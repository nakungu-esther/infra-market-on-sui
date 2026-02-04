import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, session, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

async function authenticateProvider(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Authentication required', status: 401 };
    }

    const token = authHeader.substring(7);
    
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    const userSession = sessionResult[0];
    
    if (new Date(userSession.expiresAt) < new Date()) {
      return { error: 'Token expired', status: 401 };
    }

    const userResult = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userResult.length === 0) {
      return { error: 'User not found', status: 401 };
    }

    const authenticatedUser = userResult[0];

    if (authenticatedUser.role !== 'provider') {
      return { error: 'Access denied. Provider role required', status: 403 };
    }

    return { user: authenticatedUser };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateProvider(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const authenticatedUser = authResult.user;
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const serviceId = parseInt(id);

    const existingService = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingService[0].providerId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this service', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      serviceType,
      status,
      metadata,
      pricingInfo,
      contactInfo,
      isAcceptingUsers
    } = body;

    const validStatuses = ['active', 'pending', 'suspended', 'archived'];

    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { error: 'Name must be a string', code: 'INVALID_NAME_TYPE' },
          { status: 400 }
        );
      }
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'EMPTY_NAME' },
          { status: 400 }
        );
      }
      if (trimmedName.length > 200) {
        return NextResponse.json(
          { error: 'Name must not exceed 200 characters', code: 'NAME_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    if (description !== undefined && typeof description === 'string') {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 1000) {
        return NextResponse.json(
          { error: 'Description must not exceed 1000 characters', code: 'DESCRIPTION_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { 
            error: `Status must be one of: ${validStatuses.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (serviceType !== undefined) {
      updateData.serviceType = serviceType;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }
    if (pricingInfo !== undefined) {
      updateData.pricingInfo = pricingInfo;
    }
    if (contactInfo !== undefined) {
      updateData.contactInfo = contactInfo;
    }
    if (isAcceptingUsers !== undefined) {
      updateData.isAcceptingUsers = isAcceptingUsers;
    }

    const updatedService = await db.update(services)
      .set(updateData)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.providerId, authenticatedUser.id)
        )
      )
      .returning();

    if (updatedService.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update service', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        service: updatedService[0]
      }
    }, { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateProvider(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const authenticatedUser = authResult.user;
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const serviceId = parseInt(id);

    const existingService = await db.select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (existingService.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingService[0].providerId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this service', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await db.delete(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.providerId, authenticatedUser.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}