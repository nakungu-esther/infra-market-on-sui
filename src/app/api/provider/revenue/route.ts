import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, entitlements, session, user } from '@/db/schema';
import { eq, and, inArray, sql, gte } from 'drizzle-orm';

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

    // Query session table for token
    const sessionRecords = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecords.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userSession = sessionRecords[0];

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(userSession.expiresAt);
    if (expiresAt < now) {
      return NextResponse.json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      }, { status: 401 });
    }

    // Query user table for session.userId
    const userRecords = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const currentUser = userRecords[0];

    // Verify user.role === 'provider'
    if (currentUser.role !== 'provider') {
      return NextResponse.json({ 
        error: 'Access forbidden: Provider role required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Get provider's service IDs
    const providerServices = await db.select({ id: services.id })
      .from(services)
      .where(eq(services.providerId, currentUser.id));

    const serviceIds = providerServices.map(s => s.id);

    if (serviceIds.length === 0) {
      // Provider has no services, return zero revenue
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: 0,
          revenueByService: [],
          monthlyRevenue: []
        }
      });
    }

    // Calculate totalRevenue
    const totalRevenueResult = await db.select({
      total: sql<number>`SUM(CAST(${entitlements.amountPaid} AS REAL))`
    })
    .from(entitlements)
    .where(inArray(entitlements.serviceId, serviceIds));

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Calculate revenueByService
    const revenueByServiceResult = await db.select({
      serviceId: entitlements.serviceId,
      serviceName: services.name,
      revenue: sql<number>`SUM(CAST(${entitlements.amountPaid} AS REAL))`,
      customerCount: sql<number>`COUNT(DISTINCT ${entitlements.userId})`
    })
    .from(entitlements)
    .innerJoin(services, eq(entitlements.serviceId, services.id))
    .where(inArray(entitlements.serviceId, serviceIds))
    .groupBy(entitlements.serviceId, services.name)
    .orderBy(sql`SUM(CAST(${entitlements.amountPaid} AS REAL)) DESC`);

    const revenueByService = revenueByServiceResult.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      revenue: row.revenue || 0,
      customerCount: row.customerCount || 0
    }));

    // Calculate monthlyRevenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();

    const monthlyRevenueResult = await db.select({
      month: sql<string>`substr(${entitlements.createdAt}, 1, 7)`,
      revenue: sql<number>`SUM(CAST(${entitlements.amountPaid} AS REAL))`,
      transactions: sql<number>`COUNT(*)`
    })
    .from(entitlements)
    .where(
      and(
        inArray(entitlements.serviceId, serviceIds),
        gte(entitlements.createdAt, sixMonthsAgoISO)
      )
    )
    .groupBy(sql`substr(${entitlements.createdAt}, 1, 7)`)
    .orderBy(sql`substr(${entitlements.createdAt}, 1, 7) ASC`);

    // Fill in missing months with 0 revenue
    const monthlyRevenueMap = new Map(
      monthlyRevenueResult.map(row => [row.month, {
        month: row.month,
        revenue: row.revenue || 0,
        transactions: row.transactions || 0
      }])
    );

    const monthlyRevenue = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);
      
      if (monthlyRevenueMap.has(monthKey)) {
        monthlyRevenue.push(monthlyRevenueMap.get(monthKey)!);
      } else {
        monthlyRevenue.push({
          month: monthKey,
          revenue: 0,
          transactions: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        revenueByService,
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}