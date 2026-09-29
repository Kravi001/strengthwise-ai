/**
 * In-memory sliding window rate limiter for Next.js API routes.
 * Tracks requests per client identifier (User ID or IP address).
 */

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory cache surviving across requests within the process
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < staleThreshold);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // epoch ms
  retryAfterSeconds: number;
}

/**
 * Check and record a rate limit hit for an identifier.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, windowSeconds: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitMap.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= config.limit) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime,
      retryAfterSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  const remaining = Math.max(0, config.limit - record.timestamps.length);
  const resetTime = record.timestamps[0] + windowMs;

  return {
    success: true,
    limit: config.limit,
    remaining,
    resetTime,
    retryAfterSeconds: 0,
  };
}

/**
 * Helper to extract client IP address from request headers.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ip = xForwardedFor.split(",")[0].trim();
    if (ip) return ip;
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "anonymous-client";
}
