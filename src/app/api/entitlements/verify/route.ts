import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements } from '@/db/schema';
import { eq, and, lte, gte, lt } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { serviceId } = body;

    // Validate required fields
    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required', code: 'MISSING_SERVICE_ID' },
        { status: 400 }
      );
    }

    // Validate serviceId is a valid integer
    const parsedServiceId = parseInt(serviceId);
    if (isNaN(parsedServiceId)) {
      return NextResponse.json(
        { error: 'serviceId must be a valid integer', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    // Get current timestamp
    const currentTimestamp = new Date().toISOString();

    // Query for valid entitlement
    const validEntitlements = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, user.id),
          eq(entitlements.serviceId, parsedServiceId),
          eq(entitlements.isActive, true),
          lte(entitlements.validFrom, currentTimestamp),
          gte(entitlements.validUntil, currentTimestamp),
          lt(entitlements.quotaUsed, entitlements.quotaLimit)
        )
      )
      .limit(1);

    // Check if valid entitlement exists
    if (validEntitlements.length === 0) {
      // Check for more specific error reasons
      const anyEntitlement = await db
        .select()
        .from(entitlements)
        .where(
          and(
            eq(entitlements.userId, user.id),
            eq(entitlements.serviceId, parsedServiceId)
          )
        )
        .limit(1);

      if (anyEntitlement.length === 0) {
        return NextResponse.json(
          {
            error: 'No active entitlement found for this service',
            code: 'NO_ENTITLEMENT',
            reason: 'NO_ENTITLEMENT_EXISTS'
          },
          { status: 403 }
        );
      }

      const entitlement = anyEntitlement[0];

      // Check if entitlement is inactive
      if (!entitlement.isActive) {
        return NextResponse.json(
          {
            error: 'Entitlement is not active',
            code: 'ENTITLEMENT_INACTIVE',
            reason: 'ENTITLEMENT_INACTIVE'
          },
          { status: 403 }
        );
      }

      // Check if entitlement has expired
      if (new Date(entitlement.validUntil) < new Date(currentTimestamp)) {
        return NextResponse.json(
          {
            error: 'Entitlement has expired',
            code: 'ENTITLEMENT_EXPIRED',
            reason: 'ENTITLEMENT_EXPIRED',
            validUntil: entitlement.validUntil
          },
          { status: 403 }
        );
      }

      // Check if entitlement hasn't started yet
      if (new Date(entitlement.validFrom) > new Date(currentTimestamp)) {
        return NextResponse.json(
          {
            error: 'Entitlement is not yet valid',
            code: 'ENTITLEMENT_NOT_STARTED',
            reason: 'ENTITLEMENT_NOT_STARTED',
            validFrom: entitlement.validFrom
          },
          { status: 403 }
        );
      }

      // Check if quota is exceeded
      if (entitlement.quotaUsed >= entitlement.quotaLimit) {
        return NextResponse.json(
          {
            error: 'Quota limit exceeded',
            code: 'QUOTA_EXCEEDED',
            reason: 'QUOTA_EXCEEDED',
            quotaLimit: entitlement.quotaLimit,
            quotaUsed: entitlement.quotaUsed
          },
          { status: 403 }
        );
      }

      // Generic error if none of the above conditions match
      return NextResponse.json(
        {
          error: 'No valid entitlement found',
          code: 'INVALID_ENTITLEMENT',
          reason: 'ENTITLEMENT_NOT_VALID'
        },
        { status: 403 }
      );
    }

    // Valid entitlement found
    const entitlement = validEntitlements[0];
    const remainingQuota = entitlement.quotaLimit - entitlement.quotaUsed;

    return NextResponse.json({
      success: true,
      entitlement: {
        id: entitlement.id,
        pricingTier: entitlement.pricingTier,
        quotaLimit: entitlement.quotaLimit,
        quotaUsed: entitlement.quotaUsed,
        remainingQuota: remainingQuota,
        validFrom: entitlement.validFrom,
        validUntil: entitlement.validUntil,
        isActive: entitlement.isActive,
        serviceId: entitlement.serviceId,
        userId: entitlement.userId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}