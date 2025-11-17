import apiClient from './apiClient';

export type Severity = 'low' | 'medium' | 'high';
export type Status = 'open' | 'in_progress' | 'fixed';

export interface Pothole {
  id: number;
  latitude: number;
  longitude: number;
  severity: Severity;
  status: Status;
  thumbnail: string;
  depth_estimation?: number;
  created_at: string;
  updated_at: string;
  contractor?: string;
  assigned_contractor?: string;
}

export interface UploadVideoResponse {
  potholes: Pothole[];
  video_id: string;
}

export interface PotholeStats {
  severity_count: {
    low: number;
    medium: number;
    high: number;
  };
  status_count: {
    open: number;
    in_progress: number;
    fixed: number;
  };
  total_count: number;
  by_date?: Array<{
    date: string;
    count: number;
  }>;
}

export interface UpdatePotholeData {
  status?: Status;
  assigned_contractor?: string;
}

export const potholeApi = {
  uploadVideo: async (
    videoFile: File,
    latitude?: number,
    longitude?: number
  ): Promise<UploadVideoResponse> => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (latitude !== undefined) {
        formData.append('latitude', latitude.toString());
      }
      if (longitude !== undefined) {
        formData.append('longitude', longitude.toString());
      }

      const response = await apiClient.post<UploadVideoResponse>(
        '/upload-video/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not available. Please ensure the backend is running.');
    }
  },

  getAllPotholes: async (): Promise<Pothole[]> => {
    try {
      const response = await apiClient.get<Pothole[]>('/potholes/');
      // ALWAYS ensure response is an array
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      console.warn('Backend returned non-array data, returning empty array');
      return [];
    } catch (error) {
      // Return empty array if backend is not available (for graceful degradation)
      console.warn('Backend not available, returning empty potholes array');
      return [];
    }
  },

  getPotholeStats: async (params?: {
    severity?: Severity;
    status?: Status;
    start_date?: string;
    end_date?: string;
  }): Promise<PotholeStats> => {
    try {
      const response = await apiClient.get<PotholeStats>('/potholes/stats/', {
        params,
      });
      return response.data;
    } catch (error) {
      // Return empty stats if backend is not available (for graceful degradation)
      console.warn('Backend not available, returning empty stats');
      return {
        severity_count: {
          low: 0,
          medium: 0,
          high: 0,
        },
        status_count: {
          open: 0,
          in_progress: 0,
          fixed: 0,
        },
        total_count: 0,
      };
    }
  },

  updatePothole: async (
    id: number,
    data: UpdatePotholeData
  ): Promise<Pothole> => {
    const response = await apiClient.patch<Pothole>(`/potholes/${id}/`, data);
    return response.data;
  },

  getPotholeById: async (id: number): Promise<Pothole> => {
    const response = await apiClient.get<Pothole>(`/potholes/${id}/`);
    return response.data;
  },
};

