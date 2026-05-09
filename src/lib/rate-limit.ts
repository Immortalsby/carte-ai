import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
function redis() {
  if (!_redis) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      throw new Error("KV_REST_API_URL and KV_REST_API_TOKEN must be set for rate limiting");
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

function createLimiter(prefix: string, requests: number, window: string) {
  let _limiter: Ratelimit | null = null;
  return {
    limit(key: string) {
      if (!_limiter) {
        _limiter = new Ratelimit({
          redis: redis(),
          limiter: Ratelimit.slidingWindow(requests, window as "1 m"),
          prefix,
        });
      }
      return _limiter.limit(key);
    },
  };
}

// 推荐 API：验证用户 60 次/分钟/IP，未验证 10 次/分钟/IP
export const recommendRateLimit = createLimiter("ratelimit:recommend", 60, "1 m");
export const recommendRateLimitStrict = createLimiter("ratelimit:recommend-strict", 10, "1 m");

// 上传 API：10 次/分钟/tenant
export const ingestRateLimit = createLimiter("ratelimit:ingest", 10, "1 m");

// 埋点 API：120 次/分钟/IP
export const eventsRateLimit = createLimiter("ratelimit:events", 120, "1 m");
