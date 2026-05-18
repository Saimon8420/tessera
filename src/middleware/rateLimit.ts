import type { NextFunction, Request, Response } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const perMinute = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 60);
const limiter = url && token
  ? new Ratelimit({ redis: new Redis({ url, token, retry: { retries: 1, backoff: () => 0 } }), limiter: Ratelimit.slidingWindow(perMinute, "60 s"), prefix: "tessera" })
  : null;
export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (!limiter) return next();
  try {
    const id = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "anon";
    const { success, limit, remaining, reset } = await limiter.limit(id);
    res.setHeader("X-RateLimit-Limit", limit); res.setHeader("X-RateLimit-Remaining", remaining); res.setHeader("X-RateLimit-Reset", reset);
    if (!success) { res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }); return; }
    next();
  } catch { next(); }
}
