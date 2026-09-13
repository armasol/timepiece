import Link from 'next/link';
import { BrandLogo } from './BrandLogo';
export function Footer(){return <footer className="footer"><div className="container footer-grid"><div><BrandLogo compact/><p>Watch records, verification and onchain token markets in one interface.</p></div><div className="footer-links"><Link href="/watches">Watches</Link><Link href="/list">List a watch</Link><Link href="/about">Docs</Link></div></div></footer>}
