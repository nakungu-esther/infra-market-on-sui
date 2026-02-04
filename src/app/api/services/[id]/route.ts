// API route for individual service operations
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET handler - Get single service details (PUBLIC ACCESS)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    
    // Fetch service
    const service = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);
    
    if (service.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Fetch tags for this service
    const tags = await db
      .select()
      .from(serviceTags)
      .where(eq(serviceTags.serviceId, serviceId));
    
    return NextResponse.json({
      success: true,
      data: {
        service: service[0],
        tags: tags.map(t => ({
          id: t.id,
          tag: t.tag,
          addedByAdmin: t.addedByAdmin,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// PUT handler - Update service (PROVIDER AUTHENTICATION + OWNERSHIP REQUIRED)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    
    // Authentication check
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Get user session
    const sessionRecord = await db
      .select()
      .from((await import('@/db/schema')).session)
      .where(eq((await import('@/db/schema')).session.token, token))
      .limit(1);
    
    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
    
    const userId = sessionRecord[0].userId;
    
    // Verify service exists and belongs to provider
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
    
    if (existingService[0].providerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to update this service', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, description, serviceType, status, metadata, pricingInfo, contactInfo, isAcceptingUsers } = body;
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'pending', 'suspended', 'archived'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (serviceType !== undefined) updateData.serviceType = serviceType.trim();
    if (status !== undefined) updateData.status = status;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (pricingInfo !== undefined) updateData.pricingInfo = pricingInfo;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (isAcceptingUsers !== undefined) updateData.isAcceptingUsers = isAcceptingUsers;
    
    // Update service
    const updatedService = await db
      .update(services)
      .set(updateData)
      .where(and(eq(services.id, serviceId), eq(services.providerId, userId)))
      .returning();
    
    return NextResponse.json({
      success: true,
      data: updatedService[0],
    });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE handler - Delete service (PROVIDER AUTHENTICATION + OWNERSHIP REQUIRED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const serviceId = parseInt(id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }
    
    // Authentication check
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Get user session
    const sessionRecord = await db
      .select()
      .from((await import('@/db/schema')).session)
      .where(eq((await import('@/db/schema')).session.token, token))
      .limit(1);
    
    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }
    
    const userId = sessionRecord[0].userId;
    
    // Verify service exists and belongs to provider
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
    
    if (existingService[0].providerId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this service', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    
    // Delete service (cascading deletes will handle tags and mappings)
    await db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.providerId, userId)));
    
    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}