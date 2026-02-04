import Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export class RateLimiter {
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
      } catch (error) {
        console.warn('Redis connection failed, using in-memory rate limiting:', error);
      }
    }
  }

  /**
   * Token bucket rate limiting with Redis or in-memory fallback
   */
  async checkRateLimit(
    key: string,
    maxTokens: number,
    refillRate: number // tokens per second
  ): Promise<RateLimitResult> {
    const now = Date.now() / 1000;

    if (this.redis) {
      return this.redisTokenBucket(key, maxTokens, refillRate, now);
    } else {
      return this.inMemoryTokenBucket(key, maxTokens, refillRate, now);
    }
  }

  /**
   * Redis-backed token bucket with Lua script for atomicity
   */
  private async redisTokenBucket(
    key: string,
    maxTokens: number,
    refillRate: number,
    now: number
  ): Promise<RateLimitResult> {
    const rateLimitKey = `rate:${key}`;

    try {
      const result = await this.redis!.eval(`
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local max_tokens = tonumber(ARGV[2])
        local refill_rate = tonumber(ARGV[3])
        
        local data = redis.call('HGETALL', key)
        local tokens = max_tokens
        local last_refill = now
        
        -- Parse existing data
        for i = 1, #data, 2 do
          if data[i] == 'tokens' then
            tokens = tonumber(data[i + 1])
          elseif data[i] == 'last_refill' then
            last_refill = tonumber(data[i + 1])
          end
        end
        
        -- Refill tokens based on elapsed time
        local elapsed = math.max(0, now - last_refill)
        tokens = math.min(max_tokens, tokens + (elapsed * refill_rate))
        
        local allowed = 0
        if tokens >= 1 then
          tokens = tokens - 1
          allowed = 1
        end
        
        -- Update state
        redis.call('HSET', key, 'tokens', tostring(tokens), 'last_refill', tostring(now))
        redis.call('EXPIRE', key, 3600)
        
        return {allowed, math.floor(tokens), max_tokens}
      `, 1, rateLimitKey, now, maxTokens, refillRate) as [number, number, number];

      const [allowed, remaining, limit] = result;

      return {
        allowed: allowed === 1,
        remaining,
        limit,
        resetAt: Math.floor(now + (1 / refillRate)),
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fail open in case of Redis error
      return {
        allowed: true,
        remaining: maxTokens,
        limit: maxTokens,
        resetAt: Math.floor(now + 60),
      };
    }
  }

  /**
   * In-memory token bucket (fallback when Redis unavailable)
   */
  private inMemoryTokenBucket(
    key: string,
    maxTokens: number,
    refillRate: number,
    now: number
  ): RateLimitResult {
    let bucket = this.inMemoryStore.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: maxTokens, resetAt: now + 60 };
    } else {
      // Refill tokens
      const elapsed = now - (bucket.resetAt - 60);
      const refilled = Math.floor(elapsed * refillRate);
      bucket.count = Math.min(maxTokens, bucket.count + refilled);
    }

    const allowed = bucket.count >= 1;
    if (allowed) {
      bucket.count -= 1;
    }

    this.inMemoryStore.set(key, bucket);

    return {
      allowed,
      remaining: bucket.count,
      limit: maxTokens,
      resetAt: Math.floor(bucket.resetAt),
    };
  }

  /**
   * Fixed window counter for simple rate limiting
   */
  async checkFixedWindow(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `window:${key}:${Math.floor(now / windowSeconds)}`;

    if (this.redis) {
      try {
        const count = await this.redis.incr(windowKey);
        
        if (count === 1) {
          await this.redis.expire(windowKey, windowSeconds);
        }

        const resetAt = Math.ceil(now / windowSeconds) * windowSeconds;

        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          limit,
          resetAt,
        };
      } catch (error) {
        console.error('Redis fixed window error:', error);
      }
    }

    // In-memory fallback
    const bucket = this.inMemoryStore.get(windowKey) || { count: 0, resetAt: now + windowSeconds };
    bucket.count += 1;
    
    const allowed = bucket.count <= limit;
    this.inMemoryStore.set(windowKey, bucket);

    return {
      allowed,
      remaining: Math.max(0, limit - bucket.count),
      limit,
      resetAt: bucket.resetAt,
    };
  }

  close() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    const redisUrl = process.env.REDIS_URL;
    rateLimiterInstance = new RateLimiter(redisUrl);
  }
  return rateLimiterInstance;
}
