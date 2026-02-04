import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements, services, session, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const sessionData = sessionRecord[0];

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }

    // Get user details
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, sessionData.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return null;
    }

    return userRecord[0];
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Fetch entitlement with service details
    const entitlementRecord = await db
      .select({
        id: entitlements.id,
        userId: entitlements.userId,
        serviceId: entitlements.serviceId,
        paymentId: entitlements.paymentId,
        pricingTier: entitlements.pricingTier,
        quotaLimit: entitlements.quotaLimit,
        quotaUsed: entitlements.quotaUsed,
        validFrom: entitlements.validFrom,
        validUntil: entitlements.validUntil,
        isActive: entitlements.isActive,
        tokenType: entitlements.tokenType,
        amountPaid: entitlements.amountPaid,
        txDigest: entitlements.txDigest,
        createdAt: entitlements.createdAt,
        updatedAt: entitlements.updatedAt,
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          serviceType: services.serviceType,
          status: services.status,
          providerId: services.providerId,
        },
      })
      .from(entitlements)
      .leftJoin(services, eq(entitlements.serviceId, services.id))
      .where(eq(entitlements.id, parseInt(id)))
      .limit(1);

    if (entitlementRecord.length === 0) {
      return NextResponse.json(
        { error: 'Entitlement not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const entitlement = entitlementRecord[0];

    // Verify ownership (unless admin)
    if (authenticatedUser.role !== 'admin' && entitlement.userId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(entitlement, { status: 200 });
  } catch (error) {
    console.error('GET entitlement error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Verify admin role
    if (authenticatedUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Extract allowed fields
    const {
      quotaLimit,
      quotaUsed,
      validFrom,
      validUntil,
      isActive,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (quotaLimit !== undefined) {
      if (typeof quotaLimit !== 'number' || quotaLimit < 0) {
        return NextResponse.json(
          { error: 'quotaLimit must be a non-negative number', code: 'INVALID_QUOTA_LIMIT' },
          { status: 400 }
        );
      }
      updates.quotaLimit = quotaLimit;
    }

    if (quotaUsed !== undefined) {
      if (typeof quotaUsed !== 'number' || quotaUsed < 0) {
        return NextResponse.json(
          { error: 'quotaUsed must be a non-negative number', code: 'INVALID_QUOTA_USED' },
          { status: 400 }
        );
      }
      updates.quotaUsed = quotaUsed;
    }

    if (validFrom !== undefined) {
      if (typeof validFrom !== 'string' || !validFrom.trim()) {
        return NextResponse.json(
          { error: 'validFrom must be a valid date string', code: 'INVALID_VALID_FROM' },
          { status: 400 }
        );
      }
      updates.validFrom = validFrom;
    }

    if (validUntil !== undefined) {
      if (typeof validUntil !== 'string' || !validUntil.trim()) {
        return NextResponse.json(
          { error: 'validUntil must be a valid date string', code: 'INVALID_VALID_UNTIL' },
          { status: 400 }
        );
      }
      updates.validUntil = validUntil;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean', code: 'INVALID_IS_ACTIVE' },
          { status: 400 }
        );
      }
      updates.isActive = isActive;
    }

    // Check if entitlement exists
    const existingEntitlement = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, parseInt(id)))
      .limit(1);

    if (existingEntitlement.length === 0) {
      return NextResponse.json(
        { error: 'Entitlement not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Update entitlement
    const updated = await db
      .update(entitlements)
      .set(updates)
      .where(eq(entitlements.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update entitlement', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT entitlement error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}