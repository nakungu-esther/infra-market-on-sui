import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements, services, user, session } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Validate session and get userId
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION' 
      }, { status: 401 });
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    const now = new Date();
    if (userSession.expiresAt < now) {
      return NextResponse.json({ 
        error: 'Session has expired',
        code: 'EXPIRED_SESSION' 
      }, { status: 401 });
    }

    const userId = userSession.userId;

    // Query user table and verify role === 'developer'
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    if (userRecord[0].role !== 'developer') {
      return NextResponse.json({ 
        error: 'Developer role required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate date formats if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json({ 
        error: 'Invalid startDate format. Expected ISO date string',
        code: 'INVALID_START_DATE' 
      }, { status: 400 });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json({ 
        error: 'Invalid endDate format. Expected ISO date string',
        code: 'INVALID_END_DATE' 
      }, { status: 400 });
    }

    // Build date filter conditions
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(entitlements.createdAt, startDate));
    }
    if (endDate) {
      dateConditions.push(lte(entitlements.createdAt, endDate));
    }

    // Build where clause
    const whereConditions = [eq(entitlements.userId, userId)];
    if (dateConditions.length > 0) {
      whereConditions.push(...dateConditions);
    }

    const whereClause = whereConditions.length > 1 
      ? and(...whereConditions) 
      : whereConditions[0];

    // Query billing history with LEFT JOIN to services
    const billingHistory = await db.select({
      id: entitlements.id,
      serviceId: entitlements.serviceId,
      serviceName: services.name,
      serviceType: services.serviceType,
      paymentId: entitlements.paymentId,
      pricingTier: entitlements.pricingTier,
      tokenType: entitlements.tokenType,
      amountPaid: entitlements.amountPaid,
      quotaLimit: entitlements.quotaLimit,
      quotaUsed: entitlements.quotaUsed,
      validFrom: entitlements.validFrom,
      validUntil: entitlements.validUntil,
      isActive: entitlements.isActive,
      txDigest: entitlements.txDigest,
      createdAt: entitlements.createdAt,
    })
    .from(entitlements)
    .leftJoin(services, eq(entitlements.serviceId, services.id))
    .where(whereClause)
    .orderBy(desc(entitlements.createdAt))
    .limit(limit)
    .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(entitlements)
    .where(whereClause);

    const total = Number(totalCountResult[0].count);

    // Calculate summary statistics
    const summaryResult = await db.select({
      totalSpent: sql<string>`COALESCE(SUM(CAST(${entitlements.amountPaid} AS REAL)), 0)`,
      totalTransactions: sql<number>`count(*)`,
      activeSubscriptions: sql<number>`SUM(CASE WHEN ${entitlements.isActive} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(entitlements)
    .where(whereClause);

    const summary = {
      totalSpent: parseFloat(summaryResult[0].totalSpent || '0'),
      totalTransactions: Number(summaryResult[0].totalTransactions),
      activeSubscriptions: Number(summaryResult[0].activeSubscriptions || 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        billing: billingHistory,
        summary,
        limit,
        offset,
        total,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET billing history error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}