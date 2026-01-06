import Assignment from '../models/Assignment.js';
import generateUserPotholes, {
  mapToSummary,
  summarizeCluster,
} from '../utils/potholeGenerator.js';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

const sanitizePotholePayload = (pothole) => ({
  potholeId: pothole.potholeId?.toString(),
  latitude: pothole.latitude,
  longitude: pothole.longitude,
  severity: pothole.severity || 'medium',
  status: pothole.status || 'open',
  segmentLabel: pothole.segmentLabel || pothole.description,
  description: pothole.description,
  depth_estimation: pothole.depth_estimation,
});

export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .sort({ createdAt: -1 })
      .lean();

    const cutoff = new Date(Date.now() - TEN_DAYS_MS);

    // Remove stale fixed assignments quietly
    const staleFixedIds = assignments
      .filter(
        (assignment) =>
          assignment.status === 'FIXED' &&
          assignment.fixedAt &&
          new Date(assignment.fixedAt) < cutoff
      )
      .map((assignment) => assignment._id);

    if (staleFixedIds.length > 0) {
      await Assignment.deleteMany({ _id: { $in: staleFixedIds } });
    }

    const activeAssignments = assignments.filter(
      (assignment) => !staleFixedIds.includes(assignment._id)
    );

    const assigned = activeAssignments.filter((assignment) =>
      ['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status)
    );

    const fixed = activeAssignments.filter(
      (assignment) => assignment.status === 'FIXED'
    );

    const userPotholes = generateUserPotholes(
      req.user?._id?.toString() || '',
      req.user?.email || ''
    );

    const takenPotholeIds = new Set(
      activeAssignments.flatMap((assignment) =>
        assignment.potholes.map((p) => p.potholeId?.toString())
      )
    );

    const notAssigned = userPotholes
      .filter(
        (pothole) =>
          pothole.status !== 'fixed' && !takenPotholeIds.has(pothole.id.toString())
      )
      .map(mapToSummary)
      .slice(0, 40);

    res.json({
      success: true,
      assigned,
      fixed,
      notAssigned,
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load assignments',
    });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { contractorName, contractorContact, notes, potholes = [], summary } = req.body;

    if (!contractorName || contractorName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contractor name is required',
      });
    }

    if (!Array.isArray(potholes) || potholes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one pothole must be selected',
      });
    }

    const normalizedPotholes = potholes.map(sanitizePotholePayload);

    const assignment = await Assignment.create({
      contractorName: contractorName.trim(),
      contractorContact: contractorContact?.trim(),
      notes,
      potholes: normalizedPotholes,
      status: 'ASSIGNED',
      createdBy: req.user._id,
      summary: summary || summarizeCluster(normalizedPotholes),
    });

    res.status(201).json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
    });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ASSIGNED', 'IN_PROGRESS', 'FIXED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status supplied',
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    assignment.status = status;
    assignment.fixedAt = status === 'FIXED' ? new Date() : assignment.fixedAt;
    assignment.potholes = assignment.potholes.map((pothole) => ({
      ...pothole.toObject(),
      status: status === 'FIXED' ? 'fixed' : pothole.status,
    }));

    await assignment.save();

    res.json({
      success: true,
      assignment,
    });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment status',
    });
  }
};

