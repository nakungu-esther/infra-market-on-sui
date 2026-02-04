import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags, user } from '@/db/schema';
import { eq, and, like, or, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract and validate Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_AUTH' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Get session from token
    const sessions = await db
      .select()
      .from(await import('@/db/schema').then(m => m.session))
      .where(eq((await import('@/db/schema').then(m => m.session)).token, token))
      .limit(1);

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const session = sessions[0];

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Get user and verify admin role
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, session.userId))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const currentUser = users[0];

    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build WHERE conditions
    const conditions = [];

    if (statusFilter) {
      conditions.push(eq(services.status, statusFilter));
    }

    if (searchQuery) {
      conditions.push(
        or(
          like(services.name, `%${searchQuery}%`),
          like(services.description, `%${searchQuery}%`)
        )
      );
    }

    // Get total count
    const countQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` }).from(services).where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` }).from(services);

    const countResult = await countQuery;
    const total = Number(countResult[0].count);

    // Build main query
    let query = db
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
      .leftJoin(user, eq(services.providerId, user.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const servicesData = await query
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    // Get tags for all services
    const serviceIds = servicesData.map(s => s.id);
    let tagsData: Array<{ serviceId: number; tag: string; addedByAdmin: boolean | null }> = [];
    
    if (serviceIds.length > 0) {
      tagsData = await db
        .select({
          serviceId: serviceTags.serviceId,
          tag: serviceTags.tag,
          addedByAdmin: serviceTags.addedByAdmin,
        })
        .from(serviceTags)
        .where(sql`${serviceTags.serviceId} IN ${serviceIds}`);
    }

    // Group tags by service ID
    const tagsByService = tagsData.reduce((acc, tag) => {
      if (!acc[tag.serviceId]) {
        acc[tag.serviceId] = [];
      }
      acc[tag.serviceId].push({
        tag: tag.tag,
        addedByAdmin: tag.addedByAdmin ?? false,
      });
      return acc;
    }, {} as Record<number, Array<{ tag: string; addedByAdmin: boolean }>>);

    // Combine services with their tags
    const servicesWithTags = servicesData.map(service => ({
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
      tags: tagsByService[service.id] || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithTags,
        total,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('GET /api/admin/services error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}