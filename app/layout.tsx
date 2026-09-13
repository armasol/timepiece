import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Timepiece — Watch-linked token markets',
  description: 'Verify a watch, create its record, and connect it to an onchain token market on Robinhood Chain.',
  icons: {
    icon: '/images/favicon.png',
    shortcut: '/images/favicon.png',
    apple: '/images/favicon.png'
  },
  openGraph: {
    title: 'Timepiece',
    description: 'Watch records, verification and onchain token markets.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="bg-background"><body><Providers>{children}</Providers></body></html>;
}
