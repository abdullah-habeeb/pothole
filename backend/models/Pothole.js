import mongoose from 'mongoose';

const detectionMetaSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
);

// Minimal GPS match schema - only store source for popup display
const gpsMatchSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['timestamp', 'index', 'none'],
      default: 'none',
    },
    // Don't store latitude/longitude/timestamp here - already in main schema
  },
  { _id: false }
);

const potholeSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'fixed'],
      default: 'open',
    },
    latitude: Number,
    longitude: Number,
    previewImage: {
      type: String,
      // Limit size - only store optimized thumbnails
      maxlength: 100000, // ~100KB max
    },
    confidence: {
      type: Number,
      default: 0,
    },
    // detectionMeta is optional - not needed for popup display
    detectionMeta: {
      type: detectionMetaSchema,
      required: false,
    },
    assignedContractor: {
      type: String,
      default: null,
      trim: true,
    },
    // Only store minimal gpsMatch data needed for popup
    gpsMatch: {
      type: gpsMatchSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Pothole', potholeSchema);

