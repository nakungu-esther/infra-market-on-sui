// API route for payment verification
import { NextRequest, NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { db } from '@/db';
import { entitlements, pricingTiers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { mistToSui } from '@/lib/sui/transactions';

interface VerifyPaymentRequest {
  transactionDigest: string;
  tierId: number;
  serviceId: number;
  expectedAmount: number;
  expectedRecipient: string;
  paymentToken: 'SUI' | 'USDC' | 'WAL';
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode token to get user ID (simplified - in production use proper JWT verification)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = payload.sub || payload.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body: VerifyPaymentRequest = await request.json();
    const { transactionDigest, tierId, serviceId, expectedAmount, expectedRecipient, paymentToken } = body;

    // Get pricing tier details
    const [tier] = await db.select().from(pricingTiers).where(eq(pricingTiers.id, tierId)).limit(1);
    
    if (!tier) {
      return NextResponse.json({ 
        isValid: false, 
        message: 'Invalid pricing tier' 
      }, { status: 400 });
    }

    // Check if payment is free
    const isFree = parseFloat(tier.priceSui) === 0 && 
                   parseFloat(tier.priceWal) === 0 && 
                   parseFloat(tier.priceUsdc) === 0;

    let txDigest = transactionDigest;
    
    if (!isFree) {
      // Initialize Sui client
      const network = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet';
      const suiClient = new SuiClient({ url: getFullnodeUrl(network) });

      // Validate transaction digest format
      if (!transactionDigest || !transactionDigest.match(/^[A-Za-z0-9+/=]+$/)) {
        return NextResponse.json({
          isValid: false,
          message: 'Invalid transaction digest format',
        }, { status: 400 });
      }

      // Fetch transaction from Sui blockchain
      const txBlock = await suiClient.getTransactionBlock({
        digest: transactionDigest,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });

      // Verify transaction status
      if (!txBlock.effects?.status.status || txBlock.effects.status.status !== 'success') {
        return NextResponse.json({
          isValid: false,
          message: 'Transaction failed or not yet finalized',
        }, { status: 400 });
      }

      // Verify balance changes (payment received)
      const balanceChanges = txBlock.balanceChanges || [];
      const recipientReceived = balanceChanges.some((change: any) => {
        const amountReceived = Math.abs(parseInt(change.amount));
        const expectedAmountMist = expectedAmount * 1_000_000_000;
        
        return change.owner?.AddressOwner === expectedRecipient && 
               amountReceived >= expectedAmountMist * 0.99; // 1% tolerance for gas
      });

      if (!recipientReceived) {
        return NextResponse.json({
          isValid: false,
          message: 'Payment verification failed: Amount or recipient mismatch',
        }, { status: 400 });
      }
    }

    // Create entitlement in database
    const now = new Date();
    const validUntil = new Date(now.getTime() + tier.validityDays * 24 * 60 * 60 * 1000);

    const [newEntitlement] = await db.insert(entitlements).values({
      userId,
      serviceId,
      paymentId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pricingTier: tier.tierName,
      quotaLimit: tier.quotaLimit,
      quotaUsed: 0,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      isActive: true,
      tokenType: paymentToken,
      amountPaid: expectedAmount.toString(),
      txDigest: txDigest || 'free-tier',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }).returning();

    return NextResponse.json({
      isValid: true,
      message: 'Payment verified successfully',
      entitlement: newEntitlement,
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      isValid: false,
      message: error.message || 'Payment verification failed',
    }, { status: 500 });
  }
}