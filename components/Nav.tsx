'use client';
import Link from 'next/link';
import { WalletButton } from './WalletButton';

export function Nav() {
  return <nav className="nav"><div className="nav-inner">
    <Link className="brand" href="/"><span className="brand-mark">↗</span><span>TIMEPIECE</span></Link>
    <div className="nav-links"><Link href="/watches">Watches</Link><Link href="/#how">How it works</Link><Link href="/list">List your watch</Link><Link href="/about">About</Link></div>
    <WalletButton compact/>
  </div></nav>;
}
