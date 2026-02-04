import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, session, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication token required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token and check if expired
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

    // Query user table for session.userId
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

    // Verify user.role === 'admin'
    if (authenticatedUser.role !== 'admin') {
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
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body for 'reason' field
    const body = await request.json();
    const { reason } = body;

    // Validate reason is non-empty string
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required', code: 'MISSING_REASON' },
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

    const currentService = existingService[0];

    // Merge existing metadata with rejection information
    const existingMetadata = currentService.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      rejectionReason: reason.trim(),
      rejectedAt: new Date().toISOString(),
    };

    // Update service with rejection information
    const updatedService = await db
      .update(services)
      .set({
        status: 'archived',
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(services.id, serviceId))
      .returning();

    if (updatedService.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update service', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Service rejected successfully',
        data: {
          service: {
            id: updatedService[0].id,
            status: updatedService[0].status,
            metadata: updatedService[0].metadata,
            updatedAt: updatedService[0].updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}