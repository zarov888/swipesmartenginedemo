// Mulberry32 PRNG - Fast, simple, deterministic
// https://gist.github.com/tommyettinger/46a874533244883189143505d203312c

export class PRNG {
  private state: number;
  private initialSeed: number;

  constructor(seed: number) {
    this.initialSeed = seed;
    this.state = seed;
  }

  // Core PRNG function
  private next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Get a random float between 0 and 1
  random(): number {
    return this.next();
  }

  // Get a random integer between min (inclusive) and max (inclusive)
  randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Get a random float between min and max
  randomFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Get a random boolean with optional probability
  randomBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Pick a random element from an array
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  // Shuffle an array (Fisher-Yates)
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Get deterministic latency within a range
  getLatency(min: number, max: number): number {
    // Add some variability with a slight bias toward lower values
    const base = this.next();
    const skewed = Math.pow(base, 0.8); // Slight bias toward lower values
    return Math.round(min + skewed * (max - min));
  }

  // Generate a deterministic correlation ID
  generateCorrelationId(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        result += '-';
      }
      result += chars[Math.floor(this.next() * 16)];
    }
    return result;
  }

  // Generate a deterministic risk score
  getRiskScore(baseRisk: number, variance: number = 15): number {
    const adjustment = (this.next() - 0.5) * 2 * variance;
    return Math.max(0, Math.min(100, baseRisk + adjustment));
  }

  // Generate deterministic decline probability
  getDeclineProbability(riskScore: number): number {
    // Higher risk = higher decline probability with some randomness
    const base = riskScore / 100;
    const variance = this.next() * 0.1 - 0.05;
    return Math.max(0, Math.min(1, base * 0.8 + variance));
  }

  // Simulate auth result deterministically
  simulateAuthResult(declineProbability: number): boolean {
    return this.next() > declineProbability;
  }

  // Reset to initial seed for replay
  reset(): void {
    this.state = this.initialSeed;
  }

  // Get current seed for display
  getSeed(): number {
    return this.initialSeed;
  }
}

// Generate a new random seed
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

// Create a hash from a string (for policy signatures etc)
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:${hex}${hex}${hex.slice(0, 8)}`;
}
