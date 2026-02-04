'use server';

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getSuiNetwork, getPaymentPackageId } from '@/lib/sui/config';

interface ValidateTransactionParams {
  txDigest: string;
  expectedAmount: bigint;
  expectedRecipient: string;
}

export async function validateSuiTransaction(
  params: ValidateTransactionParams
): Promise<{
  valid: boolean;
  error?: string;
  transactionBlock?: any;
}> {
  const network = getSuiNetwork();
  const client = new SuiClient({
    url: getFullnodeUrl(network),
  });

  try {
    const txBlock = await client.getTransactionBlock({
      digest: params.txDigest,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showInput: true,
      },
    });

    // Verify transaction success
    if (txBlock.effects?.status?.status !== 'success') {
      return {
        valid: false,
        error: `Transaction failed: ${txBlock.effects?.status?.error}`,
      };
    }

    // Additional validation logic here
    // - Verify recipient in transaction
    // - Verify amount transferred
    // - Check for entitlement NFT creation

    return {
      valid: true,
      transactionBlock: txBlock,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

export async function verifyEntitlementNFT(
  userAddress: string
): Promise<{ hasEntitlement: boolean; nftId?: string; objectIds?: string[] }> {
  const network = getSuiNetwork();
  const packageId = getPaymentPackageId();
  
  if (!packageId) {
    return { hasEntitlement: false };
  }

  const client = new SuiClient({
    url: getFullnodeUrl(network),
  });

  try {
    const objects = await client.getOwnedObjects({
      owner: userAddress,
      filter: {
        MoveModule: {
          package: packageId,
          module: 'entitlement',
        },
      },
    });

    const hasEntitlement = objects.data.length > 0;
    return {
      hasEntitlement,
      nftId: hasEntitlement ? objects.data[0].data?.objectId : undefined,
      objectIds: objects.data.map(obj => obj.data?.objectId).filter(Boolean) as string[],
    };
  } catch (error) {
    console.error('Entitlement verification failed:', error);
    return { hasEntitlement: false };
  }
}

export async function getSuiBalance(
  address: string,
  coinType: string = '0x2::sui::SUI'
): Promise<{ balance: string; error?: string }> {
  const network = getSuiNetwork();
  const client = new SuiClient({
    url: getFullnodeUrl(network),
  });

  try {
    const balance = await client.getBalance({
      owner: address,
      coinType,
    });

    return {
      balance: balance.totalBalance,
    };
  } catch (error) {
    return {
      balance: '0',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
