'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowUpRight } from 'lucide-react';

export function Nav() {
  return <nav className="nav"><div className="nav-inner">
    <Link className="brand" href="/"><span className="brand-mark">↗</span><span>TIMEPIECE</span></Link>
    <div className="nav-links"><Link href="/watches">Watches</Link><Link href="/#how">How it works</Link><Link href="/list">List your watch</Link><Link href="/about">About</Link></div>
    <ConnectButton.Custom>{({ account, openConnectModal, mounted }) => (
      <button className="pill" onClick={openConnectModal}>{mounted && account ? `${account.address.slice(0,6)}…${account.address.slice(-4)}` : 'Connect Wallet'} <ArrowUpRight size={16}/></button>
    )}</ConnectButton.Custom>
  </div></nav>;
}
