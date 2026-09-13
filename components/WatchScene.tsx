'use client';

import dynamic from 'next/dynamic';

const ClientWatchCanvas = dynamic(
  () => import('./WatchModel').then((module) => module.WatchCanvas),
  {
    ssr: false,
    loading: () => <div className="watch-webgl-loading" aria-hidden="true" />,
  },
);

export function WatchScene({ progress = 0 }: { progress?: number }) {
  return <ClientWatchCanvas progress={progress} />;
}
