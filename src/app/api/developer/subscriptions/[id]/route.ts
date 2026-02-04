import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements, session, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session and validate token
    const sessionResult = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user and verify role
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const authenticatedUser = userResult[0];

    if (authenticatedUser.role !== 'developer') {
      return NextResponse.json(
        { error: 'Access denied. Developer role required.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get and validate ID parameter
    const { id } = await params;
    const entitlementId = parseInt(id);

    if (isNaN(entitlementId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if entitlement exists
    const entitlementResult = await db
      .select()
      .from(entitlements)
      .where(eq(entitlements.id, entitlementId))
      .limit(1);

    if (entitlementResult.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const entitlement = entitlementResult[0];

    // Verify ownership
    if (entitlement.userId !== authenticatedUser.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to cancel this subscription',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Check if already inactive
    if (!entitlement.isActive) {
      return NextResponse.json(
        {
          error: 'Subscription is already cancelled',
          code: 'ALREADY_CANCELLED',
        },
        { status: 400 }
      );
    }

    // Update entitlement to inactive
    const updatedEntitlement = await db
      .update(entitlements)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(entitlements.id, entitlementId),
          eq(entitlements.userId, authenticatedUser.id)
        )
      )
      .returning();

    if (updatedEntitlement.length === 0) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          entitlement: {
            id: updatedEntitlement[0].id,
            userId: updatedEntitlement[0].userId,
            serviceId: updatedEntitlement[0].serviceId,
            isActive: updatedEntitlement[0].isActive,
            updatedAt: updatedEntitlement[0].updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE entitlement error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}