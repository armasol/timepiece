'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Check,
  Fingerprint,
  ScanLine,
  ShieldCheck,
  Wallet,
  Watch,
} from 'lucide-react';
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
          scrub: 0.75,
          onUpdate: (self) => setProgress(self.progress),
        });

        gsap.to('.hero-copy', {
          y: -120,
          scale: 0.86,
          opacity: 0.12,
          scrollTrigger: { trigger: '.hero', start: '8% top', end: '43% top', scrub: true },
        });
        gsap.to('.hero-canvas-wrap', {
          y: -34,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true },
        });
        gsap.to('.hero-grid', {
          backgroundPosition: '0px 72px, 72px 0px',
          opacity: 0.62,
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true },
        });
        gsap.to('.floating-card', {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          scrollTrigger: { trigger: '.hero', start: '18% top', end: '52% top', scrub: true },
        });

        const market = gsap.timeline({
          scrollTrigger: { trigger: '.market-story', start: 'top top', end: 'bottom bottom', scrub: 0.8 }
        });
        market
          .to('.market-dial', { rotate: 18, scale: 1.06, duration: 1 }, 0)
          .to('.market-orbit-a', { rotate: 210, duration: 1 }, 0)
          .to('.market-orbit-b', { rotate: -150, duration: 1 }, 0)
          .to('.market-proof-card', { x: 0, y: 0, rotate: -3, opacity: 1, duration: .35 }, .12)
          .to('.market-record-card', { x: 0, y: 0, rotate: 3, opacity: 1, duration: .35 }, .38)
          .to('.market-contract-card', { x: 0, y: 0, rotate: -1.5, opacity: 1, duration: .35 }, .66)
          .to('.market-center-label .phase-one', { opacity: 0, y: -10, duration: .14 }, .26)
          .to('.market-center-label .phase-two', { opacity: 1, y: 0, duration: .16 }, .30)
          .to('.market-center-label .phase-two', { opacity: 0, y: -10, duration: .14 }, .61)
          .to('.market-center-label .phase-three', { opacity: 1, y: 0, duration: .16 }, .65);

        const proof = gsap.timeline({
          scrollTrigger: { trigger: '.proof-story', start: 'top top', end: 'bottom bottom', scrub: 0.8 }
        });
        proof
          .to('.proof-paper', { x: 0, y: 0, rotate: -4, opacity: 1, duration: .35 }, .06)
          .to('.proof-code', { scale: 1, opacity: 1, duration: .24 }, .22)
          .to('.proof-scan', { yPercent: 780, opacity: 1, duration: .5 }, .34)
          .to('.proof-focus-ring', { scale: .86, opacity: 1, duration: .35 }, .44)
          .to('.proof-status', { opacity: 1, y: 0, duration: .22 }, .70);

        const data = gsap.timeline({
          scrollTrigger: { trigger: '.data-story', start: 'top top', end: 'bottom bottom', scrub: 0.8 }
        });
        data
          .to('.data-second-hand', { rotate: 360, duration: 1, ease: 'none' }, 0)
          .to('.data-ring', { rotate: -110, duration: 1, ease: 'none' }, 0)
          .to('.data-card', { opacity: 1, y: 0, stagger: .08, duration: .18 }, .18)
          .to('.data-chart-line', { strokeDashoffset: 0, duration: .7, ease: 'none' }, .22);

        const box = gsap.timeline({
          scrollTrigger: { trigger: '.box-story', start: 'top top', end: 'bottom bottom', scrub: 0.9 }
        });
        box
          .to('.premium-box-lid', { rotateX: -76, y: -54, duration: .5 }, .06)
          .to('.box-watch', { y: -30, scale: 1.04, opacity: 1, duration: .34 }, .25)
          .to('.box-record', { x: 0, opacity: 1, stagger: .08, duration: .26 }, .48)
          .to('.premium-box', { rotateY: 5, rotateX: 2, duration: .28 }, .72);

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(el, { y: 34, opacity: 0 }, {
            y: 0, opacity: 1, duration: .75, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%' }
          });
        });
      });
      cleanup = () => ctx.revert();
    })();

    return () => { disposed = true; cleanup?.(); };
  },[]);

  return <>
    <section className="hero">
      <div className="hero-sticky">
        <div className="hero-bg"/><div className="hero-grid"/><div className="hero-grain"/>
        <div className="hero-copy">
          <div className="eyebrow">Watch-linked token markets</div>
          <h1 className="serif">Luxury watches.<br/><span>Onchain markets.</span></h1>
          <p className="hero-sub">Timepiece connects a watch record to a token market. Owners submit the watch, complete the possession workflow, and choose the share to tokenize. Buyers connect a wallet and trade the linked token on Robinhood Chain.</p>
          <div className="hero-actions"><Link className="pill green" href="/watches">Explore watches <ArrowUpRight size={16}/></Link><Link className="pill" href="/list">List a watch <ArrowUpRight size={16}/></Link></div>
        </div>
        <div className="hero-canvas-wrap"><WatchScene progress={progress}/></div>
        <div className="hero-overlay-data">
          <div className="floating-card fc1"><span className="floating-icon"><Fingerprint size={16}/></span><b>Owner proof</b><span>one-time code photo</span></div>
          <div className="floating-card fc2"><span className="floating-icon"><Watch size={16}/></span><b>Watch record</b><span>model · reference · year</span></div>
          <div className="floating-card fc3"><span className="floating-icon"><Activity size={16}/></span><b>Token market</b><span>contract-linked data</span></div>
          <div className="floating-card fc4"><span className="floating-icon"><Wallet size={16}/></span><b>Wallet-native</b><span>you approve each action</span></div>
        </div>
        <div className="scroll-note"><span>Scroll to inspect</span><i/></div>
      </div>
    </section>

    <div className="brand-strip"><div className="brand-strip-track">{[...topBrands,...topBrands].map((b,i)=><span key={i}>{b}</span>)}</div></div>

    <section id="how" className="market-story scroll-story">
      <div className="story-sticky">
        <div className="story-copy market-copy">
          <div className="kicker">How Timepiece works</div>
          <h2 className="display-title serif">One watch.<br/>One record.<br/>One market.</h2>
          <p className="lead">The watch stays at the center of the listing. Verification, watch details and contract data are attached to the same record from submission through trading.</p>
          <div className="story-steps">
            <div><b>01</b><span>Describe the watch</span></div>
            <div><b>02</b><span>Prove possession</span></div>
            <div><b>03</b><span>Connect the token</span></div>
          </div>
        </div>
        <div className="market-machine" aria-hidden="true">
          <div className="market-orbit market-orbit-a"><i/><i/><i/></div>
          <div className="market-orbit market-orbit-b"><i/><i/><i/><i/></div>
          <div className="market-dial">
            <div className="dial-minute-track"/>
            <div className="dial-hand dial-hour"/><div className="dial-hand dial-minute"/><div className="dial-hand dial-seconds"/><div className="dial-pin"/>
            <div className="market-center-label"><span className="phase-one">WATCH</span><span className="phase-two">VERIFY</span><span className="phase-three">MARKET</span></div>
          </div>
          <div className="market-float-card market-proof-card"><small>POSSESSION</small><b>Code photo</b><span><Check size={14}/> submitted</span></div>
          <div className="market-float-card market-record-card"><small>WATCH RECORD</small><b>Reference · year</b><span>condition · images</span></div>
          <div className="market-float-card market-contract-card"><small>ONCHAIN</small><b>Token contract</b><span>market data attached</span></div>
        </div>
      </div>
    </section>

    <section className="proof-story scroll-story">
      <div className="story-sticky proof-layout">
        <div className="proof-stage" aria-hidden="true">
          <div className="proof-table-grid"/>
          <div className="proof-watch">
            <div className="proof-strap top"/><div className="proof-strap bottom"/>
            <div className="proof-watch-case"><div className="proof-watch-dial"><i/><b/></div></div>
          </div>
          <div className="proof-paper"><span>TIMEPIECE</span><strong>TP-7419-K</strong><small>Write the code by hand</small></div>
          <div className="proof-code">TP-7419-K</div>
          <div className="proof-scan"/>
          <div className="proof-focus-ring"/>
          <div className="proof-status"><ShieldCheck size={18}/> Owner proof submitted</div>
        </div>
        <div className="story-copy" data-reveal>
          <div className="kicker">Possession verification</div>
          <h2 className="display-title serif">The watch has to be in the photo.</h2>
          <p className="lead">Timepiece generates a one-time code. The owner writes it on paper, places it beside the watch, and uploads a new photo containing both. The listing then moves to review.</p>
          <div className="fine-list"><span><Check/>Unique code</span><span><Check/>New owner photo</span><span><Check/>Admin review</span></div>
        </div>
      </div>
    </section>

    <section className="data-story scroll-story">
      <div className="story-sticky data-layout">
        <div className="story-copy" data-reveal>
          <div className="kicker">The token page</div>
          <h2 className="display-title serif">The market never loses the watch.</h2>
          <p className="lead">Each token page keeps the physical watch record beside contract-derived market data: model, reference, year, condition, verification state, holders, price activity and chart history.</p>
          <Link className="pill" href="/watches">See watch markets <ArrowUpRight size={16}/></Link>
        </div>
        <div className="data-watch-stage" aria-hidden="true">
          <div className="data-dial"><div className="data-ring"/><div className="data-second-hand"/><div className="data-center"/></div>
          <svg className="data-chart" viewBox="0 0 620 240" fill="none"><path className="data-chart-grid" d="M0 40H620M0 100H620M0 160H620M100 0V240M220 0V240M340 0V240M460 0V240M580 0V240"/><path className="data-chart-line" d="M8 190 C70 185 98 145 145 152 C195 160 218 105 270 118 C327 132 348 72 402 92 C458 112 496 48 610 58"/></svg>
          <div className="data-card dc1"><small>WATCH</small><b>Model & reference</b></div>
          <div className="data-card dc2"><small>MARKET</small><b>Price & chart</b></div>
          <div className="data-card dc3"><small>CONTRACT</small><b>Holders & phase</b></div>
        </div>
      </div>
    </section>

    <section className="box-story scroll-story">
      <div className="story-sticky box-layout">
        <div className="premium-box-stage" aria-hidden="true">
          <div className="premium-box">
            <div className="premium-box-lid"><div className="box-logo-mark">T</div></div>
            <div className="premium-box-base"><div className="box-watch"><div className="box-watch-face"><i/><b/></div></div></div>
          </div>
          <div className="box-record br1"><small>REFERENCE</small><b>126710BLRO</b></div>
          <div className="box-record br2"><small>CONDITION</small><b>Excellent</b></div>
          <div className="box-record br3"><small>STATUS</small><b>Owner verified</b></div>
        </div>
        <div className="story-copy" data-reveal>
          <div className="kicker">Built around the object</div>
          <h2 className="display-title serif">A watch listing should still feel like a watch listing.</h2>
          <p className="lead">Images, condition, reference, year, documentation and verification remain prominent. The token layer adds trading without replacing the context of the physical piece.</p>
          <Link className="pill green" href="/list">Start a listing <ArrowUpRight size={16}/></Link>
        </div>
      </div>
    </section>

    <section className="closing-section section-grid-bg">
      <div className="container closing-inner" data-reveal>
        <div className="kicker">Timepiece</div>
        <h2 className="display-title serif">Start with the watch.<br/>Then open the market.</h2>
        <p className="lead">Browse watch-linked token markets or connect a wallet to submit a watch for review.</p>
        <div className="hero-actions"><Link className="pill green" href="/watches">Explore watches <ArrowUpRight size={16}/></Link><Link className="pill" href="/list">List a watch <ArrowUpRight size={16}/></Link></div>
      </div>
    </section>
  </>;
}
