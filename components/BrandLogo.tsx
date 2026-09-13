import Link from 'next/link';

export function BrandLogo({ compact = false, href = '/' }: { compact?: boolean; href?: string }) {
  return (
    <Link className={`brand-logo ${compact ? 'brand-logo-compact' : ''}`} href={href} aria-label="Timepiece home">
      <span className="brand-logo-fallback"><i>T</i><b>TIMEPIECE</b></span>
    </Link>
  );
}
