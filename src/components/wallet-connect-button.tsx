'use client';

import { useWalletConnection } from '@/lib/sui/useWalletConnection';
import { ConnectButton } from '@suiet/wallet-kit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function WalletConnectButton() {
  const { isConnected, address } = useWalletConnection();

  return (
    <div className="flex items-center gap-2">
      {isConnected && address ? (
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <ConnectButton>
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              Connected
            </Button>
          </ConnectButton>
        </div>
      ) : (
        <ConnectButton>
          <Button variant="default" size="sm">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </ConnectButton>
      )}
    </div>
  );
}
