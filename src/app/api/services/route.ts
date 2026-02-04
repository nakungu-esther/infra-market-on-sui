// API route for services listing and creation
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags, serviceCategoryMapping } from '@/db/schema';
import { eq, like, or, and, inArray, desc, sql } from 'drizzle-orm';

// GET handler - List and filter services (PUBLIC ACCESS)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query conditions
    const conditions = [eq(services.status, status)];
    
    if (type) {
      conditions.push(eq(services.serviceType, type));
    }
    
    if (search) {
      conditions.push(
        or(
          like(services.name, `%${search}%`),
          like(services.description, `%${search}%`)
        )
      );
    }
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(and(...conditions));
    const total = Number(countResult[0].count);
    
    // Fetch services
    let servicesQuery = db
      .select()
      .from(services)
      .where(and(...conditions))
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);
    
    let servicesResult = await servicesQuery;
    
    // Filter by category if provided
    if (category) {
      const categoryId = parseInt(category);
      const categoryMappings = await db
        .select({ serviceId: serviceCategoryMapping.serviceId })
        .from(serviceCategoryMapping)
        .where(eq(serviceCategoryMapping.categoryId, categoryId));
      
      const categoryServiceIds = categoryMappings.map(m => m.serviceId);
      servicesResult = servicesResult.filter(s => categoryServiceIds.includes(s.id));
    }
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      const taggedServices = await db
        .select({ serviceId: serviceTags.serviceId })
        .from(serviceTags)
        .where(sql`${serviceTags.tag} IN (${tags.join(',')})`);
      
      const taggedServiceIds = taggedServices.map(t => t.serviceId);
      servicesResult = servicesResult.filter(s => taggedServiceIds.includes(s.id));
    }
    
    // Fetch tags for all services
    const serviceIds = servicesResult.map(s => s.id);
    let allTags: Array<{ serviceId: number; tag: string }> = [];
    
    if (serviceIds.length > 0) {
      allTags = await db
        .select({ serviceId: serviceTags.serviceId, tag: serviceTags.tag })
        .from(serviceTags)
        .where(sql`${serviceTags.serviceId} IN (${serviceIds.join(',')})`);
    }
    
    // Group tags by service
    const tagsByService = allTags.reduce((acc, { serviceId, tag }) => {
      if (!acc[serviceId]) acc[serviceId] = [];
      acc[serviceId].push(tag);
      return acc;
    }, {} as Record<number, string[]>);
    
    // Combine services with tags
    const servicesWithTags = servicesResult.map(service => ({
      ...service,
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
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// POST handler - Create new service (PROVIDER AUTHENTICATION REQUIRED)
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Get user session and extract user ID
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
    
    // Parse request body
    const body = await request.json();
    const { name, description, serviceType, status, metadata, pricingInfo, contactInfo, isAcceptingUsers } = body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }
    
    if (!serviceType || !serviceType.trim()) {
      return NextResponse.json(
        { error: 'Service type is required', code: 'MISSING_SERVICE_TYPE' },
        { status: 400 }
      );
    }
    
    // Validate name length
    if (name.length > 200) {
      return NextResponse.json(
        { error: 'Name must not exceed 200 characters', code: 'NAME_TOO_LONG' },
        { status: 400 }
      );
    }
    
    // Validate description length
    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must not exceed 1000 characters', code: 'DESCRIPTION_TOO_LONG' },
        { status: 400 }
      );
    }
    
    // Validate status
    const validStatuses = ['active', 'pending', 'suspended', 'archived'];
    const serviceStatus = status || 'pending';
    
    if (!validStatuses.includes(serviceStatus)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }
    
    // Create new service
    const newService = await db
      .insert(services)
      .values({
        providerId: userId,
        name: name.trim(),
        description: description?.trim() || null,
        serviceType: serviceType.trim(),
        status: serviceStatus,
        metadata: metadata || null,
        pricingInfo: pricingInfo || null,
        contactInfo: contactInfo || null,
        isAcceptingUsers: isAcceptingUsers !== undefined ? isAcceptingUsers : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();
    
    return NextResponse.json(
      {
        success: true,
        data: newService[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}