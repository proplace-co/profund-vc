import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CONTACT } from './LeadForm';
import { HeroVisual, Icon, type IconName } from './Thesis';
import { CollapseVisual, EnginesForLps, EnginesRunning, Numbers, Say, TheTeam, WhatWeBack } from './Founders';
import { Downloads, PerformanceTables, SimulationTables, TermsTables } from './ProFundPage';
import { Fold } from './Drawer';
import { savedAccess } from '../lib/access';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';
import { FACTSHEET_URL } from '../lib/links';

// /lp — LA PAGE DES LPs. 06/11 (6) : plus de plan numéroté, un seul raisonnement qu'on suit
// sans effort, chaque phrase appelant la suivante :
//   les bâtisseurs sont très peu (The kingmakers) → ils ont le choix, le capital n'est plus
//   rare (Capital is no longer scarce) → on a écrit ce que tout le monde dit (We wrote it
//   down) → ce qui est juste pour eux est ce qui paie le LP (What pays you) → un premier
//   fonds ne cache rien, il se regarde travailler (We run on what we back) → tout le détail
//   est là (Check every figure) → les questions des LPs (07/11, Questions you might ask) →
//   l'invitation (What €10M would represent).
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
// 07/11 : la cible affichée est le cas prudent (clé « base ») ; le cas modélisé est l'upside.
const TARGET = C.base;
const UPSIDE = C.target;
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
  // 07/11 : la question de la liquidité (FAQ), chaque source relue le 07/11/2026
  jefferies: { n: 9, label: 'Jefferies, 2025 Global Secondary Market Review: $240 billion of secondary volume in 2025, up 48%, a record', url: 'https://www.jefferies.com/insights/the-big-picture/2025-global-secondary-market-review-another-record-breaking-year/' },
  forge: { n: 10, label: 'Business Wire, 2 March 2026: Charles Schwab completes its acquisition of Forge Global', url: 'https://www.businesswire.com/news/home/20260302211827/en/Charles-Schwab-Completes-Acquisition-of-Forge-Global' },
  spacex: { n: 11, label: 'Deseret News, 12 June 2026: SpaceX raises about $75 billion on Nasdaq, the largest IPO ever', url: 'https://www.deseret.com/business/2026/06/12/spacex-ipo-elon-musk-stock-market-debut-nasdaq-exchange-xai-tesla-star-trek-science-fiction-future/' },
  secTokens: { n: 12, label: 'Morgan Lewis, February 2026: the SEC staff statement on tokenized securities', url: 'https://www.morganlewis.com/pubs/2026/02/sec-clarifies-federal-securities-law-treatment-of-tokenized-securities' },
  secExempt: { n: 13, label: 'Troutman Pepper Locke, 26 October 2026: the SEC’s Innovation Exemption covers stock listed on a national exchange', url: 'https://www.troutman.com/insights/sec-innovation-exemption-opens-path-to-onchain-trading-of-listed-stock-subject-to-issuer-objection/' },
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

// ── Ce qu'on rend, ce qu'on garde : chaque ligne reste une clause du pacte (Pact.tsx) ──
const GIVE: { t: string; d: string }[] = [
  { t: 'The votes.', d: 'Our shares vote with the founder on how the company is run.' },
  { t: 'The board.', d: 'One seat for us. The majority stays theirs.' },
  { t: 'The next round.', d: 'We never push for one. Every follow-on is their call.' },
  { t: 'The exit.', d: 'We never block a sale that pays back what we invested.' },
];
// v3.19 (07/11) : ce que le pacte protège, clause par clause, vu par un LP exigeant. v3.17 du modèle
// (07/11) : le fonds ne prête plus, « Loans repaid first » devient les rachats évalués (clause 4).
const KEEP: { t: string; d: string }[] = [
  { t: 'A 1× preference.', d: 'On every cheque, first or follow-on, outside small seed rounds, with standard anti-dilution.' },
  { t: 'Buybacks priced independently.', d: 'By an independent valuer, never while the company is in default on its debt, never from a founder without our approval.' },
  { t: 'No sale on the cheap.', d: 'Below our money back, no one can drag our shares into a sale. What a buyer pays a founder on the side counts as price.' },
  { t: 'Cash stays in the company.', d: 'Founder pay beyond budget, related-party deals and buybacks of founder shares need our approval.' },
  { t: 'Founders stay in.', d: 'Vesting with a cliff, a lock-up on founder shares, and a bad leaver returns every share at no more than cost.' },
  { t: 'Consent where it counts.', d: 'A board seat and monthly figures. Nothing ranks ahead of our shares or changes their rights without us.' },
  { t: 'Protections that wake up.', d: 'Fraud, a payment default on the company’s debt or a breach of the pact ends the voting agreement and restores a classic lead’s consents.' },
];

// ── Les questions des LPs (07/11) : la part publiable de la FAQ de préparation (document Claude
// « ProFund Fund I : pitch et FAQ LP »). Seulement ce qui est décidé : pas de fiscalité (avis en attente),
// pas de domicile (plus de « Luxembourg » dans la copie), pas de nom de successeur, aucune question
// « piège ». Tout chiffre du fonds lu dans fund.json ; dit comme une intention pour les documents du fonds.
const ALL_LINES = (['seed', 'venture', 'growth'] as const).flatMap((id) => L[id].lines);
const BUY_DISC = (ids: ('seed' | 'venture' | 'growth')[]) => ids.flatMap((id) => L[id].lines)
  .filter((l) => l.buyback && l.discount !== null).map((l) => l.discount!);
const WIN_DISC = BUY_DISC(['seed', 'venture']);
const CALLED = (y: number) => TARGET.cashflows.calls.slice(0, y).reduce((s, v) => s + v, 0) / F.commitments;
const IP = F.investment_period_years;
const FAQ: { id: string; q: string; a: ReactNode }[] = [
  { id: 'faq-debt', q: 'Why doesn’t the fund lend?',
    a: <>Lending well is a profession of its own, and a fund that lends to the companies it owns sits on both sides of the table. So the fund holds equity only. When debt can carry a company’s growth, we raise it for the founders from our partner banks: we build the case, negotiate the terms and stay at the table. The loan is between the company and the bank, and ProFund takes no fee and no warrants on it.</> },
  { id: 'faq-ic', q: 'Who decides an investment?',
    a: <>An authorised manager (AIFM) runs the fund and keeps a veto on compliance and risk; its selection is under way. Every investment goes through an investment committee where external members, chosen among our LPs, sit alongside the Founding Partner, who never invests alone. An LP advisory committee approves every conflict of interest.</> },
  { id: 'faq-key', q: 'You are a solo GP. What if something happens to you?',
    a: <>The money never depends on one person: a depositary holds the assets, an authorised manager runs the fund, a committee invests. A successor, named in the fund documents, sits on the investment committee from day one. A key-person event suspends the investment period. If the LPs do not approve the successor, it ends: uncalled commitments are released, uninvested cash is returned, and the portfolio is managed to exit at reduced fees. A key-person insurance, paid by the management company, funds the transition.</> },
  { id: 'faq-votes', q: 'Your shares vote with the founder. What protects our capital?',
    a: <>The voting agreement covers how the company is run, never what protects capital: shares ranking ahead of ours, a change to our rights, related-party deals, founder pay beyond budget, and the terms of any sale. It lasts ten years at most and ends if the founder leaves, sells control, or another investor leads a priced round. Our classic protections sleep while the company is run in good faith; fraud, gross misconduct, a material breach of the pact, a payment default on the company’s debt or insolvency wake them up.</> },
  // 07/11 (Alexandre) : la liquidité sans le contrôle. Ce que le pacte signe, puis le marché, sourcé ;
  // jamais « liquidité assurée » : les tokens ne couvrent pas encore les sociétés non cotées (SEC).
  { id: 'faq-liquidity', q: 'Without control of the company, how do you get to liquidity?',
    a: <>Control rarely creates liquidity: a sale or an IPO needs the founder anyway, so the pact puts us on the founder’s side of it. Whenever founders sell, in a round or in a sale of control, we can sell alongside them on the same terms (clauses 9 and 10). No one can drag our shares into a sale that returns less than we invested, and a sale we can be dragged into is to an independent buyer, for cash or listed shares. The ways out keep widening: secondaries reached a record $240 billion in 2025, up 48%<Ref s={SRC.jefferies} />; Schwab now owns Forge Global, a marketplace for private shares<Ref s={SRC.forge} />; SpaceX listed in June 2026 in the largest IPO ever, about $75 billion<Ref s={SRC.spacex} />. Tokens are not there yet for private companies: a token does not change what a share is, a third-party token gives no rights from the company<Ref s={SRC.secTokens} />, and the SEC’s path to onchain trading covers listed stock only<Ref s={SRC.secExempt} />. Our model counts on none of it: each company pays back only at its exit.</> },
  { id: 'faq-buyback', q:'Buying out angels at a discount: is it fair to them?',
    a: <>No one has to sell. An angel who sells gets liquidity years before an exit, with the founder’s agreement, at a price set by an independent valuer. The model assumes {pct(Math.min(...WIN_DISC))} to {pct(Math.max(...WIN_DISC))} below the valuation of the time on winners and angels, {pct(Math.max(...BUY_DISC(['growth'])))} on blocks bought from end-of-life funds.</> },
  { id: 'faq-calls', q: 'When is my money called?',
    a: <>As we invest, never upfront. In the model, about {pct(CALLED(1))} of commitments is called by the end of year 1, {pct(CALLED(3))} by year 3 and {pct(CALLED(IP))} by year {IP}. Exits run from year {Math.min(...ALL_LINES.map((l) => l.exit_year))} to year {Math.max(...ALL_LINES.map((l) => l.exit_year))}.</> },
  { id: 'faq-cost', q: 'What does the fund cost?',
    a: <>A management fee of {pct(T.fee_ip_pct)} of commitments for {IP} years ({pct(T.fee_first_close_pct, 2)} for first-close LPs), then {pct(T.fee_post_pct, 1)} of invested capital: {eur(A.mgmt_fees)} over the fund’s life in the model, plus {eur(A.fund_expenses)} of fund expenses. Carried interest of {pct(T.carry_pct)} over an {pct(T.hurdle_pct)} hurdle, on the whole fund: the team earns nothing before LPs have their paid-in capital and the hurdle back. Fees and expenses are estimates until the manager’s quote.</> },
  { id: 'faq-gp', q: 'How much does the team put in?',
    a: <>At least {pct(T.gp_commit_min_pct)} of commitments, {eur(T.gp_commit_min, 'tile')} at {eur(F.commitments, 'tile')}, in the fund alongside you. Like every LP’s commitment, it is called as we invest: about {eur(Math.round(T.gp_commit_min * CALLED(1) / 1e4) * 1e4)} in year 1 and {eur(Math.round(T.gp_commit_min * CALLED(3) / 1e4) * 1e4)} by year 3. We fund it by waiving part of our management fee: that part of the fee goes into the fund instead of to us, and the waiver is written in the fund documents.</> },
  { id: 'faq-who', q: 'Who can invest?',
    a: <>Professional investors, and eligible investors who confirm in writing that they understand the risks (Article 6(1) of the EuVECA Regulation), with a minimum commitment of €500,000. The fund is in pre-marketing: no units can be subscribed yet.</> },
  { id: 'faq-exit', q: 'Can I sell my units before the end?',
    a: <>The fund is closed-ended, for {F.term_years} years. As in any such fund, units can be transferred to another eligible investor with the manager’s consent.</> },
];

// ── Les briques de mise en page ──────────────────────────────────────────────
function Stats({ items }: { items: { b: string; t: ReactNode }[] }) {
  return (
    <div className="lp-stats">
      {items.map((x) => <div key={x.b}><b>{x.b}</b><span>{x.t}</span></div>)}
    </div>
  );
}


/** L'accès à la page : l'aperçu du GP (?gp), ou l'accès au deal flow de ce navigateur. */
function lpAccess(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('gp')) return true;
  } catch { /* URL illisible : on retombe sur l'accès retenu */ }
  return !!savedAccess();
}

// Ce que la page ouvre, montré fermé (pas de chiffre : la porte est publique).
const BEHIND = ['The thesis, in sourced figures', 'Terms that protect capital and share the upside',
  'The fund, its returns and terms', 'Every figure, with its source', 'Fact sheet, fund model and LP deck'];

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
          { b: 'Under 20%', t: 'Every founder, in seven major European listings. Each one sourced below.' },
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
          { b: 'Useful.', t: 'Each founder gets an in-house Chief Fundraising Officer, and the two AI engines that already run Proplace, Maximum Insurance, Sosuites and WinHealth Group.' },
          { b: 'Aligned.', t: 'The terms the best founders negotiate, from their first cheque. In writing, in a public pact.' },
        ]} />
        <p className="pv-fine pv-three-src">The largest funds lead the largest rounds. We stay at the founder’s side, with SPVs that keep that upside for our LPs.</p>
      </Say>

      <Say id="returns" title="What is right for them is what pays you."
        lead={<p className="pv-say-p">Every share a company does not issue protects the founders’ stake, and ours. The less equity a team needs, the more we both hold when it becomes a unicorn. One company can carry the fund. And if no unicorn comes, the fund still returns more than your capital.</p>}>
        <Numbers four items={[
          { b: mult(TARGET.net_tvpi), t: 'Target net TVPI' },
          { b: pct(TARGET.net_irr), t: 'Target net IRR' },
          { b: mult(UPSIDE.net_tvpi), t: 'Net TVPI in the upside, at modelled exit values' },
          { b: mult(NO_UNI.net_tvpi), t: 'Net TVPI if no unicorn comes' },
        ]} />
        <p className="pv-fine pv-three-src">Outputs of our fund model, not a track record, a forecast or a guarantee. TVPI and IRR net of fees, expenses and carry. Target: every exit at {pct(C.base.exit_mult)} of its modelled value. Upside: modelled values; our best company, sold for {eur(UPSIDE.largest_exit, 'val')} with {pct(FR.stake_at_exit, 1)} at exit, returns {mult(FR.multiple_of_fund)} the fund on its own, and a {eur(FR.fund_returning_exit, 'val')} sale already returns it. Stress: every exit at {pct(C.stress.exit_mult)}, {mult(C.stress.net_tvpi)}. The target assumes our best company grows on bank debt; if it also sold {eur(FM.paths[1].equity, 'tile')} of equity along the way: {mult(UNI_SAME.net_tvpi)}. No company has followed this path yet.</p>
      </Say>

      <Say id="engines" tone="night" title="We run on what we back."
        lead={<p className="pv-say-p">This is a first fund, and we will not pretend otherwise. What we can show you is how we work: a small team, two AI engines that already run real companies, and every company we review, every evening, in a live deal flow you can watch yourself. Not once a quarter.</p>}>
        <div className="lp-run"><EnginesRunning /></div>
        <div className="pv-ctas pv-run-cta">
          <button type="button" className="pv-btn light" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
        </div>
      </Say>
      <TheTeam lp tint={false} />

      {/* 07/11 : plus « The data room » (Alexandre : ils ne comprendront pas) ; purgée de ce qui
          répétait la page (les chemins de dilution, la protection en double). */}
      <Say id="check" tone="tint" title="Check every figure."
        lead={<p className="pv-say-p">The detail behind this page. Each figure links to its source or to its line in our model.</p>}>
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
            <p className="lp-read lp-fold-lead">{pct(A.after_first_pct)} of what we invest goes in after the first cheque: buybacks and follow-ons.</p>
            <div className="lp-fund-tables"><TermsTables /></div>
          </Fold>

          <Fold id="room-perf" title="Returns and stress tests" sub="Target, base and stress cases; without the unicorn; a bigger one">
            <div className="lp-fund-tables"><PerformanceTables /></div>
          </Fold>

          <Fold id="room-sim" title="The simulation, line by line" sub="Every position of the three layers: cheques, buybacks, follow-ons, stake at exit, return">
            <div className="lp-fund-tables lp-sim"><SimulationTables /></div>
          </Fold>

          <Fold id="room-engines" title="The two engines, step by step" sub="How they source for the fund, and what they run for each company">
            <EnginesForLps />
          </Fold>
        </div>
        <div className="lp-room-dl"><Downloads deck /></div>
      </Say>

      <Say id="faq" title="Questions you might ask."
        lead={<p className="pv-say-p">Answered plainly. These are our intentions for the fund documents, which will settle each point; until then, terms may change.</p>}>
        <div className="pv-say-folds">
          {FAQ.map((f) => (
            <Fold key={f.id} id={f.id} title={f.q}><p className="lp-read lp-fold-text">{f.a}</p></Fold>
          ))}
        </div>
      </Say>

      <section className="pv-sec lp-alloc-sec" id="allocation">
        <div className="pv-wrap">
          <div className="lp-alloc">
            <div className="lp-alloc-main">
              <p className="pv-kick">Your allocation</p>
              <h2>What {eur(TICKET, 'tile')} would represent.</h2>
              <ul className="lp-alloc-list">
                <li><b>{pct(TICKET / F.commitments)} of Fund I</b>, and {pct(TICKET / F.first_close_max)} to {pct(TICKET / F.first_close_min)} of the first close ({eurRange(F.first_close_min, F.first_close_max, 'tile', '–')}).</li>
                <li><b>In the model, net of fees, expenses and carry:</b> {eur(TICKET * TARGET.net_tvpi, 'tile')} in the target case, {eur(TICKET * UPSIDE.net_tvpi, 'tile')} in the upside, {eur(TICKET * C.stress.net_tvpi, 'tile')} in the stress case.</li>
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
