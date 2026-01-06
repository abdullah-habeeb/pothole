import apiClient from './apiClient';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role?: string;
  contractorId?: string;
  governmentId?: string;
  passkey?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'government' | 'contractor' | 'admin';
  isAdmin?: boolean; // Keep for backward compat if needed, or remove
  isGovernmentAuthorized?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export const authApi = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },

  adminAuthorize: async (passkey: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/admin-authorize', { passkey });
    return response.data;
  },

  getContractors: async (): Promise<{ success: boolean; contractors?: { id: string; name: string; contractorId: string }[] }> => {
    const response = await apiClient.get('/auth/contractors');
    return response.data;
  },

  governmentAuthorize: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/government-authorize', { email, password });
    return response.data;
  },
};

