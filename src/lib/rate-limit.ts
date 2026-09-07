// In-memory token bucket. Good enough for launch on a single instance;
// swap `allow` internals for Redis when horizontally scaling (see ARCHITECTURE.md).

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: max, updatedAt: now };
  const refill = ((now - b.updatedAt) / windowMs) * max;
  b.tokens = Math.min(max, b.tokens + refill);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

/** Test hook. */
export function resetBuckets(): void {
  buckets.clear();
}

// Convenience presets
export function aiRunLimiter(key: string): boolean {
  return allow(`ai-run:${key}`, 10, 60_000);
}

export function authLimiter(key: string): boolean {
  return allow(`auth:${key}`, 8, 60_000);
}
