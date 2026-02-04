// Sui blockchain client configuration
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { createNetworkConfig } from '@mysten/dapp-kit';

// Network configuration
const { networkConfig, useNetworkVariable } = createNetworkConfig({
  testnet: {
    url: getFullnodeUrl('testnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || '',
    },
  },
  devnet: {
    url: getFullnodeUrl('devnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || '',
    },
  },
  mainnet: {
    url: getFullnodeUrl('mainnet'),
    variables: {
      packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || '',
    },
  },
});

// Create Sui client instance
export const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as 'testnet' | 'devnet' | 'mainnet' || 'testnet'),
});

export { networkConfig, useNetworkVariable };

// Helper functions for Sui interactions
export const getSuiBalance = async (address: string): Promise<bigint> => {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
    });
    return BigInt(balance.totalBalance);
  } catch (error) {
    console.error('Error fetching SUI balance:', error);
    return BigInt(0);
  }
};

export const getTransactionDetails = async (digest: string) => {
  try {
    const txn = await suiClient.getTransactionBlock({
      digest,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    return txn;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    return null;
  }
};

// Format SUI amount from MIST (1 SUI = 10^9 MIST)
export const formatSuiAmount = (mist: bigint | number): string => {
  const amount = Number(mist) / 1_000_000_000;
  return amount.toFixed(4);
};

// Convert SUI to MIST
export const suiToMist = (sui: number): bigint => {
  return BigInt(Math.floor(sui * 1_000_000_000));
};
