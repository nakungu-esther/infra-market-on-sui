import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, serviceTags, entitlements, session, user } from '@/db/schema';
import { eq, and, desc, sql, lt } from 'drizzle-orm';

async function authenticateProvider(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionResult = await db.select()
      .from(session)
      .where(and(
        eq(session.token, token),
        lt(sql`datetime('now')`, session.expiresAt)
      ))
      .limit(1);

    if (sessionResult.length === 0) {
      return null;
    }

    const userResult = await db.select()
      .from(user)
      .where(eq(user.id, sessionResult[0].userId))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    if (userResult[0].role !== 'provider') {
      return { error: 'forbidden', message: 'User is not a provider' };
    }

    return { user: userResult[0] };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateProvider(request);
    
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if ('error' in authResult) {
      return NextResponse.json({ 
        error: authResult.message,
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { user: authenticatedUser } = authResult;

    const providerServices = await db.select()
      .from(services)
      .where(eq(services.providerId, authenticatedUser.id))
      .orderBy(desc(services.createdAt));

    const servicesWithDetails = await Promise.all(
      providerServices.map(async (service) => {
        const tags = await db.select({
          id: serviceTags.id,
          tag: serviceTags.tag,
          addedByAdmin: serviceTags.addedByAdmin
        })
          .from(serviceTags)
          .where(eq(serviceTags.serviceId, service.id));

        const customersCountResult = await db.select({
          count: sql<number>`COUNT(DISTINCT ${entitlements.userId})`
        })
          .from(entitlements)
          .where(eq(entitlements.serviceId, service.id));

        const customersCount = customersCountResult[0]?.count || 0;

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
          tags: tags,
          customersCount: Number(customersCount)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithDetails
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateProvider(request);
    
    if (!authResult) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    if ('error' in authResult) {
      return NextResponse.json({ 
        error: authResult.message,
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { user: authenticatedUser } = authResult;

    const body = await request.json();
    const {
      name,
      description,
      serviceType,
      metadata,
      pricingInfo,
      contactInfo,
      isAcceptingUsers
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 200) {
      return NextResponse.json({ 
        error: 'Name must not exceed 200 characters',
        code: 'NAME_TOO_LONG' 
      }, { status: 400 });
    }

    if (!serviceType || typeof serviceType !== 'string' || serviceType.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Service type is required',
        code: 'MISSING_SERVICE_TYPE' 
      }, { status: 400 });
    }

    const trimmedServiceType = serviceType.trim();

    let trimmedDescription = null;
    if (description) {
      if (typeof description !== 'string') {
        return NextResponse.json({ 
          error: 'Description must be a string',
          code: 'INVALID_DESCRIPTION' 
        }, { status: 400 });
      }
      trimmedDescription = description.trim();
      if (trimmedDescription.length > 1000) {
        return NextResponse.json({ 
          error: 'Description must not exceed 1000 characters',
          code: 'DESCRIPTION_TOO_LONG' 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const newService = await db.insert(services)
      .values({
        providerId: authenticatedUser.id,
        name: trimmedName,
        description: trimmedDescription,
        serviceType: trimmedServiceType,
        status: 'pending',
        metadata: metadata || null,
        pricingInfo: pricingInfo || null,
        contactInfo: contactInfo || null,
        isAcceptingUsers: isAcceptingUsers !== undefined ? isAcceptingUsers : true,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Service created successfully and pending approval',
      data: {
        service: newService[0]
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}