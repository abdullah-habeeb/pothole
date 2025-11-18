import apiClient from './apiClient';
import { Severity, Status } from './potholeApi';

export type AssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'FIXED';

export interface AssignmentPothole {
  potholeId: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: Status;
  segmentLabel?: string;
  description?: string;
}

export interface Assignment {
  _id: string;
  contractorName: string;
  contractorContact?: string;
  notes?: string;
  status: AssignmentStatus;
  summary?: string;
  potholes: AssignmentPothole[];
  createdAt: string;
  updatedAt: string;
  fixedAt?: string;
}

export interface AssignmentListsResponse {
  success: boolean;
  notAssigned: AssignmentPothole[];
  assigned: Assignment[];
  fixed: Assignment[];
}

export interface CreateAssignmentPayload {
  contractorName: string;
  contractorContact?: string;
  notes?: string;
  potholes: AssignmentPothole[];
  summary?: string;
}

export const assignmentsApi = {
  getAssignments: async (): Promise<AssignmentListsResponse> => {
    const response = await apiClient.get<AssignmentListsResponse>('/assignments');
    return response.data;
  },
  createAssignment: async (payload: CreateAssignmentPayload) => {
    const response = await apiClient.post('/assignments', payload);
    return response.data;
  },
  updateStatus: async (id: string, status: AssignmentStatus) => {
    const response = await apiClient.patch(`/assignments/${id}/status`, { status });
    return response.data;
  },
};

