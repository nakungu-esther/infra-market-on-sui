import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { services, pricingTiers, entitlements, session, user } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract and validate authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Query session table for token
    const sessionRecord = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Check if session is expired
    const sessionData = sessionRecord[0];
    const now = new Date();
    if (sessionData.expiresAt < now) {
      return NextResponse.json(
        { error: 'Token expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Query user table
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, sessionData.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    const authenticatedUser = userRecord[0];

    // Check if user has developer role
    if (authenticatedUser.role !== 'developer') {
      return NextResponse.json(
        { error: 'Access denied. Developer role required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get service ID from params
    const { id } = await params;

    // Validate service ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid service ID is required', code: 'INVALID_SERVICE_ID' },
        { status: 400 }
      );
    }

    const serviceId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { pricingTier, paymentId, tokenType, amountPaid, txDigest } = body;

    // Validate required fields
    if (!pricingTier) {
      return NextResponse.json(
        { error: 'Pricing tier is required', code: 'MISSING_PRICING_TIER' },
        { status: 400 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required', code: 'MISSING_PAYMENT_ID' },
        { status: 400 }
      );
    }

    if (!tokenType) {
      return NextResponse.json(
        { error: 'Token type is required', code: 'MISSING_TOKEN_TYPE' },
        { status: 400 }
      );
    }

    if (!amountPaid) {
      return NextResponse.json(
        { error: 'Amount paid is required', code: 'MISSING_AMOUNT_PAID' },
        { status: 400 }
      );
    }

    if (!txDigest) {
      return NextResponse.json(
        { error: 'Transaction digest is required', code: 'MISSING_TX_DIGEST' },
        { status: 400 }
      );
    }

    // Validate pricingTier
    const validTiers = ['free', 'basic', 'pro', 'enterprise'];
    if (!validTiers.includes(pricingTier.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'Invalid pricing tier. Must be one of: free, basic, pro, enterprise',
          code: 'INVALID_PRICING_TIER',
        },
        { status: 400 }
      );
    }

    // Validate tokenType
    const validTokenTypes = ['SUI', 'WAL', 'USDC'];
    if (!validTokenTypes.includes(tokenType.toUpperCase())) {
      return NextResponse.json(
        {
          error: 'Invalid token type. Must be one of: SUI, WAL, USDC',
          code: 'INVALID_TOKEN_TYPE',
        },
        { status: 400 }
      );
    }

    // Check if service exists
    const serviceRecord = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (serviceRecord.length === 0) {
      return NextResponse.json(
        { error: 'Service not found', code: 'SERVICE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const service = serviceRecord[0];

    // Check if service is active
    if (service.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Service is not active',
          code: 'SERVICE_NOT_ACTIVE',
        },
        { status: 400 }
      );
    }

    // Check if service is accepting users
    if (!service.isAcceptingUsers) {
      return NextResponse.json(
        {
          error: 'Service is not accepting new users',
          code: 'SERVICE_NOT_ACCEPTING_USERS',
        },
        { status: 400 }
      );
    }

    // Query pricing tier
    const pricingTierRecord = await db
      .select()
      .from(pricingTiers)
      .where(
        and(
          eq(pricingTiers.serviceId, serviceId),
          eq(pricingTiers.tierName, pricingTier.toLowerCase()),
          eq(pricingTiers.isActive, true)
        )
      )
      .limit(1);

    if (pricingTierRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'Pricing tier not found or not active',
          code: 'PRICING_TIER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const tier = pricingTierRecord[0];

    // Check for existing active subscription
    const currentDate = new Date().toISOString();
    const existingEntitlement = await db
      .select()
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, authenticatedUser.id),
          eq(entitlements.serviceId, serviceId),
          eq(entitlements.isActive, true),
          gt(entitlements.validUntil, currentDate)
        )
      )
      .limit(1);

    if (existingEntitlement.length > 0) {
      return NextResponse.json(
        {
          error: 'You already have an active subscription for this service',
          code: 'ACTIVE_SUBSCRIPTION_EXISTS',
        },
        { status: 400 }
      );
    }

    // Calculate validity period
    const validFrom = new Date().toISOString();
    const validUntilDate = new Date(
      Date.now() + tier.validityDays * 24 * 60 * 60 * 1000
    );
    const validUntil = validUntilDate.toISOString();

    // Insert entitlement
    let newEntitlement;
    try {
      newEntitlement = await db
        .insert(entitlements)
        .values({
          userId: authenticatedUser.id,
          serviceId: serviceId,
          paymentId: paymentId,
          pricingTier: pricingTier.toLowerCase(),
          quotaLimit: tier.quotaLimit,
          quotaUsed: 0,
          validFrom: validFrom,
          validUntil: validUntil,
          isActive: true,
          tokenType: tokenType.toUpperCase(),
          amountPaid: amountPaid,
          txDigest: txDigest,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
    } catch (error: any) {
      // Handle unique constraint error on paymentId
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json(
          {
            error: 'Payment ID already exists',
            code: 'PAYMENT_ID_CONFLICT',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to service',
        data: {
          entitlement: newEntitlement[0],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}