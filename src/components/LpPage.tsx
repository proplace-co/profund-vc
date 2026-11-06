import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CONTACT } from './LeadForm';
import { FourLaws, HeroVisual, Icon, Manifesto, type IconName } from './Thesis';
import { FounderEngines, TheTeam, founderNote } from './Founders';
import { Downloads, PerformanceTables, TermsTables } from './ProFundPage';
import { savedAccess } from '../lib/access';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';
import { millions, payout, vcCapTable } from '../lib/founderMath.js';
import { FACTSHEET_URL } from '../lib/links';

// /lp — LA PAGE DES LPs (v3.10, Antoine, 05/11 ; réécrite le 06/11 pour un LP exigeant,
// qui doit tout trouver dès la première visite). Rien qui s'adresse aux fondateurs (c'est
// l'accueil). Dans l'ordre : le fonds en un coup d'œil (cibles, termes, documents), le
// manifeste, la nouvelle ère en chiffres sourcés, les lois, le modèle et le
// co-investissement, les sorties européennes réelles, la protection, les moteurs (le
// process et la preuve), l'équipe, les termes complets, l'accès au deal flow. Pas de
// barre du haut, pas de formulaire : le seul bouton est le deal flow (direct si accepté,
// sinon la candidature). La page étant fermée, frais, carry et cibles y figurent, lus dans
// fund.json comme la fiche et /pitch. Chiffres de tiers sourcés en note : ne pas les
// modifier sans relire la source. La mention de pré-commercialisation est celle de /legal, de la fiche et du
// popup : les changer ensemble.
// v3.15 (06/11) : la page est réservée aux candidats acceptés, derrière la MÊME
// candidature que le deal flow (DealFlowModal, `lp`). Elle s'ouvre quand ce navigateur
// a l'accès retenu par /dealflow (lib/access.ts : lien magique vérifié une fois), ou
// avec ?gp dans l'URL (aperçu du GP : profund.vc/lp/?gp). Barrière côté client : le
// texte reste dans le bundle JS, ne rien mettre ici qui doive rester secret.
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const FUND_SIZE = eur(F.commitments, 'tile');
const T = fund.terms;
const C = fund.cases;
const TARGET = C.target;
// v3.16 (06/11) : la licorne est dans la cible ; son absence et une plus grosse sont des tests.
const FR = fund.fund_returner;
const NO_UNI = fund.stress_tests.find((s) => s.id === 'best_zombie')!;
const UNI_EXIT_YEAR = Math.max(...L.seed.lines.filter((l) => l.company === FR.company).map((l) => l.exit_year));
const BIG_UNICORN = fund.stress_tests.find((s) => s.id === 'big_unicorn')!;

// Le modèle, vu du fonds : quatre moteurs de détention.
const MODEL: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'Equity, cheque for cheque',
    d: 'A first cheque in new shares, from pre-seed to growth, with a 1× non-participating preference. No new shares after that unless the founder asks.' },
  { icon: 'trend', t: 'Buybacks at a discount',
    d: 'Our exposure to the winners grows by buying existing shares from angels, leavers and end-of-life funds, with the founder’s agreement, at an independent valuation, below the price of the time.' },
  { icon: 'banknote', t: 'A loan book',
    d: `Growth is financed by loans, drawn in tranches and repaid before equity, within the EuVECA limit of ${Math.round(F.loan_cap_pct * 100)}% of commitments. Priced like venture debt, without warrants.` },
  { icon: 'loop', t: 'Annual cancellations',
    d: 'Every year, companies can buy back and cancel shares. Every cancellation lifts the founder’s stake, and ours.' },
];

const LAYERS = [
  { name: 'Seed', stage: 'Pre-seed and seed', ticket: eurRange(L.seed.ticket_min, L.seed.ticket_max),
    d: `${L.seed.tracks!.lead.companies} conviction leads and ${L.seed.tracks!.radar.companies} radar tickets: each one an option to buy more when a company breaks out.` },
  { name: 'Venture', stage: 'Seed+ and Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    d: 'A first cheque at the inflection, or a buyback of the angels and leavers.' },
  { name: 'Growth', stage: 'Series B and beyond', ticket: eurRange(L.growth.ticket_min, F.company_cap),
    d: 'Blocks bought from end-of-life funds, fresh growth rounds, and more of our own winners.' },
];

// v3.15 (06/11) : les protections du pacte à 12 clauses (Pact.tsx), vues des LPs.
const PROTECTION: { icon: IconName; t: string; d: string }[] = [
  { icon: 'shield', t: '1× preference', d: 'Every first cheque, and any extra equity a founder asks for, carries a 1× non-participating preference. No ratchet, no cumulative dividend.' },
  { icon: 'banknote', t: 'Loans, on lender terms', d: 'Covenants, no new senior debt without our consent, repaid before any equity and on any change of control. A missed payment suspends the voting agreement.' },
  { icon: 'file', t: 'A board seat', d: 'One seat in every company, with monthly figures and quarterly accounts. Our consent for anything that would change our shares: senior shares, our rights, dividends while a loan runs, the IP, a dissolution.' },
  { icon: 'scale', t: 'Independent pricing', d: 'Every buyback is priced by an independent valuer.' },
  { icon: 'trend', t: 'If a founder raises elsewhere', d: 'A right of first offer; we follow or lead. If another investor leads a priced round, the voting agreement ends and we hold the same rights as the new lead.' },
  { icon: 'door', t: 'Exit', d: 'Tag-along on any sale of control, drag-along only on the same terms for every shareholder, our loans repaid at closing.' },
  { icon: 'handshake', t: 'Vesting and leavers', d: 'Four-year founder vesting; a bad leaver gives back unvested shares at nominal value. The voting agreement ends when a founder leaves or sells control.' },
  { icon: 'lock', t: 'Conflicts', d: 'ProFund’s shares abstain on its own loans and buybacks; the voting agreement does not apply to a founder’s personal interest. Fund-side conflicts go to the LP advisory committee.' },
  { icon: 'check', t: 'Fallback', d: 'Fraud, gross misconduct, a material breach of the pact or insolvency proceedings end the voting agreement. An investment committee and a key-person clause in the fund.' },
];

function Cards({ items, cols = 4 }: { items: { icon: IconName; t: string; d: string }[]; cols?: 3 | 4 }) {
  return (
    <ol className={`pv-cards c${cols}`}>
      {items.map((x) => (
        <li key={x.t} className="pv-block">
          <span className="pv-ic"><Icon name={x.icon} /></span>
          <h3>{x.t}</h3>
          <p>{x.d}</p>
        </li>
      ))}
    </ol>
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
const BEHIND = ['Target returns and terms', 'The shift, in sourced figures', 'The model, layer by layer',
  'Real European exits, at every size', 'How LPs are protected', 'Fact sheet, fund model and LP deck'];

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

// ── Le fonds en un coup d'œil (06/11) : ce qu'un LP exigeant cherche d'abord ─────
// Les chiffres du modèle (fund.json, mêmes valeurs que la fiche et le classeur). La page
// est fermée (candidats acceptés) : les termes et les cibles peuvent y figurer.
function AtAGlance() {
  const tiles = [
    { b: pct(TARGET.net_irr), l: 'Target net IRR', s: `Base case ${pct(C.base.net_irr)}, stress case ${pct(C.stress.net_irr)}.` },
    { b: mult(TARGET.net_tvpi), l: 'Target net TVPI', s: `Base case ${mult(C.base.net_tvpi)}, stress case ${mult(C.stress.net_tvpi)}.` },
    { b: mult(TARGET.dpi_year7), l: 'Net DPI by year 7', s: `Loans and growth exits bring cash back early; the unicorn sells in year ${UNI_EXIT_YEAR}.` },
    { b: eur(TARGET.largest_exit, 'val'), l: 'One unicorn carries the fund', s: `${FR.company}, ${pct(FR.stake_at_exit, 1)} owned at exit, returns ${mult(FR.multiple_of_fund)} the fund. Without it: ${mult(NO_UNI.net_tvpi)} net. ${BIG_UNICORN.label.replace(/^A bigger unicorn: /, '')}: ${mult(BIG_UNICORN.net_tvpi)}.` },
  ];
  const terms: [string, string][] = [
    ['Vehicle', 'Closed-ended EuVECA fund'],
    ['Size', `${FUND_SIZE}, first close ${eurRange(F.first_close_min, F.first_close_max, 'tile', '–')}, closings over ${F.closing_months} months`],
    ['Term', `${F.term_years} years, ${F.investment_period_years}-year investment period`],
    ['Fees', `${pct(T.fee_ip_pct)} on commitments for ${F.investment_period_years} years (${pct(T.fee_loan_pct)} on the loan sleeve), then ${pct(T.fee_post_pct, 1)} on invested capital`],
    ['Carry', `${pct(T.carry_pct)} over an ${pct(T.hurdle_pct)} hurdle, European whole-of-fund waterfall`],
    ['GP commitment', `At least ${pct(T.gp_commit_min_pct)} of commitments (${eur(T.gp_commit_min, 'tile')})`],
    ['Portfolio', `${F.companies} companies across three layers; at most ${eur(F.company_cap, 'tile')} per company from the fund`],
    ['LP base', 'Mainly high-net-worth individuals and family offices, as professional or eligible investors'],
  ];
  return (
    <section className="pv-sec" id="glance">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Fund I at a glance</p>
          <h2 className="pv-h2">We hunt the outliers, and own more of them.</h2>
        </div>
        <div className="pv-figs pv-glance-figs">
          {tiles.map((t) => <div key={t.l}><b>{t.b}</b><span><strong>{t.l}.</strong> {t.s}</span></div>)}
        </div>
        <dl className="pv-glance-terms">
          {terms.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="pv-fine">Targets are model outputs, net of fees, expenses and carry: not a forecast or a guarantee. Every figure is built line by line in the fund model.</p>
        <Downloads deck />
      </div>
    </section>
  );
}

// ── La nouvelle ère, en chiffres sourcés (06/11) ──────────────────────────────
// Chiffres de tiers : ne pas les modifier sans relire la source (notes en bas de section).
const SHIFT: { b: string; t: string; n: number }[] = [
  { b: '8 months', t: 'Lovable (Stockholm), from launch to $100M ARR, with 45 full-time employees.', n: 1 },
  { b: '146 people', t: 'Lovable’s team when it passed $400M ARR, in February 2026.', n: 2 },
  { b: '$2M', t: 'The capital Lovable had used when it reached $17M ARR (company figures).', n: 3 },
  { b: '24 vs 37 months', t: 'To $5M ARR: the top 100 AI companies on Stripe in 2024, against the top 100 SaaS companies in 2018.', n: 4 },
  { b: '$1.13M', t: 'ARR per employee in year one for Bessemer’s AI “supernovas”, which reach $40M ARR in their first year.', n: 5 },
  { b: '2×', t: 'Companies on Stripe reaching $10M ARR within three months of creation, 2025 against 2024.', n: 6 },
];

function TheShift() {
  return (
    <section className="pv-sec tint" id="shift">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">The shift</p>
          <h2 className="pv-h2">AI collapsed the cost of building. Venture has not caught up.</h2>
        </div>
        <div className="pv-duo-txt pv-shift-txt">
          <p className="big">Unicorn valuations, on a fraction of the capital.</p>
          <p>AI-native teams reach growth-stage revenue, and unicorn valuations, with far less capital and far fewer people than software used to need. The venture model has not changed: a round every 18 months, a slice of the company every time. <b>Capital is abundant. The best founders have every option, and they will choose the terms.</b></p>
        </div>
        <div className="pv-shift-stats">
          {SHIFT.map((x) => (
            <div key={x.b}><b>{x.b}</b><span>{x.t}<sup>{x.n}</sup></span></div>
          ))}
        </div>
        <p className="pf-fine pv-src">
          ¹ TechCrunch, 23 July 2025. ² TechCrunch, 11 March 2026 (headcount from Lovable’s CRO, via Business Insider).
          ³ TechCrunch, 25 February 2025 (company claim). ⁴ Stripe 2024 annual letter, reported by TechCrunch on 27 February 2025.
          ⁵ Bessemer Venture Partners, The State of AI 2025, 13 August 2025. ⁶ Stripe 2025 annual letter, 24 February 2026 (all companies on Stripe).
        </p>
      </div>
    </section>
  );
}

// ── Les sorties européennes (06/11) ──────────────────────────────────────────
// Le marché réel (PitchBook, Atomico) et de vraies cessions, valeur telle que publiée
// (devise d'origine, aucune conversion). Les colonnes du tableau sont calculées par le
// moteur du site (founderMath.js), le même que le tableau publié : la société de
// l'exemple, vendue à la taille de chaque cession réelle.
const EXIT_MARKET: { b: string; t: string; n: number }[] = [
  { b: '0.7% → 68%', t: '$1B+ deals were 0.7% of European tech M&A over the past decade, and 68% of its value.', n: 1 },
  { b: '13% → 86%', t: '$1B+ IPOs were 13% of European tech IPOs over the decade, and 86% of their value.', n: 1 },
  { b: '77%', t: 'of European tech M&A deals in 2023 were worth less than $100M. The outliers make the returns.', n: 2 },
];

const EXIT_BANDS: { h: string; items: { co: string; v: string; d: string }[] }[] = [
  { h: 'Under 100M', items: [
    { co: 'Snips', v: '~$37.5M', d: 'France · Sonos, 2019' },
    { co: 'AdCreative.ai', v: '$38.7M', d: 'France · Appier, 2025' },
    { co: 'Sentronics', v: '~$60M', d: 'Germany · Nova, 2025' },
  ] },
  { h: '100M to 300M', items: [
    { co: 'Freetrade', v: '£160M', d: 'UK · IG Group, 2025, enterprise value' },
    { co: 'Rollic', v: '$168M', d: 'Turkey · Zynga, 2020, for 80%' },
    { co: 'Planday', v: '€183.5M', d: 'Denmark · Xero, 2021, with earn-out' },
  ] },
  { h: '300M to 1B', items: [
    { co: 'InstaDeep', v: '~€500M', d: 'UK · BioNTech, 2023, for the shares it did not own' },
    { co: 'Silo AI', v: '~$665M', d: 'Finland · AMD, 2024' },
    { co: 'Peakon', v: '~$700M', d: 'Denmark · Workday, 2021' },
    { co: 'Cognigy', v: '~$955M', d: 'Germany · NICE, 2025' },
  ] },
  { h: 'Above 1B', items: [
    { co: 'Sana', v: '~$1.1B', d: 'Sweden · Workday, 2025' },
    { co: 'Depop', v: '~$1.625B', d: 'UK · Etsy, 2021' },
    { co: 'Tink', v: '€1.8B', d: 'Sweden · Visa, 2021, incl. retention' },
    { co: 'Wolt', v: '~€7.0B', d: 'Finland · DoorDash, 2021, all stock' },
  ] },
];

// La société du tableau fondateurs, vendue à la taille de vraies cessions européennes,
// de la vente de raison à la licorne (06/11 : le tableau refait, plus lisible).
const EXIT_ROWS: { exit: number; co: string; d: string }[] = [
  { exit: 40e6, co: 'AdCreative.ai', d: 'Appier, 2025 · $38.7M' },
  { exit: 60e6, co: 'Sentronics', d: 'Nova, 2025 · ~$60M' },
  { exit: 160e6, co: 'Freetrade', d: 'IG Group, 2025 · £160M' },
  { exit: 500e6, co: 'InstaDeep', d: 'BioNTech, 2023 · ~€500M' },
  { exit: 1800e6, co: 'Tink', d: 'Visa, 2021 · €1.8B' },
  { exit: 7000e6, co: 'Wolt', d: 'DoorDash, 2021 · ~€7.0B' },
];
const CAP_VC = vcCapTable({ founders: FM.founders, holders: FM.holders, rounds: FM.vc_rounds });
const CAP_PF = [{ id: 'founders', stake: FM.founders, pref: 0 }, ...FM.holders.map((h) => ({ ...h }))];
const DEBT = FM.loans * FM.loan_multiple;
const A_COST = FM.holders.find((h) => h.id === 'series_a')!.pref;
const atExit = (exit: number) => {
  const v = payout(exit, CAP_VC);
  const p = payout(Math.max(0, exit - DEBT), CAP_PF);
  return { fVc: millions(v.founders), fPf: millions(p.founders), aVc: v.series_a / A_COST, aPf: p.series_a / A_COST };
};
const m2 = (x: number) => `${x.toFixed(x < 10 ? 1 : 0)}×`;
const money = (v: number) => eur(v, v >= 1e9 ? 'val' : 'tile');
const UNICORN_MIN = 1e9;

function Exits() {
  const rows = EXIT_ROWS.map((r) => ({ ...r, ...atExit(r.exit) }));
  const tie = atExit(40e6);
  const tink = rows.find((r) => r.co === 'Tink')!;
  return (
    <section className="pv-sec" id="exits">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Exits</p>
          <h2 className="pv-h2">From a trade sale to a unicorn.</h2>
          <p className="sub">In Europe as everywhere, the outliers make the returns. We hunt them like the best funds do. The difference: when one comes, we still own our full stake, and so does the founder.</p>
        </div>
        <div className="pv-exit-stats">
          {EXIT_MARKET.map((x) => <div key={x.b}><b>{x.b}</b><span>{x.t}<sup>{x.n}</sup></span></div>)}
        </div>

        <div className="pv-xt-head">
          <h3 className="pv-h3">The same company, sold at the price of real European exits</h3>
          <p>
            One company, {eur(FM.raised_before, 'tile')} raised up to its Series A. Then, on the VC path, {eur(FM.vc_equity, 'tile')} of
            equity over three more rounds; on ours, {eur(FM.loans, 'tile')} of loans. Sold at the price of six real exits.
          </p>
          <div className="pv-xt-legend">
            <span className="vc">VC path</span><span className="pf">ProFund path</span><span className="up">ProFund’s edge</span>
          </div>
        </div>
        <div className="pv-xt" role="table" aria-label="The same company on both paths, at real European exit sizes">
          <div className="pv-xt-row head" role="row">
            <span role="columnheader">Sold at</span>
            <span role="columnheader">Founders take home</span>
            <span role="columnheader">Series A cheque, multiple</span>
            <span role="columnheader">ProFund’s edge</span>
          </div>
          {rows.map((r) => {
            const top = Math.max(r.fPf, r.fVc, 1);
            const w = (v: number) => ({ ['--w' as string]: `${Math.max(v > 0 ? 3 : 0, (v / top) * 100)}%` });
            const edge = r.aVc > 0 ? r.aPf / r.aVc : null;
            return (
              <div key={r.exit} className={`pv-xt-row${r.exit >= UNICORN_MIN ? ' uni' : ''}`} role="row">
                <span className="pv-xt-exit" role="cell">
                  <b>{eur(r.exit, 'val')}</b>
                  <span>{r.co}<small>{r.d}</small></span>
                  {r.exit >= UNICORN_MIN && <em>Unicorn</em>}
                </span>
                <span className="pv-xt-bars" role="cell">
                  <span className="vc"><small>VC</small><i style={w(r.fVc)} /><b>{money(r.fVc)}</b></span>
                  <span className="pf"><small>ProFund</small><i style={w(r.fPf)} /><b>{money(r.fPf)}</b></span>
                </span>
                <span className="pv-xt-mult" role="cell">
                  <span className="vc"><small>VC path</small>{m2(r.aVc)}</span>
                  <Icon name="arrow" />
                  <span className="pf"><small>ProFund</small>{m2(r.aPf)}</span>
                </span>
                <span className="pv-xt-edge" role="cell">
                  {edge !== null && <b>{edge.toFixed(1)}×</b>}
                  <small>the VC path’s multiple</small>
                  <span className="f">{r.fVc > 0 ? `Founders: ${(r.fPf / r.fVc).toFixed(1)}× more` : r.fPf > 0 ? `Founders: ${money(r.fPf)} instead of €0` : 'Founders: €0 on both paths'}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="pv-exit-read">
          <b>The same unicorn, three times the multiple.</b> Sold at Tink’s {eur(tink.exit, 'val')}, the company returns {m2(tink.aPf)} on
          our Series A cheque, against {m2(tink.aVc)} on the VC path, and leaves its founders {money(tink.fPf)} instead
          of {money(tink.fVc)}: no round after ours dilutes either of us. At the low end, our loans come first, repaid in full
          from a {eur(DEBT, 'val')} sale; our equity is back at 1× from {eur(60e6, 'val')}, where the VC path’s Series A needs {eur(250e6, 'val')};
          below, nobody gains, and our equity still recovers {m2(tie.aPf)} against {m2(tie.aVc)}.
        </p>
        <p className="pv-fine">{founderNote()} Sale prices rounded from the real exits listed, whose values are shown as disclosed, in their own currency.</p>

        <h3 className="pv-h3 pv-exit-t">Real European exits, at every size</h3>
        <div className="pv-exit-bands">
          {EXIT_BANDS.map((band) => (
            <div key={band.h} className="pv-exit-band">
              <h4>{band.h}</h4>
              <ul>
                {band.items.map((it) => (
                  <li key={it.co}><b>{it.co}</b><em>{it.v}</em><small>{it.d}</small></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="pf-fine pv-src">
          ¹ Atomico, State of European Tech 2025 (S&amp;P data to 24 October 2025), over the past decade. ² Atomico, State of
          European Tech 2023. Exits: Sonos 10-K 2019; Appier; Nova; IG Group (RNS); Zynga; Xero (ASX); BioNTech; AMD; Workday; NICE;
          Etsy; Visa; DoorDash. Values as disclosed by the buyer.
        </p>
      </div>
    </section>
  );
}

function LpContent() {
  // Le deal flow live : directement si ce navigateur en a l'accès (LP accepté), sinon la
  // candidature (popup). Un LP non accepté n'y accède jamais : /dealflow vérifie le jeton.
  const [open, setOpen] = useState(false);
  const follow = () => { if (savedAccess()) window.location.href = '/dealflow/'; else setOpen(true); };
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  return (
    <div className="pfh">
      {/* 06/11 : plus de barre du haut ni de menu ; le logo ouvre le héros, comme l'accueil. */}
      <header className="pv-hero pv-lp-hero">
        <div className="pv-wrap pv-hero-grid">
          <div className="pv-hero-copy">
            <Link to="/" className="pv-lp-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
            <span className="pv-eyebrow caps"><b />LPs · Pre-marketing phase · EuVECA</span>
            <h1 className="pv-h1 pv-h1-one">Backing AI-native teams building self-improving AI systems.</h1>
            <p className="pv-lead pv-lead-k">Fund I. {FUND_SIZE}, pre-seed to growth.</p>
            <p className="pv-lead">
              We don’t fund headcount. We back the clearest minds directing the most autonomous machines, in the
              world’s largest markets, and we compete for them with the best funds in the world.
            </p>
            <div className="pv-ctas">
              <button type="button" className="pv-btn" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
              <a href={FACTSHEET_URL} className="pv-btn line" download><Icon name="file" />Fact sheet</a>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <AtAGlance />
      <Manifesto lp />
      <TheShift />
      <FourLaws tint={false} />

      <section className="pv-sec tint" id="model">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">The model</p>
            <h2 className="pv-h2">Equity first. Then we lend and we buy.</h2>
            <p className="sub">Founders own more at every stage. So does the fund.</p>
          </div>
          <Cards items={MODEL} />
          <div className="pv-stages pv-lp-layers">
            {LAYERS.map((x, i) => (
              <div key={x.name} className="pv-stage">
                <span className="pv-stage-n">Layer {i + 1}</span>
                <h3>{x.name}</h3>
                <dl>
                  <div><dt>Stage</dt><dd>{x.stage}</dd></div>
                  <div><dt>First ticket</dt><dd className="tk">{x.ticket}</dd></div>
                  <div><dt>Role</dt><dd>{x.d}</dd></div>
                </dl>
              </div>
            ))}
          </div>
          {/* 06/11 : concurrencer les meilleurs fonds sur les meilleurs tours, et gagner par les termes.
              Index, Balderton, Sequoia : cités comme référence, jamais comme partenaires. */}
          <div className="pv-coinv">
            <div>
              <p className="pv-kick">Competing with the best</p>
              <h3>The new go-to fund for elite founders.</h3>
              <p className="pv-coinv-lead">Exceptional founders have every option. We compete with Index Ventures, Balderton or Sequoia for the same rounds, and we win them on terms.</p>
            </div>
            <ul>
              <li><Icon name="target" /><span><b>Cheque for cheque, in the rounds that matter.</b> Seed, pre-Series A, Series A, Series B: the fund writes up to {eur(F.company_cap, 'tile')} per company, and SPVs alongside take us to the size of the round. {pct(fund.allocation.after_first_pct)} of the capital we invest goes in after the first cheque: follow-ons, buybacks and loans, in the form the founder chooses.</span></li>
              <li><Icon name="trend" /><span><b>Mega rounds, without giving up the upside.</b> When a company needs far more to stay ahead of over-capitalised rivals, we raise SPVs with our LPs alongside the fund: the round is financed, the upside stays with our LPs, and the founder keeps our terms.</span></li>
              <li><Icon name="handshake" /><span><b>When a top-tier fund leads, we follow its terms.</b> A co-investor does not renegotiate the lead’s term sheet: we invest alongside, on the same terms. Our pact applies where we lead.</span></li>
              <li><Icon name="shield" /><span><b>We win on terms, not on posture.</b> Written into a public pact: the founder’s votes, no veto on how they run, raise or sell, their exit. Then the loan line, the buybacks and the two engines on top.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <Exits />

      <section className="pv-sec" id="protection">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">Protection</p>
            <h2 className="pv-h2">Founders get control. LPs keep the protection.</h2>
            <p className="sub">We give up the veto on how founders run, raise or sell. We keep a board seat and every right that protects capital.</p>
          </div>
          <Cards items={PROTECTION} cols={3} />
        </div>
      </section>

      <FounderEngines lp onFollow={follow} />
      <TheTeam lp />

      <section className="pv-sec tint" id="terms">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">Terms and returns</p>
            <h2 className="pv-h2">Every number, and how it is built.</h2>
            <p className="sub">The same figures as the fact sheet and the fund model, from one model, line by line.</p>
          </div>
          <TermsTables />
          <div className="pv-lp-perf"><PerformanceTables /></div>
          <Downloads deck />
        </div>
      </section>

      <section className="pv-sec" id="access">
        <div className="pv-wrap">
          <div className="pv-band pv-lp-band">
            <div>
              <h2>Follow every company we review.</h2>
              <p>Every evening, the companies we reviewed, the ones we kept, and why. Data room on request: <a className="pv-band-a" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
            </div>
            <div className="pv-band-ctas">
              <button type="button" className="pv-btn light" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
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
      <DealFlowModal lp open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
