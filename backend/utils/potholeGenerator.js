const DEFAULT_EMAIL = 'demo@potholes.gov';

const getSeed = (source = '') => {
  const text = source || DEFAULT_EMAIL;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash) || 1;
};

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }
}

const ROAD_SEGMENTS = [
  'Outer Ring Rd',
  'MG Road',
  'Brigade Rd',
  'Indiranagar 100ft Rd',
  'Whitefield Main Rd',
  'Bannerghatta Rd',
  'Old Madras Rd',
  'Rajajinagar Main Rd',
  'Sarjapur Main Rd',
  'Airport Rd Connector',
];

const getSegmentLabel = (lat, lng, rng) => {
  const index = Math.abs(Math.round((lat + lng) * 10)) % ROAD_SEGMENTS.length;
  const suffix = rng.nextInt(1, 20);
  return `${ROAD_SEGMENTS[index]} Block ${suffix}`;
};

export const summarizeCluster = (potholes) => {
  if (!Array.isArray(potholes) || potholes.length === 0) {
    return '';
  }
  const lat = potholes.reduce((sum, p) => sum + (p.latitude || 0), 0) / potholes.length;
  const lng = potholes.reduce((sum, p) => sum + (p.longitude || 0), 0) / potholes.length;
  return `Approx. ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
};

export const generateUserPotholes = (userId = '', email = '') => {
  const seedSource = `${userId}:${email || DEFAULT_EMAIL}`;
  const rng = new SeededRandom(getSeed(seedSource));
  const isTestUser = email === '1by23cs002' || userId.includes('1by23cs002');
  const count = isTestUser ? 25 : rng.nextInt(10, 22);

  const baseLat = 12.9716;
  const baseLng = 77.5946;
  const severities = ['low', 'medium', 'high'];
  const statuses = ['open', 'in_progress', 'fixed'];

  const potholes = [];
  for (let i = 0; i < count; i += 1) {
    const latitude = baseLat + rng.nextFloat(-0.08, 0.08);
    const longitude = baseLng + rng.nextFloat(-0.08, 0.08);
    const severity = severities[rng.nextInt(0, severities.length - 1)];
    const status = statuses[rng.nextInt(0, statuses.length - 1)];
    const depth =
      severity === 'high'
        ? rng.nextFloat(6, 14)
        : severity === 'medium'
        ? rng.nextFloat(3, 8)
        : rng.nextFloat(0.5, 4);
    const now = Date.now();
    const created = new Date(now - rng.nextInt(0, 30) * 24 * 60 * 60 * 1000);
    const updated = new Date(created.getTime() + rng.nextInt(0, 5) * 24 * 60 * 60 * 1000);
    potholes.push({
      id: getSeed(seedSource) + i * 997, // deterministic unique id
      latitude,
      longitude,
      severity,
      status,
      depth_estimation: depth,
      description: getSegmentLabel(latitude, longitude, rng),
      created_at: created.toISOString(),
      updated_at: updated.toISOString(),
    });
  }

  return potholes;
};

export const mapToSummary = (pothole) => ({
  potholeId: pothole.id,
  latitude: pothole.latitude,
  longitude: pothole.longitude,
  severity: pothole.severity,
  status: pothole.status,
  segmentLabel: pothole.description,
  description: `Lat ${pothole.latitude.toFixed(3)}, Lng ${pothole.longitude.toFixed(3)}`,
  depth_estimation: pothole.depth_estimation,
  lastSeen: pothole.updated_at,
});

export default generateUserPotholes;

