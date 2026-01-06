import apiClient from './apiClient';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Government' | 'User';
  isAdmin: boolean;
  isGovernmentAuthorized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  users: AdminUser[];
}

export const adminApi = {
  getAllUsers: async (): Promise<AdminUsersResponse> => {
    const response = await apiClient.get<AdminUsersResponse>('/admin/users');
    return response.data;
  },
};

