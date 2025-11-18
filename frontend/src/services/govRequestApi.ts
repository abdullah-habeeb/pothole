import apiClient from './apiClient';

export type GovRequestStatus = 'pending' | 'approved' | 'rejected';

export interface GovAuthorizationRequest {
  _id: string;
  userId: string;
  email: string;
  status: GovRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface GovRequestResponse {
  success: boolean;
  request?: GovAuthorizationRequest;
  requests?: GovAuthorizationRequest[];
  message?: string;
}

export const govRequestApi = {
  createRequest: async (email: string, password: string): Promise<GovRequestResponse> => {
    const response = await apiClient.post<GovRequestResponse>('/gov-requests/create', {
      email,
      password,
    });
    return response.data;
  },

  getMyRequest: async (): Promise<GovRequestResponse> => {
    const response = await apiClient.get<GovRequestResponse>('/gov-requests/my-request');
    return response.data;
  },

  getAllRequests: async (): Promise<GovRequestResponse> => {
    const response = await apiClient.get<GovRequestResponse>('/gov-requests/all');
    return response.data;
  },

  approveRequest: async (id: string): Promise<GovRequestResponse> => {
    const response = await apiClient.patch<GovRequestResponse>(`/gov-requests/${id}/approve`);
    return response.data;
  },

  rejectRequest: async (id: string, notes?: string): Promise<GovRequestResponse> => {
    const response = await apiClient.patch<GovRequestResponse>(`/gov-requests/${id}/reject`, {
      notes,
    });
    return response.data;
  },
};

