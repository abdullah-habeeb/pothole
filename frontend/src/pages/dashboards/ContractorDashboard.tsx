import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractorAssignmentApi, ContractorAssignment } from '../../services/contractorAssignmentApi';
import { toast } from 'sonner';

const ContractorDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

    const { data, isLoading, error } = useQuery({
        queryKey: ['contractorAssignments'],
        queryFn: contractorAssignmentApi.getAssignments,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'in_progress' | 'fixed' }) =>
            contractorAssignmentApi.updateStatus(id, status),
        onSuccess: () => {
            toast.success('Pothole marked as completed!');
            queryClient.invalidateQueries({ queryKey: ['contractorAssignments'] });
        },
        onError: () => {
            toast.error('Failed to update status');
        },
    });

    const assigned = data?.assigned || []; // These are 'assigned' or 'in_progress'
    const fixed = data?.fixed || [];

    const allAssignments = [...assigned, ...fixed].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const pendingAssignments = assigned;
    const completedAssignments = fixed;

    const getFilteredAssignments = () => {
        switch (activeTab) {
            case 'pending': return pendingAssignments;
            case 'completed': return completedAssignments;
            default: return allAssignments;
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-red-600">
                Failed to load assignments.
            </div>
        );
    }

    const filteredList = getFilteredAssignments();

    return (
        <div className="p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>
                <p className="text-gray-500">Manage your assigned repair works</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-700">Pending</h2>
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">📋</span>
                    </div>
                    <p className="text-4xl font-bold text-indigo-600 mt-4">{pendingAssignments.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-700">Completed</h2>
                        <span className="p-2 bg-green-50 text-green-600 rounded-lg">✅</span>
                    </div>
                    <p className="text-4xl font-bold text-green-600 mt-4">{completedAssignments.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        All Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'completed'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Completed
                    </button>
                </nav>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredList.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-dashed border-gray-300">
                        <p className="text-gray-500">No assignments found in this view.</p>
                    </div>
                ) : (
                    filteredList.map((assignment: ContractorAssignment) => (
                        <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.status === 'fixed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-indigo-100 text-indigo-800'
                                            }`}>
                                            {assignment.status === 'fixed' ? 'Completed' : 'Pending'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Assigned {new Date(assignment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {assignment.potholeIds.length} Potholes to Fix
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Assignment ID: #{assignment._id.slice(-6).toUpperCase()}
                                    </p>
                                </div>

                                <div className="flex gap-3 items-center">
                                    {assignment.status !== 'fixed' && (
                                        <button
                                            onClick={() => updateStatusMutation.mutate({ id: assignment._id, status: 'fixed' })}
                                            disabled={updateStatusMutation.isPending}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            Mark as Done
                                        </button>
                                    )}
                                    {assignment.status === 'fixed' && (
                                        <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                                            <span>Fixed on {assignment.fixedAt ? new Date(assignment.fixedAt).toLocaleDateString() : '—'}</span>
                                            <span>✅</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ContractorDashboard;
