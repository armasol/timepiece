'use client';

import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { useWallet } from '@/components/WalletProvider';
import { useEffect, useMemo, useState } from 'react';
import { topBrands } from '@/lib/demo';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ShieldCheck, Upload, Wallet } from 'lucide-react';

const steps = ['Wallet', 'Watch', 'Photos', 'Owner proof', 'Review'];

type UploadMap = Partial<Record<'primary'|'back'|'side'|'clasp'|'verification', string>>;

export default function ListWatch(){
  const wallet=useWallet();
  const [step,setStep]=useState(0);
  const [confirmedAddress,setConfirmedAddress]=useState<string>('');
  const [walletStatus,setWalletStatus]=useState('');
  const [code,setCode]=useState('');
  const [status,setStatus]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [uploads,setUploads]=useState<UploadMap>({});
  const [form,setForm]=useState({
    brand:'Rolex',model:'',reference_number:'',year:'2021',condition:'Excellent',appraised_value_usd:'',tokenized_percent:'25',description:'',box_papers:true,serial_verified:false
  });

  useEffect(()=>{ if (confirmedAddress && wallet.address !== confirmedAddress) setConfirmedAddress(''); },[wallet.address,confirmedAddress]);

  const slug=useMemo(()=>`${form.brand}-${form.model}-${form.reference_number}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''),[form]);
  const walletConfirmed = Boolean(wallet.address && confirmedAddress === wallet.address);

  async function connectMetaMask(){
    setWalletStatus('');
    try{
      const metamask = wallet.providers.find((p)=>/metamask/i.test(p.info.name) || /metamask/i.test(p.info.rdns||''));
      await wallet.connect(metamask?.provider);
      await wallet.ensureRobinhood();
      setWalletStatus(metamask ? 'MetaMask connected. Confirm this wallet to continue.' : 'Wallet connected. Confirm it to continue.');
    }catch(e:any){ setWalletStatus(e?.message || 'Could not connect the wallet.'); }
  }

  async function connectAnother(){
    setWalletStatus('');
    try{ await wallet.connect(); await wallet.ensureRobinhood(); setWalletStatus('Wallet connected. Confirm it to continue.'); }
    catch(e:any){ setWalletStatus(e?.message || 'Could not connect the wallet.'); }
  }

  async function confirmWallet(){
    if(!wallet.address) return;
    setWalletStatus('Confirm the message in your wallet…');
    try{
      await wallet.signMessage(`Timepiece wallet confirmation\nWallet: ${wallet.address}\nPurpose: Start a watch listing`);
      setConfirmedAddress(wallet.address);
      setWalletStatus('Wallet confirmed ✓');
    }catch(e:any){ setWalletStatus(e?.shortMessage || e?.message || 'Wallet confirmation cancelled.'); }
  }

  async function generateCode(){
    setStatus('');
    const r=await fetch('/api/verification-code',{method:'POST'});
    const j=await r.json();
    if(!r.ok) return setStatus(j.error||'Could not generate code.');
    setCode(j.code);
  }

  async function upload(kind:keyof UploadMap, file?:File){
    if(!file) return;
    setStatus(`Uploading ${kind} photo…`);
    const data=new FormData(); data.append('file',file); data.append('path',`${wallet.address||'unlinked'}/${kind}-${Date.now()}`);
    const r=await fetch('/api/upload',{method:'POST',body:data});
    const j=await r.json();
    if(!r.ok){setStatus(j.error||'Upload failed'); return;}
    setUploads((current)=>({...current,[kind]:j.url}));
    setStatus(`${kind==='verification'?'Owner-proof':kind==='primary'?'Primary watch':kind} photo uploaded ✓`);
  }

  function next(){
    setStatus('');
    if(step===0 && !walletConfirmed) return setWalletStatus('Connect and confirm your wallet first.');
    if(step===1 && (!form.model.trim() || !form.reference_number.trim() || !form.appraised_value_usd)) return setStatus('Add the model, reference and appraised value before continuing.');
    if(step===2 && !uploads.primary) return setStatus('Upload at least one clear primary watch photo.');
    if(step===3 && (!code || !uploads.verification)) return setStatus('Generate the owner-proof code and upload the photo showing the code beside the watch.');
    setStep((s)=>Math.min(4,s+1));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  async function submit(){
    if(!wallet.address || !walletConfirmed) return setStatus('Confirm your wallet first.');
    if(!code || !uploads.primary || !uploads.verification) return setStatus('The listing is missing required verification information.');
    setSubmitting(true); setStatus('Confirm the final listing signature in your wallet…');
    try{
      const message=`Timepiece listing verification\nWallet: ${wallet.address}\nCode: ${code}\nWatch: ${form.brand} ${form.model} ${form.reference_number}`;
      const signature=await wallet.signMessage(message);
      const additional_images = (['back','side','clasp'] as const).filter(k=>uploads[k]).map(k=>({image_url:uploads[k]!,image_type:k}));
      const payload={
        ...form,slug,owner_wallet:wallet.address,verification_code:code,signature,
        year:Number(form.year),appraised_value_usd:Number(form.appraised_value_usd),tokenized_percent:Number(form.tokenized_percent),
        primary_image_url:uploads.primary,verification_image_url:uploads.verification,additional_images,
        verification_status:'submitted',published:false
      };
      const res=await fetch('/api/watches',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const json=await res.json();
      if(!res.ok) return setStatus(json.error||'Submission failed.');
      setStatus('Submitted ✓ Your watch record is now waiting for Timepiece review.');
    }catch(e:any){ setStatus(e?.shortMessage||e?.message||'Signature cancelled.'); }
    finally{ setSubmitting(false); }
  }

  return <main className="page listing-page"><Nav/>
    <section className="listing-shell">
      <div className="container">
        <div className="listing-head"><div className="kicker">List a watch</div><h1 className="docs-title serif">Create the watch record first.</h1><p>Five steps. Your wallet is confirmed before any watch details are submitted.</p></div>
        <div className="listing-layout">
          <aside className="listing-progress">
            {steps.map((name,i)=><button key={name} className={`listing-step ${i===step?'active':''} ${i<step?'done':''}`} onClick={()=>i<step&&setStep(i)}><span>{i<step?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><b>{name}</b></button>)}
            <div className="listing-help"><ShieldCheck size={18}/><p>The owner-proof photo is separate from watch authentication. Admin review determines the status shown on the listing.</p></div>
          </aside>

          <div className="listing-card panel">
            {step===0&&<div className="wizard-step">
              <div className="wizard-icon"><Wallet/></div><div className="kicker">Step 01 · Wallet</div><h2>Connect MetaMask first.</h2><p className="wizard-lead">The connected wallet becomes the owner wallet for this submission. Timepiece asks for a free message signature to confirm you control it.</p>
              {!wallet.connected?<div className="wallet-first-actions"><button className="pill green" onClick={connectMetaMask}>Connect MetaMask <ArrowRight size={16}/></button><button className="pill" onClick={connectAnother}>Use another EVM wallet</button></div>:<div className="wallet-confirm-card"><small>CONNECTED WALLET</small><b>{wallet.address}</b>{walletConfirmed?<div className="confirmed-line"><CheckCircle2/> Wallet confirmed</div>:<button className="pill green" onClick={confirmWallet}>Confirm wallet <ArrowRight size={16}/></button>}</div>}
              {walletStatus&&<p className="form-status">{walletStatus}</p>}
            </div>}

            {step===1&&<div className="wizard-step"><div className="kicker">Step 02 · Watch</div><h2>Describe the exact watch.</h2><p className="wizard-lead">These details become the public watch record after review.</p><div className="form">
              <label className="label">Brand<select className="select" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}>{topBrands.map(b=><option key={b}>{b}</option>)}</select></label>
              <div className="two-col"><label className="label">Model<input className="input" placeholder="GMT-Master II" value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/></label><label className="label">Reference<input className="input" placeholder="126710BLRO" value={form.reference_number} onChange={e=>setForm({...form,reference_number:e.target.value})}/></label></div>
              <div className="two-col"><label className="label">Year<input className="input" inputMode="numeric" value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/></label><label className="label">Condition<select className="select" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}>{['Unworn','Excellent','Very Good','Good','Fair'].map(x=><option key={x}>{x}</option>)}</select></label></div>
              <div className="two-col"><label className="label">Appraised value USD<input className="input" inputMode="decimal" placeholder="19500" value={form.appraised_value_usd} onChange={e=>setForm({...form,appraised_value_usd:e.target.value})}/></label><label className="label">Share to tokenize<input className="input" inputMode="decimal" value={form.tokenized_percent} onChange={e=>setForm({...form,tokenized_percent:e.target.value})}/></label></div>
              <label className="label">Watch notes<textarea className="textarea" placeholder="Condition notes, service history, included documentation…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
              <div className="check-row"><label><input type="checkbox" checked={form.box_papers} onChange={e=>setForm({...form,box_papers:e.target.checked})}/> Box / papers included</label><label><input type="checkbox" checked={form.serial_verified} onChange={e=>setForm({...form,serial_verified:e.target.checked})}/> Serial/reference photographed</label></div>
            </div></div>}

            {step===2&&<div className="wizard-step"><div className="kicker">Step 03 · Photos</div><h2>Show the watch clearly.</h2><p className="wizard-lead">Upload a primary image plus any additional angles you want included with the record. JPG, PNG or WebP, up to 12 MB each.</p><div className="upload-grid">
              <UploadBox title="Primary photo" required done={!!uploads.primary} onFile={f=>upload('primary',f)}/><UploadBox title="Caseback" done={!!uploads.back} onFile={f=>upload('back',f)}/><UploadBox title="Side / crown" done={!!uploads.side} onFile={f=>upload('side',f)}/><UploadBox title="Clasp / bracelet" done={!!uploads.clasp} onFile={f=>upload('clasp',f)}/>
            </div>{status&&<p className="form-status">{status}</p>}</div>}

            {step===3&&<div className="wizard-step"><div className="kicker">Step 04 · Owner proof</div><h2>Put this code beside the watch.</h2><p className="wizard-lead">Generate a one-time code, write it on a physical piece of paper, place that paper beside the watch, then take a new photo with both clearly visible.</p>
              <div className="proof-code-card"><small>YOUR ONE-TIME CODE</small><strong>{code||'TP-••••-••'}</strong><button className="pill" onClick={generateCode}>{code?'Generate a new code':'Generate code'}</button></div>
              <UploadBox title="Watch + handwritten code" required done={!!uploads.verification} onFile={f=>upload('verification',f)}/>
              <div className="proof-rules"><span><Check/> The code must be handwritten</span><span><Check/> The watch and paper must appear in the same new image</span><span><Check/> Keep the reference/serial area readable when possible</span></div>{status&&<p className="form-status">{status}</p>}
            </div>}

            {step===4&&<div className="wizard-step"><div className="kicker">Step 05 · Review</div><h2>Review before you submit.</h2><p className="wizard-lead">Nothing is published automatically. The submitted watch record goes to Timepiece review first.</p>
              <div className="review-watch"><div className="review-image" style={uploads.primary?{backgroundImage:`url(${uploads.primary})`}:undefined}/><div><small>{form.brand}</small><h3>{form.model||'Watch model'}</h3><p>{form.reference_number} · {form.year} · {form.condition}</p><dl><div><dt>Owner wallet</dt><dd>{wallet.address}</dd></div><div><dt>Share selected</dt><dd>{form.tokenized_percent}%</dd></div><div><dt>Owner-proof code</dt><dd>{code}</dd></div><div><dt>Photos</dt><dd>{Object.values(uploads).filter(Boolean).length} uploaded</dd></div></dl></div></div>
              <button className="pill green submit-listing" disabled={submitting} onClick={submit}>{submitting?'Submitting…':'Sign & submit for review'} <ArrowRight size={16}/></button>{status&&<p className="form-status">{status}</p>}
            </div>}

            <div className="wizard-nav">{step>0?<button className="wizard-back" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/> Back</button>:<span/>}{step<4&&<button className="pill green" onClick={next}>Continue <ArrowRight size={16}/></button>}</div>
          </div>
        </div>
      </div>
    </section><Footer/></main>;
}

function UploadBox({title,required=false,done=false,onFile}:{title:string;required?:boolean;done?:boolean;onFile:(file?:File)=>void}){
  return <label className={`upload-box ${done?'done':''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>onFile(e.target.files?.[0])}/><span className="upload-icon">{done?<CheckCircle2/>:<Upload/>}</span><b>{title}</b><small>{done?'Uploaded':required?'Required':'Optional'}</small></label>;
}
