import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['active', 'pending', 'suspended', 'archived'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Extract and validate ID from URL params
    const { id } = await params;
    const serviceId = parseInt(id);
    
    if (!id || isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status field
    if (!status) {
      return NextResponse.json(
        { error: 'Status field is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if service exists and belongs to authenticated provider
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

    // Verify ownership
    if (existingService[0].providerId !== user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this service',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Update service status
    const updatedService = await db
      .update(services)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(services.id, serviceId), eq(services.providerId, user.id)))
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
        data: {
          service: updatedService[0],
        },
        message: 'Service status updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/services/[id]/status error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}