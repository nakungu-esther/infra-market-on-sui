import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session, services, entitlements } from '@/db/schema';
import { eq, and, desc, gt, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token and check expiration
    const sessionResult = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const userSession = sessionResult[0];

    // Check if session is expired
    if (userSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user table for session userId
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

    // Verify user role is provider
    if (authenticatedUser.role !== 'provider') {
      return NextResponse.json(
        { error: 'Access denied. Provider role required.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get provider's service IDs
    const providerServices = await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(eq(services.providerId, authenticatedUser.id));

    if (providerServices.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          customers: [],
          totalCustomers: 0,
        },
      });
    }

    const serviceIds = providerServices.map((s) => s.id);
    const serviceMap = Object.fromEntries(
      providerServices.map((s) => [s.id, s.name])
    );

    // Query entitlements with user details joined
    const entitlementsWithUsers = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        entitlementId: entitlements.id,
        serviceId: entitlements.serviceId,
        pricingTier: entitlements.pricingTier,
        quotaLimit: entitlements.quotaLimit,
        quotaUsed: entitlements.quotaUsed,
        validFrom: entitlements.validFrom,
        validUntil: entitlements.validUntil,
        isActive: entitlements.isActive,
        amountPaid: entitlements.amountPaid,
        createdAt: entitlements.createdAt,
      })
      .from(entitlements)
      .innerJoin(user, eq(entitlements.userId, user.id))
      .innerJoin(services, eq(entitlements.serviceId, services.id))
      .where(eq(services.providerId, authenticatedUser.id))
      .orderBy(desc(entitlements.createdAt));

    // Group by userId to aggregate entitlements per customer
    const customerMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        entitlements: Array<{
          id: number;
          serviceId: number;
          serviceName: string;
          pricingTier: string;
          quotaLimit: number;
          quotaUsed: number;
          validFrom: string;
          validUntil: string;
          isActive: boolean;
          amountPaid: string;
          createdAt: string;
        }>;
        totalRevenue: number;
        activeSubscriptions: number;
      }
    >();

    for (const row of entitlementsWithUsers) {
      if (!customerMap.has(row.userId)) {
        customerMap.set(row.userId, {
          userId: row.userId,
          name: row.userName,
          email: row.userEmail,
          entitlements: [],
          totalRevenue: 0,
          activeSubscriptions: 0,
        });
      }

      const customer = customerMap.get(row.userId)!;

      customer.entitlements.push({
        id: row.entitlementId,
        serviceId: row.serviceId,
        serviceName: serviceMap[row.serviceId] || 'Unknown Service',
        pricingTier: row.pricingTier,
        quotaLimit: row.quotaLimit,
        quotaUsed: row.quotaUsed,
        validFrom: row.validFrom,
        validUntil: row.validUntil,
        isActive: row.isActive,
        amountPaid: row.amountPaid,
        createdAt: row.createdAt,
      });

      // Sum total revenue
      customer.totalRevenue += parseFloat(row.amountPaid);

      // Count active subscriptions
      if (row.isActive) {
        customer.activeSubscriptions += 1;
      }
    }

    const customers = Array.from(customerMap.values());

    return NextResponse.json({
      success: true,
      data: {
        customers,
        totalCustomers: customers.length,
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}