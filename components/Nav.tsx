'use client';
import Link from 'next/link';
import { WalletButton } from './WalletButton';
import { BrandLogo } from './BrandLogo';

export function Nav() {
  return <nav className="nav"><div className="nav-inner">
    <BrandLogo />
    <div className="nav-links"><Link href="/watches">Watches</Link><Link href="/#how">How it works</Link><Link href="/list">List a watch</Link><Link href="/about">Docs</Link></div>
    <WalletButton compact/>
  </div></nav>;
}
