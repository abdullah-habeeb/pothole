import mongoose from 'mongoose';

const govAuthorizationRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
govAuthorizationRequestSchema.index({ userId: 1, status: 1 });
govAuthorizationRequestSchema.index({ status: 1, createdAt: -1 });

const GovAuthorizationRequest = mongoose.model('GovAuthorizationRequest', govAuthorizationRequestSchema);

export default GovAuthorizationRequest;

