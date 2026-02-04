"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Wallet, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { COIN_TYPES, MIST_PER_SUI } from "@/lib/sui/config";

interface PricingTier {
  id: number;
  serviceId: number;
  tierName: string;
  priceSui: string;
  priceWal: string;
  priceUsdc: string;
  quotaLimit: number;
  validityDays: number;
  features: string[];
  isActive: boolean;
}

interface PaymentCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: PricingTier;
  serviceName: string;
  onSuccess?: () => void;
}

export function PaymentCheckoutDialog({
  open,
  onOpenChange,
  tier,
  serviceName,
  onSuccess,
}: PaymentCheckoutDialogProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [selectedToken, setSelectedToken] = useState<"SUI" | "WAL" | "USDC">("SUI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [txDigest, setTxDigest] = useState<string>("");

  const getPrice = () => {
    switch (selectedToken) {
      case "SUI":
        return tier.priceSui;
      case "WAL":
        return tier.priceWal;
      case "USDC":
        return tier.priceUsdc;
      default:
        return "0";
    }
  };

  const getCoinType = () => {
    switch (selectedToken) {
      case "SUI":
        return COIN_TYPES.SUI;
      case "WAL":
        return COIN_TYPES.WAL_TESTNET;
      case "USDC":
        return COIN_TYPES.USDC_TESTNET;
      default:
        return COIN_TYPES.SUI;
    }
  };

  const buildPaymentTransaction = async () => {
    if (!currentAccount) throw new Error("Wallet not connected");

    const price = parseFloat(getPrice());
    const amountInMist = BigInt(Math.floor(price * Number(MIST_PER_SUI)));
    const coinType = getCoinType();
    const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || currentAccount.address;

    // Fetch sender's coins
    const coins = await suiClient.getCoins({
      owner: currentAccount.address,
      coinType,
    });

    if (coins.data.length === 0) {
      throw new Error(`No ${selectedToken} coins found in your wallet`);
    }

    const tx = new Transaction();
    tx.setSender(currentAccount.address);

    // Build payment transaction
    let paymentCoin;
    if (coins.data.length === 1) {
      // Single coin: split it
      [paymentCoin] = tx.splitCoins(tx.gas, [amountInMist]);
    } else {
      // Multiple coins: merge then split
      const primaryCoin = coins.data[0].coinObjectId;
      const otherCoins = coins.data.slice(1).map((c) => c.coinObjectId);
      tx.mergeCoins(primaryCoin, otherCoins);
      [paymentCoin] = tx.splitCoins(primaryCoin, [amountInMist]);
    }

    // Transfer payment to treasury
    tx.transferObjects([paymentCoin], treasuryAddress);

    return tx;
  };

  const handlePayment = async () => {
    if (!currentAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    const price = parseFloat(getPrice());
    if (price === 0) {
      // Free tier - no payment needed, just create entitlement
      await createEntitlement("FREE-" + Date.now(), "0x0");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Build transaction
      const tx = await buildPaymentTransaction();

      // Execute transaction
      const result = await signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result.digest);
          },
        }
      );

      const digest = result.digest;
      setTxDigest(digest);

      // Wait for transaction confirmation
      await suiClient.waitForTransaction({
        digest,
      });

      // Create entitlement in backend
      await createEntitlement(`PAY-${Date.now()}`, digest);
      
      setPaymentStatus("success");
      toast.success("Payment successful! Your entitlement has been activated.");
      
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setPaymentStatus("idle");
        setTxDigest("");
      }, 2000);
      
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
      
      if (error.message?.includes("Insufficient")) {
        toast.error(`Insufficient ${selectedToken} balance. Please add funds to your wallet.`);
      } else if (error.message?.includes("User rejected")) {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(error.message || "Payment failed. Please try again.");
      }
      
      setTimeout(() => setPaymentStatus("idle"), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const createEntitlement = async (paymentId: string, txDigest: string) => {
    const token = localStorage.getItem("bearer_token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    const validFrom = new Date().toISOString();
    const validUntil = new Date(Date.now() + tier.validityDays * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch("/api/entitlements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        serviceId: tier.serviceId,
        paymentId,
        pricingTier: tier.tierName,
        quotaLimit: tier.quotaLimit,
        validFrom,
        validUntil,
        tokenType: selectedToken,
        amountPaid: getPrice(),
        txDigest,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create entitlement");
    }

    return response.json();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Subscribe to {tier.tierName} Plan</DialogTitle>
          <DialogDescription>
            Complete your purchase for {serviceName}
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === "idle" || paymentStatus === "processing" ? (
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{tier.tierName} Plan</span>
                <Badge variant="secondary">{tier.validityDays} days</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {tier.quotaLimit.toLocaleString()} requests/month
              </div>
              <div className="pt-2 border-t">
                <ul className="space-y-1 text-sm">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Token Selection */}
            {parseFloat(getPrice()) > 0 && (
              <div className="space-y-3">
                <Label>Payment Token</Label>
                <RadioGroup value={selectedToken} onValueChange={(v) => setSelectedToken(v as any)}>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="SUI" id="sui" />
                    <Label htmlFor="sui" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>SUI Token</span>
                        <span className="font-semibold">{tier.priceSui} SUI</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="WAL" id="wal" />
                    <Label htmlFor="wal" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>WAL Token</span>
                        <span className="font-semibold">{tier.priceWal} WAL</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="USDC" id="usdc" />
                    <Label htmlFor="usdc" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>USDC Stablecoin</span>
                        <span className="font-semibold">{tier.priceUsdc} USDC</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Wallet Connection */}
            {!currentAccount ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <Wallet className="h-4 w-4" />
                  Please connect your Sui wallet to continue
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Wallet connected: {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-6)}
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {paymentStatus === "processing" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing transaction on Sui blockchain...
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!currentAccount || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {parseFloat(getPrice()) === 0 ? "Activate Free Tier" : `Pay ${getPrice()} ${selectedToken}`}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : paymentStatus === "success" ? (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription has been activated
              </p>
              {txDigest && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  TX: {txDigest.slice(0, 10)}...{txDigest.slice(-8)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again or contact support
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}