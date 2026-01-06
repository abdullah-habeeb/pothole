import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contractorAssignmentApi, ContractorAssignmentStatus } from '../services/contractorAssignmentApi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePotholeSelection } from '../context/PotholeSelectionContext';

const Assignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selection, clearSelection } = usePotholeSelection();
  const [activeList, setActiveList] = useState<'assigned' | 'notAssigned' | 'fixed'>('assigned');
  const [contractorName, setContractorName] = useState('');

  const isAuthorized = user?.isGovernmentAuthorized || false;

  // Initialize contractor name from selection if available
  useEffect(() => {
    if (selection?.contractorName) {
      setContractorName(selection.contractorName);
    }
  }, [selection]);

  const { data, isLoading } = useQuery({
    queryKey: ['contractorAssignments'],
    queryFn: contractorAssignmentApi.getAssignments,
    enabled: isAuthorized,
  });

  const createAssignmentMutation = useMutation({
    mutationFn: contractorAssignmentApi.createAssignment,
    onSuccess: () => {
      toast.success('Contractor assignment created');
      queryClient.invalidateQueries({ queryKey: ['contractorAssignments'] });
      setContractorName('');
      clearSelection();
    },
    onError: () => {
      toast.error('Failed to create assignment');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContractorAssignmentStatus }) =>
      contractorAssignmentApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Assignment status updated');
      queryClient.invalidateQueries({ queryKey: ['contractorAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['potholes'] });
    },
    onError: () => {
      toast.error('Failed to update assignment status');
    },
  });

  const handleCreateAssignment = () => {
    if (!selection?.items.length) {
      toast.error('Select potholes from the map first');
      return;
    }
    if (!contractorName.trim()) {
      toast.error('Enter a contractor name');
      return;
    }
    createAssignmentMutation.mutate({
      contractorName: contractorName.trim(),
      potholeIds: selection.items.map((item) => item._id),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 text-red-700';
      case 'medium':
        return 'bg-orange-50 text-orange-700';
      case 'low':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (!isAuthorized) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Government Authorization Required
        </h2>
        <p className="text-gray-600">
          You need government authorization to access the assignments panel.
        </p>
      </div>
    );
  }

  const assigned = data?.assigned || [];
  const notAssigned = data?.notAssigned || [];
  const fixed = data?.fixed || [];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage contractor assignments and track pothole fixes
            </p>
          </div>
          <button
            onClick={() => navigate('/map?assignMode=true')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Select Potholes
          </button>
        </div>

        {/* Assignment form for selected potholes */}
        {selection?.items.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Create Assignment</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contractor Name
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="Enter contractor name"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="text-sm text-gray-600">
                {selection.items.length} pothole{selection.items.length !== 1 ? 's' : ''} selected
              </div>
              <button
                onClick={handleCreateAssignment}
                disabled={!contractorName.trim() || createAssignmentMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {createAssignmentMutation.isPending ? 'Creating...' : 'Assign'}
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveList('assigned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeList === 'assigned'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assigned ({assigned.length})
          </button>
          <button
            onClick={() => setActiveList('notAssigned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeList === 'notAssigned'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Not Assigned ({notAssigned.length})
          </button>
          <button
            onClick={() => setActiveList('fixed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeList === 'fixed'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Fixed ({fixed.length})
          </button>
        </div>

        {/* List A: Assigned */}
        {activeList === 'assigned' && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : assigned.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No assigned potholes.</div>
            ) : (
              <div className="space-y-4">
                {assigned.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{assignment.contractorName}</p>
                        <p className="text-sm text-gray-500">
                          {assignment.potholeIds.length} pothole{assignment.potholeIds.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {formatDate(assignment.createdAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {assignment.status === 'assigned' ? 'Assigned' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {assignment.status === 'assigned' && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: assignment._id, status: 'in_progress' })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Mark In Progress
                        </button>
                      )}
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: assignment._id, status: 'fixed' })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        Mark Fixed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List B: Not Assigned */}
        {activeList === 'notAssigned' && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : notAssigned.length === 0 ? (
              <div className="text-center py-12 text-gray-500">All potholes are assigned.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notAssigned.map((pothole) => (
                  <div
                    key={pothole._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      navigate(`/map?assignMode=true&focus=${pothole._id}`)
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pothole.latitude.toFixed(6)}, {pothole.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Confidence: {(pothole.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                          pothole.severity
                        )}`}
                      >
                        {pothole.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Click to view on map
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List C: Fixed */}
        {activeList === 'fixed' && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : fixed.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No fixed potholes. Fixed potholes older than 10 days are automatically removed.
              </div>
            ) : (
              <div className="space-y-3">
                {fixed.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="border border-gray-200 rounded-lg p-4 bg-green-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{assignment.contractorName}</p>
                        <p className="text-sm text-gray-600">
                          {assignment.potholeIds.length} pothole{assignment.potholeIds.length !== 1 ? 's' : ''} fixed
                        </p>
                        {assignment.fixedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Fixed: {formatDate(assignment.fixedAt)}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        Fixed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;

