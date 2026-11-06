import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CONTACT } from './LeadForm';
import { HeroVisual, Icon, type IconName } from './Thesis';
import { FounderEngines, TheTeam } from './Founders';
import { Downloads, PerformanceTables, SimulationTables, TermsTables } from './ProFundPage';
import { Drawer } from './Drawer';
import { savedAccess } from '../lib/access';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';
import { FACTSHEET_URL } from '../lib/links';

// /lp — LA PAGE DES LPs. Réécrite le 06/11 (Antoine) en sept chapitres numérotés, un seul
// fil : un LP exigeant doit se dire « j'ai compris, la stratégie tient, ils ont accès aux
// meilleurs fondateurs, je mets un ticket, et je sais comment les joindre ».
//   01 Why now · 02 How we win the best founders · 03 What the founder gets (de vraies
//   introductions en bourse, de vraies médianes, puis une multiplication) · 04 What our LPs
//   get · 05 The fund (le modèle, dit comme tel) · 06 Protection and team ·
//   07 What €10M would represent (et le contact : téléphone, email).
// Pas de barre du haut ni de formulaire. Chiffres du fonds lus dans fund.json (comme la
// fiche et /pitch) ; chiffres de tiers numérotés et cliquables (SOURCES, en bas), cessions
// réelles cliquables vers le communiqué ou le dépôt de l'acheteur. Ne pas modifier un chiffre
// de tiers sans relire sa source. La page est fermée (candidats acceptés) : frais, carry et
// cibles y figurent. Barrière côté client : le texte reste dans le bundle JS.
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const T = fund.terms;
const C = fund.cases;
const A = fund.allocation;
const TARGET = C.target;
const FR = fund.fund_returner;
const NO_UNI = fund.stress_tests.find((s) => s.id === 'best_zombie')!;
const BIG_UNICORN = fund.stress_tests.find((s) => s.id === 'big_unicorn')!;
const FUND_SIZE = eur(F.commitments, 'tile');
const PHONE = '+33 6 83 10 72 86';           // le même que la fiche PDF (factsheet.py, PHONE)
const PHONE_TEL = 'tel:+33683107286';
const TICKET = 10_000_000;                    // l'allocation discutée au chapitre 07 (page, pas modèle)

const DELIVEROO_PROSPECTUS = 'https://lexismarkettracker.lexisnexis.com/documents/0035/35079/167313/MT_Deliveroo%20plc_prospectus_22%20March%202021.pdf';
// ── Les sources : numérotées, cliquables, listées en bas de page ──────────────
type Src = { n: number; label: string; url: string };
const SRC = {
  lovable100: { n: 1, label: 'TechCrunch, 23 July 2025: Lovable crosses $100M ARR eight months after launch, with 45 employees', url: 'https://techcrunch.com/2025/07/23/eight-months-in-swedish-unicorn-lovable-crosses-the-100m-arr-milestone' },
  lovable400: { n: 2, label: 'TechCrunch, 11 March 2026: Lovable at $400M ARR with 146 employees', url: 'https://techcrunch.com/2026/03/11/lovable-says-it-added-100m-in-revenue-last-month-alone-with-just-146-employees/' },
  stripe: { n: 3, label: 'TechCrunch, 27 February 2025, on Stripe’s 2024 annual letter: AI companies vs SaaS, time to $5M ARR', url: 'https://techcrunch.com/2025/02/27/stripe-ceo-says-ai-startups-are-growing-faster-than-saas-ever-did-and-calling-them-wrappers-misses-the-point' },
  bessemer: { n: 4, label: 'Bessemer Venture Partners, The State of AI 2025 (13 August 2025)', url: 'https://www.bvp.com/atlas/the-state-of-ai-2025' },
  carta: { n: 5, label: 'Carta, Founder Ownership Report 2026', url: 'https://carta.com/data/founder-ownership-2026/' },
  saastr: { n: 6, label: 'SaaStr on Carta data: founders hold 11.4% after the Series D', url: 'https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/' },
  deliveroo: { n: 7, label: 'Deliveroo plc, IPO prospectus, 22 March 2021: Will Shu’s stake, capital raised', url: DELIVEROO_PROSPECTUS },
  atomico25: { n: 8, label: 'Atomico, State of European Tech 2025: $1B+ exits, share of deals and of value', url: 'https://2025.stateofeuropeantech.com/chapters/unlocking-capital-and-liquidity' },
  atomico23: { n: 9, label: 'Atomico, State of European Tech 2023: 77% of M&A deals under $100M', url: 'https://2023.stateofeuropeantech.com/exits' },
} satisfies Record<string, Src>;
const SOURCES: Src[] = Object.values(SRC).sort((a, b) => a.n - b.n);

function Ref({ s }: { s: Src }) {
  return <sup className="lp-ref"><a href={`#src-${s.n}`} aria-label={`Source ${s.n}`}>{s.n}</a></sup>;
}

// Les cessions réelles : chaque nom renvoie au communiqué ou au dépôt de l'acheteur.
type Exit = { co: string; v: string; d: string; url: string };
const EXITS: Record<string, Exit> = {
  snips: { co: 'Snips', v: '~$37.5M', d: 'France · Sonos, 2019', url: 'https://www.sec.gov/Archives/edgar/data/1314727/000131472719000038/sono-20190928x10k.htm' },
  adcreative: { co: 'AdCreative.ai', v: '$38.7M', d: 'France · Appier, 2025', url: 'https://www.appier.com/en/press-media/appier-acquires-adcreative.ai-in-strategic-move' },
  sentronics: { co: 'Sentronics', v: '~$60M', d: 'Germany · Nova, 2025', url: 'https://www.novami.com/wp-content/uploads/2024/11/pr20241127-website.pdf' },
  freetrade: { co: 'Freetrade', v: '£160M', d: 'UK · IG Group, 2025', url: 'https://data.fca.org.uk/artefacts/NSM/RNS/5502554.html' },
  rollic: { co: 'Rollic', v: '$168M for 80%', d: 'Turkey · Zynga, 2020', url: 'https://www.sec.gov/Archives/edgar/data/1439404/000156459020036813/znga-ex991_36.htm' },
  planday: { co: 'Planday', v: '€183.5M', d: 'Denmark · Xero, 2021', url: 'https://announcements.asx.com.au/asxpdf/20210304/pdf/44tb94y37knkhc.pdf' },
  instadeep: { co: 'InstaDeep', v: '~€500M', d: 'UK · BioNTech, 2023', url: 'https://www.sec.gov/Archives/edgar/data/1776985/000177698523000046/ex991instadeepclosingrelea.htm' },
  silo: { co: 'Silo AI', v: '~$665M', d: 'Finland · AMD, 2024', url: 'https://www.nasdaq.com/press-release/amd-completes-acquisition-silo-ai-accelerate-development-and-deployment-ai-models-amd' },
  peakon: { co: 'Peakon', v: '~$700M', d: 'Denmark · Workday, 2021', url: 'https://www.sec.gov/Archives/edgar/data/1327811/000119312521020093/d31063dex991.htm' },
  cognigy: { co: 'Cognigy', v: '~$955M', d: 'Germany · NICE, 2025', url: 'https://www.sec.gov/Archives/edgar/data/1003935/000117891325002467/exhibit_99-1.htm' },
  sana: { co: 'Sana', v: '~$1.1B', d: 'Sweden · Workday, 2025', url: 'https://investor.workday.com/files/doc_news/Workday-Signs-Definitive-Agreement-to-Acquire-Sana-09-16-2025-2025.pdf' },
  depop: { co: 'Depop', v: '~$1.625B', d: 'UK · Etsy, 2021', url: 'https://www.sec.gov/Archives/edgar/data/1370637/000137063721000028/exhibit99106022021.htm' },
  tink: { co: 'Tink', v: '€1.8B', d: 'Sweden · Visa, 2021', url: 'https://tink.com/press/visa-acquires-tink' },
  wolt: { co: 'Wolt', v: '~€7.0B', d: 'Finland · DoorDash, 2021', url: 'https://ir.doordash.com/news/news-details/2021/DoorDash-Joins-Forces-with-Wolt/default.aspx' },
};
const EXIT_BANDS: { h: string; items: Exit[] }[] = [
  { h: 'Under 100M', items: [EXITS.snips, EXITS.adcreative, EXITS.sentronics] },
  { h: '100M to 300M', items: [EXITS.freetrade, EXITS.rollic, EXITS.planday] },
  { h: '300M to 1B', items: [EXITS.instadeep, EXITS.silo, EXITS.peakon, EXITS.cognigy] },
  { h: 'Above 1B', items: [EXITS.sana, EXITS.depop, EXITS.tink, EXITS.wolt] },
];
function ExitLink({ e }: { e: Exit }) {
  return <a href={e.url} target="_blank" rel="noopener noreferrer">{e.co}</a>;
}

// ── Les vrais chiffres (06/11, Antoine : « fais des chiffres réels ») ─────────
// Sept introductions en bourse européennes : parts lues dans les prospectus (sauf Spotify,
// parts économiques citées par Fortune), chaque chiffre renvoie à sa source (tous relus dans
// la source elle-même le 06/11). Ne rien modifier sans relire la source. Ne pas écrire « lever moins, c'est garder plus » : ces cas ne le
// montrent pas (Criteo, 47 M€ levés, 8,4 %), et ces parts mêlent dilution et ventes de titres.
// JAMAIS de nom de société réelle à côté d'un calcul fictif.
type Cited = { t: string; u?: string };
type Listing = { co: string; where: string; val: Cited; raised: Cited; stakes: string; stakeUrl: string; note?: string };
const LISTINGS: Listing[] = [
  { co: 'Deliveroo', where: 'UK · LSE, April 2021',
    val: { t: '£7.6bn', u: 'https://www.rte.ie/news/business/2021/0331/1207132-deliveroos-london-ipo' },
    raised: { t: 'about £1.3bn', u: DELIVEROO_PROSPECTUS },
    stakes: 'Shu 6.3%', stakeUrl: DELIVEROO_PROSPECTUS,
    note: 'Prospectus figure, at the mid-point of the price range; the IPO priced at the bottom. About 57% of the votes.' },
  { co: 'Klarna', where: 'Sweden · NYSE, September 2025',
    val: { t: '$15bn', u: 'https://www.americanbanker.com/payments/news/klarna-debuts-on-the-new-york-stock-exchange' },
    raised: { t: '$4.8bn, per PitchBook', u: 'https://www.crowdfundinsider.com/2025/03/237414-swedish-fintech-firm-klarna-files-for-1bn-us-ipo/' },
    stakes: 'Jacobsson 8.02%, Siemiatkowski 6.79%', stakeUrl: 'https://www.sec.gov/Archives/edgar/data/2003292/000200329225000052/klarnagroupplc424b4.htm',
    note: 'Ordinary shares. Jacobsson with entities he may be deemed to control.' },
  { co: 'Spotify', where: 'Sweden · NYSE direct listing, April 2018',
    val: { t: '$26.5bn', u: 'https://fortune.com/2018/04/03/spotify-ipo-spot-winners' },
    raised: { t: 'about $2.7bn, debt and equity', u: 'https://techcrunch.com/2018/02/28/spotify-has-filed-to-go-public/' },
    stakes: 'Lorentzon 12.2%, Ek 8.8%', stakeUrl: 'https://fortune.com/2018/04/03/spotify-ipo-spot-winners',
    note: 'Economic stakes, as reported by Fortune.' },
  { co: 'Wise', where: 'Estonia, UK · LSE direct listing, July 2021',
    val: { t: 'more than £8bn', u: 'https://www.cnbc.com/2021/07/07/wise-direct-listing-london.html' },
    raised: { t: 'no published total' },
    stakes: 'Käärmann 18.78%, Hinrikus 10.85%', stakeUrl: 'https://wise.com/imaginary-v2/images/66edcbaae5e13b596fd612fede0a9482-Wise_Prospectus.pdf',
    note: 'Class A shares, before liquidity sales. Käärmann holds 40.75% of the votes.' },
  { co: 'Elastic', where: 'Netherlands · NYSE, October 2018',
    val: { t: 'around $2.5bn', u: 'https://news.crunchbase.com/public/elastic-prices-ipo-above-range-selling-7m-shares-at-36-apiece/' },
    raised: { t: '$162M', u: 'https://siliconangle.com/2018/10/04/elastic-sets-share-price-33-35-ahead-friday-ipo/' },
    stakes: 'Schuurman 18.9%, Banon 13.7%', stakeUrl: 'https://www.sec.gov/Archives/edgar/data/1707753/000119312518294675/d588632d424b4.htm' },
  { co: 'Criteo', where: 'France · Nasdaq, October 2013',
    val: { t: 'over $2bn', u: 'https://globalventuring.com/blog/2013/10/31/criteo-ipo-pops/' },
    raised: { t: '€47.0M', u: 'https://www.sec.gov/Archives/edgar/data/1576427/000119312513416937/d541385d424b4.htm' },
    stakes: 'Rudelle 8.4%, Niccoli 3.9%, Le Ouay 3.9%', stakeUrl: 'https://www.sec.gov/Archives/edgar/data/1576427/000119312513416937/d541385d424b4.htm' },
  { co: 'Trustpilot', where: 'Denmark · LSE, March 2021',
    val: { t: 'about £1.08bn', u: 'https://ipo.trustpilot.com/trustpilot-offer-price-announcement.pdf' },
    raised: { t: 'no published total' },
    stakes: 'Mühlmann 2.11%', stakeUrl: 'https://ipo.trustpilot.com/trustpilot-prospectus.pdf',
    note: '4.39% before the IPO, where he sold shares.' },
];
function CitedLink({ c }: { c: Cited }) {
  return c.u ? <a href={c.u} target="_blank" rel="noopener noreferrer">{c.t}</a> : <>{c.t}</>;
}

// Les médianes Carta (pas spécifiques à l'Europe). La D : donnée Carta citée par SaaStr.
const MEDIAN_A = FM.founders;                       // 37,5 %, sociétés « digital »
const MEDIAN_D = 0.114;
const MEDIANS: { v: number; l: string; s: string; r: Src }[] = [
  { v: MEDIAN_A, l: 'After the Series A', s: 'Digital companies', r: SRC.carta },
  { v: 0.273, l: 'After the Series B', s: 'AI teams (21.8% for the others)', r: SRC.carta },
  { v: 0.161, l: 'After the Series C', s: 'Less than the employee pool, at 16.8%', r: SRC.carta },
  { v: MEDIAN_D, l: 'After the Series D', s: 'Carta data, as reported by SaaStr', r: SRC.saastr },
];

// Ce que nos termes changent : une multiplication, de vrais prix, une hypothèse dite en clair.
const DEBT = FM.loans * FM.loan_multiple;
const A_COST = FM.holders.find((h) => h.id === 'series_a')!.pref;
const A_STAKE0 = FM.holders.find((h) => h.id === 'series_a')!.stake;
const A_STAKE_VC = A_STAKE0 * (MEDIAN_D / MEDIAN_A); // un chèque non renforcé, dilué comme les fondateurs
const PRICES: { exit: number; e: Exit }[] = [
  { exit: 500e6, e: EXITS.instadeep },
  { exit: 1800e6, e: EXITS.tink },
  { exit: 7000e6, e: EXITS.wolt },
];
const x1 = (v: number) => `${v.toFixed(v < 10 ? 1 : 0)}×`;
const UNICORN = 1e9;
/** €94M, €30.4M, €2.61B : assez de précision pour refaire le calcul de tête. */
function amt(v: number) {
  if (v >= 1e9) return `€${(v / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`;
  if (v >= 100e6) return `€${Math.round(v / 1e6)}M`;
  if (v <= 0) return '€0';
  return `€${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
}
type Line = { l: string; v: string; k?: 'minus' | 'sub' };
type Side = { name: string; lines: Line[]; label: string; result: string; edge?: string };
const afterLoans = (exit: number): Line[] => [
  { l: 'Sale price', v: amt(exit) },
  { l: 'Loans and interest, repaid first', v: `−${amt(DEBT)}`, k: 'minus' },
  { l: 'Left', v: amt(exit - DEBT), k: 'sub' },
];

function founderSides(exit: number): [Side, Side] {
  const vc = MEDIAN_D * exit;
  const pf = MEDIAN_A * (exit - DEBT);
  return [
    { name: 'Median founding team, after a Series D',
      lines: [{ l: 'Sale price', v: amt(exit) }, { l: 'Founders’ stake', v: pct(MEDIAN_D, 1) }],
      label: 'Founders take home', result: amt(vc) },
    { name: 'ProFund path, our hypothesis',
      lines: [...afterLoans(exit), { l: 'Founders’ stake, not diluted', v: pct(MEDIAN_A, 1) }],
      label: 'Founders take home', result: amt(pf), edge: `${(pf / vc).toFixed(1)}× the median` },
  ];
}

function lpSides(exit: number): [Side, Side] {
  const vc = A_STAKE_VC * exit;
  const pf = A_STAKE0 * (exit - DEBT);
  return [
    { name: 'A cheque that is not topped up',
      lines: [{ l: 'Sale price', v: amt(exit) }, { l: `Stake: ${pct(A_STAKE0)}, diluted like the founders’`, v: pct(A_STAKE_VC, 2) }],
      label: `On a ${amt(A_COST)} cheque`, result: `${amt(vc)} · ${x1(vc / A_COST)}` },
    { name: 'ProFund path, our hypothesis',
      lines: [...afterLoans(exit), { l: 'Stake, not diluted', v: pct(A_STAKE0) }],
      label: `On a ${amt(A_COST)} cheque`, result: `${amt(pf)} · ${x1(pf / A_COST)}`, edge: `${(pf / vc).toFixed(1)}× the cheque on the left` },
  ];
}

// ── Les briques de mise en page ──────────────────────────────────────────────
function Chapter({ n, id, kicker, title, sub, tint = false, children }: {
  n: string; id: string; kicker: string; title: string; sub?: ReactNode; tint?: boolean; children: ReactNode;
}) {
  return (
    <section className={`pv-sec lp-ch${tint ? ' tint' : ''}`} id={id}>
      <div className="pv-wrap">
        <div className="lp-ch-head">
          <span className="lp-ch-n">{n}</span>
          <div>
            <p className="pv-kick">{kicker}</p>
            <h2 className="pv-h2">{title}</h2>
            {sub && <p className="lp-ch-sub">{sub}</p>}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function Stats({ items }: { items: { b: string; t: ReactNode }[] }) {
  return (
    <div className="lp-stats">
      {items.map((x) => <div key={x.b}><b>{x.b}</b><span>{x.t}</span></div>)}
    </div>
  );
}

function SideCard({ s }: { s: Side }) {
  return (
    <div className={`lp-led-side${s.edge ? ' pf' : ''}`}>
      <p className="lp-led-name">{s.name}</p>
      <dl>
        {s.lines.map((x) => (
          <div key={x.l} className={x.k ?? undefined}><dt>{x.l}</dt><dd>{x.v}</dd></div>
        ))}
      </dl>
      <p className="lp-led-res"><span>{s.label}</span><b>{s.result}</b></p>
      {s.edge && <p className="lp-led-edge">{s.edge}</p>}
    </div>
  );
}

/** Une ligne par prix de vente réel : le décompte des deux chemins, côte à côte, toujours visible. */
function Ledgers({ sides }: { sides: (exit: number) => [Side, Side] }) {
  return (
    <div className="lp-led">
      {PRICES.map((r) => {
        const [vc, pf] = sides(r.exit);
        return (
          <article key={r.exit} className={`lp-led-row${r.exit >= UNICORN ? ' uni' : ''}`}>
            <header>
              <b>Sold for {eur(r.exit, 'val')}</b>
              {r.exit >= UNICORN && <em>Unicorn</em>}
              <span>The price of <ExitLink e={r.e} /> ({r.e.d.split(' · ')[1]}, {r.e.v})</span>
            </header>
            <div className="lp-led-grid"><SideCard s={vc} /><SideCard s={pf} /></div>
          </article>
        );
      })}
    </div>
  );
}

/** Un bloc repliable : un titre, un « + » qui tourne, le contenu en dessous (06/11). */
function Fold({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-fold${open ? ' open' : ''}`}>
      <button type="button" className="lp-fold-bar" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span><b>{title}</b>{sub && <small>{sub}</small>}</span>
        <span className="pv-toggle-ic" aria-hidden="true" />
      </button>
      <Drawer id={id} open={open} label={title}>{children}</Drawer>
    </div>
  );
}

// Les règles de protection, vues des LPs (pacte à 12 clauses, Pact.tsx).
const PROTECTION: { icon: IconName; t: string; d: string }[] = [
  { icon: 'shield', t: '1× preference', d: 'On every cheque, first or follow-on. No ratchet, no cumulative dividend.' },
  { icon: 'banknote', t: 'Loans first', d: 'Lender covenants; repaid before any equity and on any change of control.' },
  { icon: 'file', t: 'A board seat', d: 'Monthly figures, quarterly accounts, and consent on anything that would change our shares.' },
  { icon: 'scale', t: 'Independent pricing', d: 'Every buyback is priced by an independent valuer.' },
  { icon: 'trend', t: 'The lead’s rights', d: 'If another investor leads a priced round, we hold the same rights as the new lead.' },
  { icon: 'door', t: 'Exit', d: 'Tag-along on any sale of control; drag-along only on the same terms for everyone.' },
  { icon: 'handshake', t: 'Vesting and leavers', d: 'Four-year founder vesting; the voting agreement ends if a founder leaves or sells control.' },
  { icon: 'lock', t: 'Conflicts', d: 'Our shares abstain on our own loans and buybacks; fund-side conflicts go to the LP advisory committee.' },
  { icon: 'check', t: 'Fallback', d: 'Fraud, misconduct, a breach of the pact or insolvency end the voting agreement. Investment committee, key-person clause.' },
];

/** L'accès à la page : l'aperçu du GP (?gp), ou l'accès au deal flow de ce navigateur. */
function lpAccess(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('gp')) return true;
  } catch { /* URL illisible : on retombe sur l'accès retenu */ }
  return !!savedAccess();
}

// Ce que la page ouvre, montré fermé (pas de chiffre : la porte est publique).
const BEHIND = ['Why now, in sourced figures', 'How we win the best founders', 'What founders and LPs gain, at real exit prices',
  'The fund, its returns and terms', 'How LPs are protected', 'Fact sheet, fund model and LP deck'];

function LpGate() {
  const [modal, setModal] = useState<'apply' | 'returning' | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <>
    <div className="pv-terms-page pv-gate">
      <div className="pv-wrap pv-gate-grid">
        <div>
          <Link to="/" className="pv-terms-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
          <p className="pv-kick pv-gate-kick"><Icon name="lock" />LPs · Private access</p>
          <h1 className="pv-rules-h">Backing AI-native teams building self-improving AI systems.</h1>
          <p className="pv-terms-lead">
            This page is for the investors we accept. Apply once. When we accept you, your private link
            opens this page and our live deal flow.
          </p>
          <p className="pv-terms-lead pv-gate-who">Our LPs are mainly high-net-worth individuals and family offices.</p>
          <div className="pv-ctas">
            <button type="button" className="pv-btn light" onClick={() => setModal('apply')}>Apply for LP access <Icon name="arrow" /></button>
            <button type="button" className="pv-btn ghost-light" onClick={() => setModal('returning')}>Already accepted? Get my link</button>
          </div>
        </div>
        <div className="pv-gate-card" aria-label="What the LP page holds">
          <p className="pv-gate-card-h">Behind the door</p>
          <ul>
            {BEHIND.map((b) => <li key={b}><Icon name="lock" />{b}</li>)}
            <li className="live"><span className="pv-dot" />Live deal flow, every evening</li>
          </ul>
        </div>
        <p className="pv-gate-note">
          EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
        </p>
      </div>
    </div>
    {/* hors du fond sombre : la boîte garde ses couleurs */}
    <DealFlowModal lp open={modal !== null} startPane={modal ?? 'apply'} onClose={() => setModal(null)} />
    </>
  );
}

export default function LpPage() {
  const [access] = useState(lpAccess);
  return access ? <LpContent /> : <LpGate />;
}

function LpContent() {
  // Le deal flow live : directement si ce navigateur en a l'accès (LP accepté), sinon la
  // candidature (popup). Un LP non accepté n'y accède jamais : /dealflow vérifie le jeton.
  const [open, setOpen] = useState(false);
  const follow = () => { if (savedAccess()) window.location.href = '/dealflow/'; else setOpen(true); };
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  const mailto = `mailto:${CONTACT}?subject=${encodeURIComponent('ProFund Fund I · indicative interest')}`;
  return (
    <div className="pfh">
      {/* ── Le héros : qui nous sommes, en quatre chiffres ── */}
      <header className="pv-hero pv-lp-hero">
        <div className="pv-wrap pv-hero-grid">
          <div className="pv-hero-copy">
            <Link to="/" className="pv-lp-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
            <span className="pv-eyebrow caps"><b />LPs · Pre-marketing phase · EuVECA</span>
            <h1 className="pv-h1 pv-h1-one">Backing AI-native teams building self-improving AI systems.</h1>
            <p className="pv-lead">
              Fund I, {FUND_SIZE}, pre-seed to Series B. We compete with the best funds for exceptional AI-native founders, and we
              win them on terms.
            </p>
            <div className="lp-kpis">
              <div><b>{mult(TARGET.net_tvpi)}</b><span>Target net TVPI</span></div>
              <div><b>{pct(TARGET.net_irr)}</b><span>Target net IRR</span></div>
              <div><b>{pct(FR.stake_at_exit, 1)}</b><span>Of our best company at exit, in the model</span></div>
              <div><b>{eurRange(F.first_close_min, F.first_close_max, 'tile', '–')}</b><span>First close</span></div>
            </div>
            <div className="pv-ctas">
              <a href="#allocation" className="pv-btn">Talk to the Founding Partner <Icon name="arrow" /></a>
              <button type="button" className="pv-btn line" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      {/* ── 01 · Pourquoi maintenant ── */}
      <Chapter n="01" id="shift" kicker="Why now" tint
        title="AI builds unicorns on a fraction of the capital."
        sub="The venture model has not changed: a round every 18 months, a slice of the company every time. The best founders now have every option, and they choose the terms.">
        <Stats items={[
          { b: '8 months', t: <>From launch to $100M ARR for Lovable (Stockholm), with 45 people.<Ref s={SRC.lovable100} /></> },
          { b: '146 people', t: <>Lovable’s whole team when it passed $400M ARR, in February 2026.<Ref s={SRC.lovable400} /></> },
          { b: '24 vs 37 months', t: <>To $5M ARR: the top 100 AI companies on Stripe, against the top 100 SaaS companies.<Ref s={SRC.stripe} /></> },
          { b: '$1.13M', t: <>Of ARR per employee in year one for Bessemer’s AI “supernovas”.<Ref s={SRC.bessemer} /></> },
        ]} />
      </Chapter>

      {/* ── 02 · Comment on gagne les meilleurs fondateurs ── */}
      <Chapter n="02" id="edge" kicker="How we win the best founders"
        title="The same cheques as the best funds. Better terms."
        sub="Exceptional founders have every option. We compete with Index Ventures, Balderton or Sequoia for the same rounds, and we win them on terms.">
        <div className="lp-pillars">
          <div>
            <span className="pv-ic"><Icon name="target" /></span>
            <h3>Cheque for cheque</h3>
            <p>Seed, pre-Series A, Series A, Series B: up to {eur(F.company_cap, 'tile')} per company from the fund, and SPVs with our LPs for the largest rounds. {pct(A.after_first_pct)} of what we invest goes in after the first cheque.</p>
          </div>
          <div>
            <span className="pv-ic"><Icon name="shield" /></span>
            <h3>Terms they can’t match</h3>
            <p>A public pact: the founder keeps the votes and the exit, no veto on how they run, raise or sell, no round ever pushed on them. When a top-tier fund leads, we follow its terms.</p>
          </div>
          <div>
            <span className="pv-ic"><Icon name="radar" /></span>
            <h3>Two AI engines</h3>
            <p>Every European seed round scored each week against our thesis, and every company we back gets its corporate development, inbound and outbound run for it.</p>
          </div>
        </div>
      </Chapter>
      <FounderEngines lp onFollow={follow} />

      {/* ── 03 · Ce que gagne le fondateur ── */}
      <Chapter n="03" id="founders" kicker="What the founder gets"
        title="What founders really keep."
        sub="Real listings and real medians. Then what our terms change, as a plain multiplication.">
        <h3 className="pv-h3 lp-t lp-t0">Seven European listings: what the founders held</h3>
        <div className="lp-list" role="table">
          <div className="lp-list-row head" role="row">
            <span role="columnheader">Company</span>
            <span role="columnheader">Valuation</span>
            <span role="columnheader">Raised before</span>
            <span role="columnheader">Founders’ stake at listing</span>
          </div>
          {LISTINGS.map((c) => (
            <div key={c.co} className="lp-list-row" role="row">
              <span className="co" role="cell"><b>{c.co}</b><small>{c.where}</small></span>
              <span role="cell"><small>Valuation</small><CitedLink c={c.val} /></span>
              <span role="cell"><small>Raised before</small><CitedLink c={c.raised} /></span>
              <span className="st" role="cell"><small>Founders’ stake at listing</small><a href={c.stakeUrl} target="_blank" rel="noopener noreferrer">{c.stakes}</a>{c.note && <em>{c.note}</em>}</span>
            </div>
          ))}
        </div>
        <p className="lp-read"><b>In these seven listings, no founder holds 20% of the capital.</b> Every figure links to its source. Not a statistical sample: these stakes reflect dilution and, for some founders, shares sold along the way.</p>

        <h3 className="pv-h3 lp-t">The median founding team</h3>
        <div className="pv-real in lp-medians">
          <div className="pv-real-carta">
            <ol>
              {MEDIANS.map((c) => (
                <li key={c.l} style={{ ['--w' as string]: `${(c.v / MEDIANS[0].v) * 100}%` }}>
                  <span className="l">{c.l}<Ref s={c.r} /><small>{c.s}</small></span>
                  <b>{pct(c.v, 1)}</b>
                  <i />
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="pv-fine lp-under">Carta’s data, fully diluted, is not specific to Europe. Deliveroo’s founder: 6.3% at its IPO, after about £1.3bn raised.<Ref s={SRC.deliveroo} /></p>

        <h3 className="pv-h3 lp-t">What our terms change, as a plain multiplication</h3>
        <div className="lp-co">
          <p className="lp-co-h"><b>Real: the sale prices and the medians. Our hypothesis: the right-hand column.</b> No company has followed this path yet. It assumes an AI-native company can grow on {amt(FM.loans)} of loans ({amt(DEBT)} to repay with interest) where the usual path sells far more equity. The founders then keep the {pct(MEDIAN_A, 1)} they hold after the Series A.</p>
          <p className="lp-co-def">The prices are those paid for the companies named, not what happened to their founders: we do not know their cap tables. We assume every investor converts into shares at these prices. A company that needs no further capital keeps more by taking neither path.</p>
        </div>
        <Ledgers sides={founderSides} />
      </Chapter>

      {/* ── 04 · Ce que gagnent les LPs ── */}
      <Chapter n="04" id="returns" kicker="What our LPs get" tint
        title="The same unicorn, three times the multiple."
        sub={`A cheque that is not topped up is diluted like the founders’. Funds that follow on keep more, and pay for it at every round. On our path, no round after ours dilutes us: ${pct(FR.stake_at_exit, 1)} of our best company at exit, in the model.`}>
        <h3 className="pv-h3 lp-t lp-t0">What a {amt(A_COST)} Series A cheque returns, as a plain multiplication</h3>
        <div className="lp-co">
          <p className="lp-co-h"><b>Real: the sale prices. Our hypothesis: a {amt(A_COST)} cheque for {pct(A_STAKE0)}.</b> Left, the cheque is not topped up and shrinks like the founders’ stake, from {pct(MEDIAN_A, 1)} to {pct(MEDIAN_D, 1)}: {pct(A_STAKE0)} × {(MEDIAN_D * 100).toFixed(1)} ÷ {(MEDIAN_A * 100).toFixed(1)} = {pct(A_STAKE_VC, 2)}. Right, no further equity round: it stays at {pct(A_STAKE0)}, behind {amt(DEBT)} of loans and interest repaid first.</p>
          <p className="lp-co-def">The returns on the loans themselves are left out. These are the prices of the companies named, not what their investors received.</p>
        </div>
        <Ledgers sides={lpSides} />

        <h3 className="pv-h3 lp-t">Europe’s exits follow a power law</h3>
        <Stats items={[
          { b: '0.7% → 68%', t: <>$1B+ deals were 0.7% of European tech M&amp;A over the past decade, and 68% of its value.<Ref s={SRC.atomico25} /></> },
          { b: '13% → 86%', t: <>$1B+ IPOs were 13% of European tech IPOs, and 86% of their value.<Ref s={SRC.atomico25} /></> },
          { b: '77%', t: <>Of European tech M&amp;A deals in 2023 were under $100M.<Ref s={SRC.atomico23} /></> },
        ]} />
        <Fold id="exits" title="15 real European exits, at every size" sub="Each one links to the buyer’s announcement or filing">
          <div className="pv-exit-bands lp-bands">
            {EXIT_BANDS.map((band) => (
              <div key={band.h} className="pv-exit-band">
                <h4>{band.h}</h4>
                <ul>
                  {band.items.map((it) => (
                    <li key={it.co}><b><ExitLink e={it} /></b><em>{it.v}</em><small>{it.d}</small></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="pv-fine">Values as disclosed, in their own currency; the tables above round them to the nearest sale price in euros.</p>
        </Fold>
      </Chapter>

      {/* ── 05 · Le fonds ── */}
      <Chapter n="05" id="fund" kicker="The fund"
        title={`${FUND_SIZE}, three layers, one power law.`}
        sub="A model, as for any fund before its launch. Like the best venture funds, one company carries it. Unlike them, our stake is not diluted when it does.">
        <div className="pv-figs lp-figs">
          <div><b>{pct(TARGET.net_irr)}</b><span><strong>Target net IRR.</strong> Base {pct(C.base.net_irr)}, stress {pct(C.stress.net_irr)}.</span></div>
          <div><b>{mult(TARGET.net_tvpi)}</b><span><strong>Target net TVPI.</strong> Base {mult(C.base.net_tvpi)}, stress {mult(C.stress.net_tvpi)}.</span></div>
          <div><b>{eur(TARGET.largest_exit, 'val')}</b><span><strong>One unicorn.</strong> {FR.company} returns {mult(FR.multiple_of_fund)} the fund on its own.</span></div>
          <div><b>{mult(NO_UNI.net_tvpi)}</b><span><strong>Without it.</strong> {BIG_UNICORN.label.replace(/^A bigger unicorn: /, '')}: {mult(BIG_UNICORN.net_tvpi)}.</span></div>
        </div>
        <div className="pv-stages lp-layers">
          {(['seed', 'venture', 'growth'] as const).map((id, i) => (
            <div key={id} className="pv-stage">
              <span className="pv-stage-n">Layer {i + 1}</span>
              <h3>{L[id].model_name}</h3>
              <dl>
                <div><dt>Stage</dt><dd>{['Pre-seed and seed', 'Pre-Series A and Series A', 'Series B and beyond'][i]}</dd></div>
                <div><dt>Ticket</dt><dd className="tk">{eurRange(L[id].ticket_min, id === 'growth' ? F.company_cap : L[id].ticket_max)}</dd></div>
                <div><dt>Companies</dt><dd>{L[id].companies}</dd></div>
              </dl>
            </div>
          ))}
        </div>
        <div className="lp-folds">
          <Fold id="fund-terms" title="Terms and allocation" sub="Size, fees, carry, GP commitment, where the money goes, where 36% comes from">
            <div className="lp-fund-tables"><TermsTables /></div>
          </Fold>
          <Fold id="fund-perf" title="Returns and stress tests" sub="Target, base and stress cases; without the unicorn; a bigger one">
            <div className="lp-fund-tables"><PerformanceTables /></div>
          </Fold>
          <Fold id="fund-sim" title="The simulation, line by line" sub="Every position of the three layers: cheques, buybacks, loans, stake at exit, return">
            <div className="lp-fund-tables lp-sim"><SimulationTables /></div>
          </Fold>
        </div>
        <Downloads deck />
      </Chapter>

      {/* ── 06 · Protection et équipe ── */}
      <Chapter n="06" id="protection" kicker="Protection and team" tint
        title="Founders get control. LPs keep the protection."
        sub="We give up the veto on how founders run, raise or sell. We keep a board seat and every right that protects capital.">
        <ul className="lp-prot">
          {PROTECTION.map((x) => (
            <li key={x.t}><Icon name={x.icon} /><span><b>{x.t}.</b> {x.d}</span></li>
          ))}
        </ul>
      </Chapter>
      <TheTeam lp tint={false} />

      {/* ── 07 · Ce que représenterait une allocation de 10 M€, et le contact ── */}
      <section className="pv-sec lp-ch lp-alloc-sec" id="allocation">
        <div className="pv-wrap">
          <div className="lp-alloc">
            <div className="lp-alloc-main">
              <span className="lp-ch-n">07</span>
              <p className="pv-kick">Your allocation</p>
              <h2>What {eur(TICKET, 'tile')} would represent.</h2>
              <ul className="lp-alloc-list">
                <li><b>{pct(TICKET / F.commitments)} of Fund I</b>, and {pct(TICKET / F.first_close_max)} to {pct(TICKET / F.first_close_min)} of the first close ({eurRange(F.first_close_min, F.first_close_max, 'tile', '–')}).</li>
                <li><b>In the model, net of fees, expenses and carry:</b> {eur(TICKET * TARGET.net_tvpi, 'tile')} in the target case, {eur(TICKET * C.base.net_tvpi, 'tile')} in the base case, {eur(TICKET * C.stress.net_tvpi, 'tile')} in the stress case.</li>
                <li><b>First-close terms:</b> a {pct(T.fee_first_close_pct, 2)} management fee, instead of {pct(T.fee_ip_pct)}.</li>
                <li><b>Co-investment:</b> SPVs open to our LPs on the largest rounds.</li>
                <li><b>Every company we review</b>, every evening, in the live deal flow.</li>
              </ul>
              <p className="lp-alloc-fine">Targets are model outputs, not a forecast or a guarantee. Pre-marketing: the fund is not yet established and no units can be subscribed; we register indicative interest only.</p>
            </div>
            <div className="lp-contact">
              <img src="/gp-photo.jpg" alt="Alexandre Busson" width={88} height={110} />
              <p className="lp-contact-name">Alexandre Busson</p>
              <p className="lp-contact-role">Founding Partner</p>
              <a className="lp-contact-line" href={PHONE_TEL}><Icon name="phone" />{PHONE}</a>
              <a className="lp-contact-line" href={`mailto:${CONTACT}`}><Icon name="mail" />{CONTACT}</a>
              <a className="pv-btn light lp-contact-go" href={mailto}>Register your interest <Icon name="arrow" /></a>
              <button type="button" className="pv-btn ghost-light lp-contact-go" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
              <a className="lp-contact-doc" href={FACTSHEET_URL} download><Icon name="file" />Fact sheet (PDF)</a>
            </div>
          </div>
          <div className="pv-notice pv-lp-notice">
            <p className="pv-notice-h">Pre-marketing phase</p>
            <p>
              This page is a pre-marketing communication within the meaning of Article 4a of
              Regulation (EU) No 345/2013 (EuVECA). The fund is not yet established and no units may
              be subscribed at this stage. For professional and eligible investors only.
            </p>
          </div>
        </div>
      </section>

      {/* ── Les sources, cliquables ── */}
      <section className="pv-sec lp-sources-sec" id="sources">
        <div className="pv-wrap">
          <p className="pv-kick">Sources</p>
          <ol className="lp-sources">
            {SOURCES.map((s) => (
              <li key={s.n} id={`src-${s.n}`}>
                <span>{s.n}</span>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<Icon name="out" /></a>
              </li>
            ))}
          </ol>
          <p className="pv-fine">Fund figures: the ProFund fund model, the same as the fact sheet and the Excel model; a model, not a track record. Listings and exits: each figure links to its own source.</p>
        </div>
      </section>
      <DealFlowModal lp open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
