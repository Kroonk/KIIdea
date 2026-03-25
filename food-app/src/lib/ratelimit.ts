/**
 * Simple in-memory rate limiter for server actions.
 * No external dependencies (Redis etc.) needed — fits SQLite-based setup.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const records = new Map<string, RateLimitRecord>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = records.get(key)

  if (!record || now > record.resetAt) {
    records.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: maxRequests - record.count }
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of records) {
    if (now > record.resetAt) {
      records.delete(key)
    }
  }
}, 10 * 60 * 1000)
