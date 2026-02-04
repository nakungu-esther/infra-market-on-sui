import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');

    // Build base query conditions
    const conditions = [eq(services.providerId, user.id)];

    // Add status filter if provided
    if (statusFilter) {
      conditions.push(eq(services.status, statusFilter));
    }

    // Add service type filter if provided
    if (typeFilter) {
      conditions.push(eq(services.serviceType, typeFilter));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(and(...conditions));

    const total = Number(countResult[0]?.count ?? 0);

    // Fetch services with pagination
    const servicesResult = await db
      .select()
      .from(services)
      .where(and(...conditions))
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch tags for all services in the result
    const serviceIds = servicesResult.map(service => service.id);
    
    let tagsResult: Array<{ serviceId: number; tag: string; addedByAdmin: boolean | null; createdAt: string }> = [];
    
    if (serviceIds.length > 0) {
      tagsResult = await db
        .select({
          serviceId: serviceTags.serviceId,
          tag: serviceTags.tag,
          addedByAdmin: serviceTags.addedByAdmin,
          createdAt: serviceTags.createdAt
        })
        .from(serviceTags)
        .where(sql`${serviceTags.serviceId} IN ${serviceIds}`);
    }

    // Group tags by service ID
    const tagsByServiceId = tagsResult.reduce((acc, tag) => {
      if (!acc[tag.serviceId]) {
        acc[tag.serviceId] = [];
      }
      acc[tag.serviceId].push({
        tag: tag.tag,
        addedByAdmin: tag.addedByAdmin ?? false,
        createdAt: tag.createdAt
      });
      return acc;
    }, {} as Record<number, Array<{ tag: string; addedByAdmin: boolean; createdAt: string }>>);

    // Combine services with their tags
    const servicesWithTags = servicesResult.map(service => ({
      ...service,
      tags: tagsByServiceId[service.id] || []
    }));

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithTags,
        total,
        limit,
        offset
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET my-services error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}