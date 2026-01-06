import ContractorAssignment from '../models/ContractorAssignment.js';
import PotholeModel from '../models/Pothole.js';
import mongoose from 'mongoose';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// Create a new contractor assignment
export const createContractorAssignment = async (req, res) => {
  try {
    const { contractorName, potholeIds } = req.body;

    if (!contractorName || contractorName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contractor name is required',
      });
    }

    if (!Array.isArray(potholeIds) || potholeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one pothole must be selected',
      });
    }

    // Validate pothole IDs
    const validPotholeIds = potholeIds
      .map((id) => {
        try {
          return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (validPotholeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pothole IDs provided',
      });
    }

    // Check if potholes exist
    const existingPotholes = await PotholeModel.find({
      _id: { $in: validPotholeIds },
    });

    if (existingPotholes.length !== validPotholeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some potholes do not exist',
      });
    }

    // Create assignment
    const assignment = await ContractorAssignment.create({
      contractorName: contractorName.trim(),
      potholeIds: validPotholeIds,
      status: 'assigned',
      assignedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Create contractor assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contractor assignment',
    });
  }
};

// Get all assignments grouped by status
export const getContractorAssignments = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - TEN_DAYS_MS);

    // Get all assignments
    const allAssignments = await ContractorAssignment.find()
      .populate({
        path: 'potholeIds',
        select: 'latitude longitude severity status confidence',
      })
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Remove stale fixed assignments
    const staleFixedIds = allAssignments
      .filter(
        (assignment) =>
          assignment.status === 'fixed' &&
          assignment.fixedAt &&
          new Date(assignment.fixedAt) < cutoff
      )
      .map((assignment) => assignment._id);

    if (staleFixedIds.length > 0) {
      await ContractorAssignment.deleteMany({ _id: { $in: staleFixedIds } });
    }

    const activeAssignments = allAssignments.filter(
      (assignment) => !staleFixedIds.includes(assignment._id)
    );

    // Group by status
    const assigned = activeAssignments.filter(
      (assignment) => assignment.status === 'assigned' || assignment.status === 'in_progress'
    );

    const fixed = activeAssignments.filter((assignment) => assignment.status === 'fixed');

    // Get all potholes
    const allPotholes = await PotholeModel.find()
      .select('_id latitude longitude severity status confidence createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Get assigned pothole IDs
    const assignedPotholeIds = new Set(
      activeAssignments.flatMap((assignment) =>
        assignment.potholeIds.map((p) => p._id?.toString() || p.toString())
      )
    );

    // Get fixed pothole IDs
    const fixedPotholeIds = new Set(
      fixed.flatMap((assignment) =>
        assignment.potholeIds.map((p) => p._id?.toString() || p.toString())
      )
    );

    // Not assigned potholes (not in any assignment and not fixed)
    const notAssigned = allPotholes
      .filter(
        (pothole) =>
          pothole.status !== 'fixed' &&
          !assignedPotholeIds.has(pothole._id.toString()) &&
          !fixedPotholeIds.has(pothole._id.toString())
      )
      .map((pothole) => ({
        _id: pothole._id.toString(),
        latitude: pothole.latitude,
        longitude: pothole.longitude,
        severity: pothole.severity || 'low',
        status: pothole.status || 'open',
        confidence: pothole.confidence || 0,
        createdAt: pothole.createdAt,
      }));

    res.json({
      success: true,
      assigned,
      fixed,
      notAssigned,
    });
  } catch (error) {
    console.error('Get contractor assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load assignments',
    });
  }
};

// Update assignment status
export const updateContractorAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['assigned', 'in_progress', 'fixed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status supplied',
      });
    }

    const assignment = await ContractorAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    assignment.status = status;
    if (status === 'fixed') {
      assignment.fixedAt = new Date();
      // Update pothole statuses
      await PotholeModel.updateMany(
        { _id: { $in: assignment.potholeIds } },
        { status: 'fixed' }
      );
    }

    await assignment.save();

    res.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Update contractor assignment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment status',
    });
  }
};

