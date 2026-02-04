import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements, services } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

const VALID_PRICING_TIERS = ['free', 'basic', 'pro', 'enterprise'] as const;
const VALID_TOKEN_TYPES = ['SUI', 'WAL', 'USDC'] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    const isActive = searchParams.get('isActive') !== null 
      ? searchParams.get('isActive') === 'true' 
      : true;
    const pricingTier = searchParams.get('pricingTier');

    const conditions = [eq(entitlements.userId, user.id)];

    if (serviceId) {
      const parsedServiceId = parseInt(serviceId);
      if (isNaN(parsedServiceId)) {
        return NextResponse.json({ 
          error: 'Invalid serviceId format',
          code: 'INVALID_SERVICE_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(entitlements.serviceId, parsedServiceId));
    }

    conditions.push(eq(entitlements.isActive, isActive));

    if (pricingTier) {
      if (!VALID_PRICING_TIERS.includes(pricingTier as any)) {
        return NextResponse.json({ 
          error: `Invalid pricingTier. Must be one of: ${VALID_PRICING_TIERS.join(', ')}`,
          code: 'INVALID_PRICING_TIER' 
        }, { status: 400 });
      }
      conditions.push(eq(entitlements.pricingTier, pricingTier));
    }

    const results = await db
      .select({
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
        service: {
          id: services.id,
          name: services.name,
          description: services.description,
          serviceType: services.serviceType,
          status: services.status,
        }
      })
      .from(entitlements)
      .leftJoin(services, eq(entitlements.serviceId, services.id))
      .where(and(...conditions))
      .orderBy(desc(entitlements.createdAt));

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET entitlements error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED' 
      }, { status: 400 });
    }

    const { 
      serviceId, 
      paymentId, 
      pricingTier, 
      quotaLimit, 
      validFrom, 
      validUntil, 
      tokenType, 
      amountPaid, 
      txDigest 
    } = body;

    if (!serviceId || !paymentId || !pricingTier || !quotaLimit || !validFrom || !validUntil || !tokenType || !amountPaid || !txDigest) {
      return NextResponse.json({ 
        error: 'Missing required fields: serviceId, paymentId, pricingTier, quotaLimit, validFrom, validUntil, tokenType, amountPaid, txDigest',
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    if (!VALID_PRICING_TIERS.includes(pricingTier)) {
      return NextResponse.json({ 
        error: `Invalid pricingTier. Must be one of: ${VALID_PRICING_TIERS.join(', ')}`,
        code: 'INVALID_PRICING_TIER' 
      }, { status: 400 });
    }

    if (!VALID_TOKEN_TYPES.includes(tokenType)) {
      return NextResponse.json({ 
        error: `Invalid tokenType. Must be one of: ${VALID_TOKEN_TYPES.join(', ')}`,
        code: 'INVALID_TOKEN_TYPE' 
      }, { status: 400 });
    }

    const parsedQuotaLimit = parseInt(quotaLimit);
    if (isNaN(parsedQuotaLimit) || parsedQuotaLimit <= 0) {
      return NextResponse.json({ 
        error: 'quotaLimit must be a positive integer',
        code: 'INVALID_QUOTA_LIMIT' 
      }, { status: 400 });
    }

    let validFromDate: Date;
    let validUntilDate: Date;
    try {
      validFromDate = new Date(validFrom);
      validUntilDate = new Date(validUntil);
      
      if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (e) {
      return NextResponse.json({ 
        error: 'validFrom and validUntil must be valid ISO timestamp strings',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    if (validUntilDate <= validFromDate) {
      return NextResponse.json({ 
        error: 'validUntil must be after validFrom',
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    const parsedServiceId = parseInt(serviceId);
    if (isNaN(parsedServiceId)) {
      return NextResponse.json({ 
        error: 'Invalid serviceId format',
        code: 'INVALID_SERVICE_ID' 
      }, { status: 400 });
    }

    const serviceExists = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.id, parsedServiceId))
      .limit(1);

    if (serviceExists.length === 0) {
      return NextResponse.json({ 
        error: 'Service not found',
        code: 'SERVICE_NOT_FOUND' 
      }, { status: 404 });
    }

    const existingPayment = await db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(eq(entitlements.paymentId, paymentId))
      .limit(1);

    if (existingPayment.length > 0) {
      return NextResponse.json({ 
        error: 'Payment ID already exists',
        code: 'DUPLICATE_PAYMENT_ID' 
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const newEntitlement = await db
      .insert(entitlements)
      .values({
        userId: user.id,
        serviceId: parsedServiceId,
        paymentId: paymentId.trim(),
        pricingTier,
        quotaLimit: parsedQuotaLimit,
        quotaUsed: 0,
        validFrom: validFromDate.toISOString(),
        validUntil: validUntilDate.toISOString(),
        isActive: true,
        tokenType,
        amountPaid: amountPaid.toString(),
        txDigest: txDigest.trim(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newEntitlement[0], { status: 201 });
  } catch (error: any) {
    console.error('POST entitlement error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}