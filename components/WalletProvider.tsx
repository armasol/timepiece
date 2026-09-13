'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createWalletClient, custom, getAddress, type Address, type Hash } from 'viem';
import { robinhoodChain } from '@/lib/robinhood';

type RequestArguments = { method: string; params?: unknown[] | object };
type Eip1193Provider = {
  request(args: RequestArguments): Promise<unknown>;
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

type AnnouncedProvider = {
  info: { uuid: string; name: string; icon?: string; rdns?: string };
  provider: Eip1193Provider;
};

type WriteContractRequest = any;

type WalletContextValue = {
  address: Address | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  providers: AnnouncedProvider[];
  connect: (provider?: Eip1193Provider) => Promise<Address>;
  disconnect: () => void;
  ensureRobinhood: () => Promise<void>;
  signMessage: (message: string) => Promise<`0x${string}`>;
  writeContract: (request: WriteContractRequest) => Promise<Hash>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

const STORAGE_KEY = 'timepiece.wallet.connected';

function toChainHex(id: number) {
  return `0x${id.toString(16)}`;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [providers, setProviders] = useState<AnnouncedProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<Eip1193Provider | null>(null);

  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<AnnouncedProvider>).detail;
      if (!detail?.provider || !detail?.info?.uuid) return;
      setProviders((current) => current.some((x) => x.info.uuid === detail.info.uuid) ? current : [...current, detail]);
    };
    window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    if (window.ethereum) {
      setProviders((current) => current.length ? current : [{ info: { uuid: 'injected', name: 'Browser Wallet' }, provider: window.ethereum! }]);
    }

    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener);
  }, []);

  const attachProviderListeners = useCallback((provider: Eip1193Provider) => {
    const onAccounts = (accounts: string[]) => {
      if (!accounts?.length) {
        setAddress(null);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setAddress(getAddress(accounts[0]));
      }
    };
    const onChain = (value: string | number) => {
      const parsed = typeof value === 'string' ? Number.parseInt(value, 16) : Number(value);
      setChainId(Number.isFinite(parsed) ? parsed : null);
    };
    provider.on?.('accountsChanged', onAccounts);
    provider.on?.('chainChanged', onChain);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
    };
  }, []);

  const connect = useCallback(async (providerArg?: Eip1193Provider) => {
    const provider = providerArg || activeProvider || providers[0]?.provider || window.ethereum;
    if (!provider) throw new Error('No compatible wallet found. Open Timepiece inside MetaMask, Rabby, Coinbase Wallet, or another EVM wallet browser.');
    setConnecting(true);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      if (!accounts?.[0]) throw new Error('Wallet did not return an account.');
      const currentChain = await provider.request({ method: 'eth_chainId' }) as string;
      const nextAddress = getAddress(accounts[0]);
      setAddress(nextAddress);
      setChainId(Number.parseInt(currentChain, 16));
      setActiveProvider(provider);
      localStorage.setItem(STORAGE_KEY, '1');
      attachProviderListeners(provider);
      return nextAddress;
    } finally {
      setConnecting(false);
    }
  }, [activeProvider, providers, attachProviderListeners]);

  useEffect(() => {
    if (!providers.length || localStorage.getItem(STORAGE_KEY) !== '1' || address) return;
    const provider = providers[0].provider;
    Promise.all([
      provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
      provider.request({ method: 'eth_chainId' }) as Promise<string>
    ]).then(([accounts, chain]) => {
      if (!accounts?.[0]) return;
      setAddress(getAddress(accounts[0]));
      setChainId(Number.parseInt(chain, 16));
      setActiveProvider(provider);
      attachProviderListeners(provider);
    }).catch(() => {});
  }, [providers, address, attachProviderListeners]);

  const ensureRobinhood = useCallback(async () => {
    const provider = activeProvider || providers[0]?.provider || window.ethereum;
    if (!provider) throw new Error('Connect a wallet first.');
    const chainHex = toChainHex(robinhoodChain.id);
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainHex }] });
    } catch (error: any) {
      if (error?.code !== 4902 && error?.code !== -32603) throw error;
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainHex,
          chainName: robinhoodChain.name,
          nativeCurrency: robinhoodChain.nativeCurrency,
          rpcUrls: robinhoodChain.rpcUrls.default.http,
          blockExplorerUrls: [robinhoodChain.blockExplorers?.default.url]
        }]
      });
    }
    setChainId(robinhoodChain.id);
  }, [activeProvider, providers]);

  const getClient = useCallback(() => {
    const provider = activeProvider || providers[0]?.provider || window.ethereum;
    if (!provider || !address) throw new Error('Connect a wallet first.');
    return createWalletClient({ account: address, chain: robinhoodChain, transport: custom(provider as any) });
  }, [activeProvider, providers, address]);

  const signMessage = useCallback(async (message: string) => {
    if (!address) throw new Error('Connect a wallet first.');
    await ensureRobinhood();
    return getClient().signMessage({ account: address, message });
  }, [address, ensureRobinhood, getClient]);

  const writeContract = useCallback(async (request: WriteContractRequest) => {
    if (!address) throw new Error('Connect a wallet first.');
    await ensureRobinhood();
    return getClient().writeContract(request as any);
  }, [address, ensureRobinhood, getClient]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAddress(null);
    setChainId(null);
    setActiveProvider(null);
  }, []);

  const value = useMemo<WalletContextValue>(() => ({
    address,
    chainId,
    connected: Boolean(address),
    connecting,
    providers,
    connect,
    disconnect,
    ensureRobinhood,
    signMessage,
    writeContract
  }), [address, chainId, connecting, providers, connect, disconnect, ensureRobinhood, signMessage, writeContract]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error('useWallet must be used inside WalletProvider');
  return value;
}
