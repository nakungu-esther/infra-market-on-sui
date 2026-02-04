import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, user, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_STATUSES = ['active', 'suspended', 'archived'] as const;
type ServiceStatus = typeof VALID_STATUSES[number];

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select({
      userId: session.userId,
      expiresAt: session.expiresAt,
    })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    const userRecord = await db.select({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })
      .from(user)
      .where(eq(user.id, userSession.userId))
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser(request);

    if (!adminUser) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }

    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Admin privileges required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid service ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const serviceId = parseInt(id);

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { 
          error: 'Status is required',
          code: 'MISSING_STATUS'
        },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    const existingService = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { 
          error: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const updatedService = await db.update(services)
      .set({
        status: status as ServiceStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(services.id, serviceId))
      .returning();

    if (updatedService.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to update service',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          service: updatedService[0],
        },
        message: `Service status updated to ${status}`,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}