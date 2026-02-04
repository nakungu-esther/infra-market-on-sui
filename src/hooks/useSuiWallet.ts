// Custom hook for Sui wallet integration
'use client';

import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';
import { formatSuiAmount } from '@/lib/sui-client';

export const useSuiWallet = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [isProcessing, setIsProcessing] = useState(false);

  const getBalance = async () => {
    if (!currentAccount?.address) return null;
    
    try {
      const balance = await suiClient.getBalance({
        owner: currentAccount.address,
      });
      return {
        total: balance.totalBalance,
        formatted: formatSuiAmount(BigInt(balance.totalBalance)),
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  };

  const executeTransaction = async (
    transaction: Transaction,
    onSuccess?: (digest: string) => void,
    onError?: (error: Error) => void
  ) => {
    if (!currentAccount) {
      onError?.(new Error('No wallet connected'));
      return;
    }

    setIsProcessing(true);

    try {
      signAndExecuteTransaction(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction executed:', result.digest);
            onSuccess?.(result.digest);
            setIsProcessing(false);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            onError?.(error as Error);
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error('Transaction error:', error);
      onError?.(error as Error);
      setIsProcessing(false);
    }
  };

  return {
    account: currentAccount,
    address: currentAccount?.address,
    isConnected: !!currentAccount,
    isProcessing,
    getBalance,
    executeTransaction,
  };
};
