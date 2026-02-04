'use client';

import { useWallet } from '@suiet/wallet-kit';
import { useCallback, useEffect, useState } from 'react';

export function useWalletConnection() {
  const { account, connect, disconnect, connected, status } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }, [connect]);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  }, [disconnect]);

  return {
    address: isClient && account?.address,
    isConnected: isClient && connected,
    connectWallet,
    disconnectWallet,
    account: isClient ? account : null,
    status: isClient ? status : 'disconnected',
  };
}
