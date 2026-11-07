import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CONTACT } from './LeadForm';
import { HeroVisual, Icon, type IconName } from './Thesis';
import { CollapseVisual, EnginesForLps, EnginesRunning, Numbers, Say, TheTeam, WhatWeBack, pathMoney } from './Founders';
import { Downloads, PerformanceTables, SimulationTables, TermsTables } from './ProFundPage';
import { Fold } from './Drawer';
import { savedAccess } from '../lib/access';
import { eur, eurRange, fund, mult, pct, type FounderPath } from '../lib/fund';
import { FACTSHEET_URL } from '../lib/links';

// /lp — LA PAGE DES LPs. 06/11 (6) : plus de plan numéroté, un seul raisonnement qu'on suit
// sans effort, chaque phrase appelant la suivante :
//   les bâtisseurs sont très peu (The kingmakers) → ils ont le choix, le capital n'est plus
//   rare (Capital is no longer scarce) → on a écrit ce que tout le monde dit (We wrote it
//   down) → ce qui est juste pour eux est ce qui paie le LP (What pays you) → un premier
//   fonds ne cache rien, il se regarde travailler (We run on what we back) → tout le détail
//   est là (The data room) → l'invitation (What €10M would represent).
// Humble et sans comparaison : on ne nomme aucun fonds. Tout chiffre du fonds lu dans
// fund.json et dit comme un modèle ; chiffres de tiers numérotés et cliquables (SOURCES, en
// bas). Ne pas modifier un chiffre de tiers sans relire sa source. Pas de barre du haut ni de
// formulaire. La page est fermée (candidats acceptés) : frais, carry et cibles y figurent.
// Barrière côté client : le texte reste dans le bundle JS.
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const T = fund.terms;
const C = fund.cases;
const A = fund.allocation;
const TARGET = C.target;
const FR = fund.fund_returner;
const NO_UNI = fund.stress_tests.find((s) => s.id === 'best_zombie')!;
const UNI_SAME = fund.stress_tests.find((s) => s.id === 'unicorn_same')!;
const BIG_UNICORN = fund.stress_tests.find((s) => s.id === 'big_unicorn')!;
const FUND_SIZE = eur(F.commitments, 'tile');
const PHONE = '+33 6 83 10 72 86';           // le même que la fiche PDF (factsheet.py, PHONE)
const PHONE_TEL = 'tel:+33683107286';
const TICKET = 10_000_000;                    // l'allocation discutée en fin de page (page, pas modèle)

const DELIVEROO_PROSPECTUS = 'https://lexismarkettracker.lexisnexis.com/documents/0035/35079/167313/MT_Deliveroo%20plc_prospectus_22%20March%202021.pdf';
// ── Les sources : numérotées, cliquables, listées en bas de page ──────────────
type Src = { n: number; label: string; url: string };
const SRC = {
  lovable100: { n: 1, label: 'TechCrunch, 23 July 2025: Lovable crosses $100M ARR eight months after launch, with 45 employees', url: 'https://techcrunch.com/2025/07/23/eight-months-in-swedish-unicorn-lovable-crosses-the-100m-arr-milestone' },
  lovable400: { n: 2, label: 'TechCrunch, 11 March 2026: Lovable at $400M ARR with 146 employees', url: 'https://techcrunch.com/2026/03/11/lovable-says-it-added-100m-in-revenue-last-month-alone-with-just-146-employees/' },
  bessemer: { n: 3, label: 'Bessemer Venture Partners, The State of AI 2025 (13 August 2025)', url: 'https://www.bvp.com/atlas/the-state-of-ai-2025' },
  carta: { n: 4, label: 'Carta, Founder Ownership Report 2026', url: 'https://carta.com/data/founder-ownership-2026/' },
  saastr: { n: 5, label: 'SaaStr on Carta data: founders hold 11.4% after the Series D', url: 'https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/' },
  deliveroo: { n: 6, label: 'Deliveroo plc, IPO prospectus, 22 March 2021: Will Shu’s stake, capital raised', url: DELIVEROO_PROSPECTUS },
  atomico25: { n: 7, label: 'Atomico, State of European Tech 2025: $1B+ exits, share of deals and of value', url: 'https://2025.stateofeuropeantech.com/chapters/unlocking-capital-and-liquidity' },
  atomico23: { n: 8, label: 'Atomico, State of European Tech 2023: 77% of M&A deals under $100M', url: 'https://2023.stateofeuropeantech.com/exits' },
  debt: { n: 9, label: 'First Citizens (formerly SVB), 22 September 2023: venture debt is typically sized at 20-40% of the last equity round', url: 'https://innovation.firstcitizens.com/business-growth/access-to-capital/right-amount-of-venture-debt' },
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

// Ce que nos termes changent : une multiplication, de vrais prix, les hypothèses dites en clair.
// 07/11 : les quatre chemins, chacun dit ce qu'il vend et emprunte. Le chemin « the same capital »
// lève autant que le chemin usuel ; les deux autres lèvent moins, et le disent.
const DEBT = FM.loan_debt;
const A_COST = FM.holders.find((h) => h.id === 'series_a')!.pref;
const A_STAKE0 = FM.holders.find((h) => h.id === 'series_a')!.stake;
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
const pathName = (p: FounderPath) => (p.id === 'vc' ? 'The usual path' : `With us, ${p.label.charAt(0).toLowerCase()}${p.label.slice(1)}`);
const afterLoans = (p: FounderPath, exit: number) => (p.loans > 0 ? exit - DEBT : exit);
type PathCell = { result: string; formula: string; edge?: string };

/** Ce que touchent les fondateurs : la part × ce qui reste une fois les prêts remboursés. */
function founderCell(p: FounderPath, exit: number): PathCell {
  const left = afterLoans(p, exit);
  const v = p.stake * left;
  const usual = FM.paths[0].stake * exit;
  return { result: amt(v), formula: `${pct(p.stake, 1)} × ${amt(left)}`,
    edge: p.id === 'vc' ? undefined : `${(v / usual).toFixed(1)}× the usual path` };
}

/** Ce que rend un chèque de Series A non renforcé : sa part baisse comme celle des fondateurs. */
function chequeCell(p: FounderPath, exit: number): PathCell {
  const left = afterLoans(p, exit);
  const stake = A_STAKE0 * (p.stake / MEDIAN_A);
  const v = stake * left;
  return { result: amt(v), formula: `${p.id === 'credit' ? pct(stake) : pct(stake, 2)} × ${amt(left)}`, edge: `${x1(v / A_COST)} the cheque` };
}

// ── Ce qu'on rend, ce qu'on garde : chaque ligne reste une clause du pacte (Pact.tsx) ──
const GIVE: { t: string; d: string }[] = [
  { t: 'The votes.', d: 'Our shares vote with the founder on how the company is run.' },
  { t: 'The board.', d: 'One seat for us. The majority stays theirs.' },
  { t: 'The next round.', d: 'We never push for one. Every follow-on is their call.' },
  { t: 'The exit.', d: 'We never block a sale that pays back what we invested.' },
];
// v3.19 (07/11) : ce que le pacte protège, clause par clause, vu par un LP exigeant.
const KEEP: { t: string; d: string }[] = [
  { t: 'A 1× preference.', d: 'On every cheque, first or follow-on, outside small seed rounds, with standard anti-dilution.' },
  { t: 'Loans repaid first.', d: 'Before any equity and on any change of control, with lender covenants.' },
  { t: 'No sale on the cheap.', d: 'Below our money back, no one can drag our shares into a sale. What a buyer pays a founder on the side counts as price.' },
  { t: 'Cash stays in the company.', d: 'Founder pay beyond budget, related-party deals and buybacks of founder shares need our approval.' },
  { t: 'Founders stay in.', d: 'Vesting with a cliff, a lock-up on founder shares, and a bad leaver returns every share at no more than cost.' },
  { t: 'Consent where it counts.', d: 'A board seat and monthly figures. Nothing ranks ahead of our shares or changes their rights without us.' },
  { t: 'Protections that wake up.', d: 'Fraud, a loan default or a breach of the pact ends the voting agreement and restores a classic lead’s consents.' },
];

// ── Les briques de mise en page ──────────────────────────────────────────────
function Stats({ items }: { items: { b: string; t: ReactNode }[] }) {
  return (
    <div className="lp-stats">
      {items.map((x) => <div key={x.b}><b>{x.b}</b><span>{x.t}</span></div>)}
    </div>
  );
}

/** Une ligne par prix de vente réel, une colonne par chemin : le résultat et son calcul, toujours visibles. */
function PathTable({ cell }: { cell: (p: FounderPath, exit: number) => PathCell }) {
  return (
    <div className="lp-pt" role="table">
      <div className="lp-pt-head" role="row">
        <span role="columnheader">Sold for</span>
        {FM.paths.map((p) => <span key={p.id} className={p.id} role="columnheader"><b>{pathName(p)}</b><small>{pathMoney(p)}</small></span>)}
      </div>
      {PRICES.map((r) => (
        <div key={r.exit} className={`lp-pt-row${r.exit >= UNICORN ? ' uni' : ''}`} role="row">
          <span className="lp-pt-price" role="rowheader">
            <b>{eur(r.exit, 'val')}</b>
            {r.exit >= UNICORN && <em>Unicorn</em>}
            <small>The price of <ExitLink e={r.e} /> ({r.e.d.split(' · ')[1]}, {r.e.v})</small>
          </span>
          {FM.paths.map((p) => {
            const c = cell(p, r.exit);
            return (
              <span key={p.id} className={`lp-pt-c ${p.id}`} role="cell">
                <small className="l">{pathName(p)}</small>
                <b>{c.result}</b>
                <i>{c.formula}</i>
                {c.edge && <em>{c.edge}</em>}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Les règles de protection, vues des LPs (pacte à 12 clauses, Pact.tsx).
const PROTECTION: { icon: IconName; t: string; d: string }[] = [
  { icon: 'shield', t: '1× preference', d: 'On every cheque, first or follow-on, outside small seed rounds. Broad-based weighted-average anti-dilution; no full ratchet, no cumulative dividend.' },
  { icon: 'banknote', t: 'Loans first', d: 'Lender covenants; repaid before any equity and on any change of control. A default not cured within 30 days makes the loan callable.' },
  { icon: 'file', t: 'A board seat', d: 'Monthly figures, quarterly accounts, and consent on anything that would change our shares.' },
  { icon: 'scale', t: 'Independent pricing', d: 'Every buyback is priced by an independent valuer, out of distributable reserves, never from a founder without our consent.' },
  { icon: 'trend', t: 'Pro-rata and the lead’s terms', d: 'Our pro-rata on every new issue. If another investor leads a priced round, our shares keep their rights and we invest on the lead’s terms.' },
  { icon: 'door', t: 'Exit', d: 'Tag-along on any founder sale. No drag below our money back without our consent; independent buyer, cash or listed shares, warranties capped; side payments to founders count as price.' },
  { icon: 'handshake', t: 'Vesting and leavers', d: 'Four years with a one-year cliff, a lock-up on founder shares, a one-year non-compete; a bad leaver returns every share at the lower of cost and fair value.' },
  { icon: 'lock', t: 'Conflicts', d: 'Our shares abstain on our own loans and buybacks; founder pay beyond budget and related-party deals need our director; fund-side conflicts go to the LP advisory committee.' },
  { icon: 'check', t: 'Fallback', d: 'Fraud, misconduct, a breach of the pact, a loan default or insolvency end the voting agreement and restore a classic lead’s consents. Investment committee, key-person clause.' },
];

/** L'accès à la page : l'aperçu du GP (?gp), ou l'accès au deal flow de ce navigateur. */
function lpAccess(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('gp')) return true;
  } catch { /* URL illisible : on retombe sur l'accès retenu */ }
  return !!savedAccess();
}

// Ce que la page ouvre, montré fermé (pas de chiffre : la porte est publique).
const BEHIND = ['The thesis, in sourced figures', 'Terms that protect capital and share the upside',
  'The fund, its returns and terms', 'The data room: every figure, every clause', 'Fact sheet, fund model and LP deck'];

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
      <header className="pv-sec night lp-hero">
        <div className="pv-wrap">
          <Link to="/" className="lp-hero-logo" aria-label="ProFund"><img className="pv-rules-logo" src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
          <p className="lp-hero-eye">Fund I · {FUND_SIZE} · EuVECA pre-marketing</p>
          <h1 className="lp-hero-h">Backing AI-native teams building self-improving AI systems.</h1>
          <p className="lp-hero-lead">A few people now build what used to take thousands. We stand beside them, on terms that finally say so.</p>
          <div className="pv-ctas">
            <a href="#allocation" className="pv-btn light">Talk to the Founding Partner <Icon name="arrow" /></a>
            <button type="button" className="pv-btn ghost-light" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
          </div>
          <div className="lp-hero-shot"><HeroVisual /></div>
        </div>
      </header>

      {/* 07/11 : la même thèse et la même vision que l'accueil (certains LPs ne verront que /lp) */}
      <Say id="few" title="The companies that define this era will be built by very few people.">
        <CollapseVisual />
        <Numbers items={[
          { b: '8 months', t: <>From launch to $100M ARR for Lovable, in Stockholm, with 45 people.<Ref s={SRC.lovable100} /></> },
          { b: '146 people', t: <>Lovable’s whole team when it passed $400M ARR.<Ref s={SRC.lovable400} /></> },
          { b: '$1.13M', t: <>Of ARR per employee in year one, for Bessemer’s AI “supernovas”.<Ref s={SRC.bessemer} /></> },
        ]} />
      </Say>

      <WhatWeBack />

      <Say id="ownership" title="Capital is no longer scarce. Control is."
        lead={<p className="pv-say-p">A team that does not need an army does not need a round every 18 months. Yet venture still runs on the old bargain: capital, for a slice of the company and a say in how it is run. The best founders no longer have to accept it. The funds that matter next will be the ones they choose.</p>}>
        <Numbers items={[
          { b: pct(MEDIAN_D, 1), t: <>What the median founding team holds after a Series D.<Ref s={SRC.saastr} /></> },
          { b: '6.3%', t: <>What Deliveroo’s founder held at its IPO, after about £1.3bn raised.<Ref s={SRC.deliveroo} /></> },
          { b: 'Under 20%', t: 'Every founder, in seven major European listings. Each one sourced in the data room.' },
        ]} />
      </Say>

      <Say id="terms" tone="tint" title="Every fund says founders come first. We wrote it down."
        lead={<p className="pv-say-p">A public pact, the same for every founder. We give back everything about running the company. We keep everything that protects your capital.</p>}>
        <div className="lp-deal">
          <div className="give">
            <h3>What belongs to the founders</h3>
            <ul>{GIVE.map((x) => <li key={x.t}><b>{x.t}</b>{x.d}</li>)}</ul>
          </div>
          <div>
            <h3>What protects your capital</h3>
            <ul>{KEEP.map((x) => <li key={x.t}><b>{x.t}</b>{x.d}</li>)}</ul>
          </div>
        </div>
        <p className="lp-deal-end">Protect the capital. Share the upside with the people who create it.</p>
        <Link to="/terms" className="pv-link lp-deal-go">Read the pact <Icon name="arrow" /></Link>
      </Say>

      {/* 07/11 : la réponse à « pourquoi vous face aux géants ? » (Alexandre : « parfait »). On ne se bat
          pas sur la taille : on gagne en arrivant les premiers, en étant utiles, en étant alignés. */}
      <Say id="win" tone="night" title="How a focused fund wins the best founders."
        lead={<p className="pv-say-p">Not on cheque size. Where size does not help.</p>}>
        <Numbers items={[
          { b: 'First.', t: 'Our deal flow engine tracks every European seed round, every week, and flags the inflection before it becomes consensus.' },
          { b: 'Useful.', t: 'Each founder gets an in-house Chief Fundraising Officer, and the two AI engines that already run Proplace and Maximum Insurance.' },
          { b: 'Aligned.', t: 'The terms the best founders negotiate, from their first cheque. In writing, in a public pact.' },
        ]} />
        <p className="pv-fine pv-three-src">The largest funds lead the largest rounds. We stay at the founder’s side, with SPVs that keep that upside for our LPs.</p>
      </Say>

      <Say id="returns" title="What is right for them is what pays you."
        lead={<p className="pv-say-p">Every share a company does not issue protects the founders’ stake, and ours. The less equity a team needs, the more we both hold when it becomes a unicorn. One company can carry the fund. And if no unicorn comes, what we kept still works for you.</p>}>
        <Numbers four items={[
          { b: mult(TARGET.net_tvpi), t: 'Target net TVPI' },
          { b: pct(TARGET.net_irr), t: 'Target net IRR' },
          { b: mult(FR.multiple_of_fund), t: `The fund, returned by our best company alone, at ${pct(FR.stake_at_exit, 1)} at exit` },
          { b: mult(NO_UNI.net_tvpi), t: 'Net TVPI if no unicorn comes' },
        ]} />
        <p className="pv-fine pv-three-src">Outputs of our fund model, not a track record, a forecast or a guarantee. TVPI and IRR net of fees, expenses and carry. Base case {mult(C.base.net_tvpi)}, stress case {mult(C.stress.net_tvpi)}. The target assumes our best company grows on credit; if it also sold {eur(FM.paths[1].equity, 'tile')} of equity along the way: {mult(UNI_SAME.net_tvpi)}. No company has followed this path yet.</p>
      </Say>

      <Say id="engines" tone="night" title="We run on what we back."
        lead={<p className="pv-say-p">This is a first fund, and we will not pretend otherwise. What we can show you is how we work: a small team, two AI engines that already run real companies, and every company we review, every evening, in a live deal flow you can watch yourself. Not once a quarter.</p>}>
        <div className="lp-run"><EnginesRunning /></div>
        <div className="pv-ctas pv-run-cta">
          <button type="button" className="pv-btn light" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
        </div>
      </Say>
      <TheTeam lp tint={false} />

      <Say id="data-room" tone="tint" title="The data room."
        lead={<p className="pv-say-p">Every figure and every clause behind this page, with its source. Nothing here asks to be taken on trust.</p>}>
        <div className="pv-say-folds">
          <Fold id="room-keep" title="What founders really keep" sub="Seven European listings and Carta’s medians, every figure with its source">
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
            <p className="pv-fine lp-under">Carta’s data, fully diluted, is not specific to Europe.</p>
          </Fold>

          <Fold id="room-math" title="What our terms change, at real sale prices" sub="A plain multiplication, for the founders and for a Series A cheque">
            <div className="lp-co">
              <p className="lp-co-h"><b>Real: the sale prices and Carta’s medians. Our hypothesis: the three paths with us.</b> No company has followed them yet, and the valuations are the same on every path. Credit replaces what it can: {amt(FM.loans)} of loans, at {pct(FM.loan_share.min)} to {pct(FM.loan_share.max)} of the last round, within the usual 20% to 40% for venture debt<Ref s={SRC.debt} />, subject to our partner lenders. With interest, {amt(DEBT)} is repaid before any equity: a {amt(PRICES[0].exit)} sale leaves {amt(PRICES[0].exit - DEBT)}.</p>
              <p className="lp-co-def">The prices are those paid for the companies named, not what happened to their founders or investors: we do not know their cap tables. We assume every investor converts into shares at these prices.</p>
            </div>
            <h3 className="pv-h3 lp-t lp-t0">For the founders</h3>
            <PathTable cell={founderCell} />
            <h3 className="pv-h3 lp-t">For a {amt(A_COST)} Series A cheque</h3>
            <p className="lp-read lp-fold-lead">Our hypothesis: {amt(A_COST)} for {pct(A_STAKE0)}. The cheque is not topped up, so it shrinks with the founders’ stake: on the same capital, {pct(A_STAKE0)} × {(FM.paths[1].stake * 100).toFixed(1)} ÷ {(MEDIAN_A * 100).toFixed(1)} = {pct(A_STAKE0 * (FM.paths[1].stake / MEDIAN_A), 2)}. Funds that follow on keep more, and pay for it at every round. The returns on the loans themselves are left out.</p>
            <PathTable cell={chequeCell} />
          </Fold>

          <Fold id="room-exits" title="Europe’s exits follow a power law" sub="Atomico’s data, and 15 real exits at every size">
            <Stats items={[
              { b: '0.7% → 68%', t: <>$1B+ deals were 0.7% of European tech M&amp;A over the past decade, and 68% of its value.<Ref s={SRC.atomico25} /></> },
              { b: '13% → 86%', t: <>$1B+ IPOs were 13% of European tech IPOs, and 86% of their value.<Ref s={SRC.atomico25} /></> },
              { b: '77%', t: <>Of European tech M&amp;A deals in 2023 were under $100M.<Ref s={SRC.atomico23} /></> },
            ]} />
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
            <p className="pv-fine">Each name links to the buyer’s announcement or filing. Values as disclosed, in their own currency.</p>
          </Fold>

          <Fold id="room-fund" title="The fund: layers, terms and allocation" sub="Size, tickets, fees, carry, GP commitment, where the money goes">
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
            <p className="lp-read lp-fold-lead">{pct(A.after_first_pct)} of what we invest goes in after the first cheque: follow-ons, buybacks and loans.</p>
            <div className="lp-fund-tables"><TermsTables /></div>
          </Fold>

          <Fold id="room-perf" title="Returns and stress tests" sub="Target, base and stress cases; without the unicorn; a bigger one">
            <div className="lp-fund-tables"><PerformanceTables /></div>
          </Fold>

          <Fold id="room-sim" title="The simulation, line by line" sub="Every position of the three layers: cheques, buybacks, loans, stake at exit, return">
            <div className="lp-fund-tables lp-sim"><SimulationTables /></div>
          </Fold>

          <Fold id="room-protect" title="What protects your capital, in full" sub="From the 12 clauses of the pact and the fund’s conflict policy">
            <ul className="lp-prot">
              {PROTECTION.map((x) => (
                <li key={x.t}><Icon name={x.icon} /><span><b>{x.t}.</b> {x.d}</span></li>
              ))}
            </ul>
          </Fold>

          <Fold id="room-engines" title="The two engines, step by step" sub="How they source for the fund, and what they run for each company">
            <EnginesForLps />
          </Fold>
        </div>
        <div className="lp-room-dl"><Downloads deck /></div>
      </Say>

      <section className="pv-sec lp-alloc-sec" id="allocation">
        <div className="pv-wrap">
          <div className="lp-alloc">
            <div className="lp-alloc-main">
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

      <section className="pv-sec lp-sources-sec" id="sources">
        <div className="pv-wrap">
          <p className="pv-kick">Sources</p>
          <ol className="lp-sources">
            {SOURCES.map((x) => (
              <li key={x.n} id={`src-${x.n}`}>
                <span>{x.n}</span>
                <a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}<Icon name="out" /></a>
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
