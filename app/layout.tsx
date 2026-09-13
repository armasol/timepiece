import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Timepiece — Verified Watches Onchain',
  description: 'Buy, trade and list verified luxury watch ownership on Robinhood Chain.',
  openGraph: { title: 'Timepiece', description: 'Real watches. Real value. Onchain ownership.' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
