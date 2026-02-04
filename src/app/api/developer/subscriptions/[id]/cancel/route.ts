import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, entitlements, session, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Query session table to validate token and get userId
    const sessionRecord = await db.select()
      .from(session)
      .where(and(
        eq(session.token, token),
        gt(session.expiresAt, new Date())
      ))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userId = sessionRecord[0].userId;

    // Query user table and verify role === 'developer'
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    if (userRecord[0].role !== 'developer') {
      return NextResponse.json({ 
        error: 'Developer role required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Extract subscription id from search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid subscription ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const subscriptionId = parseInt(id);

    // Query subscriptions table to find subscription by id
    const subscriptionRecord = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    // Verify subscription exists and belongs to authenticated user
    if (subscriptionRecord.length === 0 || subscriptionRecord[0].userId !== userId) {
      return NextResponse.json({ 
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND' 
      }, { status: 404 });
    }

    const subscription = subscriptionRecord[0];

    // Check if subscription is already cancelled
    if (subscription.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Subscription is already cancelled',
        code: 'ALREADY_CANCELLED' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update subscriptions table
    const updatedSubscription = await db.update(subscriptions)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        autoRenew: false,
        updatedAt: now
      })
      .where(and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, userId)
      ))
      .returning();

    if (updatedSubscription.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to cancel subscription',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    // Update related entitlements table
    await db.update(entitlements)
      .set({
        isActive: false,
        updatedAt: now
      })
      .where(eq(entitlements.id, subscription.entitlementId));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: updatedSubscription[0]
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}