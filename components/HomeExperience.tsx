'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { WatchScene } from './WatchScene';
import { topBrands } from '@/lib/demo';


export function HomeExperience(){
  const [progress,setProgress]=useState(0);
  useEffect(()=>{
    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: '.hero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          onUpdate: (self) => setProgress(self.progress),
        });
        gsap.to('.hero-copy', {
          y: -150,
          scale: 0.72,
          opacity: 0.2,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: '45% top', scrub: true },
        });
        gsap.to('.floating-card', {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          scrollTrigger: { trigger: '.hero', start: '18% top', end: '55% top', scrub: true },
        });
        gsap.to('.hero-canvas-wrap', {
          y: -40,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true },
        });
      });
      cleanup = () => ctx.revert();
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  },[]);
  return <>
    <section className="hero">
      <div className="hero-sticky">
        <div className="hero-bg"/><div className="hero-grain"/>
        <div className="hero-copy">
          <div className="eyebrow">Verified watches. Onchain.</div>
          <h1 className="serif">Own a piece of <span>time.</span></h1>
          <p className="hero-sub">Buy and trade fractional ownership in verified luxury watches. List your own watch, verify possession, and let the market own part of the piece.</p>
          <div className="hero-actions"><Link className="pill green" href="/watches">Explore Watches <ArrowUpRight size={16}/></Link><Link className="pill" href="/list">List Your Watch <ArrowUpRight size={16}/></Link></div>
        </div>
        <div className="hero-canvas-wrap"><WatchScene progress={progress}/></div>
        <div className="hero-overlay-data">
          <div className="floating-card fc1"><b>$18.4M</b><span>verified value</span></div>
          <div className="floating-card fc2"><b>10 brands</b><span>curated filters</span></div>
          <div className="floating-card fc3"><b>60 min</b><span>reward rotation</span></div>
          <div className="floating-card fc4"><b>Owner proof</b><span>code photo verified</span></div>
        </div>
        <div className="scroll-note"><span>Scroll to inspect</span><i/></div>
      </div>
    </section>
    <div className="brand-strip"><div className="brand-strip-track">{[...topBrands,...topBrands].map((b,i)=><span key={i}>{b}</span>)}</div></div>
    <section id="how" className="section"><div className="container split">
      <div><div className="kicker">How it works</div><h2 className="h2 serif">A real watch becomes a live market.</h2><p className="lead">Owners prove possession with a one-time code photo. Timepiece reviews the listing, publishes the watch, and connects the verified asset to a Pons token on Robinhood Chain.</p></div>
      <div className="cards-grid"><div className="card"><h3>1. Verify</h3><p>Write the unique code beside your watch, upload photos, and submit the details.</p></div><div className="card"><h3>2. Tokenize</h3><p>Choose the percentage you want to list and launch the market from your wallet.</p></div><div className="card"><h3>3. Trade</h3><p>Buyers connect a wallet, buy the token, and follow the watch's market in real time.</p></div></div>
    </div></section>
    <section className="section"><div className="container split"><div className="panel tick-panel"><div className="ticker-face"><div className="hand"/><div className="hand short"/><div className="center-dot"/></div></div><div><div className="kicker">Rewards</div><h2 className="h2 serif">Every hour, holders see the share.</h2><p className="lead">Trading rewards can be calculated on a 60-minute rotation. When a watch is sold, proceeds can be allocated by token ownership snapshots.</p><Link className="pill green" href="/watches">Browse live watches <ArrowUpRight size={16}/></Link></div></div></section>
    <section className="section"><div className="container split"><div><div className="kicker">For owners</div><h2 className="h2 serif">Keep the watch. List the market.</h2><p className="lead">Turn part of a used luxury watch into a tradable market without selling the entire asset upfront.</p><Link className="pill" href="/list">Start verification <ArrowUpRight size={16}/></Link></div><div className="panel box-scene"><div className="watch-glow"/><div className="box-lid"/><div className="box-base"/></div></div></section>
  </>;
}
