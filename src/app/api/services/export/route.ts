import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags, serviceCategoryMapping, serviceCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active services
    const activeServices = await db.select()
      .from(services)
      .where(eq(services.status, 'active'))
      .orderBy(services.name);

    // Fetch all tags for active services
    const serviceIds = activeServices.map(s => s.id);
    const allTags = serviceIds.length > 0 
      ? await db.select()
          .from(serviceTags)
          .where(eq(serviceTags.serviceId, serviceIds[0]))
      : [];

    // Fetch all tags for each service
    const tagsMap = new Map<number, typeof allTags>();
    for (const service of activeServices) {
      const tags = await db.select()
        .from(serviceTags)
        .where(eq(serviceTags.serviceId, service.id));
      tagsMap.set(service.id, tags);
    }

    // Fetch all category mappings for active services
    const categoryMappingsMap = new Map<number, any[]>();
    for (const service of activeServices) {
      const mappings = await db.select({
        categoryId: serviceCategoryMapping.categoryId,
        categoryName: serviceCategories.name,
        categoryDescription: serviceCategories.description
      })
        .from(serviceCategoryMapping)
        .innerJoin(
          serviceCategories,
          eq(serviceCategoryMapping.categoryId, serviceCategories.id)
        )
        .where(eq(serviceCategoryMapping.serviceId, service.id));
      
      categoryMappingsMap.set(service.id, mappings);
    }

    // Build enriched services with tags and categories
    const enrichedServices = activeServices.map(service => {
      const tags = tagsMap.get(service.id) || [];
      const categoryData = categoryMappingsMap.get(service.id) || [];

      return {
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
        tags: tags.map(t => ({
          id: t.id,
          tag: t.tag,
          addedByAdmin: t.addedByAdmin,
          createdAt: t.createdAt
        })),
        categories: categoryData.map(c => ({
          id: c.categoryId,
          name: c.categoryName,
          description: c.categoryDescription
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        services: enrichedServices,
        exportedAt: new Date().toISOString(),
        count: enrichedServices.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}