import axios, { AxiosInstance } from 'axios';

// Backend server URL
// In development, use relative URLs to leverage Vite proxy
// In production, use full URL or environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60 second timeout (backend should respond much faster)
});

// Helper to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      // Could show toast notification here
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      // Don't redirect here to avoid infinite loops - handle in components
    }
    
    if (error.response?.status === 503) {
      // Service unavailable - likely MongoDB connection issue
      console.error('Backend service unavailable:', error.response.data?.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

