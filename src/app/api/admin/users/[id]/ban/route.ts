import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token and check expiration
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
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Query user table for session userId
    const currentUserResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (currentUserResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const currentUser = currentUserResult[0];

    // Verify user role is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get target user ID from params
    const { id: targetUserId } = await params;

    // Prevent admin from banning themselves
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot ban yourself', code: 'CANNOT_BAN_SELF' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUserResult = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (targetUserResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'TARGET_USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user (cascading deletes will handle related records)
    await db
      .delete(user)
      .where(eq(user.id, targetUserId));

    return NextResponse.json({
      success: true,
      message: 'User banned successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}