import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingTiers, services, session } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

const VALID_TIER_NAMES = ['free', 'basic', 'pro', 'enterprise'] as const;

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const sessionRecords = await db
      .select({ userId: session.userId })
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecords.length === 0) {
      return null;
    }

    return { id: sessionRecords[0].userId };
  } catch (error) {
    console.error('Session lookup error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const isActiveParam = searchParams.get('isActive');

    if (!serviceId) {
      return NextResponse.json(
        { 
          error: 'serviceId query parameter is required',
          code: 'MISSING_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    const serviceIdInt = parseInt(serviceId);
    if (isNaN(serviceIdInt)) {
      return NextResponse.json(
        { 
          error: 'serviceId must be a valid integer',
          code: 'INVALID_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    const isActive = isActiveParam === null ? true : isActiveParam === 'true';

    const conditions = [
      eq(pricingTiers.serviceId, serviceIdInt),
      eq(pricingTiers.isActive, isActive)
    ];

    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(and(...conditions))
      .orderBy(asc(pricingTiers.quotaLimit));

    return NextResponse.json(tiers, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      tierName,
      priceSui,
      priceWal,
      priceUsdc,
      quotaLimit,
      validityDays,
      features
    } = body;

    if (!serviceId) {
      return NextResponse.json(
        { 
          error: 'serviceId is required',
          code: 'MISSING_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    if (!tierName) {
      return NextResponse.json(
        { 
          error: 'tierName is required',
          code: 'MISSING_TIER_NAME'
        },
        { status: 400 }
      );
    }

    if (!VALID_TIER_NAMES.includes(tierName)) {
      return NextResponse.json(
        { 
          error: `tierName must be one of: ${VALID_TIER_NAMES.join(', ')}`,
          code: 'INVALID_TIER_NAME'
        },
        { status: 400 }
      );
    }

    if (priceSui === undefined || priceSui === null) {
      return NextResponse.json(
        { 
          error: 'priceSui is required',
          code: 'MISSING_PRICE_SUI'
        },
        { status: 400 }
      );
    }

    if (priceWal === undefined || priceWal === null) {
      return NextResponse.json(
        { 
          error: 'priceWal is required',
          code: 'MISSING_PRICE_WAL'
        },
        { status: 400 }
      );
    }

    if (priceUsdc === undefined || priceUsdc === null) {
      return NextResponse.json(
        { 
          error: 'priceUsdc is required',
          code: 'MISSING_PRICE_USDC'
        },
        { status: 400 }
      );
    }

    if (quotaLimit === undefined || quotaLimit === null) {
      return NextResponse.json(
        { 
          error: 'quotaLimit is required',
          code: 'MISSING_QUOTA_LIMIT'
        },
        { status: 400 }
      );
    }

    if (validityDays === undefined || validityDays === null) {
      return NextResponse.json(
        { 
          error: 'validityDays is required',
          code: 'MISSING_VALIDITY_DAYS'
        },
        { status: 400 }
      );
    }

    if (!features) {
      return NextResponse.json(
        { 
          error: 'features is required',
          code: 'MISSING_FEATURES'
        },
        { status: 400 }
      );
    }

    const priceSuiNum = parseFloat(priceSui);
    if (isNaN(priceSuiNum) || priceSuiNum < 0) {
      return NextResponse.json(
        { 
          error: 'priceSui must be a non-negative number',
          code: 'INVALID_PRICE_SUI'
        },
        { status: 400 }
      );
    }

    const priceWalNum = parseFloat(priceWal);
    if (isNaN(priceWalNum) || priceWalNum < 0) {
      return NextResponse.json(
        { 
          error: 'priceWal must be a non-negative number',
          code: 'INVALID_PRICE_WAL'
        },
        { status: 400 }
      );
    }

    const priceUsdcNum = parseFloat(priceUsdc);
    if (isNaN(priceUsdcNum) || priceUsdcNum < 0) {
      return NextResponse.json(
        { 
          error: 'priceUsdc must be a non-negative number',
          code: 'INVALID_PRICE_USDC'
        },
        { status: 400 }
      );
    }

    const quotaLimitInt = parseInt(quotaLimit);
    if (isNaN(quotaLimitInt) || quotaLimitInt <= 0) {
      return NextResponse.json(
        { 
          error: 'quotaLimit must be a positive integer',
          code: 'INVALID_QUOTA_LIMIT'
        },
        { status: 400 }
      );
    }

    const validityDaysInt = parseInt(validityDays);
    if (isNaN(validityDaysInt) || validityDaysInt <= 0) {
      return NextResponse.json(
        { 
          error: 'validityDays must be a positive integer',
          code: 'INVALID_VALIDITY_DAYS'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(features)) {
      return NextResponse.json(
        { 
          error: 'features must be a JSON array',
          code: 'INVALID_FEATURES'
        },
        { status: 400 }
      );
    }

    const serviceIdInt = parseInt(serviceId);
    if (isNaN(serviceIdInt)) {
      return NextResponse.json(
        { 
          error: 'serviceId must be a valid integer',
          code: 'INVALID_SERVICE_ID'
        },
        { status: 400 }
      );
    }

    const serviceRecords = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceIdInt))
      .limit(1);

    if (serviceRecords.length === 0) {
      return NextResponse.json(
        { 
          error: 'Service not found',
          code: 'SERVICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (serviceRecords[0].providerId !== user.id) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to manage pricing tiers for this service',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    const newTier = await db
      .insert(pricingTiers)
      .values({
        serviceId: serviceIdInt,
        tierName,
        priceSui: priceSui.toString(),
        priceWal: priceWal.toString(),
        priceUsdc: priceUsdc.toString(),
        quotaLimit: quotaLimitInt,
        validityDays: validityDaysInt,
        features: features,
        isActive: true,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newTier[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}