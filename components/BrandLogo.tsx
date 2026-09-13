'use client';

import { useState } from 'react';
import Link from 'next/link';

export function BrandLogo({ compact = false, href = '/' }: { compact?: boolean; href?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <Link className={`brand-logo ${compact ? 'brand-logo-compact' : ''}`} href={href} aria-label="Timepiece home">
      {!failed ? (
        <img src="/images/logo.png" alt="Timepiece" onError={() => setFailed(true)} />
      ) : (
        <span className="brand-logo-fallback"><i>T</i><b>TIMEPIECE</b></span>
      )}
    </Link>
  );
}
