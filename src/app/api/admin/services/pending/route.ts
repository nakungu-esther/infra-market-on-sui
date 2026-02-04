import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, user, session } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'MISSING_TOKEN'
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token and check if expired
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return NextResponse.json(
        { 
          error: 'Session expired',
          code: 'SESSION_EXPIRED'
        },
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
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 401 }
      );
    }

    const currentUser = userRecord[0];

    // Verify user.role === 'admin'
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    // Query services with pending status and join with user table
    const pendingServices = await db
      .select({
        id: services.id,
        providerId: services.providerId,
        name: services.name,
        description: services.description,
        serviceType: services.serviceType,
        status: services.status,
        metadata: services.metadata,
        pricingInfo: services.pricingInfo,
        contactInfo: services.contactInfo,
        isAcceptingUsers: services.isAcceptingUsers,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
        providerName: user.name,
        providerEmail: user.email,
      })
      .from(services)
      .leftJoin(user, eq(services.providerId, user.id))
      .where(eq(services.status, 'pending'))
      .orderBy(services.createdAt);

    // Transform results to match response format
    const formattedServices = pendingServices.map(service => ({
      id: service.id,
      providerId: service.providerId,
      name: service.name,
      description: service.description,
      serviceType: service.serviceType,
      status: service.status,
      metadata: service.metadata,
      pricingInfo: service.pricingInfo,
      contactInfo: service.contactInfo,
      isAcceptingUsers: service.isAcceptingUsers,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      provider: {
        name: service.providerName,
        email: service.providerEmail,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        services: formattedServices,
        count: formattedServices.length,
      },
    });

  } catch (error) {
    console.error('GET pending services error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}