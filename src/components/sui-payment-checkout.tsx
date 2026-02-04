'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { ConnectButton } from '@mysten/dapp-kit';
import { buildSUIPaymentTx, buildTokenPaymentTx, suiToMist } from '@/lib/sui/transactions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface SuiPaymentCheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: {
    id: number;
    tierName: string;
    priceSui: string;
    priceWal: string;
    priceUsdc: string;
    quotaLimit: number;
    validityDays: number;
  };
  serviceName: string;
  serviceId: number;
  onSuccess?: (transactionDigest: string) => void;
}

type PaymentToken = 'SUI' | 'USDC' | 'WAL';

export function SuiPaymentCheckout({
  open,
  onOpenChange,
  tier,
  serviceName,
  serviceId,
  onSuccess,
}: SuiPaymentCheckoutProps) {
  const { mutate: signAndExecuteTransaction, isPending } = useSignAndExecuteTransaction();
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('SUI');
  const [transactionDigest, setTransactionDigest] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const recipientAddress = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT || 
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  const prices = {
    SUI: parseFloat(tier.priceSui),
    USDC: parseFloat(tier.priceUsdc),
    WAL: parseFloat(tier.priceWal),
  };

  const selectedPrice = prices[selectedToken];
  const isFree = selectedPrice === 0;

  const handlePayment = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isFree) {
      // Free tier - just create subscription without payment
      await handleFreeSubscription();
      return;
    }

    setStatus('processing');
    setError('');

    try {
      const amountInMist = suiToMist(selectedPrice);
      
      let tx;
      if (selectedToken === 'SUI') {
        tx = await buildSUIPaymentTx({
          recipient: recipientAddress,
          amount: amountInMist,
          senderAddress: currentAccount.address,
        });
      } else {
        // Token payment (USDC/WAL)
        const coinType = selectedToken === 'USDC' 
          ? process.env.NEXT_PUBLIC_USDC_TYPE || '0x2::sui::SUI'
          : process.env.NEXT_PUBLIC_WAL_TYPE || '0x2::sui::SUI';
        
        tx = await buildTokenPaymentTx({
          recipient: recipientAddress,
          amount: amountInMist,
          senderAddress: currentAccount.address,
          coinType,
        });
      }

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            setTransactionDigest(result.digest);
            setStatus('verifying');
            
            // Wait a bit for transaction to finalize
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify transaction on server
            await verifyTransaction(result.digest);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            setStatus('error');
            setError(error.message || 'Transaction failed');
            toast.error('Payment failed');
          },
        }
      );
    } catch (err: any) {
      console.error('Payment error:', err);
      setStatus('error');
      setError(err.message || 'Failed to process payment');
      toast.error('Failed to process payment');
    }
  };

  const handleFreeSubscription = async () => {
    setStatus('processing');
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tierId: tier.id,
          serviceId,
          paymentMethod: 'free',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate free subscription');
      }

      setStatus('success');
      toast.success('Free tier activated!');
      
      setTimeout(() => {
        onSuccess?.('free-tier');
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
      toast.error('Failed to activate subscription');
    }
  };

  const verifyTransaction = async (digest: string) => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionDigest: digest,
          tierId: tier.id,
          serviceId,
          expectedAmount: selectedPrice,
          expectedRecipient: recipientAddress,
          paymentToken: selectedToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.isValid) {
        throw new Error(data.message || 'Payment verification failed');
      }

      setStatus('success');
      toast.success('Payment verified! Subscription activated.');
      
      setTimeout(() => {
        onSuccess?.(digest);
        onOpenChange(false);
      }, 1500);
    } catch (err: any) {
      console.error('Verification error:', err);
      setStatus('error');
      setError(err.message || 'Payment verification failed');
      toast.error('Payment verification failed');
    }
  };

  const handleClose = () => {
    if (status !== 'processing' && status !== 'verifying') {
      onOpenChange(false);
      // Reset state
      setTimeout(() => {
        setStatus('idle');
        setError('');
        setTransactionDigest('');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout - {tier.tierName} Plan</DialogTitle>
          <DialogDescription>
            Complete payment to activate {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <span className="font-medium">{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{tier.tierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quota</span>
              <span className="font-medium">{tier.quotaLimit.toLocaleString()} requests</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Validity</span>
              <span className="font-medium">{tier.validityDays} days</span>
            </div>
          </div>

          {/* Payment Token Selection */}
          {!isFree && (
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup value={selectedToken} onValueChange={(value) => setSelectedToken(value as PaymentToken)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="SUI" id="sui" />
                  <Label htmlFor="sui" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>SUI</span>
                      <Badge variant="secondary">{prices.SUI} SUI</Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="USDC" id="usdc" />
                  <Label htmlFor="usdc" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>USDC</span>
                      <Badge variant="secondary">{prices.USDC} USDC</Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="WAL" id="wal" />
                  <Label htmlFor="wal" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>WAL</span>
                      <Badge variant="secondary">{prices.WAL} WAL</Badge>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Wallet Connection */}
          {!currentAccount && !isFree ? (
            <div className="space-y-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Wallet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Connect your Sui wallet to continue
                </p>
                <ConnectButton />
              </div>
            </div>
          ) : null}

          {/* Status Messages */}
          {status === 'success' && (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">Payment Successful!</p>
                <p className="text-sm">Your subscription has been activated.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg">
              <XCircle className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">Payment Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {transactionDigest && (
            <div className="p-3 bg-muted rounded text-xs break-all">
              <span className="text-muted-foreground">Transaction: </span>
              {transactionDigest}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={status === 'processing' || status === 'verifying'}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={(!currentAccount && !isFree) || isPending || status === 'processing' || status === 'verifying' || status === 'success'}
              className="flex-1"
            >
              {status === 'processing' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              )}
              {status === 'verifying' && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </>
              )}
              {(status === 'idle' || status === 'error') && (
                <>
                  {isFree ? 'Activate Free Tier' : `Pay ${selectedPrice} ${selectedToken}`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
