import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usageLogs, entitlements, services, user } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const entitlementId = searchParams.get('entitlementId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const isAdmin = currentUser.role === 'admin';

    // Build WHERE conditions
    const conditions = [];

    // Non-admin users can only see their own usage logs
    if (!isAdmin) {
      conditions.push(eq(usageLogs.userId, currentUser.id));
    }

    if (serviceId) {
      const parsedServiceId = parseInt(serviceId);
      if (isNaN(parsedServiceId)) {
        return NextResponse.json({ 
          error: 'Invalid serviceId parameter',
          code: 'INVALID_SERVICE_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(usageLogs.serviceId, parsedServiceId));
    }

    if (entitlementId) {
      const parsedEntitlementId = parseInt(entitlementId);
      if (isNaN(parsedEntitlementId)) {
        return NextResponse.json({ 
          error: 'Invalid entitlementId parameter',
          code: 'INVALID_ENTITLEMENT_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(usageLogs.entitlementId, parsedEntitlementId));
    }

    if (startDate) {
      conditions.push(gte(usageLogs.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(usageLogs.timestamp, endDate));
    }

    // Build query
    let query = db.select().from(usageLogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(usageLogs);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count: totalCount }] = await countQuery;

    // Execute paginated query
    const logs = await query
      .orderBy(desc(usageLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: logs,
      total: totalCount,
      limit,
      offset
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { entitlementId, serviceId, endpoint, requestsCount, ipAddress, userAgent } = body;

    // Validate required fields
    if (!entitlementId) {
      return NextResponse.json({ 
        error: 'entitlementId is required',
        code: 'MISSING_ENTITLEMENT_ID' 
      }, { status: 400 });
    }

    if (!serviceId) {
      return NextResponse.json({ 
        error: 'serviceId is required',
        code: 'MISSING_SERVICE_ID' 
      }, { status: 400 });
    }

    if (!endpoint) {
      return NextResponse.json({ 
        error: 'endpoint is required',
        code: 'MISSING_ENDPOINT' 
      }, { status: 400 });
    }

    // Validate entitlementId is a valid number
    const parsedEntitlementId = parseInt(entitlementId);
    if (isNaN(parsedEntitlementId)) {
      return NextResponse.json({ 
        error: 'Invalid entitlementId',
        code: 'INVALID_ENTITLEMENT_ID' 
      }, { status: 400 });
    }

    // Validate serviceId is a valid number
    const parsedServiceId = parseInt(serviceId);
    if (isNaN(parsedServiceId)) {
      return NextResponse.json({ 
        error: 'Invalid serviceId',
        code: 'INVALID_SERVICE_ID' 
      }, { status: 400 });
    }

    // Set default requestsCount
    const finalRequestsCount = requestsCount ? parseInt(requestsCount) : 1;
    if (isNaN(finalRequestsCount) || finalRequestsCount < 1) {
      return NextResponse.json({ 
        error: 'Invalid requestsCount',
        code: 'INVALID_REQUESTS_COUNT' 
      }, { status: 400 });
    }

    // Fetch entitlement to validate and get userId
    const entitlement = await db.select()
      .from(entitlements)
      .where(eq(entitlements.id, parsedEntitlementId))
      .limit(1);

    if (entitlement.length === 0) {
      return NextResponse.json({ 
        error: 'Entitlement not found',
        code: 'ENTITLEMENT_NOT_FOUND' 
      }, { status: 404 });
    }

    const entitlementRecord = entitlement[0];

    // Validate serviceId matches entitlement's serviceId
    if (entitlementRecord.serviceId !== parsedServiceId) {
      return NextResponse.json({ 
        error: 'Service ID does not match entitlement',
        code: 'SERVICE_MISMATCH' 
      }, { status: 400 });
    }

    // Check if entitlement is active
    if (!entitlementRecord.isActive) {
      return NextResponse.json({ 
        error: 'Entitlement is not active',
        code: 'ENTITLEMENT_INACTIVE' 
      }, { status: 403 });
    }

    // Check if entitlement is still valid (not expired)
    const now = new Date().toISOString();
    if (now > entitlementRecord.validUntil) {
      return NextResponse.json({ 
        error: 'Entitlement has expired',
        code: 'ENTITLEMENT_EXPIRED' 
      }, { status: 403 });
    }

    // Calculate new quota usage
    const newQuotaUsed = entitlementRecord.quotaUsed + finalRequestsCount;

    // Check if quota will be exceeded
    if (newQuotaUsed > entitlementRecord.quotaLimit) {
      return NextResponse.json({ 
        error: 'Quota exceeded',
        code: 'QUOTA_EXCEEDED',
        details: {
          quotaLimit: entitlementRecord.quotaLimit,
          currentUsage: entitlementRecord.quotaUsed,
          requestedUsage: finalRequestsCount,
          exceededBy: newQuotaUsed - entitlementRecord.quotaLimit
        }
      }, { status: 403 });
    }

    // Update quota in entitlements table
    const updatedEntitlement = await db.update(entitlements)
      .set({
        quotaUsed: newQuotaUsed,
        updatedAt: new Date().toISOString()
      })
      .where(eq(entitlements.id, parsedEntitlementId))
      .returning();

    // Create usage log
    const timestamp = new Date().toISOString();
    const newUsageLog = await db.insert(usageLogs)
      .values({
        entitlementId: parsedEntitlementId,
        userId: entitlementRecord.userId,
        serviceId: parsedServiceId,
        timestamp,
        requestsCount: finalRequestsCount,
        endpoint: endpoint.trim(),
        ipAddress: ipAddress?.trim() || null,
        userAgent: userAgent?.trim() || null,
        createdAt: timestamp
      })
      .returning();

    // Check if quota is close to limit (>80%)
    const quotaPercentage = (newQuotaUsed / entitlementRecord.quotaLimit) * 100;
    const warning = quotaPercentage > 80 ? {
      warning: 'Quota usage is above 80%',
      quotaUsed: newQuotaUsed,
      quotaLimit: entitlementRecord.quotaLimit,
      percentageUsed: Math.round(quotaPercentage)
    } : null;

    return NextResponse.json({
      ...newUsageLog[0],
      ...(warning && { quota: warning })
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}