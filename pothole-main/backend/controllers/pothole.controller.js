import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import PotholeModel from '../models/Pothole.js';
import VideoAnalysisModel from '../models/VideoAnalysis.js';

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const buildFilterFromQuery = (query) => {
  const filter = {};
  if (query.severity && ['low', 'medium', 'high'].includes(query.severity)) {
    filter.severity = query.severity;
  }
  if (query.status && ['open', 'in_progress', 'fixed'].includes(query.status)) {
    filter.status = query.status;
  }
  const startDate = query.start_date ? new Date(query.start_date) : null;
  const endDate = query.end_date ? new Date(query.end_date) : null;
  if ((startDate && !Number.isNaN(startDate.getTime())) || (endDate && !Number.isNaN(endDate.getTime()))) {
    filter.createdAt = {};
    if (startDate && !Number.isNaN(startDate.getTime())) {
      filter.createdAt.$gte = startDate;
    }
    if (endDate && !Number.isNaN(endDate.getTime())) {
      filter.createdAt.$lte = endDate;
    }
  }
  return filter;
};

const normalizeGpsPoints = (gpsPoints) =>
  ensureArray(gpsPoints)
    .map((point, index) => {
      const latitude = Number(point?.latitude ?? point?.lat);
      const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      let timestamp = point?.timestamp ?? point?.time;
      if (typeof timestamp === 'string') {
        const parsed = Date.parse(timestamp);
        timestamp = Number.isNaN(parsed) ? null : parsed;
      }
      if (typeof timestamp === 'number' && !Number.isFinite(timestamp)) {
        timestamp = null;
      }

      return {
        latitude,
        longitude,
        timestamp: typeof timestamp === 'number' ? timestamp : null,
        index,
      };
    })
    .filter(Boolean);

const normalizeDetections = (potholes) =>
  ensureArray(potholes).map((detection, index) => ({
    confidence: Number(detection?.confidence ?? 0),
    preview_image: detection?.preview_image ?? null,
    x: Number(detection?.x ?? 0),
    y: Number(detection?.y ?? 0),
    width: Number(detection?.width ?? 0),
    height: Number(detection?.height ?? 0),
    timestamp: detection?.timestamp ?? null,
    index,
  }));

const deriveSeverity = (confidence, fallbackSeverity) => {
  if (fallbackSeverity && ['high', 'medium', 'low'].includes(fallbackSeverity)) {
    return fallbackSeverity;
  }
  if (confidence >= 0.8) {
    return 'high';
  }
  if (confidence >= 0.5) {
    return 'medium';
  }
  return 'low';
};

const matchGpsPoint = (detection, gpsPoints, totalDetections) => {
  if (!gpsPoints.length) {
    return {
      latitude: null,
      longitude: null,
      timestamp: null,
      source: 'none',
    };
  }

  const usablePoints = gpsPoints.filter((point) => point.timestamp !== null);
  if (usablePoints.length && detection.timestamp) {
    const targetTime =
      typeof detection.timestamp === 'number'
        ? detection.timestamp
        : Date.parse(detection.timestamp);
    if (!Number.isNaN(targetTime)) {
      let closest = usablePoints[0];
      let diff = Math.abs(closest.timestamp - targetTime);
      for (const point of usablePoints) {
        const distance = Math.abs(point.timestamp - targetTime);
        if (distance < diff) {
          diff = distance;
          closest = point;
        }
      }
      return { ...closest, source: 'timestamp' };
    }
  }

  const normalizedIndex =
    totalDetections > 1
      ? Math.round((detection.index / (totalDetections - 1)) * (gpsPoints.length - 1))
      : 0;
  const clampedIndex = Math.min(Math.max(normalizedIndex, 0), gpsPoints.length - 1);
  const fallbackPoint = gpsPoints[clampedIndex];

  return {
    latitude: fallbackPoint.latitude,
    longitude: fallbackPoint.longitude,
    timestamp: fallbackPoint.timestamp,
    source: 'index',
  };
};

// Helper to compress/limit base64 image size (keep only first 50KB for thumbnail)
const optimizeImage = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return null;
  }
  // If image is too large (> 50KB), truncate it (this is a simple approach)
  // In production, you'd want to actually resize/compress the image
  const maxSize = 50000; // 50KB
  if (base64String.length > maxSize) {
    // Keep the header and truncate
    const headerEnd = base64String.indexOf(',') + 1;
    const truncated = base64String.substring(0, headerEnd) + base64String.substring(headerEnd, headerEnd + maxSize);
    return truncated;
  }
  return base64String;
};

// Async background processing function
const processPotholesInBackground = async (videoId, severity, previewImage, gpsPoints, detections) => {
  try {
    // This runs in background - doesn't block the API response
    const savedPotholes = await PotholeModel.insertMany(
      detections.map((detection) => {
        const gpsMatch = matchGpsPoint(detection, gpsPoints, detections.length);
        // Only save minimal required fields
        return {
          videoId,
          severity: deriveSeverity(detection.confidence, severity === 'none' ? null : severity),
          status: 'open',
          latitude: gpsMatch.latitude,
          longitude: gpsMatch.longitude,
          // Optimize image - only save small thumbnail
          previewImage: optimizeImage(detection.preview_image),
          confidence: detection.confidence,
          // Only save gpsMatch source for popup display
          gpsMatch: {
            source: gpsMatch.source || 'none',
            // Don't save full gpsMatch data - only what's needed
          },
          // Don't save detectionMeta - not needed for popup
        };
      }),
      { ordered: false } // Continue even if some fail
    );

    // Update VideoAnalysis in background (non-critical)
    await VideoAnalysisModel.findOneAndUpdate(
      { videoId },
      {
        videoId,
        severity,
        previewImage: optimizeImage(previewImage), // Optimize main preview too
        gpsPointsCount: gpsPoints.length,
        potholes: savedPotholes.map((pothole) => ({
          potholeId: pothole._id,
          latitude: pothole.latitude,
          longitude: pothole.longitude,
          severity: pothole.severity,
          status: pothole.status,
          confidence: pothole.confidence,
        })),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).catch((err) => {
      // Don't fail if VideoAnalysis update fails
      console.error('VideoAnalysis update failed (non-critical):', err.message);
    });

    return savedPotholes;
  } catch (error) {
    console.error('Background pothole processing error:', error);
    throw error;
  }
};

export const uploadPotholes = async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again in a moment.',
      });
    }

    const {
      severity = 'none',
      previewImage = null,
      potholes = [],
      gps = [],
      video_id: providedVideoId,
    } = req.body;

    const videoId = providedVideoId || randomUUID();
    const gpsPoints = normalizeGpsPoints(gps);
    const detections = normalizeDetections(potholes).slice(0, 5);

    if (!detections.length) {
      return res.status(400).json({
        success: false,
        message: 'No pothole detections supplied',
      });
    }

    // RESPOND IMMEDIATELY - process in background
    // Calculate what we need for the response without waiting for DB
    const responseData = {
      success: true,
      video: {
        video_id: videoId,
        severity: severity === 'none' ? 'low' : severity,
        previewImage: optimizeImage(previewImage),
        pothole_count: detections.length,
        gps_points: gpsPoints.length,
      },
      potholes: detections.map((detection, index) => {
        const gpsMatch = matchGpsPoint(detection, gpsPoints, detections.length);
        return {
          _id: `temp-${Date.now()}-${index}`, // Temporary ID
          videoId,
          severity: deriveSeverity(detection.confidence, severity === 'none' ? null : severity),
          status: 'open',
          latitude: gpsMatch.latitude,
          longitude: gpsMatch.longitude,
          previewImage: optimizeImage(detection.preview_image),
          confidence: detection.confidence,
          gpsMatch: {
            source: gpsMatch.source || 'none',
          },
        };
      }),
    };

    // Send response immediately (< 500ms)
    res.status(201).json(responseData);

    // Process in background - don't await
    processPotholesInBackground(videoId, severity, previewImage, gpsPoints, detections)
      .then((savedPotholes) => {
        console.log(`✅ Background: Saved ${savedPotholes.length} potholes for video ${videoId}`);
      })
      .catch((error) => {
        console.error(`❌ Background: Failed to save potholes for video ${videoId}:`, error.message);
        // Could emit event or log to monitoring service here
      });
  } catch (error) {
    console.error('Upload potholes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing pothole detections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAllPotholes = async (req, res, next) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        potholes: []
      });
    }

    // Only select fields needed for map popup display
    const potholes = await PotholeModel.find()
      .select('_id videoId severity status latitude longitude previewImage confidence gpsMatch.source createdAt updatedAt assignedContractor')
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform to match frontend expectations
    const transformedPotholes = (Array.isArray(potholes) ? potholes : []).map((pothole) => ({
      _id: pothole._id.toString(),
      videoId: pothole.videoId,
      severity: pothole.severity || 'low',
      status: pothole.status || 'open',
      latitude: pothole.latitude,
      longitude: pothole.longitude,
      previewImage: pothole.previewImage || null,
      confidence: pothole.confidence || 0,
      gpsMatch: {
        source: pothole.gpsMatch?.source || 'none',
      },
      createdAt: pothole.createdAt,
      updatedAt: pothole.updatedAt,
      assignedContractor: pothole.assignedContractor || null,
    }));

    res.json({
      success: true,
      potholes: transformedPotholes,
    });
  } catch (error) {
    console.error('Get all potholes error:', error);
    // Return empty array instead of crashing
    res.json({
      success: false,
      message: 'Error fetching potholes',
      potholes: []
    });
  }
};

export const getPotholeStats = async (req, res, next) => {
  try {
    const filter = buildFilterFromQuery(req.query);
    const matchStage = Object.keys(filter).length ? [{ $match: filter }] : [];

    const [severityAgg, statusAgg, byDateAgg, totalCount] = await Promise.all([
      PotholeModel.aggregate([...matchStage, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
      PotholeModel.aggregate([...matchStage, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      PotholeModel.aggregate([
        ...matchStage,
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PotholeModel.countDocuments(filter),
    ]);

    const severityCount = { low: 0, medium: 0, high: 0 };
    severityAgg.forEach((entry) => {
      if (entry._id && severityCount[entry._id] !== undefined) {
        severityCount[entry._id] = entry.count;
      }
    });

    const statusCount = { open: 0, in_progress: 0, fixed: 0 };
    statusAgg.forEach((entry) => {
      if (entry._id && statusCount[entry._id] !== undefined) {
        statusCount[entry._id] = entry.count;
      }
    });

    res.json({
      success: true,
      severity_count: severityCount,
      status_count: statusCount,
      total_count: totalCount,
      by_date: byDateAgg.map((entry) => ({
        date: entry._id,
        count: entry.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePothole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assigned_contractor: assignedContractor } = req.body;

    const updatePayload = {};
    if (status && ['open', 'in_progress', 'fixed'].includes(status)) {
      updatePayload.status = status;
    }
    if (typeof assignedContractor === 'string') {
      updatePayload.assignedContractor = assignedContractor.trim() || null;
    }

    if (!Object.keys(updatePayload).length) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields supplied',
      });
    }

    const pothole = await PotholeModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: 'Pothole not found',
      });
    }

    res.json({
      success: true,
      pothole,
    });
  } catch (error) {
    next(error);
  }
};

