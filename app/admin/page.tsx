'use client';
import { useState } from 'react';
import { WatchListing } from '@/lib/types';
import { decodeEventLog } from 'viem';
import { useWallet } from '@/components/WalletProvider';
import { ponsFactoryAbi, PONS_FACTORY, publicClient } from '@/lib/pons';
import { WalletButton } from '@/components/WalletButton';
import { BrandLogo } from '@/components/BrandLogo';

export default function Admin(){
 const [key,setKey]=useState(''); const [watches,setWatches]=useState<WatchListing[]>([]); const [status,setStatus]=useState(''); const wallet=useWallet();
 async function load(){setStatus('Loading…');const r=await fetch('/api/admin/watches',{headers:{'x-timepiece-admin-key':key}}); const j=await r.json(); if(r.ok){setWatches(j.watches||[]);setStatus('')} else setStatus(j.error)}
 async function patch(id:string,body:any){const r=await fetch(`/api/admin/watches/${id}`,{method:'PATCH',headers:{'content-type':'application/json','x-timepiece-admin-key':key},body:JSON.stringify(body)}); const j=await r.json(); setStatus(r.ok?'Updated':j.error); if(r.ok) await load()}
 async function launchPons(w:WatchListing){
   if(!wallet.address) return setStatus('Connect the launcher wallet first.');
   if(!key) return setStatus('Enter the admin key first.');
   setStatus('Reading live Pons launch terms…');
   try {
     const res=await fetch('/api/pons/launch-draft',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...w,creatorFeeRecipient:w.owner_wallet,launcher:wallet.address,logo:w.primary_image_url})}); const draft=await res.json();
     if(!res.ok) return setStatus(draft.error);
     if(draft.canLaunch===false) return setStatus('This wallet does not currently pass Pons canLaunch(). Pons enforces that gate onchain.');
     if(process.env.NEXT_PUBLIC_ENABLE_MAINNET_ACTIONS !== 'true') return setStatus(`Launch draft ready. Mainnet actions are disabled. Fee: ${draft.launchFeeEth} ETH.`);
     setStatus('Confirm the Pons launch in your wallet…');
     const hash=await wallet.writeContract({address:(draft.factory||PONS_FACTORY) as `0x${string}`,abi:ponsFactoryAbi,functionName:'launchToken',args:[draft.tokenParams, BigInt(draft.launchConfigId), draft.pairToken], value:BigInt(draft.launchFeeWei)} as any);
     setStatus('Launch submitted. Waiting for confirmation…');
     const receipt=await publicClient.waitForTransactionReceipt({hash});
     let token:string|null=null, curve:string|null=null;
     for(const log of receipt.logs){
       try { const decoded=decodeEventLog({abi:ponsFactoryAbi,data:log.data,topics:log.topics}); if(decoded.eventName==='TokenLaunched'){const args=decoded.args as any;token=args.token;curve=args.curve;break;} } catch {}
     }
     if(!token||!curve) return setStatus(`Launch confirmed (${hash.slice(0,12)}…) but token addresses could not be decoded. Paste them into the row manually.`);
     await patch(w.id,{pons_token_address:token,pons_curve_address:curve,pons_launch_tx_hash:hash,pons_launch_block:Number(receipt.blockNumber)});
     setStatus(`Live. Token ${token.slice(0,10)}… linked automatically.`);
   } catch(e:any){setStatus(e?.shortMessage||e?.message||'Launch failed.');}
 }
 return <main className="admin-grid"><aside className="sidebar"><BrandLogo /><p style={{color:'var(--muted)'}}>Admin dashboard</p><div style={{margin:'14px 0'}}><WalletButton/></div><input className="input" type="password" placeholder="Admin key" value={key} onChange={e=>setKey(e.target.value)}/><button className="pill green" style={{marginTop:12}} onClick={load}>Load dashboard</button><p className="microcopy">{status}</p></aside><section className="admin-main"><h1 className="h2 serif admin-title">Verification queue</h1><div className="table-wrap"><table className="table"><thead><tr><th>Watch</th><th>Owner</th><th>Status</th><th>Appraised value</th><th>Pons token</th><th>Actions</th></tr></thead><tbody>{watches.map(w=><tr key={w.id}><td><b>{w.brand} {w.model}</b><br/><span className="microcopy">{w.reference_number} · {w.year}</span></td><td>{w.owner_wallet?.slice(0,8)}…</td><td>{w.verification_status}</td><td>${w.appraised_value_usd.toLocaleString()}</td><td><input className="input" style={{minWidth:270,marginBottom:8}} placeholder="0x token" defaultValue={w.pons_token_address||''} onBlur={e=>patch(w.id,{pons_token_address:e.target.value||null})}/><input className="input" style={{minWidth:270}} placeholder="0x curve" defaultValue={w.pons_curve_address||''} onBlur={e=>patch(w.id,{pons_curve_address:e.target.value||null})}/></td><td><div className="admin-actions"><button className="filter" onClick={()=>patch(w.id,{verification_status:'owner_verified'})}>Owner verified</button><button className="filter" onClick={()=>patch(w.id,{verification_status:'authenticated'})}>Authenticated</button><button className="filter" onClick={()=>patch(w.id,{published:!w.published})}>{w.published?'Unpublish':'Publish'}</button><button className="filter active" onClick={()=>launchPons(w)}>Launch with Pons</button></div></td></tr>)}</tbody></table></div></section></main>;
}
