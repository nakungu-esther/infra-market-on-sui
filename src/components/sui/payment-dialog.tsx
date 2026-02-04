"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { processPayment, getTokenBalance, type PaymentParams } from "@/lib/sui/payment";
import type { TokenType } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceName: string;
  tierId: string;
  tierName: string;
  price: number;
  duration: number;
  providerAddress: string;
  quota: string;
  features: string[];
  onSuccess?: (transactionDigest: string) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  serviceId,
  serviceName,
  tierId,
  tierName,
  price,
  duration,
  providerAddress,
  quota,
  features,
  onSuccess,
}: PaymentDialogProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [selectedToken, setSelectedToken] = useState<TokenType>("SUI");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success" | "error">("confirm");
  const [transactionDigest, setTransactionDigest] = useState<string>("");

  // Fetch balance when token changes
  useEffect(() => {
    if (account?.address && open) {
      getTokenBalance(client, account.address, selectedToken).then(setBalance);
    }
  }, [account, selectedToken, client, open]);

  const handlePayment = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (balance < price) {
      toast.error(`Insufficient ${selectedToken} balance`);
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const paymentParams: PaymentParams = {
        serviceId,
        tierId,
        amount: price,
        token: selectedToken,
        providerAddress,
        duration,
      };

      const result = await processPayment(
        client,
        paymentParams,
        account.address,
        async (tx) => {
          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  resolve({ digest: result.digest });
                },
                onError: (error) => {
                  reject(error);
                },
              }
            );
          });
        }
      );

      if (result.success && result.transactionDigest) {
        setTransactionDigest(result.transactionDigest);
        setStep("success");
        
        // Record payment in backend
        await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
          },
          body: JSON.stringify({
            serviceId,
            tierId,
            amount: price,
            token: selectedToken,
            transactionHash: result.transactionDigest,
            duration,
          }),
        });

        toast.success("Payment successful!");
        onSuccess?.(result.transactionDigest);
      } else {
        throw new Error(result.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setStep("error");
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onOpenChange(false);
      // Reset state after delay
      setTimeout(() => {
        setStep("confirm");
        setTransactionDigest("");
      }, 300);
    } else if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Purchase</DialogTitle>
              <DialogDescription>
                Review your subscription details and complete payment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Service Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <span className="font-medium">{serviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tier</span>
                  <Badge variant="secondary">{tierName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Quota</span>
                  <span className="font-medium">{quota}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} days</span>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Features Included:</span>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Payment Method */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Token</label>
                <Select value={selectedToken} onValueChange={(value) => setSelectedToken(value as TokenType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUI">SUI</SelectItem>
                    <SelectItem value="WAL">WAL</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
                
                {account && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <span className="font-medium">
                      {balance.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {price} {selectedToken}
                </span>
              </div>

              {/* Warnings */}
              {!account && (
                <Alert>
                  <Wallet className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your Sui wallet to continue
                  </AlertDescription>
                </Alert>
              )}

              {account && balance < price && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need {price} {selectedToken} but only have {balance.toFixed(4)}.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={!account || balance < price || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Pay {price} {selectedToken}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Processing Payment...</h3>
            <p className="text-sm text-muted-foreground text-center">
              Please confirm the transaction in your wallet and wait for blockchain confirmation.
            </p>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Your subscription to {serviceName} ({tierName}) has been activated.
              </p>
              {transactionDigest && (
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                  <code className="block w-full p-2 bg-muted rounded text-xs break-all">
                    {transactionDigest}
                  </code>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "error" && (
          <>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold">Payment Failed</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Something went wrong while processing your payment. Please try again.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setStep("confirm")}>
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
