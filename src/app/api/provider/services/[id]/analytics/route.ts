import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, entitlements, usageLogs, subscriptions, session, user } from '@/db/schema';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract and validate Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate session
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid session', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    const userSession = sessionRecord[0];
    const now = new Date();

    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user and verify role
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const authenticatedUser = userRecord[0];

    if (authenticatedUser.role !== 'provider') {
      return NextResponse.json(
        { error: 'Provider role required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      );
    }

    // Validate service ID
    const serviceId = params.id;
    if (!serviceId || isNaN(parseInt(serviceId))) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedServiceId = parseInt(serviceId);

    // Query service
    const serviceRecord = await db
      .select()
      .from(services)
      .where(eq(services.id, parsedServiceId))
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const service = serviceRecord[0];

    // Verify service ownership
    if (service.providerId !== authenticatedUser.id) {
      return NextResponse.json(
        { error: 'You do not own this service', code: 'NOT_SERVICE_OWNER' },
        { status: 403 }
      );
    }

    // Parse date parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    let startDate: Date;
    let endDate: Date;

    try {
      startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
      endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Calculate analytics

    // 1. Total Revenue
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`CAST(SUM(CAST(${entitlements.amountPaid} AS REAL)) AS REAL)`,
      })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.serviceId, parsedServiceId),
          gte(entitlements.createdAt, startDateStr),
          lte(entitlements.createdAt, endDateStr)
        )
      );

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // 2. Active Subscriptions
    const activeSubsResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.serviceId, parsedServiceId),
          eq(subscriptions.status, 'active')
        )
      );

    const activeSubscriptions = Number(activeSubsResult[0]?.count || 0);

    // 3. Total Customers
    const totalCustomersResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${entitlements.userId})`,
      })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.serviceId, parsedServiceId),
          gte(entitlements.createdAt, startDateStr),
          lte(entitlements.createdAt, endDateStr)
        )
      );

    const totalCustomers = Number(totalCustomersResult[0]?.count || 0);

    // 4. Total API Calls
    const apiCallsResult = await db
      .select({
        totalCalls: sql<number>`CAST(SUM(${usageLogs.requestsCount}) AS INTEGER)`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.serviceId, parsedServiceId),
          gte(usageLogs.timestamp, startDateStr),
          lte(usageLogs.timestamp, endDateStr)
        )
      );

    const totalApiCalls = Number(apiCallsResult[0]?.totalCalls || 0);

    // 5. Average Quota Usage
    const quotaUsageResult = await db
      .select({
        avgUsage: sql<number>`AVG(CAST(${entitlements.quotaUsed} AS REAL) / CAST(${entitlements.quotaLimit} AS REAL) * 100)`,
      })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.serviceId, parsedServiceId),
          eq(entitlements.isActive, true)
        )
      );

    const averageQuotaUsage = Number(quotaUsageResult[0]?.avgUsage || 0);

    // 6. Revenue by Tier
    const revenueByTierResult = await db
      .select({
        tier: entitlements.pricingTier,
        revenue: sql<number>`CAST(SUM(CAST(${entitlements.amountPaid} AS REAL)) AS REAL)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.serviceId, parsedServiceId),
          gte(entitlements.createdAt, startDateStr),
          lte(entitlements.createdAt, endDateStr)
        )
      )
      .groupBy(entitlements.pricingTier);

    const revenueByTier = revenueByTierResult.map((row) => ({
      tier: row.tier,
      revenue: Number(row.revenue || 0),
      count: Number(row.count || 0),
    }));

    // 7. Recent Customers
    const recentCustomersResult = await db
      .select({
        userId: entitlements.userId,
        userName: user.name,
        subscriptionStatus: subscriptions.status,
        createdAt: entitlements.createdAt,
      })
      .from(entitlements)
      .leftJoin(user, eq(entitlements.userId, user.id))
      .leftJoin(
        subscriptions,
        and(
          eq(subscriptions.entitlementId, entitlements.id),
          eq(subscriptions.serviceId, parsedServiceId)
        )
      )
      .where(eq(entitlements.serviceId, parsedServiceId))
      .orderBy(desc(entitlements.createdAt))
      .limit(10);

    const recentCustomers = recentCustomersResult.map((row) => ({
      userId: row.userId,
      userName: row.userName || 'Unknown',
      subscriptionStatus: row.subscriptionStatus || 'inactive',
      createdAt: row.createdAt,
    }));

    // 8. API Calls Trend (Daily)
    const apiCallsTrendResult = await db
      .select({
        date: sql<string>`DATE(${usageLogs.timestamp})`,
        calls: sql<number>`CAST(SUM(${usageLogs.requestsCount}) AS INTEGER)`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.serviceId, parsedServiceId),
          gte(usageLogs.timestamp, startDateStr),
          lte(usageLogs.timestamp, endDateStr)
        )
      )
      .groupBy(sql`DATE(${usageLogs.timestamp})`)
      .orderBy(sql`DATE(${usageLogs.timestamp})`);

    const apiCallsTrend = apiCallsTrendResult.map((row) => ({
      date: row.date,
      calls: Number(row.calls || 0),
    }));

    // Return comprehensive analytics
    return NextResponse.json({
      success: true,
      data: {
        service: {
          id: service.id,
          name: service.name,
          status: service.status,
        },
        analytics: {
          totalRevenue,
          activeSubscriptions,
          totalCustomers,
          totalApiCalls,
          averageQuotaUsage: Math.round(averageQuotaUsage * 100) / 100,
          revenueByTier,
          recentCustomers,
          apiCallsTrend,
        },
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}