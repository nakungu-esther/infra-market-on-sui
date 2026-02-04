import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getSuiNetwork, getPaymentPackageId, getTreasuryAddress } from './config';

interface PaymentWithEntitlementParams {
  senderAddress: string;
  amount: bigint;
  paymentCoinType: string;
  serviceId: number;
  tierId: number;
  tierName: string;
}

/**
 * Builds a transaction that:
 * 1. Receives payment (SUI/USDC/WAL)
 * 2. Records entitlement onchain
 */
export async function buildPaymentWithEntitlementTx(
  params: PaymentWithEntitlementParams
): Promise<Transaction> {
  const network = getSuiNetwork();
  const client = new SuiClient({ url: getFullnodeUrl(network) });
  const packageId = getPaymentPackageId();
  const treasuryAddress = getTreasuryAddress();

  const {
    senderAddress,
    amount,
    paymentCoinType,
    serviceId,
    tierId,
    tierName,
  } = params;

  // Fetch coins
  const coinData = await client.getCoins({
    owner: senderAddress,
    coinType: paymentCoinType,
  });

  if (coinData.data.length === 0) {
    throw new Error(`No ${paymentCoinType} coins found`);
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);

  // Handle coin merging/splitting
  let paymentCoinArg;
  if (coinData.data.length === 1) {
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    paymentCoinArg = coin;
  } else {
    const primaryCoin = coinData.data[0].coinObjectId;
    const otherCoins = coinData.data.slice(1).map((c) => c.coinObjectId);
    tx.mergeCoins(primaryCoin, otherCoins);
    const [coin] = tx.splitCoins(primaryCoin, [amount]);
    paymentCoinArg = coin;
  }

  // If package ID is configured, call smart contract
  if (packageId) {
    // Call smart contract: process_payment_and_issue_entitlement
    const entitlementResult = tx.moveCall({
      target: `${packageId}::payment::process_payment_and_issue_entitlement`,
      arguments: [
        tx.pure.address(senderAddress),
        paymentCoinArg,
        tx.pure.u64(serviceId),
        tx.pure.u64(tierId),
        tx.pure.string(tierName),
      ],
      typeArguments: [paymentCoinType],
    });

    // Transfer entitlement NFT to sender
    tx.transferObjects([entitlementResult], senderAddress);
  } else {
    // Fallback: simple payment transfer to treasury
    tx.transferObjects([paymentCoinArg], treasuryAddress || senderAddress);
  }

  return tx;
}

/**
 * Build a simple payment transaction (without smart contract)
 */
export async function buildSimplePaymentTx(
  senderAddress: string,
  amount: bigint,
  coinType: string
): Promise<Transaction> {
  const network = getSuiNetwork();
  const client = new SuiClient({ url: getFullnodeUrl(network) });
  const treasuryAddress = getTreasuryAddress();

  const coinData = await client.getCoins({
    owner: senderAddress,
    coinType,
  });

  if (coinData.data.length === 0) {
    throw new Error(`No ${coinType} coins found`);
  }

  const tx = new Transaction();
  tx.setSender(senderAddress);

  let paymentCoin;
  if (coinData.data.length === 1) {
    const [coin] = tx.splitCoins(tx.gas, [amount]);
    paymentCoin = coin;
  } else {
    const primary = coinData.data[0].coinObjectId;
    const others = coinData.data.slice(1).map((c) => c.coinObjectId);
    tx.mergeCoins(primary, others);
    const [coin] = tx.splitCoins(primary, [amount]);
    paymentCoin = coin;
  }

  tx.transferObjects([paymentCoin], treasuryAddress);
  return tx;
}
