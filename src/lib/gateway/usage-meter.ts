import Redis from 'ioredis';

export interface UsageMetrics {
  userId: string;
  feature: string;
  usage: number;
  limit: number;
  percentage: number;
  resetDate: Date;
  status: 'ok' | 'warning' | 'exceeded';
}

export interface QuotaCheck {
  allowed: boolean;
  metrics: UsageMetrics;
}

export class UsageMeter {
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, number> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
      } catch (error) {
        console.warn('Redis connection failed, using in-memory usage tracking:', error);
      }
    }
  }

  /**
   * Record usage and return current metrics
   */
  async recordUsage(
    userId: string,
    feature: string,
    units: number = 1,
    tierLimits?: Record<string, number>
  ): Promise<UsageMetrics> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const key = `usage:${userId}:${feature}:${year}-${month}`;
    
    const monthEnd = new Date(year, month, 1);

    let usage: number;

    if (this.redis) {
      try {
        usage = await this.redis.incrbyfloat(key, units);
        await this.redis.expireat(key, Math.floor(monthEnd.getTime() / 1000));
      } catch (error) {
        console.error('Redis usage tracking error:', error);
        usage = this.inMemoryIncrement(key, units);
      }
    } else {
      usage = this.inMemoryIncrement(key, units);
    }

    // Fetch user tier limits
    const defaultLimits: Record<string, number> = {
      free: 1000,
      pro: 10000,
      enterprise: 100000,
    };

    const limits = tierLimits || defaultLimits;
    let userTier = 'free';

    if (this.redis) {
      try {
        const tier = await this.redis.get(`user:${userId}:tier`);
        if (tier) userTier = tier;
      } catch {}
    }

    const limit = limits[userTier] || limits.free || 1000;
    const percentage = (usage / limit) * 100;

    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    // Log usage for analytics
    if (this.redis) {
      try {
        await this.redis.zadd(
          `usage_history:${userId}:${feature}`,
          Date.now(),
          JSON.stringify({ timestamp: now.toISOString(), units, usage: Math.floor(usage) })
        );
      } catch {}
    }

    return {
      userId,
      feature,
      usage: Math.floor(usage),
      limit,
      percentage: Math.round(percentage * 100) / 100,
      resetDate: monthEnd,
      status,
    };
  }

  /**
   * Check quota without incrementing
   */
  async checkQuota(
    userId: string,
    feature: string,
    tierLimits?: Record<string, number>
  ): Promise<UsageMetrics> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const key = `usage:${userId}:${feature}:${year}-${month}`;
    
    const monthEnd = new Date(year, month, 1);

    let usage = 0;

    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        usage = value ? parseFloat(value) : 0;
      } catch {
        usage = this.inMemoryStore.get(key) || 0;
      }
    } else {
      usage = this.inMemoryStore.get(key) || 0;
    }

    const defaultLimits: Record<string, number> = {
      free: 1000,
      pro: 10000,
      enterprise: 100000,
    };

    const limits = tierLimits || defaultLimits;
    let userTier = 'free';

    if (this.redis) {
      try {
        const tier = await this.redis.get(`user:${userId}:tier`);
        if (tier) userTier = tier;
      } catch {}
    }

    const limit = limits[userTier] || limits.free || 1000;
    const percentage = (usage / limit) * 100;

    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    return {
      userId,
      feature,
      usage: Math.floor(usage),
      limit,
      percentage: Math.round(percentage * 100) / 100,
      resetDate: monthEnd,
      status,
    };
  }

  /**
   * Enforce quota and record usage if allowed
   */
  async enforceQuota(
    userId: string,
    feature: string,
    units: number = 1,
    tierLimits?: Record<string, number>
  ): Promise<QuotaCheck> {
    const currentMetrics = await this.checkQuota(userId, feature, tierLimits);

    if (currentMetrics.status === 'exceeded') {
      return {
        allowed: false,
        metrics: currentMetrics,
      };
    }

    const metrics = await this.recordUsage(userId, feature, units, tierLimits);

    return {
      allowed: metrics.status !== 'exceeded',
      metrics,
    };
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    userId: string,
    feature: string,
    daysBack: number = 30
  ): Promise<Array<{ timestamp: string; units: number; usage: number }>> {
    if (!this.redis) return [];

    try {
      const startTime = Date.now() - daysBack * 24 * 60 * 60 * 1000;
      
      const entries = await this.redis.zrangebyscore(
        `usage_history:${userId}:${feature}`,
        startTime,
        Date.now()
      );

      return entries.map(e => JSON.parse(e));
    } catch (error) {
      console.error('Error fetching usage history:', error);
      return [];
    }
  }

  /**
   * In-memory increment helper
   */
  private inMemoryIncrement(key: string, units: number): number {
    const current = this.inMemoryStore.get(key) || 0;
    const newValue = current + units;
    this.inMemoryStore.set(key, newValue);
    return newValue;
  }

  close() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}

// Singleton instance
let usageMeterInstance: UsageMeter | null = null;

export function getUsageMeter(): UsageMeter {
  if (!usageMeterInstance) {
    const redisUrl = process.env.REDIS_URL;
    usageMeterInstance = new UsageMeter(redisUrl);
  }
  return usageMeterInstance;
}
