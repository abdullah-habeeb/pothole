import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { potholeApi, Pothole, Status } from '../services/potholeApi';
import { toast } from 'sonner';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ensureArray } from '../utils/potholeUtils';
import { useAuth } from '../context/AuthContext';
import AdminAuthModal from '../components/AdminAuthModal';

const Admin = () => {
  const { user, refreshUser } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const queryClient = useQueryClient();
  const [editingPothole, setEditingPothole] = useState<number | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<Status>('open');
  const [contractorUpdate, setContractorUpdate] = useState<string>('');

  const { data: rawPotholes, isLoading, error } = useQuery({
    queryKey: ['potholes'],
    queryFn: () => potholeApi.getAllPotholes(),
    retry: false, // Don't retry if backend is not available
    refetchOnWindowFocus: false,
  });

  // ALWAYS ensure potholes is an array
  const potholes = ensureArray(rawPotholes, []);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: Status; assigned_contractor?: string } }) =>
      potholeApi.updatePothole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['potholes'] });
      toast.success('Pothole updated successfully');
      setEditingPothole(null);
      setStatusUpdate('open');
      setContractorUpdate('');
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update pothole'
      );
    },
  });

  const handleUpdate = (pothole: Pothole) => {
    updateMutation.mutate({
      id: pothole.id,
      data: {
        status: statusUpdate,
        assigned_contractor: contractorUpdate || undefined,
      },
    });
  };

  const startEditing = (pothole: Pothole) => {
    setEditingPothole(pothole.id);
    setStatusUpdate(pothole.status);
    setContractorUpdate(pothole.assigned_contractor || '');
  };

  const cancelEditing = () => {
    setEditingPothole(null);
    setStatusUpdate('open');
    setContractorUpdate('');
  };

  const getSeverityColor = (severity: Pothole['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Pothole['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // If user is not admin, show restricted view
  if (!user?.isAdmin) {
    return (
      <div className="relative">
        {/* Blurred/Dimmed overlay */}
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-10"></div>
        
        {/* Restricted content */}
        <div className="relative z-20 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Admin Access Restricted
            </h2>
            <p className="text-gray-600 mb-6">
              Only administrators can use this panel.
            </p>
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-6 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors"
            >
              Authorize as Admin
            </button>
          </div>
        </div>

        {/* Dimmed admin panel content */}
        <div className="opacity-30 pointer-events-none">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>
            <div className="text-gray-500">Admin content is hidden...</div>
          </div>
        </div>

        <AdminAuthModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={async () => {
            await refreshUser();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Depth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contractor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {potholes.map((pothole) => (
                  <tr key={pothole.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pothole.thumbnail ? (
                        <img
                          src={pothole.thumbnail}
                          alt={`Pothole ${pothole.id}`}
                          className="h-16 w-24 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{pothole.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                          pothole.severity
                        )}`}
                      >
                        {pothole.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingPothole === pothole.id ? (
                        <select
                          value={statusUpdate}
                          onChange={(e) => setStatusUpdate(e.target.value as Status)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            pothole.status
                          )}`}
                        >
                          {pothole.status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pothole.latitude.toFixed(6)}, {pothole.longitude.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pothole.depth_estimation
                        ? `${pothole.depth_estimation.toFixed(2)} cm`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingPothole === pothole.id ? (
                        <input
                          type="text"
                          value={contractorUpdate}
                          onChange={(e) => setContractorUpdate(e.target.value)}
                          placeholder="Contractor name"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">
                          {pothole.assigned_contractor || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pothole.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingPothole === pothole.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(pothole)}
                            disabled={updateMutation.isPending}
                            className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(pothole)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {potholes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg mb-2">No potholes found</p>
            <p className="text-gray-500 text-sm">
              {error 
                ? 'Backend server is not available. The table will populate once the backend is connected and videos are uploaded.' 
                : 'Upload videos to detect potholes and manage them here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

