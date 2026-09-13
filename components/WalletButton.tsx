'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, WalletCards, X } from 'lucide-react';
import { useWallet } from './WalletProvider';
import { shortAddress } from '@/lib/robinhood';

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  if (wallet.connected) {
    return <>
      <button className="pill wallet-connected" onClick={() => setOpen(true)}>
        <span className="wallet-dot" /> {shortAddress(wallet.address)} {!compact && <Check size={15}/>}
      </button>
      {open && <WalletSheet close={() => setOpen(false)} error={error} setError={setError}/>}
    </>;
  }

  return <>
    <button className="pill" onClick={() => setOpen(true)} disabled={wallet.connecting}>
      {wallet.connecting ? 'Connecting…' : 'Connect Wallet'} <ArrowUpRight size={16}/>
    </button>
    {open && <WalletSheet close={() => setOpen(false)} error={error} setError={setError}/>} 
  </>;
}

function WalletSheet({ close, error, setError }: { close: () => void; error: string; setError: (v: string) => void }) {
  const wallet = useWallet();
  async function connect(provider?: any) {
    setError('');
    try {
      await wallet.connect(provider);
      await wallet.ensureRobinhood();
      close();
    } catch (e: any) {
      setError(e?.message || 'Wallet connection failed.');
    }
  }

  return <div className="wallet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div className="wallet-sheet" onMouseDown={(e) => e.stopPropagation()}>
      <button className="wallet-close" onClick={close}><X size={18}/></button>
      <div className="wallet-icon"><WalletCards size={24}/></div>
      <div className="kicker">Wallet</div>
      <h3>Connect to Timepiece</h3>
      <p>Use an EVM wallet on Robinhood Chain. You approve every onchain action yourself.</p>
      {wallet.connected ? <>
        <div className="wallet-address-row"><span>Connected</span><b>{wallet.address}</b></div>
        <button className="pill green" onClick={async () => { try { await wallet.ensureRobinhood(); close(); } catch (e:any) { setError(e.message); } }}>Switch to Robinhood Chain</button>
        <button className="wallet-text-button" onClick={() => { wallet.disconnect(); close(); }}>Disconnect locally</button>
      </> : <div className="wallet-options">
        {wallet.providers.length ? wallet.providers.map((item) => <button key={item.info.uuid} className="wallet-option" onClick={() => connect(item.provider)}>
          {item.info.icon ? <img src={item.info.icon} alt=""/> : <span className="wallet-fallback">W</span>}
          <span><b>{item.info.name}</b><small>Browser wallet</small></span><ArrowUpRight size={16}/>
        </button>) : <button className="wallet-option" onClick={() => connect()}><span className="wallet-fallback">W</span><span><b>Browser wallet</b><small>MetaMask, Rabby, Coinbase Wallet</small></span><ArrowUpRight size={16}/></button>}
      </div>}
      {error && <div className="wallet-error">{error}</div>}
      <p className="wallet-help">On mobile, open Timepiece inside your wallet's built-in browser.</p>
    </div>
  </div>;
}
