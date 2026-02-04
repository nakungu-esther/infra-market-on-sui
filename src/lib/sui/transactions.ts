import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { MIST_PER_SUI, getSuiNetwork } from './config';

interface PaymentParams {
  recipient: string;
  amount: bigint; // in MIST (1 SUI = 1_000_000_000 MIST)
  coinType?: string; // default: '0x2::sui::SUI'
  senderAddress: string;
}

export async function buildSUIPaymentTx(
  params: PaymentParams
): Promise<Transaction> {
  const network = getSuiNetwork();
  const client = new SuiClient({ url: getFullnodeUrl(network) });
  const {
    recipient,
    amount,
    coinType = '0x2::sui::SUI',
    senderAddress,
  } = params;

  // Fetch all coins of the specified type
  const coinData = await client.getCoins({
    owner: senderAddress,
    coinType,
  });

  if (coinData.data.length === 0) {
    throw new Error(`No ${coinType} coins found for sender`);
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);

  // Single coin: split it
  if (coinData.data.length === 1) {
    const [paymentCoin] = tx.splitCoins(tx.gas, [amount]);
    tx.transferObjects([paymentCoin], recipient);
    return tx;
  }

  // Multiple coins: merge then split
  const primaryCoin = coinData.data[0].coinObjectId;
  const otherCoins = coinData.data.slice(1).map((coin) => coin.coinObjectId);

  tx.mergeCoins(primaryCoin, otherCoins);
  const [paymentCoin] = tx.splitCoins(primaryCoin, [amount]);
  tx.transferObjects([paymentCoin], recipient);

  return tx;
}

// Token Payment (USDC, WAL, etc.)
interface TokenPaymentParams extends PaymentParams {
  coinType: string;
}

export async function buildTokenPaymentTx(
  params: TokenPaymentParams
): Promise<Transaction> {
  return buildSUIPaymentTx(params);
}

// Convert SUI to MIST
export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * Number(MIST_PER_SUI)));
}

// Convert MIST to SUI
export function mistToSui(mist: bigint): number {
  return Number(mist) / Number(MIST_PER_SUI);
}
