import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const sections = [
  ['overview','Overview'],['lifecycle','Listing lifecycle'],['record','Watch record'],['verification','Verification'],['market','Token market'],['wallet','Wallet interactions'],['data','Market data'],['statuses','Statuses'],['admin','Admin review'],['boundaries','What Timepiece does not assume']
];

export default function About(){
  return <main className="page docs-page"><Nav/>
    <section className="docs-hero section-grid-bg"><div className="container"><div className="kicker">Timepiece docs</div><h1 className="docs-title serif">How the platform works.</h1><p>Timepiece combines a structured watch record, an owner-possession workflow, wallet approval and an onchain token market. This page describes the product flow and what each status means.</p><div className="docs-actions"><Link className="pill green" href="/list">List a watch <ArrowUpRight size={16}/></Link><Link className="pill" href="/watches">Browse watches</Link></div></div></section>
    <section className="docs-shell"><div className="container docs-layout">
      <aside className="docs-nav"><span>ON THIS PAGE</span>{sections.map(([id,label])=><a key={id} href={`#${id}`}>{label}</a>)}</aside>
      <article className="docs-content">
        <DocSection id="overview" number="01" title="Overview"><p>Timepiece is a marketplace interface for watch-linked token markets. The physical watch record remains visible alongside the token market rather than being reduced to a ticker alone.</p><p>An owner connects a wallet, submits watch information and images, completes a one-time possession proof, and sends the record for review. After review, an approved record can be connected to a Pons token on Robinhood Chain.</p></DocSection>

        <DocSection id="lifecycle" number="02" title="Listing lifecycle"><div className="docs-process"><Process n="1" title="Connect a wallet" text="The listing starts with an EVM wallet. The owner signs a free message so Timepiece can confirm control of the connected address."/><Process n="2" title="Create the watch record" text="Brand, model, reference, year, condition, appraisal field, selected tokenized share, notes and photos are collected."/><Process n="3" title="Prove possession" text="Timepiece generates a short-lived code. The owner writes it on paper and photographs that paper beside the watch."/><Process n="4" title="Review" text="The record stays unpublished until it is reviewed. Admin can approve, reject or request updated evidence."/><Process n="5" title="Connect the market" text="An approved watch can be associated with a Pons token contract. Contract-derived market information then appears on the watch page."/></div></DocSection>

        <DocSection id="record" number="03" title="The watch record"><p>The watch record is the non-token portion of a Timepiece listing. It is intended to keep the physical object legible throughout the market experience.</p><div className="docs-grid"><Info title="Identity" text="Brand, model and reference number."/><Info title="Watch details" text="Year, condition and owner-supplied notes."/><Info title="Media" text="Primary image plus optional caseback, side and clasp images."/><Info title="Documentation" text="Box/papers and serial/reference-photo indicators."/><Info title="Review state" text="Submitted, owner verified, authenticated or rejected."/><Info title="Onchain link" text="Token and curve addresses when a market is attached."/></div></DocSection>

        <DocSection id="verification" number="04" title="Owner-possession verification"><p>The code-photo workflow is designed to show that the submitting owner can place a newly generated Timepiece code next to the watch at the time of submission.</p><div className="docs-callout"><CheckCircle2/><div><b>What this establishes</b><p>A new image contains the watch and the current one-time code supplied by Timepiece.</p></div></div><div className="docs-callout neutral"><div className="docs-dot"/><div><b>What this does not establish by itself</b><p>A possession photo is not automatically an expert authentication, appraisal, custody arrangement or legal-title opinion. Those statuses should only be shown when separately supported.</p></div></div></DocSection>

        <DocSection id="market" number="05" title="The token market"><p>Timepiece uses a linked token contract as the market layer. For Pons v2 tokens, the interface can read launch configuration, curve state, market phase and trade events directly from Robinhood Chain.</p><p>Before a Pons token graduates, buys route through its curve. After graduation, the market route can move to the pool used by the token. Timepiece keeps those implementation details behind the watch page so the user can focus on the listing.</p></DocSection>

        <DocSection id="wallet" number="06" title="Wallet interactions"><p>Wallet actions are explicit. Timepiece does not need a user private key.</p><div className="docs-grid"><Info title="Connect" text="The browser wallet exposes the public address to the interface."/><Info title="Confirm" text="A free message signature confirms control of the listing wallet."/><Info title="Network" text="The wallet is switched or prompted to add Robinhood Chain when required."/><Info title="Trade" text="Onchain buy/sell actions are shown in the wallet for user approval."/></div></DocSection>

        <DocSection id="data" number="07" title="Market data"><p>Market fields are intended to come from contracts and indexed chain activity rather than synthetic charts.</p><ul className="docs-list"><li><b>Token and curve:</b> read from the Pons launch record.</li><li><b>Phase:</b> derived from the Pons token state.</li><li><b>Price:</b> derived from curve reserves while the token is on the curve.</li><li><b>Trades:</b> indexed from curve buy/sell events.</li><li><b>Chart:</b> built from indexed trades into OHLC candles.</li><li><b>Holders:</b> read from chain-indexed token-holder data.</li></ul></DocSection>

        <DocSection id="statuses" number="08" title="Listing statuses"><div className="status-docs"><Status name="Submitted" text="The owner has completed the submission. It is not published."/><Status name="Owner verified" text="The owner-possession evidence has passed Timepiece review."/><Status name="Authenticated" text="Use only when the platform has separate support for the watch-authentication status."/><Status name="Rejected" text="The record did not pass review or needs to be resubmitted."/></div></DocSection>

        <DocSection id="admin" number="09" title="Admin review"><p>The admin dashboard is the control layer for publishing. It can review owner evidence, change verification state, publish/unpublish a record and associate an approved watch with its Pons token/curve.</p><p>Market data is not meant to be typed manually. Once a valid contract is attached, the token page can populate contract-derived fields from the chain indexer.</p></DocSection>

        <DocSection id="boundaries" number="10" title="What Timepiece does not assume"><p>Timepiece keeps different concepts separate: possession, authentication, appraisal, custody, token trading and any contractual rights associated with a listing are not treated as the same thing.</p><p>The exact terms attached to a watch-linked token should be disclosed per listing. The interface should not imply that a token automatically creates legal title to a physical watch unless the relevant legal and custody structure actually provides that right.</p></DocSection>
      </article>
    </div></section><Footer/></main>;
}

function DocSection({id,number,title,children}:{id:string;number:string;title:string;children:React.ReactNode}){return <section className="doc-section" id={id}><div className="doc-number">{number}</div><h2 className="serif">{title}</h2>{children}</section>}
function Process({n,title,text}:{n:string;title:string;text:string}){return <div><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>}
function Info({title,text}:{title:string;text:string}){return <div className="docs-info"><b>{title}</b><p>{text}</p></div>}
function Status({name,text}:{name:string;text:string}){return <div><span>{name}</span><p>{text}</p></div>}
