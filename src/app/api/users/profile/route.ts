import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Find session by token
    const userSession = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (userSession.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(userSession[0].expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Get user profile
    const userId = userSession[0].userId;
    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: userProfile[0].id,
        name: userProfile[0].name,
        email: userProfile[0].email,
        role: userProfile[0].role,
        createdAt: userProfile[0].createdAt,
        updatedAt: userProfile[0].updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;

    // Validation: userId is required
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'User ID is required and must be a non-empty string',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }

    // Validation: At least one field must be provided
    if (name === undefined && email === undefined) {
      return NextResponse.json(
        {
          error: 'At least one field (name or email) must be provided for update',
          code: 'NO_FIELDS_TO_UPDATE',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId.trim()))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    // Process name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          {
            error: 'Name cannot be empty',
            code: 'INVALID_NAME',
          },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    // Process email if provided
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          {
            error: 'Invalid email format',
            code: 'INVALID_EMAIL_FORMAT',
          },
          { status: 400 }
        );
      }

      // Check if email already exists for a different user
      const emailExists = await db
        .select()
        .from(user)
        .where(and(eq(user.email, trimmedEmail), ne(user.id, userId.trim())))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          {
            error: 'Email already exists for another user',
            code: 'EMAIL_ALREADY_EXISTS',
          },
          { status: 409 }
        );
      }

      updateData.email = trimmedEmail;
    }

    // Update user profile
    const updatedUser = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId.trim()))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user profile', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser[0],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}