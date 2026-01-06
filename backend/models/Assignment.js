import mongoose from 'mongoose';

const potholeSelectionSchema = new mongoose.Schema(
  {
    potholeId: {
      type: String,
      required: true,
    },
    latitude: Number,
    longitude: Number,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'fixed'],
      default: 'open',
    },
    segmentLabel: String,
    description: String,
    depth_estimation: Number,
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'completed'], // Simplified status as per requirements
      default: 'assigned',
    },
    potholes: {
      type: [potholeSelectionSchema],
      validate: [(arr) => arr.length > 0, 'At least one pothole is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fixedAt: Date,
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;

