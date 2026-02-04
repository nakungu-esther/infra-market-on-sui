import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_ROLES = ['developer', 'provider', 'admin'] as const;
type AllowedRole = typeof ALLOWED_ROLES[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required and must be a non-empty string' 
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role is required and must be a string' 
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId.trim()))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found' 
        },
        { status: 404 }
      );
    }

    // Update user role
    const updatedUser = await db.update(user)
      .set({ 
        role: role as AllowedRole,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId.trim()))
      .returning();

    return NextResponse.json(
      { 
        success: true, 
        message: 'Role updated successfully',
        data: { 
          user: updatedUser[0] 
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}