'use client';
import Link from 'next/link';
import { WalletButton } from './WalletButton';
import { BrandLogo } from './BrandLogo';

export function Nav() {
  return <nav className="nav" aria-label="Primary navigation"><div className="nav-inner">
    <BrandLogo compact />
    <div className="nav-center">
      <span className="nav-status"><i /> Live marketplace</span>
      <div className="nav-links"><Link href="/watches">Watches</Link><Link href="/#how">How it works</Link><Link href="/list">List a watch</Link><Link href="/about">Docs</Link></div>
    </div>
    <div className="nav-wallet"><span className="nav-network">Robinhood Chain</span><WalletButton compact/></div>
  </div></nav>;
}
