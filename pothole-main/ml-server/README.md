# FastAPI ML Server

This service exposes the `/analyze-video` endpoint that the React frontend calls to analyze uploaded videos. It bridges uploaded dashcam footage with the Roboflow YOLOv11 model and returns pothole detections in the exact format required by the rest of the system.

## Requirements

- Python 3.10+
- Roboflow API key with access to the `cpecog1-potholes-uwzi8/2` model

## Environment Variables

Create an `.env` file or export the following variables before running the server:

```bash
ROBOFLOW_API_KEY=your_key_here
# optional overrides
ROBOFLOW_MODEL_ID=cpecog1-potholes-uwzi8/2
ROBOFLOW_API_URL=https://detect.roboflow.com
```

## Installation

```bash
cd ml-server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Running the server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server automatically:

- Accepts `.mp4` uploads
- Samples every 5th frame
- Calls Roboflow via `InferenceHTTPClient`
- Returns at most 5 detections with base64 previews
- Enables CORS for `http://localhost:3001`

## Response Format

```
{
  "severity": "high" | "medium" | "none",
  "potholes": [
    {
      "confidence": float,
      "x": float,
      "y": float,
      "width": float,
      "height": float,
      "preview_image": base64string
    }
  ],
  "preview_image": base64string | null
}
```

Ensure this shape stays consistent with the backend and frontend expectations.

