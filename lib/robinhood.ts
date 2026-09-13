import { defineChain } from 'viem';

export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.mainnet.chain.robinhood.com'] }
  },
  blockExplorers: {
    default: { name: 'Robinhood Blockscout', url: 'https://robinhoodchain.blockscout.com' }
  }
});

export const shortAddress = (address?: string | null) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—';
export const explorerToken = (address: string) => `https://robinhoodchain.blockscout.com/token/${address}`;
export const explorerTx = (hash: string) => `https://robinhoodchain.blockscout.com/tx/${hash}`;
