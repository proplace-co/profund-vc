import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';

// LA PROPOSITION FONDATEURS (v3, Antoine, 05/11) : un seul tour en actions, puis des
// prêts et des rachats. v3.8 : l'accueil ne parle qu'aux fondateurs et se construit
// autour d'une idée, le contrôle revient au fondateur. L'exigence ne se dit pas, elle
// se lit : peu de mots, des chiffres, un seul bouton (« Run your numbers »).
// Tous les montants viennent de src/data/fund.json : tickets des étages
// (layers.*) et tableau des fondateurs (founder_math, même calcul que
// src/lib/founderMath.js). Pas de frais, de carry ni de rendement cible ici :
// ils restent derrière /lp (fiche, Excel, /pitch).
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const SEED = FM.holders.find((h) => h.id === 'seed')!;
const SERIES_A = FM.holders.find((h) => h.id === 'series_a')!;

/** Vrai une fois l'élément entré à l'écran : déclenche les animations (une seule fois). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

// ── Les règles : ce que le VC prenait, ce que le pacte rend ──────────────────
// Chaque ligne nouvelle est une clause du pacte (/terms) : ne rien promettre de plus.
const RULES: { old: string; now: string }[] = [
  { old: 'A new round every 18 months', now: 'One round. Then never again.' },
  { old: 'A slice of your company at every round', now: 'Your stake never goes down.' },
  { old: 'A board seat and a veto', now: 'Our shares vote with you.' },
  // (v3.10 : la ligne « No new preference on top of you » est retirée : l'equity
  // complémentaire, au choix du fondateur, porte une préférence 1×.)
  { old: 'Their exit, on their timing', now: 'Your exit. No veto. Ever.' },
  { old: 'Angels and leavers stuck on your cap table', now: 'We buy them out. Your stake goes up.' },
];

/** Les règles. `hero` : en ouverture de l'accueil (titre h1, bouton) ; sinon une section (/lp). */
export function TheRules({ hero = false }: { hero?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const H = hero ? 'h1' : 'h2';
  return (
    <section className={`pv-sec night pv-rules-sec${hero ? ' pv-rules-hero' : ''}`} id="rules">
      <div ref={ref} className={`pv-wrap pv-rules${seen ? ' in' : ''}`}>
        {hero && <img className="pv-rules-logo" src="/logo.png" alt="ProFund" width={150} height={40} />}
        <p className="pv-kick">{hero ? 'Venture capital · Pre-seed to growth · Europe' : 'The rules'}</p>
        <H className="pv-rules-h">Control was always yours.</H>
        {hero && (
          <div className="pv-ctas">
            <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
          </div>
        )}
        <ol className="pv-rules-list">
          {RULES.map((r, i) => (
            <li key={r.old} className="pv-rule" style={{ ['--d' as string]: `${0.15 + i * 0.18}s` }}>
              <span className="old"><span>{r.old}</span></span>
              <span className="arrow" aria-hidden="true"><Icon name="arrow" /></span>
              <span className="now">{r.now}</span>
            </li>
          ))}
        </ol>
        {/* la conclusion des règles barrées (Antoine, 05/11 : en bas, pas sous le titre) */}
        <p className="pv-rules-sub">For fifty years, every round took a piece of it. Your shares, your board, your exit. Now you get the capital without giving the company away.</p>
        <div className="pv-rules-foot">
          <span>Written into the pact. The same for every founder. Raise elsewhere whenever you want: we follow or lead.</span>
          <Link to="/terms" className="pv-link">Read the 10 clauses <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// ── Le capital, optimisé (v3.9) ──────────────────────────────────────────────
// Les poches profondes, sans promesse intenable : chaque euro vient de la source la
// moins chère d'abord ; l'equity en dernier, et seulement si le fondateur la demande
// (aux conditions du pacte, préférence 1× comme notre premier chèque).
export function CapitalStack() {
  const [ref, seen] = useInView<HTMLOListElement>();
  const steps: { icon: IconName; tag: string; t: string; d: string }[] = [
    { icon: 'trend', tag: 'No dilution', t: 'Your growth',
      d: 'Revenue funds what it can. That is what AI-native teams do best.' },
    { icon: 'target', tag: 'Once', t: 'One equity round',
      d: `From ${eur(L.seed.ticket_min)} at pre-seed to ${eur(F.company_cap, 'tile')} at growth. Then never again.` },
    { icon: 'banknote', tag: 'No dilution', t: 'The loan line',
      d: 'Reserved from day one, with our fund and partner lenders. Hiring, go-to-market, working capital, acquisitions. Drawn in tranches, repaid from growth.' },
    { icon: 'shield', tag: 'Your call', t: 'Equity, if you ask',
      d: 'If lenders cannot take it all, we lead the extra equity ourselves, on the pact terms, with SPVs and co-investors alongside the fund.' },
  ];
  return (
    <section className="pv-sec" id="capital">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Your capital</p>
          <h2 className="pv-h2">Funded like the leaders. Diluted like no one.</h2>
          <p className="sub">Every euro comes from the cheapest source first. Equity comes last, and only if you ask.</p>
        </div>
        <ol ref={ref} className={`pv-stack${seen ? ' in' : ''}`}>
          {steps.map((x, i) => (
            <li key={x.t} className="pv-stack-s" style={{ ['--d' as string]: `${i * 0.14}s` }}>
              <div className="pv-stack-top">
                <span className="pv-stack-n">{i + 1}</span>
                <span className={`pv-stack-tag${x.tag === 'Your call' ? ' call' : ''}`}>{x.tag}</span>
              </div>
              <span className="pv-ic"><Icon name={x.icon} /></span>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── How we back them ─────────────────────────────────────────────────────────
const BLOCKS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'One round. That’s it.',
    d: 'We invest once in new shares. After that, we never create a new share while you grow with us.' },
  { icon: 'banknote', t: 'No more fundraising.',
    d: 'A reserved loan line covers what comes next: hiring, go-to-market, working capital, acquisitions.' },
  // 05/11 : « Every cancellation lifts your stake » (la copie disait « buyback ») :
  // quand ProFund rachète un angel, la part du fondateur ne bouge pas ; c'est
  // l'annulation par la société qui la relève.
  { icon: 'trend', t: 'Your stake goes up.',
    d: 'We buy back your angels, leavers and early funds, only with your agreement, and the company cancels shares every year. Every cancellation lifts your stake.' },
  { icon: 'shield', t: 'You keep control.',
    d: 'No board seat. No veto. Our shares vote with you.' },
  { icon: 'door', t: 'You choose your exit.',
    d: 'No veto on a sale. Ever.' },
];

export function HowWeBack() {
  return (
    <section className="pv-sec" id="how">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">How we back them</p>
          <h2 className="pv-h2">Built for founders who own what they build.</h2>
          <p className="sub">Same terms for every founder. In public.</p>
        </div>
        <ol className="pv-blocks">
          {BLOCKS.map((b) => (
            <li key={b.t} className="pv-block">
              <span className="pv-ic"><Icon name={b.icon} /></span>
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </li>
          ))}
        </ol>
        {/* v3.7 : au-delà de la dette, de l'equity aux mêmes conditions, et des SPV */}
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="banknote" /></span>
          <p>Need more than debt, or lenders can’t take the full line? Your call: we lead the extra equity ourselves, on the same pact terms, with SPVs and co-investors alongside the fund.</p>
        </div>
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="scale" /></span>
          <p>If you raise elsewhere, we can follow or lead the round. Fair both ways.</p>
          <Link to="/terms" className="pv-link">Read the 10 clauses <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// ── The math ─────────────────────────────────────────────────────────────────
/** La note sous le tableau : chaque montant lu dans fund.json. */
export function founderNote() {
  return `Typical European path: ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, then ${eur(FM.vc_equity, 'tile')} of equity across Series B to D, with 1× non-participating preferences. ProFund path: same seed and Series A, then ${eur(FM.loans, 'tile')} of loans, for a company that needs far less capital. Illustrative, not a forecast.`;
}

/** La part des fondateurs, tour après tour : VC (elle fond) contre ProFund (elle tient). */
function StakeChart() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const cols = [
    { label: 'Today', vc: FM.founders },
    ...FM.vc_stakes.map((s) => ({ label: `After Series ${s.round}`, vc: s.founders })),
  ];
  const h = (v: number) => `${(v / FM.founders) * 100}%`;
  return (
    <div ref={ref} className={`pv-card pv-stake${seen ? ' in' : ''}`}>
      <div className="pv-stake-top">
        <h3 className="pv-h3">Your stake, round after round</h3>
        <div className="pv-legend"><span className="vc">VC path</span><span className="pf">ProFund path</span></div>
      </div>
      <div className="pv-stake-grid">
        {cols.map((c, i) => (
          <div key={c.label} className="pv-stake-col" style={{ ['--d' as string]: `${i * 0.12}s` }}>
            <div className="pv-stake-bars">
              <i className="vc" style={{ ['--h' as string]: h(c.vc) }}><b>{pct(c.vc, 1)}</b></i>
              <i className="pf" style={{ ['--h' as string]: h(FM.founders) }}><b>{pct(FM.founders, 1)}</b></i>
            </div>
            <span className="pv-stake-l">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Le tableau « The capital you don't raise » ; `investor` ajoute la colonne Series A (deck). */
export function FounderTable({ investor = false }: { investor?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const top = Math.max(...FM.rows.map((r) => r.founders_profund));
  const bar = (v: number) => ({ ['--w' as string]: `${Math.max(1.5, (v / top) * 100)}%` });
  return (
    <div ref={ref} className={`pv-math${seen ? ' in' : ''}`}>
      <div className="pv-math-head" aria-hidden="true">
        <span>Exit</span><span>Founders, VC path</span><span>Founders, ProFund path</span>
        {investor && <span>Series A investor, VC path</span>}
        {investor && <span>ProFund, equity</span>}
      </div>
      {FM.rows.map((r) => (
        <div key={r.exit} className={`pv-math-row${investor ? ' wide' : ''}`}>
          <span className="pv-math-exit"><small>Exit</small>{eur(r.exit, 'val')}</span>
          <span className="pv-math-v vc">
            <small>VC path</small>
            <b>{eur(r.founders_vc, 'tile')}</b>
            <i style={bar(r.founders_vc)} />
          </span>
          <span className="pv-math-v pf">
            <small>ProFund path</small>
            <b>{eur(r.founders_profund, 'tile')}</b>
            <i style={bar(r.founders_profund)} />
          </span>
          {investor && <span className="pv-math-m"><small>Series A, VC path</small>{mult(r.series_a_vc)}</span>}
          {investor && <span className="pv-math-m pf"><small>ProFund, equity</small>{mult(r.series_a_profund)}</span>}
        </div>
      ))}
    </div>
  );
}

export function TheMath() {
  return (
    <section className="pv-sec tint" id="math">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">The math</p>
          <h2 className="pv-h2">The capital you don’t raise is the company you keep.</h2>
          <p className="sub">Same exit. The usual path sells you {eur(FM.vc_equity, 'tile')} of equity after your Series A. An AI-native team on our terms needs {eur(FM.loans, 'tile')} of debt.</p>
        </div>
        <StakeChart />
        <h3 className="pv-h3 pv-math-t">What you take home</h3>
        <FounderTable />
        <p className="pv-fine">{founderNote()}</p>
        <div className="pv-ctas">
          <Link to="/calculator" className="pv-btn">Run your numbers <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// ── Every stage ──────────────────────────────────────────────────────────────
// Les tickets sont ceux des bornes du modèle (fund_model.BOUNDS). Les SPV (au-delà
// du plafond par société) sont hors du fonds : documents LP seulement.
const STAGES = [
  { layer: 'Seed', stage: 'Pre-seed, seed', ticket: eurRange(L.seed.ticket_min, L.seed.ticket_max),
    what: 'Your first and only equity round, as lead or radar ticket' },
  { layer: 'Venture', stage: 'Seed+, Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    what: 'First cheque at the inflection, or a buyback of your angels and leavers' },
  { layer: 'Growth', stage: 'Series B and beyond',
    ticket: eurRange(L.growth.ticket_min, F.company_cap),
    what: 'Fresh growth rounds, buybacks of early funds, growth loans, acquisition financing' },
];

export function EveryStage({ tint = false }: { tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="stages">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Every stage</p>
          <h2 className="pv-h2">Pre-seed to growth. One equity round, wherever you are.</h2>
          <p className="sub">Two ways in at every layer: a first equity cheque, or a buyback of existing shares. Then loans, never new shares.</p>
        </div>
        <div className="pv-stages">
          {STAGES.map((s, i) => (
            <div key={s.layer} className="pv-stage">
              <span className="pv-stage-n">Layer {i + 1}</span>
              <h3>{s.layer}</h3>
              <dl>
                <div><dt>Stage</dt><dd>{s.stage}</dd></div>
                <div><dt>Ticket</dt><dd className="tk">{s.ticket}</dd></div>
                <div><dt>What we do</dt><dd>{s.what}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Founding Partner ─────────────────────────────────────────────────────────
// Parcours du GP, en logos (tirés de public/track-record.png ; Google et Mirakl retirés le 31/10).
export const CV_LOGOS = [
  { name: 'Partech', src: '/cv-partech.png', h: 24 },
  { name: 'Ardian', src: '/cv-ardian.png', h: 20 },
  { name: 'leboncoin', src: '/cv-leboncoin.png', h: 20 },
];

export function TheTeam({ lp = false, tint = true }: { lp?: boolean; tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="team">
      <div className="pv-wrap pv-team">
        <img className="pv-team-photo" src="/gp-photo.jpg" alt="Alexandre Busson" width={240} height={300} />
        <div>
          <p className="pv-kick">Founding Partner</p>
          <h2 className="pv-h2">Alexandre Busson</h2>
          <p className="pv-team-txt">
            M&amp;A Director at Leboncoin, LBO at Ardian (ex-AXA PE),
            Senior Associate at Partech Ventures, Google. Founder of Dreamzer Games, owner and CEO of
            Fadparis.com. Three exits at 10×, 20× and 19× before the fund.
          </p>
          {lp && (
            <ul className="pv-checks sm">
              {/* 05/11 : « [to recruit] » de la copie, rendu explicite : le poste n'est pas pourvu. */}
              <li><span className="pv-tick"><Icon name="check" /></span>A partner from venture debt will run the loan book (to be recruited).</li>
              <li><span className="pv-tick"><Icon name="check" /></span>Investment committee and key-person clause.</li>
            </ul>
          )}
          <div className="gp-logos" aria-label="Partech · Ardian · leboncoin">
            {CV_LOGOS.map((l) => <img key={l.name} src={l.src} alt={l.name} style={{ height: l.h }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── La fin : une phrase, un bouton ───────────────────────────────────────────
export function FinalCall() {
  return (
    <section className="pv-sec pv-reserve-sec" id="final">
      <div className="pv-wrap">
        <div className="pv-band pv-final">
          <div>
            <h2>Exceptional numbers deserve exceptional terms.</h2>
            <p>See what you keep, round after round.</p>
          </div>
          <div className="pv-band-ctas">
            <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
