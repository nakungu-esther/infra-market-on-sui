import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token and check if not expired
    const sessionRecord = await db
      .select()
      .from(session)
      .where(
        and(
          eq(session.token, token),
          gt(session.expiresAt, new Date())
        )
      )
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Query user table for session.userId
    const authenticatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, sessionRecord[0].userId))
      .limit(1);

    if (authenticatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    // Verify user.role === 'admin'
    if (authenticatedUser[0].role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get target user ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if user is already admin
    if (targetUser[0].role === 'admin') {
      return NextResponse.json(
        { error: 'User is already an admin', code: 'ALREADY_ADMIN' },
        { status: 400 }
      );
    }

    // Update user role to admin
    const updatedUser = await db
      .update(user)
      .set({
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(user.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: {
        user: {
          id: updatedUser[0].id,
          name: updatedUser[0].name,
          email: updatedUser[0].email,
          role: updatedUser[0].role,
          updatedAt: updatedUser[0].updatedAt.toISOString()
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST promote user to admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}