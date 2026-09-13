'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { WatchListing } from '@/lib/types';
import { topBrands } from '@/lib/demo';

export default function WatchesPage(){
 const [watches,setWatches]=useState<WatchListing[]>([]); const [brand,setBrand]=useState('All'); const [query,setQuery]=useState(''); const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/watches').then(r=>r.json()).then(d=>setWatches(d.watches||[])).finally(()=>setLoading(false));},[]);
 const filtered=useMemo(()=>watches.filter(w=>(brand==='All'||w.brand===brand)&&`${w.brand} ${w.model} ${w.reference_number||''}`.toLowerCase().includes(query.toLowerCase())),[watches,brand,query]);
 return <main className="page"><Nav/><section className="section" style={{paddingTop:150}}><div className="container"><div className="kicker">Marketplace</div><h1 className="h2 serif">Own the watch. <em>Not all of it.</em></h1><p className="lead">Buy and trade positions linked to verified luxury watches. Filter by the brands you already know.</p>
 <input className="input" style={{marginTop:30,maxWidth:520}} placeholder="Search brand, model or reference" value={query} onChange={e=>setQuery(e.target.value)}/>
 <div className="market-toolbar"><button className={`filter ${brand==='All'?'active':''}`} onClick={()=>setBrand('All')}>All</button>{topBrands.map(b=><button key={b} className={`filter ${brand===b?'active':''}`} onClick={()=>setBrand(b)}>{b}</button>)}</div>
 {loading?<p className="microcopy">Loading verified watches…</p>:<div className="watch-grid">{filtered.map(w=><Link href={`/watches/${w.slug}`} className="watch-card" key={w.id}><div className="watch-art" style={w.primary_image_url?{backgroundImage:`linear-gradient(rgba(5,6,5,.05),rgba(5,6,5,.18)),url(${w.primary_image_url})`,backgroundSize:'cover',backgroundPosition:'center'}:undefined}>{!w.primary_image_url&&<div className="mini-watch"/>}</div><div className="watch-body"><div className="watch-meta"><span>{w.brand}</span><span>{w.verification_status.replace('_',' ')}</span></div><h3>{w.model}</h3><p style={{color:'var(--muted)',margin:0}}>{w.reference_number} · {w.year} · {w.condition}</p><div className="metric-row"><div className="metric"><span>Appraised</span><b>${w.appraised_value_usd.toLocaleString()}</b></div><div className="metric"><span>Tokenized</span><b>{w.tokenized_percent}%</b></div><div className="metric"><span>Market cap</span><b>{w.market?.market_cap_usd?`$${Math.round(Number(w.market.market_cap_usd)).toLocaleString()}`:'—'}</b></div><div className="metric"><span>Holders</span><b>{w.market?.holder_count ?? '—'}</b></div></div></div></Link>)}</div>}
 {!loading&&!filtered.length&&<div className="panel" style={{padding:28}}><h3>No watches match that filter.</h3><p className="microcopy">Try another brand or list the first one.</p></div>}
 </div></section><Footer/></main>
}
