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
 * Validates if a pothole has required fields for map rendering
 */
export const isValidPotholeForMap = (pothole: unknown): pothole is Pothole => {
  if (!pothole || typeof pothole !== 'object') {
    return false;
  }
  const p = pothole as Partial<Pothole>;
  const lat = p.latitude;
  const lon = p.longitude;

  return (
    typeof p._id === 'string' &&
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

