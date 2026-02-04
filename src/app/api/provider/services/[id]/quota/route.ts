import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, entitlements, user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];
    const now = new Date();

    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user and verify role
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const authenticatedUser = userRecord[0];

    if (authenticatedUser.role !== 'provider') {
      return NextResponse.json(
        { error: 'Provider role required', code: 'PROVIDER_ROLE_REQUIRED' },
        { status: 403 }
      );
    }

    // Validate service ID from URL params
    const serviceId = params.id;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    const parsedServiceId = parseInt(serviceId);

    // Query services table to verify service exists and providerId matches
    const serviceRecord = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, parsedServiceId),
          eq(services.providerId, authenticatedUser.id)
        )
      )
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'You do not have permission to manage this service',
          code: 'SERVICE_NOT_FOUND_OR_NOT_OWNED',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, quotaAdjustment, reason } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate quotaAdjustment
    if (
      quotaAdjustment === undefined ||
      quotaAdjustment === null ||
      typeof quotaAdjustment !== 'number' ||
      isNaN(quotaAdjustment) ||
      !Number.isInteger(quotaAdjustment)
    ) {
      return NextResponse.json(
        {
          error: 'Quota adjustment must be a valid integer',
          code: 'INVALID_QUOTA_ADJUSTMENT',
        },
        { status: 400 }
      );
    }

    if (quotaAdjustment === 0) {
      return NextResponse.json(
        {
          error: 'Quota adjustment cannot be zero',
          code: 'ZERO_ADJUSTMENT',
        },
        { status: 400 }
      );
    }

    // Query entitlements table to find entitlement
    const entitlementRecord = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.serviceId, parsedServiceId)
        )
      )
      .limit(1);

    if (entitlementRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'Entitlement not found for this user and service',
          code: 'ENTITLEMENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const entitlement = entitlementRecord[0];
    const previousLimit = entitlement.quotaLimit;
    const newQuotaLimit = previousLimit + quotaAdjustment;

    // Validate newQuotaLimit is not negative
    if (newQuotaLimit < 0) {
      return NextResponse.json(
        {
          error: 'Quota limit cannot be negative',
          code: 'NEGATIVE_QUOTA_LIMIT',
        },
        { status: 400 }
      );
    }

    // Update entitlements table
    const updatedEntitlement = await db
      .update(entitlements)
      .set({
        quotaLimit: newQuotaLimit,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(entitlements.id, entitlement.id))
      .returning();

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Quota adjusted successfully',
        data: {
          entitlement: updatedEntitlement[0],
          adjustment: {
            previousLimit,
            newLimit: newQuotaLimit,
            adjustmentAmount: quotaAdjustment,
            reason: reason || null,
            adjustedBy: authenticatedUser.id,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}