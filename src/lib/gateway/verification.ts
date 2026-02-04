import { db } from '@/db';
import { entitlements, usageLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface VerificationResult {
  allowed: boolean;
  entitlementId?: number;
  quotaRemaining?: number;
  message?: string;
  statusCode: number;
}

/**
 * Verify if a user has valid entitlement for a service
 */
export async function verifyEntitlement(
  userId: string,
  serviceId: number
): Promise<VerificationResult> {
  try {
    // Find active entitlement
    const entitlement = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.serviceId, serviceId),
          eq(entitlements.isActive, true)
        )
      )
      .get();

    if (!entitlement) {
      return {
        allowed: false,
        message: 'No active subscription found',
        statusCode: 403,
      };
    }

    // Check if entitlement is still valid
    const now = new Date();
    const validUntil = new Date(entitlement.validUntil);

    if (now > validUntil) {
      // Deactivate expired entitlement
      await db
        .update(entitlements)
        .set({ isActive: false, updatedAt: now.toISOString() })
        .where(eq(entitlements.id, entitlement.id))
        .run();

      return {
        allowed: false,
        message: 'Subscription expired',
        statusCode: 403,
      };
    }

    // Check quota
    if (entitlement.quotaUsed >= entitlement.quotaLimit) {
      return {
        allowed: false,
        message: 'Quota exceeded',
        statusCode: 429,
      };
    }

    return {
      allowed: true,
      entitlementId: entitlement.id,
      quotaRemaining: entitlement.quotaLimit - entitlement.quotaUsed,
      message: 'Access granted',
      statusCode: 200,
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      allowed: false,
      message: 'Internal verification error',
      statusCode: 500,
    };
  }
}

/**
 * Track API usage
 */
export async function trackUsage(
  entitlementId: number,
  userId: string,
  serviceId: number,
  endpoint: string,
  requestsCount: number = 1,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const now = new Date();

    // Log usage
    await db.insert(usageLogs).values({
      entitlementId,
      userId,
      serviceId,
      timestamp: now.toISOString(),
      requestsCount,
      endpoint,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      createdAt: now.toISOString(),
    }).run();

    // Update quota used
    const entitlement = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, entitlementId))
      .get();

    if (entitlement) {
      await db
        .update(entitlements)
        .set({
          quotaUsed: entitlement.quotaUsed + requestsCount,
          updatedAt: now.toISOString(),
        })
        .where(eq(entitlements.id, entitlementId))
        .run();
    }

    return true;
  } catch (error) {
    console.error('Usage tracking error:', error);
    return false;
  }
}

/**
 * Get current usage statistics
 */
export async function getUsageStats(userId: string, serviceId: number) {
  try {
    const entitlement = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.serviceId, serviceId),
          eq(entitlements.isActive, true)
        )
      )
      .get();

    if (!entitlement) {
      return null;
    }

    const logs = await db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.entitlementId, entitlement.id))
      .all();

    return {
      entitlement,
      totalRequests: entitlement.quotaUsed,
      quotaLimit: entitlement.quotaLimit,
      quotaRemaining: entitlement.quotaLimit - entitlement.quotaUsed,
      usagePercentage: (entitlement.quotaUsed / entitlement.quotaLimit) * 100,
      validUntil: entitlement.validUntil,
      logs,
    };
  } catch (error) {
    console.error('Get usage stats error:', error);
    return null;
  }
}
