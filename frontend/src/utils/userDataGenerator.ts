import { Pothole, PotholeStats } from '../services/potholeApi';

/**
 * Generates a deterministic seed from a user ID/email
 */
const getSeed = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Seeded random number generator for consistent randomness per user
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Generate potholes for a specific user
 * Same user always gets the same dataset
 */
export const generateUserPotholes = (userId: string, email?: string): Pothole[] => {
  const seed = getSeed(userId);
  const rng = new SeededRandom(seed);
  
  // Test user gets richer dataset
  const isTestUser = email === '1by23cs002' || userId.includes('1by23cs002');
  const count = isTestUser ? 25 : rng.nextInt(8, 18);
  
  // Base location (Bangalore area)
  const baseLat = 12.9716;
  const baseLng = 77.5946;
  
  const potholes: Pothole[] = [];
  const severities: Pothole['severity'][] = ['low', 'medium', 'high'];
  const statuses: Pothole['status'][] = ['open', 'in_progress', 'fixed'];
  
  for (let i = 0; i < count; i++) {
    // Generate consistent coordinates within Bangalore area
    const lat = baseLat + rng.nextFloat(-0.1, 0.1);
    const lng = baseLng + rng.nextFloat(-0.1, 0.1);
    
    const severity = severities[rng.nextInt(0, 2)];
    const status = statuses[rng.nextInt(0, 2)];
    
    const now = new Date();
    const daysAgo = rng.nextInt(0, 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + rng.nextInt(0, 5) * 24 * 60 * 60 * 1000);
    
    potholes.push({
      _id: `${seed}-${i}`,
      videoId: `video-${seed}`,
      latitude: lat,
      longitude: lng,
      severity,
      status,
      previewImage: null,
      confidence: rng.nextFloat(0.4, 0.95),
      detectionMeta: {
        x: rng.nextFloat(100, 520),
        y: rng.nextFloat(100, 360),
        width: rng.nextFloat(40, 180),
        height: rng.nextFloat(40, 180),
      },
      gpsMatch: {
        latitude: lat,
        longitude: lng,
        timestamp: createdAt.getTime(),
        source: 'index',
      },
      assignedContractor: status === 'in_progress' ? `Contractor ${rng.nextInt(1, 5)}` : null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as Pothole);
  }
  
  return potholes;
};

/**
 * Generate stats from potholes
 */
export const generateUserStats = (potholes: Pothole[]): PotholeStats => {
  const stats: PotholeStats = {
    severity_count: { low: 0, medium: 0, high: 0 },
    status_count: { open: 0, in_progress: 0, fixed: 0 },
    total_count: potholes.length,
    by_date: [],
  };

  potholes.forEach((pothole) => {
    stats.severity_count[pothole.severity]++;
    stats.status_count[pothole.status]++;
  });

  return stats;
};

