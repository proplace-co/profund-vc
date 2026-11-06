import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
import { N_CLAUSES, PACT_LEAD, PactList } from './Pact';
import { Calculator } from './CalculatorPage';
import { Drawer, DrawerToggle } from './Drawer';
import { eur, eurRange, fund, mult, pct } from '../lib/fund';
import { atFounderStake, millions, payout, vcCapTable } from '../lib/founderMath.js';

// LA PROPOSITION FONDATEURS (v3, Antoine, 05/11) : un seul tour en actions, puis des
// prêts et des rachats. v3.8 : l'accueil ne parle qu'aux fondateurs et se construit
// autour d'une idée, le contrôle revient au fondateur. L'exigence ne se dit pas, elle
// se lit : peu de mots, des chiffres, un seul bouton (« Run your numbers »).
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
// `keep` : le début de la ligne, NON barré (v3.15, 06/11 : on garde un siège au conseil,
// seul « and a veto » est barré).
const RULES: { keep?: string; old: string; now: string }[] = [
  // 06/11 (Antoine) : plus de « One round. Then never again. » : on joue la concurrence
  // avec les meilleurs fonds, chèque pour chèque, et on gagne par les termes.
  { old: 'Big cheques, on their terms', now: 'The same cheques. Your terms.' },
  { old: 'A slice of your company at every round', now: 'You dilute only when you choose.' },
  { keep: 'A board seat', old: 'and a veto', now: 'One seat. Our shares vote with you.' },
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
              <span className="old">{r.keep && <em>{r.keep} </em>}<span>{r.old}</span></span>
              <span className="arrow" aria-hidden="true"><Icon name="arrow" /></span>
              <span className="now">{r.now}</span>
            </li>
          ))}
        </ol>
        {/* la conclusion des règles barrées (Antoine, 05/11 : en bas, pas sous le titre) */}
        <p className="pv-rules-sub">For fifty years, every round took a piece of it. Your shares, your board, your exit. Now you get the capital without giving the company away.</p>
        <div className="pv-rules-foot" id="pact-dock">
          <span>Written into the pact. The same for every founder. Raise elsewhere whenever you want: we follow or lead.</span>
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

// ── Le capital, optimisé (v3.9) ──────────────────────────────────────────────
// Les poches profondes, sans promesse intenable : chaque euro vient de la source la
// moins chère d'abord ; l'equity en dernier, et seulement si le fondateur la demande
// (aux conditions du pacte, préférence 1× comme notre premier chèque).
export function CapitalStack() {
  const [ref, seen] = useInView<HTMLOListElement>();
  const steps: { icon: IconName; tag: string; t: string; d: string }[] = [
    { icon: 'trend', tag: 'No dilution', t: 'Your growth',
      d: 'Revenue funds what it can. That is what AI-native teams do best.' },
    { icon: 'banknote', tag: 'No dilution', t: 'The loan line',
      d: 'Reserved from day one, with our fund and partner lenders. Hiring, go-to-market, working capital, acquisitions. Drawn in tranches, repaid from growth.' },
    { icon: 'target', tag: 'Your call', t: 'Equity, cheque for cheque',
      d: `Seed, pre-Series A, Series A, Series B: from ${eur(L.seed.ticket_min)} to ${eur(F.company_cap, 'tile')} per company from the fund, the cheques the best funds write.` },
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
    <section className="pv-sec" id="capital">
      <div className="pv-wrap">
        <div className="pv-head">
          <h2 className="pv-h2">Funded like the leaders. Diluted like no one.</h2>
          <p className="sub">Every euro comes from the cheapest source first. When you want equity, we write the cheques the best funds write, on terms they don’t.</p>
        </div>
        <div className="pv-figs">
          {figs.map((f) => <div key={f.s}><b>{f.b}</b><span>{f.s}</span></div>)}
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
export function founderNote() {
  return `Typical European path, calibrated on Carta medians: ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, founders at ${(FM.founders * 100).toFixed(1)}% after the Series A; then ${eur(FM.vc_equity, 'tile')} of equity over the Series B, C and D, each one preceded by a bridge, with option pool refreshes and 1× non-participating preferences. Founders hold ${AFTER('B')} after the Series B, ${AFTER('C')} after the C and ${AFTER('D')} after the D, Carta’s medians (27.3% for AI teams after the B; 16.1% after the C, when the employee pool overtakes the founders; 11.4% after the D). ProFund path: same seed and Series A, then ${eur(FM.loans, 'tile')} of loans, for a company that needs far less capital; the pool is refilled with bought-back shares. Illustrative, not a forecast. Sources: Carta, Founder Ownership Report 2026; Series D, Carta data reported by SaaStr.`;
}

/** La part des fondateurs, étape après étape (v3.15, 06/11) : toutes les étapes du chemin
 *  VC, levées intermédiaires comprises (elle fond) ; le chemin ProFund est une ligne (elle
 *  ne bouge pas) ; la dernière colonne est un cas réel, sourcé dans RealDilution : le
 *  fondateur de Deliveroo à l'IPO, après des tours jusqu'à la série H. */
// Le cas réel : la part de Will Shu dans Deliveroo à l'IPO de 2021 (sources dans RealDilution).
const REAL_IPO = 0.063;
// Ce que toucheraient les fondateurs à ce niveau : même chemin VC, mêmes préférences.
const CAP_REAL = atFounderStake(vcCapTable({ founders: FM.founders, holders: FM.holders, rounds: FM.vc_rounds }), REAL_IPO);
const realAt = (exit: number) => millions(payout(exit, CAP_REAL).founders);

function StakeChart() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const cols: { label: string; v: number; kind: 'now' | 'bridge' | 'round' | 'real' }[] = [
    { label: 'Today', v: FM.founders, kind: 'now' },
    ...FM.vc_stakes.map((s) => ({ label: s.bridge ? 'Bridge' : s.label, v: s.founders, kind: s.bridge ? 'bridge' as const : 'round' as const })),
    { label: 'Deliveroo, at IPO', v: REAL_IPO, kind: 'real' },
  ];
  const h = (v: number) => `${(v / FM.founders) * 100}%`;
  return (
    <div ref={ref} className={`pv-card pv-stake${seen ? ' in' : ''}`}>
      <div className="pv-stake-top">
        <h3 className="pv-h3">Your stake, round after round</h3>
        <div className="pv-legend">
          <span className="pf">ProFund path</span>
          <span className="vc">VC path, Carta medians</span>
          <span className="lost">Taken by the VC rounds</span>
          <span className="real">A real case</span>
        </div>
      </div>
      <div className="pv-stake-plot">
        <div className="pv-stake-pf" aria-hidden="true">
          <span>ProFund path: {pct(FM.founders, 1)}<em>, from today to exit</em></span>
        </div>
        {/* la colonne du cas réel est plus large : son nom tient sur mobile */}
        <div className="pv-stake-grid" style={{ gridTemplateColumns: `repeat(${cols.length - 1}, minmax(0, 1fr)) minmax(0, 1.6fr)` }}>
          {cols.map((c, i) => (
            <div key={`${c.label}${i}`} className={`pv-stake-col ${c.kind}`} style={{ ['--d' as string]: `${i * 0.1}s` }}>
              <div className="pv-stake-bars">
                {/* 06/11 : ce que le chemin VC a pris, de la barre jusqu'à la ligne ProFund */}
                {c.kind !== 'now' && <s style={{ ['--h' as string]: h(c.v) }} aria-hidden="true" />}
                <i style={{ ['--h' as string]: h(c.v) }}><b>{pct(c.v, 1)}</b></i>
              </div>
              <span className="pv-stake-l">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Le tableau « The capital you don't raise » ; `investor` ajoute la colonne Series A (deck) ;
 *  `real` (accueil) ajoute le cas réel : les fondateurs à 6,3 %, mêmes tours, mêmes préférences. */
export function FounderTable({ investor = false, real = false }: { investor?: boolean; real?: boolean }) {
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
        {real && <span className="real">At {pct(REAL_IPO, 1)}, the Deliveroo case</span>}
        <span className="pf">Founders, ProFund path</span>
        {investor && <span>Series A investor, VC path</span>}
        {investor && <span>ProFund, equity</span>}
      </div>
      {FM.rows.map((r) => (
        <div key={r.exit} className={`pv-math-row${investor ? ' wide' : ''}${real ? ' real' : ''}`}>
          <span className="pv-math-exit"><small>Exit</small>{eur(r.exit, 'val')}</span>
          <span className="pv-math-v vc">
            <small>VC path</small>
            <b>{eur(r.founders_vc, 'tile')}</b>
            <i style={bar(r.founders_vc)} />
          </span>
          {real && (
            <span className="pv-math-v real">
              <small>At {pct(REAL_IPO, 1)}, Deliveroo</small>
              <b>{eur(realAt(r.exit), 'tile')}</b>
              <i style={bar(realAt(r.exit))} />
            </span>
          )}
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

// ── La dilution réelle (v3.15, 06/11) ────────────────────────────────────────
// Un cas public et les médianes Carta, sourcés en note : ne pas les modifier sans relire
// les sources (CNBC du 23/03/2021, d'après le prospectus ; Tech.eu du 17/01/2021 ;
// Carta, Founder Ownership Report 2026 ; la D, 11,4 % : donnée Carta citée par SaaStr).
const CARTA: { v: number; l: string; s: string }[] = [
  { v: 0.375, l: 'After the Series A', s: 'Digital companies' },
  { v: 0.273, l: 'After the Series B', s: 'AI teams' },
  { v: 0.161, l: 'After the Series C', s: 'Less than the employee pool' },
  { v: 0.114, l: 'After the Series D', s: 'Carta data, via SaaStr' },
  { v: REAL_IPO, l: 'Deliveroo’s founder, at IPO', s: 'A real case' },
];

function RealDilution() {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <>
      <div ref={ref} className={`pv-real${seen ? ' in' : ''}`}>
        <div className="pv-real-case">
          <p className="pv-kick">A real case</p>
          <b className="pv-real-big">6.3%</b>
          <p>
            Will Shu’s stake in Deliveroo, the company he co-founded, at its 2021 IPO. After rounds up to a
            Series H and more than $1.5bn raised, he kept control only through 20-vote shares, for three years.
          </p>
        </div>
        <div className="pv-real-carta">
          <p className="pv-kick">The median founding team</p>
          <ol>
            {CARTA.map((c, i) => (
              <li key={c.l} style={{ ['--w' as string]: `${(c.v / CARTA[0].v) * 100}%`, ['--d' as string]: `${0.1 + i * 0.15}s` }}>
                <span className="l">{c.l}<small>{c.s}</small></span>
                <b>{pct(c.v, 1)}</b>
                <i />
              </li>
            ))}
          </ol>
          <p className="pv-real-pf"><Icon name="shield" />On our path, your stake today is your stake at exit.</p>
        </div>
      </div>
      <p className="pv-fine pv-real-src">
        Deliveroo: CNBC, 23 March 2021, from the IPO prospectus (6.3% of the share capital; Class B shares with 20 votes,
        converting three years after the IPO); Tech.eu, 17 January 2021 (Series H). Median founding-team ownership, fully
        diluted: Carta, Founder Ownership Report 2026; Series D, Carta data reported by SaaStr (“The Real State of Seed
        Today”).
      </p>
    </>
  );
}

/** `onCalc` : le calculateur se déplie sous le tableau (accueil) ; sinon un lien vers /calculator. */
export function TheMath({ tint = true, calcOpen = false, onCalc }: { tint?: boolean; calcOpen?: boolean; onCalc?: () => void }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="math">
      <div className="pv-wrap">
        <div className="pv-head">
          <h2 className="pv-h2">The capital you don’t raise is the company you keep.</h2>
          <p className="sub">On the VC path, the median founding team holds 16.1% of its company after the Series C, and 11.4% after the D. On ours, your stake today is your stake at exit. When debt cannot carry your growth, we bring the equity on the same terms.</p>
        </div>
        {onCalc && <RealDilution />}
        <StakeChart />
        <h3 className="pv-h3 pv-math-t">What you take home</h3>
        <FounderTable real={!!onCalc} />
        {onCalc && (
          <p className="pv-fine">
            At {pct(REAL_IPO, 1)}: the founders brought down to the stake Deliveroo’s founder held at IPO, with the same rounds and
            preferences as the VC path. A scenario, not a forecast.
          </p>
        )}
        {onCalc ? (
          <>
            {/* 06/11 : de l'air entre la ligne à 1 Md€ et le bouton */}
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
          </>
        ) : (
          <div className="pv-ctas pv-math-cta">
            <Link to="/calculator" className="pv-btn">Run your numbers <Icon name="arrow" /></Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Le term sheet, réécrit (v3.15, 06/11) ────────────────────────────────────
// Ce qu'un term sheet VC classique prend, ce que le pacte rend : chaque ligne ProFund est
// une clause du pacte (Pact.tsx) ; ne rien promettre de plus.
const TERMS: { k: string; vc: string; pf: string }[] = [
  { k: 'Rounds', vc: 'A new round every 18 months, on their terms', pf: 'When you choose, cheque for cheque, on your terms' },
  { k: 'Your stake', vc: 'Down at every round: 11.4% after the Series D, at the median', pf: 'Diluted only when you choose. Every cancellation lifts it' },
  { k: 'Board', vc: 'A seat for every lead. Your majority erodes', pf: 'One seat. The majority stays yours' },
  { k: 'Votes', vc: 'Every investor votes its own shares', pf: 'Our shares vote with you' },
  { k: 'Vetoes', vc: 'Consent on the budget, key hires, new rounds, the sale', pf: 'Only on what would change our shares behind our back' },
  { k: 'Preference', vc: 'Stacked at every round, sometimes participating', pf: '1× non-participating, once' },
  { k: 'Exit', vc: 'Investor consent on the sale', pf: 'No veto on a sale. Same terms for everyone' },
  { k: 'Leavers', vc: 'Bad leaver for resigning during vesting', pf: 'Bad leaver only for fraud, misconduct or competing. Vested shares stay yours' },
  { k: 'Angels, early funds', vc: 'Stay on your cap table, with their votes', pf: 'Bought out with your agreement. Their votes move to your side' },
];

export function TermSheet({ onPact }: { onPact?: () => void }) {
  return (
    <section className="pv-sec tint" id="term-sheet">
      <div className="pv-wrap">
        <div className="pv-head">
          <h2 className="pv-h2">The term sheet, rewritten.</h2>
          <p className="sub">What a classic term sheet takes from you, and what our pact gives back. We keep what protects the capital, never the control.</p>
        </div>
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
          {onPact
            ? <button type="button" className="pv-btn" onClick={onPact}>Read the {N_CLAUSES} clauses <Icon name="arrow" /></button>
            : <Link to="/terms" className="pv-btn">Read the {N_CLAUSES} clauses <Icon name="arrow" /></Link>}
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
    what: 'Your first equity round, as lead or radar ticket' },
  { layer: 'Venture', stage: 'Seed+, Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    what: 'First cheque at the inflection, or a buyback of your angels and leavers' },
  { layer: 'Growth', stage: 'Series B and beyond',
    ticket: eurRange(L.growth.ticket_min, F.company_cap),
    what: 'Fresh growth rounds, buybacks of early funds, growth loans, acquisition financing' },
];

export function EveryStage({ tint = false, kicker = true }: { tint?: boolean; kicker?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="stages">
      <div className="pv-wrap">
        <div className="pv-head">
          {kicker && <p className="pv-kick">Every stage</p>}
          <h2 className="pv-h2">Pre-seed to growth. Cheque for cheque with the best.</h2>
          <p className="sub">At every layer, a first equity cheque or a buyback of existing shares. Then loans, and more equity whenever you choose, on the same terms.</p>
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
        {/* 06/11 : avec un fonds de premier plan en lead, on suit ses termes (pratique usuelle d'un co-investisseur) */}
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="handshake" /></span>
          <p><b>Raising from a top-tier fund? Take both.</b> When another fund leads your round, we invest alongside on its terms, not ours, and the loan line, the buybacks and the engines come on top.</p>
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
function EnginesRunning() {
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

/** Les deux moteurs. `lp` : la version des LPs (/lp), avec le deal flow en direct. */
export function FounderEngines({ lp = false, onFollow }: { lp?: boolean; onFollow?: () => void }) {
  const engines = lp ? ENGINES_LP : ENGINES;
  return (
    <section className="pv-sec night" id="engines">
      <div className="pv-wrap">
        <div className="pv-head">
          {lp && <p className="pv-kick">Our edge</p>}
          <h2 className="pv-h2">{lp ? 'Two AI engines. A process, not a pitch.' : 'Two AI engines, working for you.'}</h2>
          <p className="sub">{lp
            ? 'They already run ProFund, Proplace, Maximum Insurance and Sosuites, and they plug into every company we back.'
            : 'The engines that already run ProFund, Proplace, Maximum Insurance and Sosuites.'}</p>
        </div>
        <div className="pv-edge">
          {engines.map((e) => (
            <div key={e.name} className="pv-eng">
              <span className="pv-ic"><Icon name={e.icon} /></span>
              <h3>{e.name}</h3>
              <p>{e.d}</p>
              <ol className="pv-eng-steps">
                {e.steps.map((st, i) => (
                  <li key={st.k}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <b>{st.k}</b>
                    <p>{st.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <EnginesRunning />
        {lp && onFollow && (
          <div className="pv-ctas pv-run-cta">
            <button type="button" className="pv-btn light" onClick={onFollow}><span className="pv-dot" />Follow our deal flow live</button>
          </div>
        )}
      </div>
    </section>
  );
}
