// API route for payment checkout
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entitlements, services, pricingTiers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPayment } from '@/lib/sui/payment';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from session
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!sessionResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { user } = await sessionResponse.json();

    const body = await request.json();
    const { serviceId, tierId, amount, token: paymentToken, transactionHash, duration } = body;

    // Verify transaction on Sui blockchain
    const isValid = await verifyPayment(suiClient, transactionHash);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Get service details
    const service = await db.select().from(services).where(eq(services.id, parseInt(serviceId))).get();
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get pricing tier details
    const tier = await db.select().from(pricingTiers)
      .where(eq(pricingTiers.serviceId, parseInt(serviceId)))
      .where(eq(pricingTiers.id, parseInt(tierId)))
      .get();

    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Pricing tier not found' },
        { status: 404 }
      );
    }

    // Create entitlement
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + duration);

    const entitlement = await db.insert(entitlements).values({
      userId: user.id,
      serviceId: parseInt(serviceId),
      paymentId: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      pricingTier: tier.tierName,
      quotaLimit: tier.quotaLimit,
      quotaUsed: 0,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      tokenType: paymentToken,
      amountPaid: amount.toString(),
      txDigest: transactionHash,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }).returning().get();

    return NextResponse.json({
      success: true,
      data: {
        entitlement,
        message: 'Payment successful and entitlement created',
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 }
    );
  }
}