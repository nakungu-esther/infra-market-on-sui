import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, entitlements, usageLogs, user, session } from '@/db/schema';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token
    const sessionResult = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid authentication token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user table for session.userId
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const authenticatedUser = userResult[0];

    // Verify user.role === 'provider'
    if (authenticatedUser.role !== 'provider') {
      return NextResponse.json(
        { error: 'Access denied. Provider role required.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get provider's service IDs
    const providerServices = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.providerId, authenticatedUser.id));

    const serviceIds = providerServices.map(s => s.id);

    // If provider has no services, return empty statistics
    if (serviceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: 0,
          activeCustomers: 0,
          listedServices: 0,
          totalApiCalls: 0,
          revenueByTier: {
            free: { count: 0, revenue: 0 },
            basic: { count: 0, revenue: 0 },
            pro: { count: 0, revenue: 0 },
            enterprise: { count: 0, revenue: 0 }
          },
          recentActivity: []
        }
      });
    }

    // Calculate totalRevenue
    const revenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${entitlements.amountPaid} AS REAL)), 0)`
      })
      .from(entitlements)
      .where(inArray(entitlements.serviceId, serviceIds));

    const totalRevenue = parseFloat(revenueResult[0]?.total || '0');

    // Calculate activeCustomers
    const activeCustomersResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${entitlements.userId})`
      })
      .from(entitlements)
      .where(
        and(
          inArray(entitlements.serviceId, serviceIds),
          eq(entitlements.isActive, true)
        )
      );

    const activeCustomers = activeCustomersResult[0]?.count || 0;

    // Calculate listedServices
    const listedServices = serviceIds.length;

    // Calculate totalApiCalls
    const apiCallsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${usageLogs.requestsCount}), 0)`
      })
      .from(usageLogs)
      .where(inArray(usageLogs.serviceId, serviceIds));

    const totalApiCalls = apiCallsResult[0]?.total || 0;

    // Calculate revenueByTier
    const tierRevenueResult = await db
      .select({
        tier: entitlements.pricingTier,
        count: sql<number>`COUNT(*)`,
        revenue: sql<string>`COALESCE(SUM(CAST(${entitlements.amountPaid} AS REAL)), 0)`
      })
      .from(entitlements)
      .where(inArray(entitlements.serviceId, serviceIds))
      .groupBy(entitlements.pricingTier);

    const revenueByTier = {
      free: { count: 0, revenue: 0 },
      basic: { count: 0, revenue: 0 },
      pro: { count: 0, revenue: 0 },
      enterprise: { count: 0, revenue: 0 }
    };

    tierRevenueResult.forEach(tier => {
      const tierName = tier.tier.toLowerCase();
      if (tierName in revenueByTier) {
        revenueByTier[tierName as keyof typeof revenueByTier] = {
          count: tier.count,
          revenue: parseFloat(tier.revenue)
        };
      }
    });

    // Get recentActivity
    const recentActivityResult = await db
      .select({
        id: entitlements.id,
        userId: entitlements.userId,
        userName: user.name,
        serviceId: entitlements.serviceId,
        pricingTier: entitlements.pricingTier,
        amountPaid: entitlements.amountPaid,
        createdAt: entitlements.createdAt
      })
      .from(entitlements)
      .innerJoin(user, eq(entitlements.userId, user.id))
      .where(inArray(entitlements.serviceId, serviceIds))
      .orderBy(desc(entitlements.createdAt))
      .limit(10);

    const recentActivity = recentActivityResult.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.userName,
      serviceId: activity.serviceId,
      pricingTier: activity.pricingTier,
      amountPaid: activity.amountPaid,
      createdAt: activity.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        activeCustomers,
        listedServices,
        totalApiCalls,
        revenueByTier,
        recentActivity
      }
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}