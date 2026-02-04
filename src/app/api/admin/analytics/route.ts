import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, services, entitlements, session } from '@/db/schema';
import { eq, and, gte, lt, sql, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Query session table for token and check expiration
    const sessionResult = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json({ 
        error: 'Session expired',
        code: 'SESSION_EXPIRED' 
      }, { status: 401 });
    }

    // Query user table for session.userId
    const userResult = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const currentUser = userResult[0];

    // Verify user.role === 'admin'
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Calculate date boundaries for 30-day calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

    // 1. Total users
    const totalUsersResult = await db.select({ count: count() })
      .from(user);
    const totalUsers = totalUsersResult[0].count;

    // 2. Total services
    const totalServicesResult = await db.select({ count: count() })
      .from(services);
    const totalServices = totalServicesResult[0].count;

    // 3. Total providers
    const totalProvidersResult = await db.select({ count: count() })
      .from(user)
      .where(eq(user.role, 'provider'));
    const totalProviders = totalProvidersResult[0].count;

    // 4. Total developers
    const totalDevelopersResult = await db.select({ count: count() })
      .from(user)
      .where(eq(user.role, 'developer'));
    const totalDevelopers = totalDevelopersResult[0].count;

    // 5. Pending services
    const pendingServicesResult = await db.select({ count: count() })
      .from(services)
      .where(eq(services.status, 'pending'));
    const pendingServices = pendingServicesResult[0].count;

    // 6. Active services
    const activeServicesResult = await db.select({ count: count() })
      .from(services)
      .where(eq(services.status, 'active'));
    const activeServices = activeServicesResult[0].count;

    // 7. Total revenue
    const totalRevenueResult = await db.select({
      total: sql<string>`SUM(CAST(${entitlements.amountPaid} AS REAL))`
    }).from(entitlements);
    const totalRevenue = parseFloat(totalRevenueResult[0].total || '0');

    // 8. Last 30 days revenue
    const last30DaysRevenueResult = await db.select({
      total: sql<string>`SUM(CAST(${entitlements.amountPaid} AS REAL))`
    })
      .from(entitlements)
      .where(gte(entitlements.createdAt, thirtyDaysAgoISO));
    const last30DaysRevenue = parseFloat(last30DaysRevenueResult[0].total || '0');

    // 9. Revenue growth (previous 30 days: 60-30 days ago)
    const previous30DaysRevenueResult = await db.select({
      total: sql<string>`SUM(CAST(${entitlements.amountPaid} AS REAL))`
    })
      .from(entitlements)
      .where(
        and(
          gte(entitlements.createdAt, sixtyDaysAgoISO),
          lt(entitlements.createdAt, thirtyDaysAgoISO)
        )
      );
    const previous30DaysRevenue = parseFloat(previous30DaysRevenueResult[0].total || '0');

    let revenueGrowth = 0;
    if (previous30DaysRevenue > 0) {
      revenueGrowth = ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100;
    } else if (last30DaysRevenue > 0) {
      revenueGrowth = 100;
    }

    // 10. User growth (users created in last 30 days)
    const recentUsersResult = await db.select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo));
    const recentUsers = recentUsersResult[0].count;

    let userGrowth = 0;
    if (totalUsers > 0) {
      userGrowth = (recentUsers / totalUsers) * 100;
    }

    return NextResponse.json({
      totalUsers,
      totalServices,
      totalProviders,
      totalDevelopers,
      pendingServices,
      activeServices,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      last30DaysRevenue: Math.round(last30DaysRevenue * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      userGrowth: Math.round(userGrowth * 100) / 100
    }, { status: 200 });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}