import mongoose from 'mongoose';

const summaryPotholeSchema = new mongoose.Schema(
  {
    potholeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pothole',
    },
    latitude: Number,
    longitude: Number,
    severity: String,
    status: String,
    confidence: Number,
  },
  { _id: false }
);

const videoAnalysisSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
    },
    severity: {
      type: String,
      enum: ['high', 'medium', 'none'],
      default: 'none',
    },
    previewImage: String,
    potholes: [summaryPotholeSchema],
    gpsPointsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('VideoAnalysis', videoAnalysisSchema);

