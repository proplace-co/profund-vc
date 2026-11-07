import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
import { N_CLAUSES, PACT_LEAD, PactList } from './Pact';
import { Calculator } from './CalculatorPage';
import { Drawer, DrawerToggle, Fold } from './Drawer';
import { eur, eurRange, fund, mult, pct, type FounderPath, type FounderPathId } from '../lib/fund';

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
  // v3.19 : plus de « No veto. Ever. » : une vente qui ne rend pas notre mise demande notre accord (clause 10).
  { old: 'Their exit, on their timing', now: 'Your exit, on your timing.' },
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
// 06/11 (9) : la vision (Antoine : « ça fait un peu vide ») : la même que la thèse (Thesis.tsx,
// quatre lois), dite au fondateur, sans le fonds ni son multiple.
const BACK: { t: string; d: string }[] = [
  { t: 'Visionary founders.', d: 'Obsessive from day one. You iterate directly with AI until the machine mirrors your ambition.' },
  { t: 'Self-improving systems.', d: 'Closed loops that compound in intelligence, precision and autonomy with every run.' },
  { t: 'Maximum impact, minimum headcount.', d: 'Massive, painful problems in the world’s largest markets, with near-zero marginal labor.' },
  { t: 'Category leaders.', d: 'Companies built to dominate their category, globally.' },
];

export function TheFew() {
  return (
    <Say id="few" title="The companies that define this era will be built by very few people."
      lead={(
        <>
          <p className="pv-say-p">Founders who direct machines instead of org charts. Who reach revenue before headcount. Who see what a market wants long before it asks.</p>
          <p className="pv-say-p">AI has collapsed what it takes to build. A tight team directing autonomous systems now does in months what used to take thousands of people and a decade. Capital is no longer scarce. Ownership is.</p>
          <p className="pv-say-p">So we back these teams from the first cheque, finance their growth with credit before equity, and put our AI engines to work for them.</p>
          <p className="pv-say-p"><b>Venture was written for companies that needed armies. You don’t. So we rewrote it.</b></p>
        </>
      )}>
      <p className="pv-kick pv-back-k">What we back</p>
      <ul className="pv-back">
        {BACK.map((x) => <li key={x.t}><h3>{x.t}</h3><p>{x.d}</p></li>)}
      </ul>
    </Say>
  );
}

// ── Le capital (v3.9 ; 06/11 (8)) : un chemin, celui d'un Chief Fundraising Officer interne ──
// La philosophie : lever tout ce qu'il faut pour tirer le maximum de la société, dans l'ordre
// qui dilue le moins. Humble, aligné, jamais faible (ni « You decide what you take »), aucune
// comparaison. Les étages et leurs tickets sont une lecture de LP : repliés. Si un autre fonds
// mène, on devient un co-investisseur classique (clause 8) : ne jamais y promettre prêts,
// rachats ni moteurs.
const CAPITAL: { t: string; d: string }[] = [
  { t: 'A cap table that gets cleaner.', d: 'We buy out angels and early funds, only with your agreement. Their votes move to your side.' },
  { t: 'Another lead? Take both.', d: 'When another fund leads your round, we invest alongside, on its terms.' },
];

export function CapitalStack() {
  const [ref, seen] = useInView<HTMLOListElement>();
  // 06/11 (9) : les chiffres du fonds sont fondus dans les étapes (montants de fund.json).
  const steps: { icon: IconName; tag: string; t: string; d: ReactNode }[] = [
    { icon: 'trend', tag: 'No dilution', t: 'Your growth',
      d: 'Revenue funds what it can. That is what AI-native teams do best.' },
    { icon: 'banknote', tag: 'No dilution', t: 'The loan line',
      d: 'Reserved from day one, with our fund and partner lenders. Hiring, go-to-market, working capital, acquisitions. Drawn in tranches, repaid from growth.' },
    { icon: 'target', tag: 'Your call', t: 'Equity, at every stage',
      d: <>Pre-seed to growth: <b>{eur(L.seed.ticket_min)} to {eur(F.company_cap, 'tile')}</b> per company from our <b>{eur(F.commitments, 'tile')}</b> Fund I. Follow-on included: loans, buybacks, and equity on the same terms.</> },
    { icon: 'shield', tag: 'Your call', t: 'Mega rounds, on your terms',
      d: <><b>Beyond {eur(F.company_cap, 'tile')}</b>, when you need far more to stay ahead of over-capitalised rivals, we lead the round with SPVs and co-investors alongside the fund, on the same terms. Every option stays open.</> },
  ];
  return (
    <Say id="capital" tone="tint" title="Diluted like no one."
      lead={<p className="pv-say-p">Think of us as your in-house Chief Fundraising Officer. Our job: raise everything the company needs to reach its full size, in the order that dilutes you least. Every share you don’t issue protects your stake, and ours.</p>}>
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
      <ul className="pv-ruled">
        {CAPITAL.map((c) => <li key={c.t}><h3>{c.t}</h3><p>{c.d}</p></li>)}
      </ul>
      <div className="pv-say-folds">
        <Fold id="stages" title="Stages and tickets" sub="What we write at each stage, from pre-seed to growth">
          <StageLadder />
        </Fold>
      </div>
    </Say>
  );
}

// ── How we back them ─────────────────────────────────────────────────────────
const BLOCKS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'Equity, when you choose.',
    d: 'In new shares, from your first round to your largest. After that, we never push for a new round.' },
  { icon: 'banknote', t: 'Credit before equity.',
    d: 'A reserved loan line carries what it can: hiring, go-to-market, working capital, acquisitions.' },
  // 05/11 : « Every cancellation lifts your stake » (la copie disait « buyback ») :
  // quand ProFund rachète un angel, la part du fondateur ne bouge pas ; c'est
  // l'annulation par la société qui la relève.
  { icon: 'trend', t: 'Cancellations lift your stake.',
    d: 'We buy back your angels, leavers and early funds, only with your agreement, and the company cancels shares every year. Every cancellation lifts your stake.' },
  { icon: 'shield', t: 'You keep control.',
    d: 'One board seat for us, the majority for you. No veto on how you run, raise or sell. Our shares vote with you.' },
  { icon: 'door', t: 'You choose your exit.',
    d: 'We never block a sale that pays back what we invested.' },
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
          <p>If you raise elsewhere, we can follow or lead the round. If another investor leads, we invest on its terms, never better. Fair both ways.</p>
          <Link to="/terms" className="pv-link">Read the {N_CLAUSES} clauses <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// ── The math ─────────────────────────────────────────────────────────────────
/** La note sous le tableau (/pitch) : chaque montant lu dans fund.json. */
// v3.15 : le chemin VC est calé sur les parts médianes de Carta par étape (fund_model.py).
const AFTER = (id: string) => pct(FM.vc_stakes.find((s) => s.round === id)!.founders, 1);
export function founderNote() {
  return `VC path, calibrated on Carta medians (not specific to Europe): ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, founders at ${(FM.founders * 100).toFixed(1)}% after the Series A; then ${eur(FM.vc_equity, 'tile')} of equity over the Series B, C and D, each one preceded by a bridge, with option pool refreshes and 1× non-participating preferences. Founders hold ${AFTER('B')} after the Series B, ${AFTER('C')} after the C and ${AFTER('D')} after the D, Carta’s medians (27.3% for AI teams after the B; 16.1% after the C, when the employee pool overtakes the founders; 11.4% after the D). With ProFund: same seed, Series A and valuations. The same capital: ${eur(FM.loans, 'tile')} of loans replace part of the bridges, at ${pct(FM.loan_share.min)} to ${pct(FM.loan_share.max)} of the last round (usual range for venture debt: 20% to 40%). Half the capital: no bridges and no Series D. Credit alone: no further round and no pool refresh. ${eur(FM.loan_debt, 'tile')} of loans and interest repaid before equity, subject to our partner lenders. Illustrative, not a forecast; no company has followed these paths yet. Sources: Carta, Founder Ownership Report 2026; Series D, Carta data reported by SaaStr; First Citizens, 22 September 2023.`;
}

/** Ce qu'un chemin vend et emprunte, dit en clair : « €199M of equity, €25M of loans ». */
export function pathMoney(p: FounderPath) {
  return [p.equity > 0 && `${eur(p.equity, 'tile')} of equity`, p.loans > 0 && `${eur(p.loans, 'tile')} of loans`].filter(Boolean).join(', ');
}

/** La part des fondateurs, étape après étape, selon l'equity vendue (07/11). 59 M€ de prêts ne
 *  tenaient pas : le crédit s'arrête à 25 M€, la taille du marché. À capital égal, l'écart est donc
 *  modeste (13,2 % contre 11,4 %) ; il devient massif quand la société a besoin de moins d'equity,
 *  et c'est la thèse. Chaque chemin dit ce qu'il lève : on ne compare plus deux levées sans le dire. */
const PATH_TAG: Record<FounderPathId, string> = {
  vc: 'VC path',
  same: 'With us, the same capital',
  half: 'With us, half the capital',
  credit: 'With us, credit alone',
};

export function StakeChart() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const start = FM.founders;
  const stages = [{ label: 'Today', bridge: false }, ...FM.vc_stakes.map((s) => ({ label: s.bridge ? 'Bridge' : s.label, bridge: s.bridge }))];
  const n = stages.length;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const y = (v: number) => 100 - (v / start) * 88;   // 12 % de marge en haut
  const at = (p: FounderPath, i: number) => (i === 0 ? start : p.stakes[i - 1]);
  // Un escalier, d'un bord à l'autre du tracé.
  const stairs = (p: FounderPath) => {
    const pts = stages.flatMap((_, i) => (i === 0 ? [[0, y(start)]] : [[x(i), y(at(p, i - 1))], [x(i), y(at(p, i))]]));
    pts.push([100, y(p.stake)]);
    return pts.map((q) => q.join(',')).join(' ');
  };
  const vc = FM.paths[0];
  return (
    <div ref={ref} className={`pv-card pv-path${seen ? ' in' : ''}`}>
      <h3 className="pv-h3">Your stake, by the equity you sell</h3>
      <ol className="pv-ends">
        {FM.paths.map((p) => (
          <li key={p.id} className={p.id}>
            <p className="k"><i aria-hidden="true" />{PATH_TAG[p.id]}</p>
            <b>{pct(p.stake, 1)}</b>
            <p>{pathMoney(p)}</p>
          </li>
        ))}
      </ol>
      <div className="pv-path-wrap" aria-hidden="true">
        <div className="pv-path-plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon className="keep" points={`${stairs(vc)} 100,100 0,100`} />
            {FM.paths.map((p) => <polyline key={p.id} className={p.id} points={stairs(p)} vectorEffect="non-scaling-stroke" />)}
          </svg>
          {FM.paths.map((p) => (
            <span key={p.id} className={`pv-path-end ${p.id}`} style={{ top: `${y(p.stake)}%` }}>
              <b>{pct(p.stake, 1)}</b><em>{p.label}</em>
            </span>
          ))}
          {/* au survol d'une étape : les quatre chemins, côte à côte */}
          <div className="pv-path-hits" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {stages.map((s, i) => (
              <div key={`${s.label}${i}`} className={i < n / 2 ? 'l' : 'r'}>
                <span className="pv-path-tip">
                  <b>{s.label}</b>
                  {FM.paths.map((p) => <span key={p.id}><i className={p.id} />{p.label}<b>{pct(at(p, i), 1)}</b></span>)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="pv-path-x" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {stages.map((s, i) => <span key={`${s.label}${i}`} className={s.bridge ? 'bridge' : undefined}>{s.label}</span>)}
        </div>
      </div>
      {/* le même contenu, pour un lecteur d'écran */}
      <table className="pv-vh">
        <caption>Founders’ stake at each stage, on each path</caption>
        <thead><tr><th>Stage</th>{FM.paths.map((p) => <th key={p.id}>{p.label}</th>)}</tr></thead>
        <tbody>
          {stages.map((s, i) => <tr key={`${s.label}${i}`}><td>{s.label}</td>{FM.paths.map((p) => <td key={p.id}>{pct(at(p, i), 1)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

/** Le tableau illustratif des fondateurs (/pitch) : les quatre chemins, chacun dit ce qu'il lève.
 *  07/11 : il ne compare plus 224 M€ d'equity à 25 M€ de prêts sans le dire. Jamais de nom de
 *  société réelle à côté de ce calcul fictif. */
export function FounderTable() {
  return (
    <div className="table-scroll pv-ts">
      <table className="fund-table pv-fm">
        <thead>
          <tr>
            <th rowSpan={2}>Exit</th>
            <th colSpan={FM.paths.length}>Founders take home</th>
            <th colSpan={FM.paths.length} className="sep">Series A investor, equity multiple</th>
          </tr>
          <tr>
            {FM.paths.map((p) => <th key={p.id}>{p.label}<small>{pathMoney(p)}</small></th>)}
            {FM.paths.map((p, i) => <th key={p.id} className={i === 0 ? 'sep' : undefined}>{p.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {FM.rows.map((r) => (
            <tr key={r.exit}>
              <td className="ex">{eur(r.exit, 'val')}</td>
              {FM.paths.map((p) => <td key={p.id} className={p.id}>{eur(r[`founders_${p.id}` as const], 'tile')}</td>)}
              {FM.paths.map((p, i) => <td key={p.id} className={`${p.id}${i === 0 ? ' sep' : ''}`}>{mult(r[`series_a_${p.id}` as const])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Les chiffres (06/11 (7)) : le graphique visible, le term sheet et le calculateur repliés ──
// Un cas public et les médianes Carta : ne pas les modifier sans relire les sources
// (prospectus de Deliveroo du 22/03/2021, relu le 06/11 ; Carta, Founder Ownership Report
// 2026 ; la D, 11,4 % : donnée Carta citée par SaaStr, relue le 06/11).
const A_ = (href: string, t: string) => <a href={href} target="_blank" rel="noopener noreferrer">{t}</a>;

/** Sur l'accueil : le graphique des chemins, le calculateur se déplie dessous. */
export function TheMath({ calcOpen = false, onCalc }: { calcOpen?: boolean; onCalc: () => void }) {
  return (
    <Say id="math" title="The equity you don’t sell is the company you keep."
      lead={<p className="pv-say-p">Most founding teams end up with a fraction of what they built. With us, credit carries what it can, and you sell only the equity your growth truly needs. For a team that does not need an army, that is far less.</p>}>
      <StakeChart />
      <p className="pv-fine">
        Same company, same valuations. VC path, calibrated on the medians of {A_('https://carta.com/data/founder-ownership-2026/', 'Carta’s Founder Ownership Report 2026')} (fully
        diluted, not specific to Europe; Series D, Carta data reported by {A_('https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/', 'SaaStr')}): each round preceded by a bridge, with
        option pool refreshes. With us: {eur(FM.loans, 'tile')} of loans in tranches, from our fund and partner lenders, each at {pct(FM.loan_share.min)} to {pct(FM.loan_share.max)} of the last round,
        within the usual 20% to 40% for venture debt ({A_('https://innovation.firstcitizens.com/business-growth/access-to-capital/right-amount-of-venture-debt', 'First Citizens')}). The same capital: they replace part of the bridges. Half the capital: no bridges and
        no Series D. Credit alone: no further round and no pool refresh. Elsewhere, the pool refreshes in new shares, as on the VC path. Buybacks and annual cancellations, which lift your stake, are not counted. Illustrative, not a forecast.
      </p>
      {/* le calculateur garde son ancre : /#calculator, le héros */}
      <div className="pv-calc-dock" id="calculator-dock">
        <div>
          <h3>Your numbers, your path.</h3>
          <p>Your stake today, the rounds you plan, your expected exit: what you keep on each path, for the same capital.</p>
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

/** Les étages sur l'accueil (06/11) : une montée sur fond de nuit, qui se lève à l'ouverture. */
function StageLadder() {
  return (
    <div className="pv-ladder">
      {STAGES.map((s, i) => (
        <div key={s.layer} className="pv-rung" style={{ ['--i' as string]: i }}>
          <span className="st">{s.stage}</span>
          <h3>{s.layer}</h3>
          <b className="tk">{s.ticket}</b>
          <p>{s.what}</p>
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
            <h2>Exceptional numbers deserve exceptional terms.</h2>
            <p>See what you keep, round after round.</p>
          </div>
          <div className="pv-band-ctas">
            {onOpen
              ? <button type="button" className="pv-btn light" onClick={() => onOpen('pact')}>Read the pact <Icon name="arrow" /></button>
              : <Link to="/terms" className="pv-btn light">Read the pact <Icon name="arrow" /></Link>}
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
