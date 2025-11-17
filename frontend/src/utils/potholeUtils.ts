import { Pothole } from '../services/potholeApi';

/**
 * Ensures data is always an array
 * Handles null, undefined, objects, strings, etc.
 */
export const ensureArray = <T>(data: unknown, defaultValue: T[] = []): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  return defaultValue;
};

/**
 * Fake test data for potholes (Bangalore area)
 */
export const FAKE_POTHOLES: Pothole[] = [
  {
    id: 1,
    latitude: 12.9721,
    longitude: 77.5952,
    severity: 'high',
    depth_estimation: 7.2,
    status: 'open',
    thumbnail: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    latitude: 12.9719,
    longitude: 77.5948,
    severity: 'medium',
    depth_estimation: 3.8,
    status: 'in_progress',
    thumbnail: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    latitude: 12.9724,
    longitude: 77.5943,
    severity: 'low',
    depth_estimation: 1.5,
    status: 'fixed',
    thumbnail: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Fake stats data
 */
export const FAKE_STATS = {
  severity_count: {
    low: 54,
    medium: 27,
    high: 12,
  },
  status_count: {
    open: 18,
    in_progress: 22,
    fixed: 53,
  },
  total_count: 93,
};

/**
 * Validates if a pothole has required fields for map rendering
 */
export const isValidPotholeForMap = (pothole: unknown): pothole is Pothole => {
  if (!pothole || typeof pothole !== 'object') {
    return false;
  }
  const p = pothole as Partial<Pothole>;
  return (
    typeof p.id === 'number' &&
    typeof p.latitude === 'number' &&
    typeof p.longitude === 'number' &&
    !isNaN(p.latitude) &&
    !isNaN(p.longitude) &&
    p.latitude >= -90 &&
    p.latitude <= 90 &&
    p.longitude >= -180 &&
    p.longitude <= 180
  );
};

