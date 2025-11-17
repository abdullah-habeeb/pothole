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
    contractorName: {
      type: String,
      required: true,
      trim: true,
    },
    contractorContact: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ASSIGNED', 'IN_PROGRESS', 'FIXED'],
      default: 'ASSIGNED',
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
    summary: String,
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;

