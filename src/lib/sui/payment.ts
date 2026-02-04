"use client";

import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import type { TokenType } from "@/types";

// Sui payment configuration
export const SUI_PAYMENT_CONFIG = {
  // These would be actual deployed contract addresses on Sui
  PAYMENT_MODULE: process.env.NEXT_PUBLIC_SUI_PAYMENT_MODULE || "0x...",
  PLATFORM_ADDRESS: process.env.NEXT_PUBLIC_SUI_PLATFORM_ADDRESS || "0x...",
  
  // Token decimals
  TOKEN_DECIMALS: {
    SUI: 9,
    WAL: 9,
    USDC: 6,
    USDT: 6,
  } as Record<TokenType, number>,
  
  // Coin types on Sui
  COIN_TYPES: {
    SUI: "0x2::sui::SUI",
    WAL: process.env.NEXT_PUBLIC_WAL_COIN_TYPE || "0x...::wal::WAL",
    USDC: process.env.NEXT_PUBLIC_USDC_COIN_TYPE || "0x...::usdc::USDC",
    USDT: process.env.NEXT_PUBLIC_USDT_COIN_TYPE || "0x...::usdt::USDT",
  } as Record<TokenType, string>,
};

export interface PaymentParams {
  serviceId: string;
  tierId: string;
  amount: number;
  token: TokenType;
  providerAddress: string;
  duration: number; // in days
}

export interface PaymentResult {
  success: boolean;
  transactionDigest?: string;
  entitlementId?: string;
  error?: string;
}

/**
 * Create a payment transaction for service subscription
 */
export function createPaymentTransaction(
  params: PaymentParams,
  userAddress: string
): Transaction {
  const tx = new Transaction();
  
  const { amount, token, providerAddress, serviceId, tierId, duration } = params;
  
  // Convert amount to proper decimals
  const decimals = SUI_PAYMENT_CONFIG.TOKEN_DECIMALS[token];
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));
  
  // Get coin type
  const coinType = SUI_PAYMENT_CONFIG.COIN_TYPES[token];
  
  // Split coins for payment
  const [coin] = tx.splitCoins(tx.gas, [amountInSmallestUnit]);
  
  // Transfer to provider (80% of payment)
  const providerAmount = Math.floor(amountInSmallestUnit * 0.8);
  const [providerCoin] = tx.splitCoins(coin, [providerAmount]);
  tx.transferObjects([providerCoin], providerAddress);
  
  // Transfer platform fee (20% of payment)
  const platformAmount = amountInSmallestUnit - providerAmount;
  const [platformCoin] = tx.splitCoins(coin, [platformAmount]);
  tx.transferObjects([platformCoin], SUI_PAYMENT_CONFIG.PLATFORM_ADDRESS);
  
  // Emit payment event (would call smart contract function in production)
  // This creates a record on-chain that can be indexed
  tx.moveCall({
    target: `${SUI_PAYMENT_CONFIG.PAYMENT_MODULE}::payment::record_payment`,
    arguments: [
      tx.pure.string(serviceId),
      tx.pure.string(tierId),
      tx.pure.u64(amountInSmallestUnit),
      tx.pure.u64(duration),
      tx.pure.address(providerAddress),
    ],
    typeArguments: [coinType],
  });
  
  return tx;
}

/**
 * Process payment and create entitlement
 */
export async function processPayment(
  client: SuiClient,
  params: PaymentParams,
  userAddress: string,
  signAndExecute: (tx: Transaction) => Promise<{ digest: string }>
): Promise<PaymentResult> {
  try {
    // Create payment transaction
    const tx = createPaymentTransaction(params, userAddress);
    
    // Sign and execute transaction
    const result = await signAndExecute(tx);
    
    if (!result.digest) {
      return {
        success: false,
        error: "Transaction failed to execute",
      };
    }
    
    // Wait for transaction to be confirmed
    await client.waitForTransaction({
      digest: result.digest,
    });
    
    return {
      success: true,
      transactionDigest: result.digest,
    };
  } catch (error) {
    console.error("Payment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed",
    };
  }
}

/**
 * Verify payment on-chain
 */
export async function verifyPayment(
  client: SuiClient,
  transactionDigest: string
): Promise<boolean> {
  try {
    const tx = await client.getTransactionBlock({
      digest: transactionDigest,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });
    
    return tx.effects?.status?.status === "success";
  } catch (error) {
    console.error("Payment verification error:", error);
    return false;
  }
}

/**
 * Get user's token balance
 */
export async function getTokenBalance(
  client: SuiClient,
  userAddress: string,
  token: TokenType
): Promise<number> {
  try {
    const coinType = SUI_PAYMENT_CONFIG.COIN_TYPES[token];
    const balance = await client.getBalance({
      owner: userAddress,
      coinType,
    });
    
    const decimals = SUI_PAYMENT_CONFIG.TOKEN_DECIMALS[token];
    return parseInt(balance.totalBalance) / Math.pow(10, decimals);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}
