import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, entitlements, services, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionResult = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date())
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const adminUserId = sessionResult[0].userId;

    // Verify admin role
    const adminUser = await db
      .select()
      .from(user)
      .where(eq(user.id, adminUserId))
      .limit(1);

    if (adminUser.length === 0 || adminUser[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Extract target user ID from URL params
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required in URL parameters', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { serviceId, quotaAdjustment, reason } = body;

    // Validate required fields
    if (serviceId === undefined || serviceId === null) {
      return NextResponse.json(
        { error: 'Service ID is required', code: 'MISSING_SERVICE_ID' },
        { status: 400 }
      );
    }

    if (quotaAdjustment === undefined || quotaAdjustment === null) {
      return NextResponse.json(
        { error: 'Quota adjustment is required', code: 'MISSING_QUOTA_ADJUSTMENT' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required', code: 'MISSING_REASON' },
        { status: 400 }
      );
    }

    // Validate serviceId is integer
    const parsedServiceId = parseInt(serviceId);
    if (isNaN(parsedServiceId)) {
      return NextResponse.json(
        { error: 'Service ID must be a valid integer', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    // Validate quotaAdjustment is integer
    const parsedQuotaAdjustment = parseInt(quotaAdjustment);
    if (isNaN(parsedQuotaAdjustment)) {
      return NextResponse.json(
        { error: 'Quota adjustment must be a valid integer', code: 'INVALID_QUOTA_ADJUSTMENT' },
        { status: 400 }
      );
    }

    // Validate quotaAdjustment is not zero
    if (parsedQuotaAdjustment === 0) {
      return NextResponse.json(
        { error: 'Quota adjustment cannot be zero', code: 'ZERO_ADJUSTMENT' },
        { status: 400 }
      );
    }

    // Validate reason is non-empty string
    if (typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Reason must be a non-empty string', code: 'INVALID_REASON' },
        { status: 400 }
      );
    }

    // Validate reason max length
    if (reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason cannot exceed 500 characters', code: 'REASON_TOO_LONG' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify service exists
    const serviceResult = await db
      .select()
      .from(services)
      .where(eq(services.id, parsedServiceId))
      .limit(1);

    if (serviceResult.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Query entitlement
    const entitlementResult = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, targetUserId),
          eq(entitlements.serviceId, parsedServiceId)
        )
      )
      .limit(1);

    if (entitlementResult.length === 0) {
      return NextResponse.json(
        { error: 'No entitlement found for this user and service', code: 'ENTITLEMENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentEntitlement = entitlementResult[0];
    const previousLimit = currentEntitlement.quotaLimit;
    const newQuotaLimit = previousLimit + parsedQuotaAdjustment;

    // Validate newQuotaLimit is not negative
    if (newQuotaLimit < 0) {
      return NextResponse.json(
        { error: 'Quota limit cannot be negative', code: 'NEGATIVE_QUOTA' },
        { status: 400 }
      );
    }

    // Update entitlement
    const adjustedAt = new Date().toISOString();
    const updatedEntitlement = await db
      .update(entitlements)
      .set({
        quotaLimit: newQuotaLimit,
        updatedAt: adjustedAt,
      })
      .where(eq(entitlements.id, currentEntitlement.id))
      .returning();

    // Return success response with full audit trail
    return NextResponse.json(
      {
        success: true,
        message: 'Quota adjusted successfully by admin',
        data: {
          user: {
            id: targetUser[0].id,
            name: targetUser[0].name,
            email: targetUser[0].email,
          },
          service: {
            id: serviceResult[0].id,
            name: serviceResult[0].name,
          },
          entitlement: {
            id: updatedEntitlement[0].id,
            quotaLimit: updatedEntitlement[0].quotaLimit,
            quotaUsed: updatedEntitlement[0].quotaUsed,
            updatedAt: updatedEntitlement[0].updatedAt,
          },
          adjustment: {
            previousLimit: previousLimit,
            newLimit: newQuotaLimit,
            adjustmentAmount: parsedQuotaAdjustment,
            reason: reason.trim(),
            adjustedBy: adminUserId,
            adjustedAt: adjustedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}