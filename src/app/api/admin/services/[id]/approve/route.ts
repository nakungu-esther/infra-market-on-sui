import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, session, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
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
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Token expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user table for session.userId
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

    const currentUser = userRecord[0];

    // Verify user.role === 'admin'
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get id from params
    const { id } = await params;

    // Validate id is a valid integer
    const serviceId = parseInt(id);
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const service = existingService[0];

    // Check if service is already active
    if (service.status === 'active') {
      return NextResponse.json(
        { error: 'Service is already active', code: 'ALREADY_ACTIVE' },
        { status: 400 }
      );
    }

    // Update service status to 'active'
    const updatedService = await db
      .update(services)
      .set({
        status: 'active',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(services.id, serviceId))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Service approved successfully',
        data: {
          service: updatedService[0],
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