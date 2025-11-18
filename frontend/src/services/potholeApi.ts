import apiClient from './apiClient';

export type Severity = 'low' | 'medium' | 'high';
export type DetectionSeverity = Severity | 'none';
export type Status = 'open' | 'in_progress' | 'fixed';

export interface PotholeDetectionMeta {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface PotholeGpsMatch {
  latitude: number | null;
  longitude: number | null;
  timestamp?: number | null;
  source?: 'timestamp' | 'index' | 'none';
}

export interface Pothole {
  _id: string;
  videoId: string;
  severity: Severity;
  status: Status;
  latitude: number | null;
  longitude: number | null;
  previewImage: string | null;
  confidence: number;
  detectionMeta?: PotholeDetectionMeta;
  gpsMatch?: PotholeGpsMatch;
  assignedContractor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MLPotholeDetection {
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  preview_image?: string;  // Made optional for safety
  timestamp?: number | string | null;
  severity?: string;  // Added optional severity field
}

export interface ParsedGpsPoint {
  latitude: number;
  longitude: number;
  timestamp?: number | string | null;
}

export interface UploadDetectionsPayload {
  severity: DetectionSeverity;
  previewImage: string | null;
  potholes: MLPotholeDetection[];
  gps: ParsedGpsPoint[];
  video_id?: string;
}

export interface UploadDetectionsResponse {
  success: boolean;
  video: {
    video_id: string;
    severity: DetectionSeverity;
    previewImage: string | null;
    pothole_count: number;
    gps_points: number;
  };
  potholes: Pothole[];
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
  by_date: Array<{
    date: string;
    count: number;
  }>;
}

export interface UpdatePotholeData {
  status?: Status;
  assigned_contractor?: string | null;
}

export const potholeApi = {
  async saveDetections(payload: UploadDetectionsPayload): Promise<UploadDetectionsResponse> {
    // Use longer timeout (60s) but backend should respond in < 500ms
    const response = await apiClient.post<UploadDetectionsResponse>('/potholes/upload', payload, {
      timeout: 60000, // 60 second timeout
    });
    return response.data;
  },

  async getAllPotholes(): Promise<Pothole[]> {
    const response = await apiClient.get<{ success: boolean; potholes: Pothole[] }>('/potholes');
    return Array.isArray(response.data?.potholes) ? response.data.potholes : [];
  },

  async getPotholeStats(params?: {
    severity?: Severity;
    status?: Status;
    start_date?: string;
    end_date?: string;
  }): Promise<PotholeStats> {
    const response = await apiClient.get<{ success: boolean } & PotholeStats>('/potholes/stats', {
      params,
    });
    return response.data;
  },

  async updatePothole(id: string, data: UpdatePotholeData): Promise<Pothole> {
    const response = await apiClient.patch<{ success: boolean; pothole: Pothole }>(
      `/potholes/${id}`,
      data
    );
    return response.data.pothole;
  },

  async getPotholeById(id: string): Promise<Pothole> {
    const response = await apiClient.get<{ success: boolean; pothole: Pothole }>(
      `/potholes/${id}`
    );
    return response.data.pothole;
  },
};

