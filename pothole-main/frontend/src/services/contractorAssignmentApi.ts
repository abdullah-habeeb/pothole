import apiClient from './apiClient';
import { Severity, Status } from './potholeApi';

export type ContractorAssignmentStatus = 'assigned' | 'in_progress' | 'fixed';

export interface ContractorAssignment {
  _id: string;
  contractorName: string;
  potholeIds: string[];
  status: ContractorAssignmentStatus;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
  fixedAt?: string;
}

export interface ContractorAssignmentListsResponse {
  success: boolean;
  assigned: ContractorAssignment[];
  fixed: ContractorAssignment[];
  notAssigned: Array<{
    _id: string;
    latitude: number;
    longitude: number;
    severity: Severity;
    status: Status;
    confidence: number;
    createdAt: string;
  }>;
}

export interface CreateContractorAssignmentPayload {
  contractorName: string;
  potholeIds: string[];
}

export const contractorAssignmentApi = {
  getAssignments: async (): Promise<ContractorAssignmentListsResponse> => {
    const response = await apiClient.get<ContractorAssignmentListsResponse>(
      '/contractor-assignments'
    );
    return response.data;
  },

  createAssignment: async (
    payload: CreateContractorAssignmentPayload
  ): Promise<{ success: boolean; assignment: ContractorAssignment }> => {
    const response = await apiClient.post('/contractor-assignments', payload);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: ContractorAssignmentStatus
  ): Promise<{ success: boolean; assignment: ContractorAssignment }> => {
    const response = await apiClient.patch(`/contractor-assignments/${id}/status`, { status });
    return response.data;
  },
};

