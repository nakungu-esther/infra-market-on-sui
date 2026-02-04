export const SUI_CONFIG = {
  testnet: {
    rpc: 'https://fullnode.testnet.sui.io:443',
    faucet: 'https://faucet.testnet.sui.io/v2/gas',
  },
  devnet: {
    rpc: 'https://fullnode.devnet.sui.io:443',
    faucet: 'https://faucet.devnet.sui.io/v2/gas',
  },
  mainnet: {
    rpc: 'https://fullnode.mainnet.sui.io:443',
  },
} as const;

export const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
  USDC_TESTNET: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC',
  USDC_MAINNET: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  // WAL token - placeholder, replace with actual contract address
  WAL_TESTNET: '0x...::wal::WAL',
  WAL_MAINNET: '0x...::wal::WAL',
} as const;

export const MIST_PER_SUI = 1_000_000_000n;

export type SuiNetwork = 'testnet' | 'devnet' | 'mainnet';

export function getSuiNetwork(): SuiNetwork {
  return (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || 'testnet';
}

export function getSuiRpcUrl(network?: SuiNetwork): string {
  const net = network || getSuiNetwork();
  return SUI_CONFIG[net].rpc;
}

export function getTreasuryAddress(): string {
  return process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '';
}

export function getPaymentPackageId(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_PACKAGE_ID || '';
}
