import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
import { N_CLAUSES, PACT_LEAD, PactList } from './Pact';
import { Calculator } from './CalculatorPage';
import { Drawer, DrawerToggle, Fold } from './Drawer';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';

// LA PROPOSITION FONDATEURS (v3, Antoine, 05/11). v3.8 : l'accueil ne parle qu'aux
// fondateurs et se construit autour d'une idée, le contrôle revient au fondateur.
// 06/11 (6), la voix : une phrase, ce qui la prouve, de l'air. On propose tout ce que
// proposent les meilleurs, la table retournée, SANS se comparer à eux ; le technique est
// replié (Fold). L'exigence ne se dit pas, elle se lit.
// v3.15 (06/11) : le pacte et le calculateur se déplient DANS l'accueil (Drawer.tsx) :
// le pacte sous les règles du héros, le calculateur sous le tableau. Les boutons
// lointains (héros, bandeau final) les ouvrent et y défilent ; /#pact et /#calculator
// aussi (pied de page). /terms et /calculator restent en ligne.
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
export function useInView<T extends Element>() {
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

/** Une phrase, puis ce qui la prouve (06/11, accueil et /lp). `tone` : night, tint ou rien. */
export function Say({ id, tone, title, lead, children }: {
  id: string; tone?: 'night' | 'tint'; title: ReactNode; lead?: ReactNode; children?: ReactNode;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <section className={`pv-sec pv-say${tone ? ` ${tone}` : ''}`} id={id}>
      <div className="pv-wrap">
        <div ref={ref} className={`pv-say-head pv-reveal${seen ? ' in' : ''}`}>
          <h2 className="pv-say-h">{title}</h2>
          {lead}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Trois ou quatre chiffres, sans carte : un filet, le chiffre, ce qu'il veut dire. */
export function Numbers({ items, four = false }: { items: { b: string; t: ReactNode }[]; four?: boolean }) {
  return (
    <div className={`pv-three${four ? ' four' : ''}`}>
      {items.map((x) => <div key={x.b}><b>{x.b}</b><span>{x.t}</span></div>)}
    </div>
  );
}

// ── Les règles : ce que le VC prenait, ce que le pacte rend ──────────────────
// Chaque ligne nouvelle est une clause du pacte (/terms) : ne rien promettre de plus.
const RULES: { old: string; now: string }[] = [
  // 06/11 (Antoine) : plus de « One round. Then never again. », ni de comparaison aux
  // autres fonds : on propose tout, la table retournée.
  { old: 'Big cheques, on their terms', now: 'Big cheques. Your terms.' },
  { old: 'A slice of your company at every round', now: 'You dilute only when you choose.' },
  { old: 'Their seats, their votes, their veto', now: 'One seat. Our shares vote with you.' },
  // (v3.10 : la ligne « No new preference on top of you » est retirée : l'equity
  // complémentaire, au choix du fondateur, porte une préférence 1×.)
  { old: 'Their exit, on their timing', now: 'Your exit. No veto. Ever.' },
  // ProFund rachète : ce sont nos titres qui montent ; les votes passent du côté du fondateur.
  { old: 'Angels and leavers stuck on your cap table', now: 'We buy them out. Their votes move to your side.' },
];

/** Les règles. `hero` : en ouverture de l'accueil (titre h1, bouton) ; sinon une section.
 *  `onPact` : le pacte se déplie sous les règles ; `onRun` : le bouton ouvre le calculateur. */
export function TheRules({ hero = false, pactOpen = false, onPact, onRun }: {
  hero?: boolean; pactOpen?: boolean; onPact?: () => void; onRun?: () => void;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const H = hero ? 'h1' : 'h2';
  return (
    <section className={`pv-sec night pv-rules-sec${hero ? ' pv-rules-hero' : ''}`} id="rules">
      <div ref={ref} className={`pv-wrap pv-rules${seen ? ' in' : ''}`}>
        {/* v3.15 (06/11) : la signature « Venture capital for the AI era » à côté du logo */}
        {hero && (
          <div className="pv-rules-brand">
            <img className="pv-rules-logo" src="/logo.png" alt="ProFund" width={150} height={40} />
            <span>Venture capital for the AI era</span>
          </div>
        )}
        {!hero && <p className="pv-kick">The rules</p>}
        <H className="pv-rules-h">Control was always yours.</H>
        {hero && (
          <div className="pv-ctas">
            {onRun
              ? <button type="button" className="pv-btn light" onClick={onRun}>Run your numbers <Icon name="arrow" /></button>
              : <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>}
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
        <div className="pv-rules-foot" id="pact-dock">
          <span>A public pact, the same for every founder. You know our terms before we know your name.</span>
          {onPact
            ? <DrawerToggle open={pactOpen} controls="pact" onClick={onPact} className="ghost-light"
                            label={`Read the pact, ${N_CLAUSES} clauses`} closeLabel="Close the pact" />
            : <Link to="/terms" className="pv-link">Read the pact, {N_CLAUSES} clauses <Icon name="arrow" /></Link>}
        </div>
        {onPact && (
          <Drawer id="pact" open={pactOpen} label="The pact" className="pv-pact-drawer">
            <span className="pv-drawer-glow" aria-hidden="true" />
            <p className="pv-terms-lead">{PACT_LEAD}</p>
            <PactList heading="h3" />
          </Drawer>
        )}
      </div>
    </section>
  );
}

// ── Ce qu'on écrit à un fondateur d'exception (06/11 (6)) ───────────────────
// Une phrase pour lui dire qu'il est attendu, sans adjectif sur nous.
export function TheFew() {
  return (
    <Say id="few" title="The companies that define this era will be built by very few people."
      lead={(
        <>
          <p className="pv-say-p">Founders who direct machines instead of org charts. Who reach revenue before headcount. Who see what a market wants long before it asks.</p>
          <p className="pv-say-p"><b>Venture was written for companies that needed armies. You don’t. So we rewrote it.</b></p>
        </>
      )} />
  );
}

// ── Le capital (v3.9 ; 06/11 (6) : l'essentiel visible, tickets et étapes repliés) ──
// Tout ce que proposent les meilleurs, sans le dire : aucun « cheque for cheque », aucun
// nom de fonds. Chaque ligne reste une clause du pacte. Si un autre fonds mène, on devient un
// co-investisseur classique (clause 9) : ne jamais y promettre prêts, rachats ni moteurs.
const CAPITAL: { t: string; d: string }[] = [
  { t: 'Equity, when you choose.', d: 'From your first round to your largest, with SPVs and co-investors alongside the fund for the biggest.' },
  { t: 'Credit, before equity.', d: 'A loan line reserved from day one, with our fund and partner lenders. Your revenue can carry what equity used to pay for.' },
  { t: 'A cap table that gets cleaner.', d: 'We buy out angels and early funds, only with your agreement. Their votes move to your side.' },
  { t: 'Another lead? Take both.', d: 'When another fund leads your round, we invest alongside, on its terms.' },
];

export function CapitalStack() {
  const [ref, seen] = useInView<HTMLOListElement>();
  const steps: { icon: IconName; tag: string; t: string; d: string }[] = [
    { icon: 'trend', tag: 'No dilution', t: 'Your growth',
      d: 'Revenue funds what it can. That is what AI-native teams do best.' },
    { icon: 'banknote', tag: 'No dilution', t: 'The loan line',
      d: 'Reserved from day one, with our fund and partner lenders. Hiring, go-to-market, working capital, acquisitions. Drawn in tranches, repaid from growth.' },
    { icon: 'target', tag: 'Your call', t: 'Equity, at every stage',
      d: `Seed, pre-Series A, Series A, Series B: from ${eur(L.seed.ticket_min)} to ${eur(F.company_cap, 'tile')} per company from the fund.` },
    { icon: 'shield', tag: 'Your call', t: 'Mega rounds, on your terms',
      d: 'When you need far more to stay ahead of over-capitalised rivals, we lead the round with SPVs and co-investors alongside the fund, on the same terms. Every option stays open.' },
  ];
  // Le fonds en quatre chiffres : taille, tickets, suivi, au-delà (montants de fund.json).
  const figs = [
    { b: eur(F.commitments, 'tile'), s: 'Fund I, pre-seed to growth' },
    { b: `${eur(L.seed.ticket_min)} – ${eur(F.company_cap, 'tile')}`, s: 'Per company, from the fund' },
    { b: 'Follow-on', s: 'Loans, buybacks, and equity on the same terms' },
    { b: `Beyond ${eur(F.company_cap, 'tile')}`, s: 'SPVs and co-investors alongside the fund' },
  ];
  return (
    <Say id="capital" tone="tint" title="Funded like the leaders. Diluted like no one."
      lead={<p className="pv-say-p pv-say-one">From your first cheque to your largest round. You decide what you take, and when.</p>}>
      <ul className="pv-ruled">
        {CAPITAL.map((c) => <li key={c.t}><h3>{c.t}</h3><p>{c.d}</p></li>)}
      </ul>
      <div className="pv-say-stages"><StagesGrid /></div>
      <div className="pv-say-folds">
        <Fold id="capital-detail" title="The order of capital" sub="Your growth, the loan line, equity, mega rounds: the cheapest source first">
          <div className="pv-figs">
            {figs.map((x) => <div key={x.s}><b>{x.b}</b><span>{x.s}</span></div>)}
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
        </Fold>
      </div>
    </Say>
  );
}

// ── How we back them ─────────────────────────────────────────────────────────
const BLOCKS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'Equity, when you choose.',
    d: 'In new shares, from your first round to your largest. After that, we never push for a new round.' },
  { icon: 'banknote', t: 'No more fundraising.',
    d: 'A reserved loan line covers what comes next: hiring, go-to-market, working capital, acquisitions.' },
  // 05/11 : « Every cancellation lifts your stake » (la copie disait « buyback ») :
  // quand ProFund rachète un angel, la part du fondateur ne bouge pas ; c'est
  // l'annulation par la société qui la relève.
  { icon: 'trend', t: 'Your stake goes up.',
    d: 'We buy back your angels, leavers and early funds, only with your agreement, and the company cancels shares every year. Every cancellation lifts your stake.' },
  { icon: 'shield', t: 'You keep control.',
    d: 'One board seat for us, the majority for you. No veto on how you run, raise or sell. Our shares vote with you.' },
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
          <p>If you raise elsewhere, we can follow or lead the round, and we hold the same rights as your new lead. Fair both ways.</p>
          <Link to="/terms" className="pv-link">Read the {N_CLAUSES} clauses <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// ── The math ─────────────────────────────────────────────────────────────────
/** La note sous le tableau : chaque montant lu dans fund.json. */
// v3.15 : le chemin VC est calé sur les parts médianes de Carta par étape (fund_model.py).
const AFTER = (id: string) => pct(FM.vc_stakes.find((s) => s.round === id)!.founders, 1);
export function founderNote(sources = true) {
  return `Typical path, calibrated on Carta medians (not specific to Europe): ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, founders at ${(FM.founders * 100).toFixed(1)}% after the Series A; then ${eur(FM.vc_equity, 'tile')} of equity over the Series B, C and D, each one preceded by a bridge, with option pool refreshes and 1× non-participating preferences. Founders hold ${AFTER('B')} after the Series B, ${AFTER('C')} after the C and ${AFTER('D')} after the D, Carta’s medians (27.3% for AI teams after the B; 16.1% after the C, when the employee pool overtakes the founders; 11.4% after the D). ProFund path: same seed and Series A, then ${eur(FM.loans, 'tile')} of loans, for a company that needs far less capital; the pool is refilled with bought-back shares. Illustrative, not a forecast.${sources ? ' Sources: Carta, Founder Ownership Report 2026; Series D, Carta data reported by SaaStr.' : ''}`;
}

/** La part des fondateurs, étape après étape (06/11, 7e passe : visible sur l'accueil).
 *  Deux chemins, dits en clair au-dessus du tracé : ProFund, une ligne droite ; VC, un escalier
 *  (levées intermédiaires comprises, calé sur les parts Carta par étape). Ce que l'écart coûte
 *  se lit dans la zone teintée. La colonne à part est un cas réel, sourcé sous le graphique :
 *  le fondateur de Deliveroo à l'IPO, jamais mêlé au calcul. */
// Le cas réel : la part de Will Shu dans Deliveroo à l'IPO de 2021 (prospectus, relu le 06/11).
const REAL_IPO = 0.063;

export function StakeChart() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const start = FM.founders;
  const stages = [
    { label: 'Today', v: start, bridge: false },
    ...FM.vc_stakes.map((s) => ({ label: s.bridge ? 'Bridge' : s.label, v: s.founders, bridge: s.bridge })),
  ];
  const end = stages[stages.length - 1].v;
  const n = stages.length;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (v: number) => 100 - (v / start) * 88;   // 12 % de marge en haut, pour l'étiquette
  // L'escalier du chemin VC, d'un bord à l'autre du tracé.
  const pts = stages.flatMap((s, i) => (i === 0 ? [[0, y(s.v)]] : [[x(i), y(stages[i - 1].v)], [x(i), y(s.v)]]));
  pts.push([100, y(end)]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const top = y(start);
  return (
    <div ref={ref} className={`pv-card pv-path${seen ? ' in' : ''}`}>
      <h3 className="pv-h3">Your stake, round after round</h3>
      <div className="pv-paths">
        <div className="pf">
          <p className="k"><i aria-hidden="true" />ProFund path</p>
          <p className="v"><b>{pct(start, 1)}</b> at exit</p>
          <p>Credit carries your growth. No new shares unless you choose, and your option pool refills with bought-back shares.</p>
        </div>
        <div className="vc">
          <p className="k"><i aria-hidden="true" />VC path, on Carta’s medians</p>
          <p className="v"><b>{pct(end, 1)}</b> after the Series D</p>
          <p>Equity pays for your growth. Every round and every bridge issues new shares, and the option pool is topped up along the way.</p>
        </div>
      </div>
      <div className="pv-path-wrap" aria-hidden="true">
        <div className="pv-path-main">
          <div className="pv-path-plot">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon className="keep" points={`${line} 100,100 0,100`} />
              <polygon className="gap" points={`0,${top} 100,${top} ${[...pts].reverse().map((p) => p.join(',')).join(' ')}`} />
              <polyline className="vc" points={line} vectorEffect="non-scaling-stroke" />
              <line className="pf" x1="0" y1={top} x2="100" y2={top} vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="pv-path-pf" style={{ bottom: `${100 - top}%` }}>ProFund path: {pct(start, 1)}<em>, from today to exit</em></span>
            <span className="pv-path-gap" style={{ top: `${top}%` }}>Taken by the VC rounds</span>
            <span className="pv-path-keep">What you keep on the VC path</span>
            {stages.map((s, i) => (
              <span key={`${s.label}${i}`} className={`pv-path-pt${s.bridge ? ' bridge' : ''}`} style={{ left: `${x(i)}%`, top: `${y(s.v)}%` }}>
                <i /><b>{pct(s.v, 1)}</b>
              </span>
            ))}
            {/* au survol d'une étape : les deux chemins, côte à côte */}
            <div className="pv-path-hits" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {stages.map((s, i) => (
                <div key={`${s.label}${i}`} className={i < n / 2 ? 'l' : 'r'}>
                  <span className="pv-path-tip">
                    <b>{s.label}</b>
                    <span><i className="pf" />ProFund path<b>{pct(start, 1)}</b></span>
                    <span><i className="vc" />VC path<b>{pct(s.v, 1)}</b></span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="pv-path-x" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => <span key={`${s.label}${i}`} className={s.bridge ? 'bridge' : undefined}>{s.label}</span>)}
          </div>
        </div>
        <div className="pv-path-real">
          <div className="pv-path-plot">
            <i style={{ height: `${(REAL_IPO / start) * 88}%` }}><b>{pct(REAL_IPO, 1)}</b></i>
          </div>
          <span>Deliveroo’s founder, at IPO</span>
        </div>
      </div>
      {/* le même contenu, pour un lecteur d'écran */}
      <table className="pv-vh">
        <caption>Founders’ stake at each stage, on the VC path and on the ProFund path</caption>
        <thead><tr><th>Stage</th><th>VC path</th><th>ProFund path</th></tr></thead>
        <tbody>
          {stages.map((s, i) => <tr key={`${s.label}${i}`}><td>{s.label}</td><td>{pct(s.v, 1)}</td><td>{pct(start, 1)}</td></tr>)}
          <tr><td>Deliveroo’s founder, at IPO (a real case)</td><td>{pct(REAL_IPO, 1)}</td><td>–</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/** Le tableau illustratif des fondateurs (/pitch) ; `investor` ajoute la colonne Series A.
 *  06/11 (6) : il quitte l'accueil, et la colonne « cas Deliveroo » disparaît : jamais de nom
 *  de société réelle à côté d'un calcul fictif. */
export function FounderTable({ investor = false }: { investor?: boolean }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const top = Math.max(...FM.rows.map((r) => r.founders_profund));
  const bar = (v: number) => ({ ['--w' as string]: `${Math.max(1.5, (v / top) * 100)}%` });
  // 06/11 : l'écart, dit dans la colonne ProFund (accueil)
  const gain = (r: { founders_vc: number; founders_profund: number }) => {
    if (!(r.founders_vc > 0)) return `VC path: ${eur(0)}`;
    const x = r.founders_profund / r.founders_vc;
    return `${x >= 10 ? Math.round(x) : x.toFixed(1)}× the VC path`;
  };
  return (
    <div ref={ref} className={`pv-math${seen ? ' in' : ''}`}>
      <div className="pv-math-head" aria-hidden="true">
        <span>Exit</span><span>Founders, VC path</span>
        <span className="pf">Founders, ProFund path</span>
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
            {!investor && <em className="pv-math-x">{gain(r)}</em>}
          </span>
          {investor && <span className="pv-math-m"><small>Series A, VC path</small>{mult(r.series_a_vc)}</span>}
          {investor && <span className="pv-math-m pf"><small>ProFund, equity</small>{mult(r.series_a_profund)}</span>}
        </div>
      ))}
    </div>
  );
}

// ── Les chiffres (06/11 (7)) : le graphique visible, le term sheet et le calculateur repliés ──
// Un cas public et les médianes Carta : ne pas les modifier sans relire les sources
// (prospectus de Deliveroo du 22/03/2021, relu le 06/11 ; Carta, Founder Ownership Report
// 2026 ; la D, 11,4 % : donnée Carta citée par SaaStr, relue le 06/11).
const A_ = (href: string, t: string) => <a href={href} target="_blank" rel="noopener noreferrer">{t}</a>;

/** Sur l'accueil : le calculateur et le term sheet se déplient ici. */
export function TheMath({ calcOpen = false, onCalc, onPact }: { calcOpen?: boolean; onCalc: () => void; onPact: () => void }) {
  return (
    <Say id="math" title="The capital you don’t raise is the company you keep."
      lead={<p className="pv-say-p">Most founding teams end up with a fraction of what they built. On our path, your stake today is your stake at exit. When credit cannot carry your growth, we bring the equity on the same terms.</p>}>
      <StakeChart />
      <p className="pv-fine">{founderNote(false)}</p>
      <p className="pv-fine pv-three-src">
        Fully diluted, not specific to Europe: {A_('https://carta.com/data/founder-ownership-2026/', 'Carta, Founder Ownership Report 2026')}; Series D, Carta data
        reported by {A_('https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/', 'SaaStr')}. Deliveroo: {A_('https://lexismarkettracker.lexisnexis.com/documents/0035/35079/167313/MT_Deliveroo%20plc_prospectus_22%20March%202021.pdf', 'IPO prospectus, 22 March 2021')} (6.3% of the
        share capital, at the mid-point of the price range, after about £1.3bn raised; he kept control through 20-vote shares, for three years).
      </p>
      <div className="pv-say-folds">
        <Fold id="term-sheet" title="The term sheet, rewritten" sub="What a classic term sheet takes, what our pact gives back">
          <TermSheetGrid onPact={onPact} />
        </Fold>
      </div>
      {/* le calculateur garde son ancre : /#calculator, le pied de page, le bandeau final */}
      <div className="pv-calc-dock" id="calculator-dock">
        <div>
          <h3>Your numbers, your path.</h3>
          <p>Your stake today, the rounds you plan, your expected exit: what you keep on each path.</p>
        </div>
        <DrawerToggle open={calcOpen} controls="calculator" onClick={onCalc}
                      label="Run your numbers" closeLabel="Close the calculator" />
      </div>
      <Drawer id="calculator" open={calcOpen} label="Run your numbers">
        <Calculator className="pv-calc-home" />
      </Drawer>
    </Say>
  );
}

// ── Le term sheet, réécrit (v3.15, 06/11) ────────────────────────────────────
// Ce qu'un term sheet VC classique prend, ce que le pacte rend : chaque ligne ProFund est
// une clause du pacte (Pact.tsx) ; ne rien promettre de plus.
const TERMS: { k: string; vc: string; pf: string }[] = [
  { k: 'Rounds', vc: 'A new round every 18 months, on their terms', pf: 'When you choose, on your terms' },
  { k: 'Your stake', vc: 'Down at every round: 11.4% after the Series D, at the median', pf: 'Diluted only when you choose. Every cancellation lifts it' },
  { k: 'Board', vc: 'A seat for every lead. Your majority erodes', pf: 'One seat. The majority stays yours' },
  { k: 'Votes', vc: 'Every investor votes its own shares', pf: 'Our shares vote with you' },
  { k: 'Vetoes', vc: 'Consent on the budget, key hires, new rounds, the sale', pf: 'Only on what would change our shares behind our back' },
  { k: 'Preference', vc: 'Stacked at every round, sometimes participating', pf: '1× non-participating, once' },
  { k: 'Exit', vc: 'Investor consent on the sale', pf: 'No veto on a sale. Same terms for everyone' },
  { k: 'Leavers', vc: 'Bad leaver for resigning during vesting', pf: 'Bad leaver only for fraud, misconduct or competing. Vested shares stay yours' },
  { k: 'Angels, early funds', vc: 'Stay on your cap table, with their votes', pf: 'Bought out with your agreement. Their votes move to your side' },
];

function TermSheetGrid({ onPact }: { onPact: () => void }) {
  return (
    <>
      <p className="lp-read lp-fold-lead">We keep what protects the capital, never the control.</p>
      <div className="pv-ts-grid" role="table" aria-label="Classic VC term sheet against the ProFund pact">
        <div className="pv-ts-row head" role="row">
          <span role="columnheader" />
          <span role="columnheader">Classic VC term sheet</span>
          <span role="columnheader">The ProFund pact</span>
        </div>
        {TERMS.map((t) => (
          <div key={t.k} className="pv-ts-row" role="row">
            <span className="k" role="rowheader">{t.k}</span>
            <span className="vc" role="cell"><small>Classic VC</small>{t.vc}</span>
            <span className="pf" role="cell"><small>ProFund</small><Icon name="check" />{t.pf}</span>
          </div>
        ))}
      </div>
      <div className="pv-ctas pv-ts-cta">
        <button type="button" className="pv-btn" onClick={onPact}>Read the {N_CLAUSES} clauses <Icon name="arrow" /></button>
      </div>
    </>
  );
}

// ── Every stage ──────────────────────────────────────────────────────────────
// Les tickets sont ceux des bornes du modèle (fund_model.BOUNDS). Les SPV (au-delà
// du plafond par société) sont hors du fonds : documents LP seulement.
const STAGES = [
  { layer: 'Seed', stage: 'Pre-seed, seed', ticket: eurRange(L.seed.ticket_min, L.seed.ticket_max),
    what: 'Your first equity round, as lead or radar ticket' },
  { layer: 'Venture', stage: 'Seed+, Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    what: 'First cheque at the inflection, or a buyback of your angels and leavers' },
  { layer: 'Growth', stage: 'Series B and beyond',
    ticket: eurRange(L.growth.ticket_min, F.company_cap),
    what: 'Fresh growth rounds, buybacks of early funds, growth loans, acquisition financing' },
];

function StagesGrid() {
  return (
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
  );
}

/** Le bloc complet, sur /pitch. */
export function EveryStage({ tint = false, kicker = true }: { tint?: boolean; kicker?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="stages">
      <div className="pv-wrap">
        <div className="pv-head">
          {kicker && <p className="pv-kick">Every stage</p>}
          <h2 className="pv-h2">Pre-seed to growth.</h2>
          <p className="sub">At every layer, a first equity cheque or a buyback of existing shares. Then loans, and more equity whenever you choose, on the same terms.</p>
        </div>
        <StagesGrid />
        {/* 06/11 : avec un fonds de premier plan en lead, on suit ses termes (pratique usuelle d'un co-investisseur) */}
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="handshake" /></span>
          <p><b>Raising from a top-tier fund? Take both.</b> When another fund leads your round, we invest alongside, on its terms.</p>
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
            Senior Associate at Partech Ventures, Google. Three exits at 10×, 20× and 19× before the fund.
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
/** `onOpen` : les boutons déplient le calculateur ou le pacte de l'accueil et y défilent. */
export function FinalCall({ onOpen }: { onOpen?: (panel: 'pact' | 'calculator') => void }) {
  return (
    <section className="pv-sec pv-reserve-sec" id="final">
      <div className="pv-wrap">
        <div className="pv-band pv-final">
          <div>
            <h2>If this was written for you, you already know.</h2>
            <p>See what you keep. Read what we sign.</p>
          </div>
          <div className="pv-band-ctas">
            {onOpen ? (
              <>
                <button type="button" className="pv-btn light" onClick={() => onOpen('calculator')}>Run your numbers <Icon name="arrow" /></button>
                <button type="button" className="pv-btn ghost-light" onClick={() => onOpen('pact')}>Read the pact</button>
              </>
            ) : (
              <>
                <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
                <Link to="/terms" className="pv-btn ghost-light">Read the pact</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Les moteurs, pour les fondateurs (v3.14 ; v3.15, 06/11) ──────────────────
// Deux noms côté fondateur : la croissance externe (l'ancien Deal Engine : cibles et
// partenaires) et la croissance interne (l'ancien Growth Engine : inbound, outbound).
// Côté LPs, OurEdge (Thesis.tsx) et la fiche p. 3 portent les mêmes noms, dits pour les LPs.
const ENGINES: { icon: IconName; name: string; d: string; steps: { k: string; d: string }[] }[] = [
  { icon: 'radar', name: 'The External AI Growth Engine',
    d: 'The acquisitions and partnerships that could move your company, found before anyone else.',
    steps: [
      { k: 'Set up', d: 'Together, we set up your investment thesis.' },
      { k: 'Every day', d: 'We scan the web, then source, assess and qualify the startups that could create the strongest synergies with your company.' },
    ] },
  { icon: 'bot', name: 'The Internal AI Growth Engine',
    d: 'Your content, inbound and outbound, prepared every day. You keep the last word.',
    steps: [
      { k: 'Set up', d: 'Together, we set up your ideal customer profiles.' },
      { k: 'Inbound', d: 'A daily editorial feed: LinkedIn and X posts in your brand voice, written for your ideal customers. You approve or decline each one.' },
      { k: 'Outbound', d: 'A daily feed of intent-based leads that match your ideal customer profiles, each with a personalised sequence. You approve, and it goes out automatically from your LinkedIn account and our cold email infrastructure.' },
    ] },
];

// La preuve (06/11, Antoine) : deux sociétés que les moteurs font tourner aujourd'hui.
const RUN = [
  { name: 'Proplace', logo: '/portfolio-proplace.png', href: 'https://proplace.co', wide: false,
    d: 'Autonomous AI operating system for corporate development and M&A.' },
  { name: 'Maximum Insurance', logo: '/portfolio-maximum-insurance.svg', href: 'https://maximum-insurance.com', wide: true,
    d: 'Travel insurance and duty of care for companies and their teams abroad.' },
];

// Les mêmes moteurs, vus des LPs (06/11) : le fonds s'en sert pour trouver ses sociétés,
// puis les branche dans chacune. Le process, pas le slogan.
const ENGINES_LP: typeof ENGINES = [
  { icon: 'radar', name: 'The External AI Growth Engine',
    d: 'Our sourcing, and each company’s corporate development.',
    steps: [
      { k: 'For the fund', d: 'Every European seed round, scored each week against our four laws; inflection points flagged before they become consensus. It feeds the live deal flow our LPs follow.' },
      { k: 'For each company', d: 'With the founder, we set up the company’s investment thesis. Every day, the engine scans the web, then sources, assesses and qualifies the startups with the strongest synergies.' },
    ] },
  { icon: 'bot', name: 'The Internal AI Growth Engine',
    d: 'Each company’s content, inbound and outbound, prepared every day and approved by the founder.',
    steps: [
      { k: 'Set up', d: 'With the founder, we set up the company’s ideal customer profiles.' },
      { k: 'Inbound', d: 'A daily editorial feed of LinkedIn and X posts in the company’s voice, written for those customers. The founder approves or declines each one.' },
      { k: 'Outbound', d: 'A daily feed of intent-based leads with personalised sequences, sent from the founder’s LinkedIn account and our cold email infrastructure once approved.' },
    ] },
];

/** La preuve : les sociétés que les deux moteurs font tourner aujourd'hui (accueil et /lp). */
export function EnginesRunning() {
  return (
    <div className="pv-run">
      <div className="pv-run-head">
        <p className="pv-kick">Running today</p>
        <p>Their corporate development, inbound and outbound are run entirely by these two engines.</p>
      </div>
      <div className="pv-run-grid">
        {RUN.map((c) => (
          <a key={c.name} className="pv-run-co" href={c.href} target="_blank" rel="noopener noreferrer">
            <span className="pv-run-lg"><img src={c.logo} alt={c.name} className={c.wide ? 'wide' : undefined} /></span>
            <p>{c.d}</p>
            <ul>
              <li><Icon name="radar" />Corporate development<b>External AI Growth Engine</b></li>
              <li><Icon name="bot" />Inbound and outbound<b>Internal AI Growth Engine</b></li>
            </ul>
            <span className="pv-run-go">{c.href.replace(/^https:\/\/(www\.)?/, '')} <Icon name="out" /></span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Les cartes des moteurs ; leurs étapes se déplient (`open`). */
function EngineCards({ engines, open }: { engines: typeof ENGINES; open: boolean }) {
  return (
    <div className="pv-edge">
      {engines.map((e, i) => (
        <div key={e.name} className="pv-eng">
          <span className="pv-ic"><Icon name={e.icon} /></span>
          <h3>{e.name}</h3>
          <p>{e.d}</p>
          <Drawer id={`engine-${i}`} open={open} label={`${e.name}, step by step`}>
            <ol className="pv-eng-steps">
              {e.steps.map((st, n) => (
                <li key={st.k}>
                  <span className="n">{String(n + 1).padStart(2, '0')}</span>
                  <b>{st.k}</b>
                  <p>{st.d}</p>
                </li>
              ))}
            </ol>
          </Drawer>
        </div>
      ))}
    </div>
  );
}

/** Les deux moteurs, pour les fondateurs (accueil). */
export function FounderEngines() {
  const [open, setOpen] = useState(false);
  return (
    <section className="pv-sec night" id="engines">
      <div className="pv-wrap">
        <div className="pv-head">
          <h2 className="pv-h2">Two AI engines, working for you.</h2>
          <p className="sub">The engines that already run ProFund, Proplace, Maximum Insurance and Sosuites.</p>
        </div>
        <EngineCards engines={ENGINES} open={open} />
        <div className="pv-eng-more">
          <DrawerToggle open={open} controls="engine-0" onClick={() => setOpen((o) => !o)} className="ghost-light"
                        label="How they work" closeLabel="Close" />
        </div>
        <EnginesRunning />
      </div>
    </section>
  );
}

/** Les mêmes moteurs, étape par étape, vus des LPs (/lp, données détaillées). */
export function EnginesForLps() {
  return <div className="lp-night"><EngineCards engines={ENGINES_LP} open /></div>;
}
