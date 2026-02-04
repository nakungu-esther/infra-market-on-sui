'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

export const WalletButton = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
        <Wallet className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Wallet</span>
      </div>
    );
  }

  return (
    <ConnectButton
      connectText={
        <>
          <Wallet className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Wallet</span>
        </>
      }
    />
  );
};