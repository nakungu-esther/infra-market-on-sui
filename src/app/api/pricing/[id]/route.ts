import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pricingTiers, services, session } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_TIER_NAMES = ['free', 'basic', 'pro', 'enterprise'];

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const userSession = sessionRecord[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return null;
    }

    return { userId: userSession.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const pricingTier = await db.select()
      .from(pricingTiers)
      .where(eq(pricingTiers.id, parseInt(id)))
      .limit(1);

    if (pricingTier.length === 0) {
      return NextResponse.json(
        { error: 'Pricing tier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(pricingTier[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const existingTier = await db.select({
      id: pricingTiers.id,
      serviceId: pricingTiers.serviceId,
      providerId: services.providerId
    })
      .from(pricingTiers)
      .innerJoin(services, eq(pricingTiers.serviceId, services.id))
      .where(eq(pricingTiers.id, parseInt(id)))
      .limit(1);

    if (existingTier.length === 0) {
      return NextResponse.json(
        { error: 'Pricing tier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingTier[0].providerId !== auth.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this pricing tier', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      tierName,
      priceSui,
      priceWal,
      priceUsdc,
      quotaLimit,
      validityDays,
      features,
      isActive
    } = body;

    if (tierName !== undefined && !VALID_TIER_NAMES.includes(tierName)) {
      return NextResponse.json(
        { 
          error: `tierName must be one of: ${VALID_TIER_NAMES.join(', ')}`, 
          code: 'INVALID_TIER_NAME' 
        },
        { status: 400 }
      );
    }

    if (priceSui !== undefined) {
      const price = parseFloat(priceSui);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'priceSui must be a non-negative number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    if (priceWal !== undefined) {
      const price = parseFloat(priceWal);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'priceWal must be a non-negative number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    if (priceUsdc !== undefined) {
      const price = parseFloat(priceUsdc);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: 'priceUsdc must be a non-negative number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    if (quotaLimit !== undefined) {
      if (!Number.isInteger(quotaLimit) || quotaLimit <= 0) {
        return NextResponse.json(
          { error: 'quotaLimit must be a positive integer', code: 'INVALID_QUOTA' },
          { status: 400 }
        );
      }
    }

    if (validityDays !== undefined) {
      if (!Number.isInteger(validityDays) || validityDays <= 0) {
        return NextResponse.json(
          { error: 'validityDays must be a positive integer', code: 'INVALID_VALIDITY' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (tierName !== undefined) updateData.tierName = tierName;
    if (priceSui !== undefined) updateData.priceSui = priceSui;
    if (priceWal !== undefined) updateData.priceWal = priceWal;
    if (priceUsdc !== undefined) updateData.priceUsdc = priceUsdc;
    if (quotaLimit !== undefined) updateData.quotaLimit = quotaLimit;
    if (validityDays !== undefined) updateData.validityDays = validityDays;
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await db.update(pricingTiers)
      .set(updateData)
      .where(eq(pricingTiers.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update pricing tier', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const existingTier = await db.select({
      id: pricingTiers.id,
      serviceId: pricingTiers.serviceId,
      providerId: services.providerId
    })
      .from(pricingTiers)
      .innerJoin(services, eq(pricingTiers.serviceId, services.id))
      .where(eq(pricingTiers.id, parseInt(id)))
      .limit(1);

    if (existingTier.length === 0) {
      return NextResponse.json(
        { error: 'Pricing tier not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingTier[0].providerId !== auth.userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this pricing tier', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const deleted = await db.delete(pricingTiers)
      .where(eq(pricingTiers.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete pricing tier', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Pricing tier deleted successfully',
        deleted: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}