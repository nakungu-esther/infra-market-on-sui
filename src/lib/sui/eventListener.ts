import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getSuiNetwork } from './config';

/**
 * Poll for transaction status
 */
export async function pollTransactionStatus(
  txDigest: string,
  maxAttempts: number = 30,
  intervalMs: number = 1000
) {
  const network = getSuiNetwork();
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await client.getTransactionBlock({
        digest: txDigest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (response.effects?.status?.status === 'success') {
        return {
          status: 'success' as const,
          digest: txDigest,
          effects: response.effects,
          events: response.events,
        };
      } else if (response.effects?.status?.status === 'failure') {
        return {
          status: 'failure' as const,
          digest: txDigest,
          error: response.effects?.status?.error,
        };
      }
    } catch (error) {
      console.log(`Polling attempt ${i + 1}/${maxAttempts}...`);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    status: 'pending' as const,
    digest: txDigest,
  };
}
