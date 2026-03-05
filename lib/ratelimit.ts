/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Resets per deployment — good enough for MVP without Redis.
 *
 * Usage:
 *   const limiter = ratelimit({ limit: 5, windowMs: 60_000 });
 *   const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 *   if (!limiter(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitStore>>();

export function ratelimit({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const store = new Map<string, RateLimitStore>();
  // Keep each limiter's store in the outer map for GC visibility (optional)
  const id = Math.random().toString(36).slice(2);
  stores.set(id, store);

  return function check(key: string): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return true; // allowed
    }

    if (entry.count >= limit) {
      return false; // blocked
    }

    entry.count++;
    return true; // allowed
  };
}

/** Extract the real client IP from common proxy headers */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
