import base64
import os
import tempfile
from typing import List, Optional
from dotenv import load_dotenv
load_dotenv()   # this loads .env automatically

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from inference_sdk import InferenceHTTPClient

FRAME_INTERVAL = 20  # Process every 20th frame for faster processing (was 10)
MAX_DETECTIONS = 8
MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "cpecog1-potholes-uwzi8/2")
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://detect.roboflow.com")

if not ROBOFLOW_API_KEY:
    raise RuntimeError("ROBOFLOW_API_KEY environment variable is required")

client = InferenceHTTPClient(api_url=ROBOFLOW_API_URL, api_key=ROBOFLOW_API_KEY)

app = FastAPI()

# CORS - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def encode_frame_to_base64(frame: np.ndarray) -> str:
    """Convert numpy frame to base64 string."""
    success, buffer = cv2.imencode(".jpg", frame)
    if not success:
        raise ValueError("Failed to encode frame to JPEG")
    return base64.b64encode(buffer).decode("utf-8")


def iou(boxA, boxB):
    """Compute Intersection over Union (IoU) of two bounding boxes."""
    # box = [x_center, y_center, width, height]
    ax1 = boxA["x"] - boxA["width"] / 2
    ay1 = boxA["y"] - boxA["height"] / 2
    ax2 = boxA["x"] + boxA["width"] / 2
    ay2 = boxA["y"] + boxA["height"] / 2

    bx1 = boxB["x"] - boxB["width"] / 2
    by1 = boxB["y"] - boxB["height"] / 2
    bx2 = boxB["x"] + boxB["width"] / 2
    by2 = boxB["y"] + boxB["height"] / 2

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    areaA = (ax2 - ax1) * (ay2 - ay1)
    areaB = (bx2 - bx1) * (by2 - by1)
    return inter_area / (areaA + areaB - inter_area)


def cluster_detections(detections, iou_threshold=0.3):
    """Cluster detections by IoU and keep highest confidence from each cluster."""
    clusters = []

    for det in detections:
        placed = False

        for cluster in clusters:
            if iou(det, cluster[0]) > iou_threshold:
                cluster.append(det)
                placed = True
                break

        if not placed:
            clusters.append([det])

    # pick highest confidence from each cluster
    unique = [max(c, key=lambda x: x["confidence"]) for c in clusters]
    return unique


def draw_box(img, det):
    """Draw a bounding box on the image for a detection."""
    x, y, w, h = det["x"], det["y"], det["width"], det["height"]
    x1 = int(x - w/2)
    y1 = int(y - h/2)
    x2 = int(x + w/2)
    y2 = int(y + h/2)
    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 3)
    return img


def infer_frame(frame: np.ndarray) -> List[dict]:
    """Run inference on a frame using Roboflow."""
    response = client.infer(inference_input=frame, model_id=MODEL_ID)
    predictions = response.get("predictions", [])
    return sorted(predictions, key=lambda p: p.get("confidence", 0), reverse=True)


def classify_severity(confidence: float) -> str:
    """Classify severity based on confidence threshold."""
    if confidence >= 0.77:
        return "high"
    elif confidence >= 0.50:
        return "medium"
    else:
        return "low"


@app.post("/analyze-video")
async def analyze_video(video: UploadFile = File(...)):
    """Analyze video for pothole detections."""
    if not video.filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 videos are supported")

    cap = None
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            contents = await video.read()
            temp_file.write(contents)
            temp_path = temp_file.name

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Unable to read uploaded video")

        # Collect ALL detections from every 10th frame
        all_detections = []
        preview_frame: Optional[np.ndarray] = None
        frame_index = 0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            # Process every 10th frame
            if frame_index % FRAME_INTERVAL != 0:
                frame_index += 1
                continue

            predictions = infer_frame(frame)
            for prediction in predictions:
                detection = {
                    "confidence": float(prediction.get("confidence", 0)),
                    "x": float(prediction.get("x", 0)),
                    "y": float(prediction.get("y", 0)),
                    "width": float(prediction.get("width", 0)),
                    "height": float(prediction.get("height", 0)),
                }
                all_detections.append(detection)

                # Store the first frame with detections for preview
                if preview_frame is None and len(predictions) > 0:
                    preview_frame = frame.copy()

            frame_index += 1

        # Cluster detections to remove duplicates
        clustered = cluster_detections(all_detections, iou_threshold=0.3)
        
        # Limit to max 8 unique potholes
        clustered = clustered[:MAX_DETECTIONS]

        # Apply severity classification
        for det in clustered:
            det["severity"] = classify_severity(det["confidence"])

        # Generate preview image with bounding boxes
        preview_image: Optional[str] = None
        if preview_frame is not None and clustered:
            preview_frame_copy = preview_frame.copy()
            for det in clustered:
                preview_frame_copy = draw_box(preview_frame_copy, det)
            preview_image = encode_frame_to_base64(preview_frame_copy)

        # Generate thumbnails for each pothole
        potholes_response = []
        if preview_frame is not None:
            for det in clustered:
                # Create thumbnail: crop around detection and draw box
                x, y, w, h = det["x"], det["y"], det["width"], det["height"]
                x1 = int(max(x - w/2, 0))
                y1 = int(max(y - h/2, 0))
                x2 = int(min(x + w/2, preview_frame.shape[1]))
                y2 = int(min(y + h/2, preview_frame.shape[0]))
                
                # Crop the region
                crop = preview_frame[y1:y2, x1:x2].copy()
                
                # Draw box on thumbnail
                if crop.size > 0:
                    # Adjust box coordinates for cropped image
                    crop_x1 = 0
                    crop_y1 = 0
                    crop_x2 = crop.shape[1]
                    crop_y2 = crop.shape[0]
                    cv2.rectangle(crop, (crop_x1, crop_y1), (crop_x2, crop_y2), (0, 255, 0), 3)
                    thumbnail = encode_frame_to_base64(crop)
                else:
                    thumbnail = encode_frame_to_base64(preview_frame)
                
                potholes_response.append({
                    "confidence": det["confidence"],
                    "severity": det["severity"],
                    "x": det["x"],
                    "y": det["y"],
                    "width": det["width"],
                    "height": det["height"],
                    "preview_image": thumbnail,  # Changed from "thumbnail" to match frontend expectation
                })

        # Compute overall severity from clustered detections
        overall_severity = "none"
        if clustered:
            severities = [det["severity"] for det in clustered]
            if "high" in severities:
                overall_severity = "high"
            elif "medium" in severities:
                overall_severity = "medium"
            else:
                overall_severity = "low"

        return {
            "potholes": potholes_response,
            "preview_image": preview_image,
            "severity": overall_severity,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if cap is not None:
            cap.release()
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

