import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePotholeSelection } from '../context/PotholeSelectionContext';
import {
  assignmentsApi,
  Assignment,
  AssignmentPothole,
  AssignmentStatus,
} from '../services/assignmentApi';

const TABS: Array<{ id: 'notAssigned' | 'assigned' | 'fixed'; label: string }> = [
  { id: 'notAssigned', label: 'Not Assigned' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'fixed', label: 'Fixed' },
];

const statusLabelMap: Record<AssignmentStatus, string> = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  FIXED: 'Fixed',
};

const severityChipMap: Record<
  AssignmentPothole['severity'],
  { bg: string; text: string }
> = {
  high: { bg: 'bg-red-50 text-red-700', text: 'High' },
  medium: { bg: 'bg-orange-50 text-orange-700', text: 'Medium' },
  low: { bg: 'bg-green-50 text-green-700', text: 'Low' },
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const GovernmentManagementPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selection, clearSelection } = usePotholeSelection();
  const queryClient = useQueryClient();
  const [contractorName, setContractorName] = useState('');
  const [contractorContact, setContractorContact] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'notAssigned' | 'assigned' | 'fixed'>('notAssigned');

  const isAuthorized = !!user?.isGovernmentAuthorized;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['assignments'],
    queryFn: assignmentsApi.getAssignments,
    enabled: isAuthorized,
  });

  const createMutation = useMutation({
    mutationFn: assignmentsApi.createAssignment,
    onSuccess: () => {
      toast.success('Contractor assignment created');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setContractorName('');
      setContractorContact('');
      setNotes('');
      clearSelection();
    },
    onError: () => {
      toast.error('Failed to create assignment');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      assignmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment updated');
    },
    onError: () => {
      toast.error('Failed to update assignment');
    },
  });

  const handleSelectPotholes = (preselect?: AssignmentPothole[]) => {
    if (!isAuthorized) {
      toast.error('Government authorization required');
      return;
    }
    navigate('/map', {
      state: {
        selectionMode: true,
        preselect: preselect?.map((item) => item.potholeId),
        focus: preselect?.length
          ? { lat: preselect[0].latitude, lng: preselect[0].longitude, zoom: 15 }
          : undefined,
      },
    });
  };

  const handleAssign = () => {
    if (!isAuthorized) {
      toast.error('Government authorization required');
      return;
    }
    if (!selection?.items.length) {
      toast.error('Select potholes from the map first');
      return;
    }
    if (!contractorName.trim()) {
      toast.error('Enter a contractor name');
      return;
    }
    createMutation.mutate({
      contractorName: contractorName.trim(),
      contractorContact: contractorContact.trim() || undefined,
      notes: notes.trim() || undefined,
      summary: selection.summary,
      potholes: selection.items.map((item) => ({
        potholeId: item._id,
        latitude: item.latitude,
        longitude: item.longitude,
        severity: item.severity,
        status: item.status,
        segmentLabel: item.segmentLabel,
        description: item.description,
      })),
    });
  };

  const handleAdvanceStatus = (assignment: Assignment, status: AssignmentStatus) => {
    statusMutation.mutate({ id: assignment._id, status });
  };

  const notAssigned = data?.notAssigned ?? [];
  const assigned = data?.assigned ?? [];
  const fixed = data?.fixed ?? [];

  const tabContent = useMemo(() => {
    if (!isAuthorized) {
      return (
        <div className="text-sm text-ink-400">
          Authorize as a government user to manage assignments.
        </div>
      );
    }
    if (isLoading) {
      return <div className="text-sm text-ink-400">Loading assignments…</div>;
    }
    const emptyState = (
      <div className="rounded-xl border border-dashed border-surface-200 bg-white p-6 text-center text-sm text-ink-400">
        No records yet.
      </div>
    );
    if (activeTab === 'notAssigned') {
      if (notAssigned.length === 0) {
        return emptyState;
      }
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {notAssigned.map((item) => (
            <div key={item.potholeId} className="card card-hover p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-700">
                    {item.segmentLabel}
                  </p>
                  <p className="text-xs text-ink-400">{item.description}</p>
                </div>
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    severityChipMap[item.severity ?? 'medium'].bg
                  )}
                >
                  {severityChipMap[item.severity ?? 'medium'].text}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                <span>Updated {formatDate(item.lastSeen)}</span>
                <button
                  type="button"
                  className="font-semibold text-primary-600"
                  onClick={() => handleSelectPotholes([item])}
                >
                  Select & Assign
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (activeTab === 'assigned') {
      if (assigned.length === 0) {
        return emptyState;
      }
      return (
        <div className="space-y-4">
          {assigned.map((assignment) => (
            <div key={assignment._id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-ink-400">
                    Contractor
                  </p>
                  <p className="text-lg font-semibold text-ink-700">
                    {assignment.contractorName}
                  </p>
                  {assignment.contractorContact && (
                    <p className="text-xs text-ink-400">{assignment.contractorContact}</p>
                  )}
                </div>
                <span className="metric-chip bg-primary-50 text-primary-700">
                  {statusLabelMap[assignment.status]}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                <span>{assignment.potholes.length} potholes</span>
                <span>Created {formatDate(assignment.createdAt)}</span>
                {assignment.summary && <span>{assignment.summary}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {assignment.potholes.slice(0, 3).map((p) => (
                  <span
                    key={p.potholeId}
                    className="rounded-full border border-surface-200 px-3 py-1 text-xs text-ink-500"
                  >
                    #{p.potholeId} • {p.segmentLabel}
                  </span>
                ))}
                {assignment.potholes.length > 3 && (
                  <span className="text-xs text-ink-400">
                    +{assignment.potholes.length - 3} more
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {assignment.status !== 'IN_PROGRESS' && (
                  <button
                    type="button"
                    className="rounded-md border border-surface-200 px-3 py-1 text-ink-600 hover:border-primary-200"
                    onClick={() => handleAdvanceStatus(assignment, 'IN_PROGRESS')}
                    disabled={statusMutation.isPending}
                  >
                    Mark In Progress
                  </button>
                )}
                {assignment.status !== 'FIXED' && (
                  <button
                    type="button"
                    className="rounded-md bg-green-600 px-3 py-1 text-white"
                    onClick={() => handleAdvanceStatus(assignment, 'FIXED')}
                    disabled={statusMutation.isPending}
                  >
                    Mark Fixed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (fixed.length === 0) {
      return emptyState;
    }
    return (
      <div className="space-y-3">
        {fixed.map((assignment) => (
          <div
            key={assignment._id}
            className="rounded-xl border border-surface-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-700">
                  {assignment.contractorName}
                </p>
                <p className="text-xs text-ink-400">
                  Fixed {formatDate(assignment.fixedAt)}
                </p>
              </div>
              <span className="metric-chip bg-green-50 text-green-700">Fixed</span>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              {assignment.summary || `${assignment.potholes.length} potholes`}
            </p>
          </div>
        ))}
      </div>
    );
  }, [activeTab, assigned, fixed, isAuthorized, isLoading, notAssigned, statusMutation.isPending]);

  return (
    <section id="gov-panel" className="relative card p-6 shadow-card">
      <div className={clsx('space-y-6', !isAuthorized && 'pointer-events-none opacity-40')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-500">
            Government Panel
          </p>
          <h2 className="text-2xl font-semibold text-ink-700">
            Contractor assignment workflows
          </h2>
          <p className="text-sm text-ink-400">
            Select potholes on the map, assign contractors, and track fixes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSelectPotholes()}
          disabled={!isAuthorized}
          title={
            isAuthorized ? 'Select potholes on the map' : 'Government authorization required'
          }
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
            isAuthorized
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-surface-200 text-ink-400 cursor-not-allowed'
          )}
        >
          Select potholes
        </button>
        </div>

      <div className="rounded-xl border border-surface-200 bg-white/80 p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Contractor name
            </label>
            <input
              type="text"
              value={contractorName}
              onChange={(e) => setContractorName(e.target.value)}
              placeholder="e.g., Bengaluru Infra Works"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex-1 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Contact / Phone (optional)
            </label>
            <input
              type="text"
              value={contractorContact}
              onChange={(e) => setContractorContact(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-surface-200 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex-1 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Priority, equipment, etc."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink-500">
            {selection?.items.length ? (
              <>
                <strong>{selection.items.length}</strong> potholes selected ·{' '}
                {selection.summary}
              </>
            ) : (
              'No potholes selected yet'
            )}
          </div>
          <div className="flex items-center gap-2">
            {selection?.items.length > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-ink-400 hover:text-ink-600"
                onClick={clearSelection}
              >
                Clear selection
              </button>
            )}
            <button
              type="button"
              onClick={handleAssign}
              disabled={!isAuthorized || createMutation.isPending}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                !isAuthorized
                  ? 'bg-surface-200 text-ink-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              )}
            >
              {createMutation.isPending ? 'Assigning…' : 'Assign to contractor'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3 border-b border-surface-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 py-2 text-sm font-semibold transition-colors',
                activeTab === tab.id
                  ? 'text-primary-700 border-b-2 border-primary-600'
                  : 'text-ink-400 hover:text-ink-600'
              )}
            >
              {tab.label}
              {tab.id === 'assigned' && assigned.length > 0 && (
                <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                  {assigned.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {isFetching && (
            <p className="mb-2 text-xs text-ink-400">Refreshing assignments…</p>
          )}
          {tabContent}
          <p className="mt-4 text-xs text-ink-400">
            Note: Fixed potholes older than 10 days are automatically cleared from this list to
            keep it current.
          </p>
        </div>
      </div>
      </div>

      {!isAuthorized && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-center text-ink-500 font-semibold px-6">
          Government contractor management is available only to authorized government users.
        </div>
      )}
    </section>
  );
};

export default GovernmentManagementPanel;

