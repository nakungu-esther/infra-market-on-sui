import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { usageLogs, entitlements } from '@/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { serviceId, endpoint, requestsCount } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!serviceId) {
      return NextResponse.json({ 
        error: "Service ID is required",
        code: "MISSING_SERVICE_ID" 
      }, { status: 400 });
    }

    if (!endpoint) {
      return NextResponse.json({ 
        error: "Endpoint is required",
        code: "MISSING_ENDPOINT" 
      }, { status: 400 });
    }

    // Validate serviceId is a valid integer
    const serviceIdInt = parseInt(serviceId);
    if (isNaN(serviceIdInt)) {
      return NextResponse.json({ 
        error: "Service ID must be a valid integer",
        code: "INVALID_SERVICE_ID" 
      }, { status: 400 });
    }

    // Default requestsCount to 1 if not provided
    const requestCount = requestsCount ? parseInt(requestsCount) : 1;
    if (isNaN(requestCount) || requestCount < 1) {
      return NextResponse.json({ 
        error: "Requests count must be a positive integer",
        code: "INVALID_REQUESTS_COUNT" 
      }, { status: 400 });
    }

    // Extract IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    // Extract user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Find active entitlement for user and service
    const now = new Date().toISOString();
    const activeEntitlements = await db.select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, user.id),
          eq(entitlements.serviceId, serviceIdInt),
          eq(entitlements.isActive, true),
          lte(entitlements.validFrom, now),
          gte(entitlements.validUntil, now)
        )
      )
      .limit(1);

    // Check if valid entitlement exists
    if (activeEntitlements.length === 0) {
      return NextResponse.json({ 
        error: 'No valid entitlement found for this service',
        code: 'NO_VALID_ENTITLEMENT' 
      }, { status: 404 });
    }

    const entitlement = activeEntitlements[0];

    // Check if adding requestsCount would exceed quota
    const newQuotaUsed = entitlement.quotaUsed + requestCount;
    if (newQuotaUsed > entitlement.quotaLimit) {
      return NextResponse.json({ 
        error: 'Quota limit exceeded',
        code: 'QUOTA_EXCEEDED',
        details: {
          quotaLimit: entitlement.quotaLimit,
          quotaUsed: entitlement.quotaUsed,
          requestsCount: requestCount,
          remaining: entitlement.quotaLimit - entitlement.quotaUsed
        }
      }, { status: 403 });
    }

    // Create usage log record
    const timestamp = new Date().toISOString();
    const createdAt = new Date().toISOString();

    const newUsageLog = await db.insert(usageLogs)
      .values({
        entitlementId: entitlement.id,
        userId: user.id,
        serviceId: serviceIdInt,
        timestamp,
        requestsCount: requestCount,
        endpoint,
        ipAddress,
        userAgent,
        createdAt
      })
      .returning();

    // Increment entitlements.quotaUsed
    const updatedEntitlement = await db.update(entitlements)
      .set({
        quotaUsed: newQuotaUsed,
        updatedAt: new Date().toISOString()
      })
      .where(eq(entitlements.id, entitlement.id))
      .returning();

    // Calculate remaining quota
    const remainingQuota = entitlement.quotaLimit - newQuotaUsed;
    const quotaPercentage = (remainingQuota / entitlement.quotaLimit) * 100;

    // Prepare response
    const response: {
      usageLog: typeof newUsageLog[0];
      remainingQuota: number;
      quotaLimit: number;
      quotaUsed: number;
      warning?: string;
    } = {
      usageLog: newUsageLog[0],
      remainingQuota,
      quotaLimit: entitlement.quotaLimit,
      quotaUsed: newQuotaUsed
    };

    // Add warning if remaining quota is low (<20%)
    if (quotaPercentage < 20 && quotaPercentage > 0) {
      response.warning = `Low quota remaining: ${remainingQuota} requests left (${quotaPercentage.toFixed(1)}%)`;
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('POST /api/track-usage error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}