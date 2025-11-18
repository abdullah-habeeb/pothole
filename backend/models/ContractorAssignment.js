import mongoose from 'mongoose';

const contractorAssignmentSchema = new mongoose.Schema(
  {
    contractorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    potholeIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Pothole',
      required: true,
      validate: [(arr) => arr.length > 0, 'At least one pothole is required'],
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'fixed'],
      default: 'assigned',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fixedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
contractorAssignmentSchema.index({ status: 1, createdAt: -1 });
contractorAssignmentSchema.index({ contractorName: 1 });

const ContractorAssignment = mongoose.model('ContractorAssignment', contractorAssignmentSchema);

export default ContractorAssignment;

