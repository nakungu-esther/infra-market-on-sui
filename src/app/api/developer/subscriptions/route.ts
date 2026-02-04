import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { session, user, entitlements, services } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required. Provide Bearer token in Authorization header.',
        code: 'MISSING_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Query session table for token and check if not expired
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN' 
      }, { status: 401 });
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    if (new Date() > new Date(userSession.expiresAt)) {
      return NextResponse.json({ 
        error: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED' 
      }, { status: 401 });
    }

    // Query user table for session.userId
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const authenticatedUser = userRecord[0];

    // Verify user.role === 'developer'
    if (authenticatedUser.role !== 'developer') {
      return NextResponse.json({ 
        error: 'Access denied. Developer role required.',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    const serviceIdParam = searchParams.get('serviceId');

    // Validate query parameters
    let isActiveFilter: boolean | null = null;
    if (isActiveParam !== null) {
      if (isActiveParam !== 'true' && isActiveParam !== 'false') {
        return NextResponse.json({ 
          error: 'Invalid isActive parameter. Must be true or false.',
          code: 'INVALID_IS_ACTIVE' 
        }, { status: 400 });
      }
      isActiveFilter = isActiveParam === 'true';
    } else {
      isActiveFilter = true; // Default to true
    }

    let serviceIdFilter: number | null = null;
    if (serviceIdParam !== null) {
      const parsedServiceId = parseInt(serviceIdParam);
      if (isNaN(parsedServiceId)) {
        return NextResponse.json({ 
          error: 'Invalid serviceId parameter. Must be a valid integer.',
          code: 'INVALID_SERVICE_ID' 
        }, { status: 400 });
      }
      serviceIdFilter = parsedServiceId;
    }

    // Build the main query with joins
    // We need to manually join since Drizzle doesn't have a built-in join API that returns flat objects
    const entitlementsRecords = await db.select({
      id: entitlements.id,
      userId: entitlements.userId,
      serviceId: entitlements.serviceId,
      paymentId: entitlements.paymentId,
      pricingTier: entitlements.pricingTier,
      quotaLimit: entitlements.quotaLimit,
      quotaUsed: entitlements.quotaUsed,
      validFrom: entitlements.validFrom,
      validUntil: entitlements.validUntil,
      isActive: entitlements.isActive,
      tokenType: entitlements.tokenType,
      amountPaid: entitlements.amountPaid,
      txDigest: entitlements.txDigest,
      createdAt: entitlements.createdAt,
      updatedAt: entitlements.updatedAt,
      serviceName: services.name,
      serviceDescription: services.description,
      serviceType: services.serviceType,
      serviceStatus: services.status,
      providerId: services.providerId,
    })
    .from(entitlements)
    .innerJoin(services, eq(entitlements.serviceId, services.id))
    .where(
      and(
        eq(entitlements.userId, authenticatedUser.id),
        isActiveFilter !== null ? eq(entitlements.isActive, isActiveFilter) : undefined,
        serviceIdFilter !== null ? eq(entitlements.serviceId, serviceIdFilter) : undefined
      )
    )
    .orderBy(desc(entitlements.createdAt));

    // Fetch provider names for all services
    const providerIds = [...new Set(entitlementsRecords.map(e => e.providerId))];
    const providers = await db.select({
      id: user.id,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, providerIds[0])); // This is simplified; in production, use `inArray` if available

    // Create a map of provider IDs to names
    const providerMap = new Map<string, string>();
    for (const providerId of providerIds) {
      const providerRecords = await db.select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, providerId))
      .limit(1);
      
      if (providerRecords.length > 0) {
        providerMap.set(providerId, providerRecords[0].name);
      }
    }

    // Process each entitlement with additional calculations
    const now = new Date();
    const subscriptions = entitlementsRecords.map(entitlement => {
      const remainingQuota = entitlement.quotaLimit - entitlement.quotaUsed;
      const quotaPercentageUsed = entitlement.quotaLimit > 0 
        ? (entitlement.quotaUsed / entitlement.quotaLimit) * 100 
        : 0;
      
      const validUntilDate = new Date(entitlement.validUntil);
      const daysUntilExpiry = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = now > validUntilDate;

      const providerName = providerMap.get(entitlement.providerId) || 'Unknown Provider';

      return {
        id: entitlement.id,
        userId: entitlement.userId,
        serviceId: entitlement.serviceId,
        serviceName: entitlement.serviceName,
        serviceDescription: entitlement.serviceDescription || '',
        serviceType: entitlement.serviceType,
        serviceStatus: entitlement.serviceStatus,
        providerName,
        pricingTier: entitlement.pricingTier,
        quotaLimit: entitlement.quotaLimit,
        quotaUsed: entitlement.quotaUsed,
        remainingQuota,
        quotaPercentageUsed: Math.round(quotaPercentageUsed * 100) / 100,
        validFrom: entitlement.validFrom,
        validUntil: entitlement.validUntil,
        daysUntilExpiry,
        isActive: Boolean(entitlement.isActive),
        isExpired,
        tokenType: entitlement.tokenType,
        amountPaid: entitlement.amountPaid,
        txDigest: entitlement.txDigest,
        createdAt: entitlement.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        count: subscriptions.length,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}