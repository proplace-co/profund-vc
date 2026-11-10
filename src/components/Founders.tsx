import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  // 07/11 (Alexandre) : plus de truismes (« You dilute only when you choose », « Your exit, on your
  // timing ») ni de « Big cheques » face aux géants : le contrôle, ce que le pacte change vraiment.
  // 07/11 (2) : « trop peu » : six règles, chacune une clause.
  // 10/11 (Alexandre) : quatre, le contrôle seul (clauses 6, 6, 1, 4) : la préférence 1× et le
  // vesting quittent la mise en avant (trop dans le détail ; ils restent dans le pacte).
  { old: 'Their seats, their votes, their veto', now: 'One seat. Our shares vote with you.' },
  { old: 'Their consent on your budget, your hires, your next round', now: 'No veto on how you run, raise or sell.' },
  { old: 'A new round pushed on you every 18 months', now: 'We never push for a round.' },
  // ProFund rachète : ce sont nos titres qui montent ; les votes passent du côté du fondateur.
  { old: 'Angels and leavers stuck on your cap table', now: 'We buy them out. Their votes move to your side.' },
];

// 10/11 (Alexandre : « que l'on ait vraiment le temps de lire ») : une règle toutes les 2,1 s, la
// première 0,9 s après l'arrivée à l'écran, puis la conclusion, une fois la dernière règle lue.
const RULE_START = 0.9;
const RULE_STEP = 2.1;
const CODA_AT = RULE_START + RULES.length * RULE_STEP + 0.4;

/** Le délai (s) d'une étape prévue `at` secondes après le départ commun `t0`, posé au premier appel. */
function delayFrom(t0: { current: number | null }, at: number) {
  const now = performance.now();
  if (t0.current === null) t0.current = now;
  return Math.max(0.08, (t0.current + at * 1000 - now) / 1000);
}

/** Une règle : elle se barre quand elle arrive à l'écran, dans l'ordre, une après l'autre. `t0` : le
 *  départ commun, pour que l'enchaînement reste régulier même si on fait défiler vite. */
function RuleRow({ r, i, t0 }: { r: { old: string; now: string }; i: number; t0: { current: number | null } }) {
  const [ref, seen] = useInView<HTMLLIElement>();
  const [d, setD] = useState(0);
  useEffect(() => {
    if (seen) setD(delayFrom(t0, RULE_START + i * RULE_STEP));
  }, [seen, i, t0]);
  return (
    <li ref={ref} className={`pv-rule${seen && d > 0 ? ' in' : ''}`} style={{ ['--d' as string]: `${d.toFixed(2)}s` }}>
      <span className="old"><span>{r.old}</span></span>
      <span className="arrow" aria-hidden="true"><Icon name="arrow" /></span>
      <span className="now">{r.now}</span>
    </li>
  );
}

/** La conclusion : ce que chaque tour prenait, barré morceau par morceau, puis la promesse. Elle part
 *  après la dernière règle (même départ commun `t0`), jamais en même temps qu'elles. */
function RulesCoda({ t0 }: { t0: { current: number | null } }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [c, setC] = useState(0);
  useEffect(() => {
    if (seen) setC(delayFrom(t0, CODA_AT));
  }, [seen, t0]);
  const pieces = ['Your shares,', 'your board,', 'your exit.'];
  const x = (k: number) => c + 1.1 + k * 0.75;
  const vars = { ['--c' as string]: `${c.toFixed(2)}s`, ['--cb' as string]: `${(x(pieces.length) + 0.5).toFixed(2)}s` };
  return (
    <div ref={ref} className={`pv-coda${seen && c > 0 ? ' in' : ''}`} style={vars}>
      <p className="pv-coda-a">
        For fifty years, every round took a piece of it.{' '}
        {pieces.map((w, k) => (
          <span key={w}>{k > 0 && ' '}<span className="pv-coda-x" style={{ ['--d' as string]: `${x(k).toFixed(2)}s` }}>{w}</span></span>
        ))}
      </p>
      <p className="pv-coda-b">Now you get the capital <b>without giving the company away.</b></p>
    </div>
  );
}

/** Les règles. `hero` : en ouverture de l'accueil (titre h1, bouton) ; sinon une section.
 *  `onPact` : le pacte se déplie sous les règles ; `onRun` : le bouton ouvre le calculateur. */
export function TheRules({ hero = false, pactOpen = false, onPact }: {
  hero?: boolean; pactOpen?: boolean; onPact?: () => void;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const t0 = useRef<number | null>(null);
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
        <H className="pv-rules-h">Control was always yours.</H>
        {/* 07/11 : le positionnement en une ligne (Alexandre : « parfait ») */}
        <p className="pv-rules-lead">The terms the best founders negotiate. <b>From your first cheque.</b></p>
        <ol className="pv-rules-list">
          {RULES.map((r, i) => <RuleRow key={r.old} r={r} i={i} t0={t0} />)}
        </ol>
        {/* la conclusion des règles barrées (Antoine, 05/11 : en bas, pas sous le titre) */}
        <RulesCoda t0={t0} />
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
// 07/11 (3) : une idée, une image. Un organigramme de deux cent cinquante personnes implose et ne
// laisse que trois fondateurs, entourés de leurs machines : « AI has collapsed what it takes to
// build », à la lettre. Le visiteur peut rejouer (Before / Now). Puis une ligne, et ce que nous
// soutenons en quatre mots. Pas de répétition avec le capital et les chiffres plus bas.

/** L'organigramme : un dirigeant, quatre directions, douze équipes, puis les rangs. Trois points
 *  deviennent les fondateurs ; tous les autres convergent vers le centre et disparaissent. */
const ORG = (() => {
  const C = { x: 500, y: 200 };
  const dots: { x: number; y: number; r: number; tx: number; ty: number; d: number; s: number; f: boolean }[] = [];
  const rnd = (i: number) => (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;
  const add = (x: number, y: number, r: number, f?: [number, number, number]) => {
    const i = dots.length;
    dots.push({ x, y, r, tx: C.x + (f ? f[0] : 0) - x, ty: C.y + (f ? f[1] : 0) - y, d: f ? 0 : 0.04 + rnd(i + 1) * 0.5, s: f ? f[2] : 0.15, f: !!f });
  };
  const L1 = [230, 410, 590, 770];
  const lines = [`M500 57 V80 M230 80 H770 ${L1.map((x) => `M${x} 80 V103`).join(' ')}`];
  for (const x of L1) lines.push(`M${x} 115 V138 M${x - 58} 138 H${x + 58} M${x - 58} 138 V161 M${x} 138 V161 M${x + 58} 138 V161`);
  add(500, 50, 7, [0, -19, 1.3]);
  L1.forEach((x, i) => add(x, 109, 6, i === 1 ? [-17, 11, 1.5] : i === 2 ? [17, 11, 1.5] : undefined));
  L1.forEach((x) => [-58, 0, 58].forEach((dx) => add(x + dx, 167, 4.6)));
  [[222, 34], [250, 40], [278, 46], [306, 52], [334, 58]].forEach(([y, n]) => {
    for (let k = 0; k < n; k++) add(500 + (k - (n - 1) / 2) * 15.5, y, 3.3);
  });
  return { C, dots, lines: lines.join(' ') };
})();
const MACHINES = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x: Math.cos(a) * 118, y: Math.sin(a) * 118 };
});

export function CollapseVisual({ bare = false, delay = 900 }: { bare?: boolean; delay?: number }) {
  const [ref, seen] = useInView<HTMLElement>();
  const [now, setNow] = useState(false);
  const touched = useRef(false);
  useEffect(() => {
    if (!seen) return;
    const t = window.setTimeout(() => { if (!touched.current) setNow(true); }, delay);
    return () => window.clearTimeout(t);
  }, [seen, delay]);
  const show = (v: boolean) => { touched.current = true; setNow(v); };
  return (
    <figure ref={ref} className={`pv-col${bare ? ' bare' : ''}${now ? ' now' : ''}`}>
      <figcaption className="pv-col-h">AI has collapsed what it takes to build.</figcaption>
      <svg viewBox="0 0 1000 370" aria-hidden="true">
        <defs>
          <radialGradient id="pvColGlow">
            <stop offset="0" stopColor="#9fb6cf" stopOpacity=".5" />
            <stop offset="1" stopColor="#9fb6cf" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path className="org-lines" d={ORG.lines} />
        <circle className="glow" cx={ORG.C.x} cy={ORG.C.y} r="96" />
        <g className="ring-g" transform={`translate(${ORG.C.x} ${ORG.C.y})`}>
          <circle className="ring" r="118" />
          <circle className="ring-run" r="118" />
          <g className="orbit">
            {MACHINES.map((m, i) => <line key={`l${i}`} x1="0" y1="0" x2={m.x} y2={m.y} />)}
            {MACHINES.map((m, i) => <circle key={`m${i}`} cx={m.x} cy={m.y} r="3.6" />)}
          </g>
        </g>
        {ORG.dots.map((p, i) => (
          <circle key={i} className={p.f ? 'dot f' : 'dot'} cx={p.x} cy={p.y} r={p.r}
                  style={{ ['--tx' as string]: `${p.tx}px`, ['--ty' as string]: `${p.ty}px`, ['--d' as string]: `${p.d.toFixed(2)}s`, ['--s' as string]: p.s }} />
        ))}
      </svg>
      <div className="pv-col-foot">
        <p className="pv-col-cap" aria-live="polite">
          <span className={now ? undefined : 'on'}>Thousands of people. A decade.</span>
          <span className={now ? 'on' : undefined}>A few people. Months.</span>
        </p>
        <div className="pv-col-toggle" role="group" aria-label="Before and now">
          <button type="button" className={now ? undefined : 'on'} aria-pressed={!now} onClick={() => show(false)}>Before</button>
          <button type="button" className={now ? 'on' : undefined} aria-pressed={now} onClick={() => show(true)}>Now</button>
        </div>
      </div>
    </figure>
  );
}

const FEW_TITLE = 'The companies that define this era will be built by very few people.';

/** La thèse (07/11, 6e passe) : l'implosion dans sa carte. `hero` (10/11, Alexandre : le contrôle
 *  passe juste avant le Chief Fundraising Officer) : elle ouvre l'accueil, le logo et la signature
 *  au-dessus, le titre en h1, sur fond clair (la vision et le contrôle qui suivent sont de nuit). */
export function TheFew({ hero = false }: { hero?: boolean }) {
  if (!hero) {
    return (
      <Say id="few" title={FEW_TITLE}>
        <CollapseVisual />
        <p className="pv-few-quote">Capital is no longer scarce. <b>Control is.</b></p>
      </Say>
    );
  }
  return (
    <section className="pv-sec pv-say pv-few-open" id="few">
      <div className="pv-wrap">
        <div className="pv-rules-brand">
          <img className="pv-rules-logo" src="/logo.png" alt="ProFund" width={150} height={40} />
          <span>Venture capital for the AI era</span>
        </div>
        <h1 className="pv-say-h">{FEW_TITLE}</h1>
        <CollapseVisual />
        <p className="pv-few-quote">Capital is no longer scarce. <b>Control is.</b></p>
      </div>
    </section>
  );
}

// ── What we back (07/11, 9e passe, Alexandre) : la vision en UNE chaîne, dans l'ordre logique des
// lois. Quelques fondateurs (01) dirigent ; leur machine atteint un marché entier sans armée (02) ;
// chaque passage dans ce marché revient nourrir la boucle, qui s'élargit à chaque tour (03) ; ce qui
// compose devient le leader que la loi de puissance récompense (04). « The clearest minds directing
// the most autonomous machines » : la phrase du manifeste (Thesis.tsx). À l'écran, la chaîne se
// dessine de gauche à droite (sur mobile, de haut en bas), puis s'anime : chaque impulsion part des
// fondateurs, balaie le marché, revient au cœur de la boucle, s'y enroule en grossissant et allume
// le sommet du leader. Les trois fondateurs sont ceux où s'arrête l'implosion (`CollapseVisual`).
// Même ordre partout : LAWS de Thesis.tsx et la fiche (factsheet.py).
// 10e passe (Alexandre) : le minimum headcount se voit, trois lignes seulement pour tout le marché
// (les points restent) et une onde qui le balaie d'un coup ; la catégorie se gagne sous les yeux :
// une foule de concurrents au coude à coude, puis le leader s'envole et la traîne retombe (loi de
// puissance plus raide : le leader pèse plus que tous les autres réunis).
const VF_ZONES = [
  { n: '01', w: 23, at: 0.3, t: 'Visionary founders.', d: 'Obsessive from day one. They direct, the machine executes.' },
  { n: '02', w: 33, at: 1.2, t: 'Maximum impact, minimum headcount.', d: 'Whole markets, with near-zero marginal labor.' },
  { n: '03', w: 34, at: 2.8, t: 'Self-improving systems.', d: 'Closed loops that compound with every run.' },
  { n: '04', w: 30, at: 5.5, t: 'Category leaders.', d: 'Built to dominate their category. The power law rewards the leader.' },
];

/** F les fondateurs, O la machine d'où part le marché (arcs de R0 à R1), L le cœur de la boucle,
 *  B le leader ; positions le long de la chaîne. */
type VfLayout = { vertical: boolean; F: number; O: number; R0: number; R1: number; L: number; B: number; box: string; id: string };
const VF_H: VfLayout = { vertical: false, F: 96, O: 236, R0: 64, R1: 254, L: 724, B: 950, box: '0 0 1200 380', id: 'h' };
const VF_V: VfLayout = { vertical: true, F: 60, O: 166, R0: 50, R1: 200, L: 596, B: 790, box: '0 0 360 1040', id: 'v' };
const VF_RING = 122;
const VF_SPIRAL = 100;
/** Les trois seules lignes du marché : ses deux bords et son axe (points de l'arc extérieur, 29 en tout). */
const VF_REACH = [0, 14, 28];
/** Les impulsions : une durée, et la ligne que chacune emprunte (l'axe, un bord, l'autre). */
const VF_PULSE = { dur: 7.2, rays: [1, 2, 0] };
/** La catégorie : la hauteur du leader, la pente de la loi de puissance, et la foule du départ (le
 *  futur leader est au milieu du peloton). */
const VF_BARS = { lead: 230, power: 1.6, crowd: [44, 50, 47, 53, 45, 49, 42, 48, 51, 44, 46, 43, 47] };
const VF_BAR_BASE = -150;
/** La course : son départ et sa durée (la foule en place à 35 %, l'envol du leader à partir de 55 %). */
const VF_RACE = { at: 4.2, dur: 2.6 };
/** Le moment où la chaîne a fini de se dessiner : les impulsions partent ensuite. */
const VF_DRAWN_MS = 7000;

type Pt = [number, number];
type Box = { x: number; y: number; width: number; height: number };
const vfFmt = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const vfLen = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
const vfCubic = (a: Pt, b: Pt, c: Pt, d: Pt, n = 24): Pt[] => Array.from({ length: n + 1 }, (_, i) => {
  const u = i / n;
  const w = [(1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u ** 2, u ** 3];
  return [0, 1].map((k) => w[0] * a[k] + w[1] * b[k] + w[2] * c[k] + w[3] * d[k]) as Pt;
});
/** Délai (et durée) d'apparition, lus par le CSS. */
const vfAt = (d: number, t?: number) =>
  ({ ['--d' as string]: `${d}s`, ...(t ? { ['--t' as string]: `${t}s` } : {}) }) as CSSProperties;
const vfKt = (xs: number[]) => xs.map((x) => x.toFixed(4)).join(';');

function VisionArt({ lay, seen, motion, live }: { lay: VfLayout; seen: boolean; motion: boolean; live: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  // Les animations SVG comptent depuis l'insertion du dessin : on lit l'horloge quand la section
  // arrive à l'écran (la course des sociétés) et quand la chaîne s'anime (les impulsions).
  const [t0, setT0] = useState<number | null>(null);
  const [t1, setT1] = useState<number | null>(null);
  const clock = () => { try { return svg.current?.getCurrentTime() ?? 0; } catch { return 0; } };
  useEffect(() => { if (seen && motion) setT0(clock()); }, [seen, motion]);
  useEffect(() => { if (live) setT1(clock()); }, [live]);
  // (t, s) : t le long de la chaîne, s en travers (positif = vers le haut à l'horizontale)
  const P = (t: number, s: number): Pt => (lay.vertical ? [180 + s, 20 + t] : [t, 190 - s]);
  // 01 : les fondateurs, dans le triangle où s'arrête l'implosion (pointe en haut, en coordonnées
  // d'écran : il ne tourne pas avec la chaîne sur mobile), et leur intention
  const [fx, fy] = P(lay.F, 0);
  const founders: Pt[] = [[0, -15], [-13, 8], [13, 8]].map(([dx, dy]) => [fx + dx, fy + dy]);
  const start = P(lay.F + 34, 0);
  const O = P(lay.O, 0);
  // 02 : un marché entier, arc après arc, atteint depuis un seul point (la machine) par trois lignes
  const market: { p: Pt; d: number }[] = [];
  const outer: Pt[] = [];
  const rim: { top: Pt[]; bottom: Pt[] } = { top: [], bottom: [] };
  for (let k = 0; k < 6; k++) {
    const R = lay.R0 + (k * (lay.R1 - lay.R0)) / 5;
    const amax = Math.asin(Math.min(0.92, 146 / R));
    const n = 9 + 4 * k;
    for (let i = 0; i < n; i++) {
      const a = -amax + (2 * amax * i) / (n - 1);
      const p = P(lay.O + Math.cos(a) * R, Math.sin(a) * R);
      market.push({ p, d: 1.3 + k * 0.12 + (Math.abs(a) / amax) * 0.08 });
      if (k === 5) outer.push(p);
    }
    // le contour du marché, un peu élargi : l'onde ne déborde pas des points
    rim.top.push(P(lay.O + Math.cos(amax * 1.06) * R * 1.05, Math.sin(amax * 1.06) * R * 1.05));
    rim.bottom.push(P(lay.O + Math.cos(amax * 1.06) * R * 1.05, -Math.sin(amax * 1.06) * R * 1.05));
  }
  const front = VF_REACH.map((i) => outer[i]);
  const aOut = Math.asin(Math.min(0.92, 146 / lay.R1)) * 1.06;
  const arc = Array.from({ length: 25 }, (_, i) => {
    const a = aOut - (2 * aOut * i) / 24;
    return P(lay.O + Math.cos(a) * lay.R1 * 1.05, Math.sin(a) * lay.R1 * 1.05);
  });
  const field = `M${vfFmt(O)} L${[...rim.top, ...arc, ...[...rim.bottom].reverse()].map(vfFmt).join(' L')} Z`;
  // 03 : chaque passage revient au cœur ; la boucle s'élargit à chaque tour (deux tours) et sort à
  // droite, vers le haut
  const C = P(lay.L, 0);
  const spiral = Array.from({ length: 121 }, (_, i) => {
    const a = (i / 120) * 4 * Math.PI;
    const r = 6 + (i / 120) * (VF_SPIRAL - 6);
    return P(lay.L + Math.cos(a) * r, Math.sin(a) * r);
  });
  const machines = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return P(lay.L + Math.cos(a) * VF_RING, Math.sin(a) * VF_RING);
  });
  // 04 : ce qui compose monte au sommet du leader. La catégorie : une foule au coude à coude, puis le
  // leader s'envole et la traîne retombe.
  const leadS = VF_BAR_BASE + VF_BARS.lead;
  const out = spiral[spiral.length - 1];
  const tip = P(lay.B - 10, leadS);
  const link = vfCubic(out, P(lay.L + VF_SPIRAL + 4, 46), P(lay.B - 66, leadS), tip);
  const top = P(lay.B, leadS);
  const bars = VF_BARS.crowd.map((h0, i) => {
    const t = lay.B + i * 17;
    const half = i === 0 ? 5.5 : 4;
    const box = (h: number): Box => {
      const [x1, y1] = P(t - half, VF_BAR_BASE);
      const [x2, y2] = P(t + half, VF_BAR_BASE + h);
      return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
    };
    const h = VF_BARS.lead / Math.pow(i + 1, VF_BARS.power);
    return { lead: i === 0, frames: [box(0), box(h0), box(h0), box(h)] };
  });
  const still = seen && !motion; // mouvement réduit : la catégorie déjà gagnée
  const base = [P(lay.B - 20, VF_BAR_BASE), P(lay.B + 12 * 17 + 20, VF_BAR_BASE)];
  // La chaîne de chaque impulsion, et les instants (en fraction du trajet) où elle quitte la machine,
  // touche son client, entre dans la boucle et en sort : vitesse constante (animateMotion « paced »).
  const chains = VF_PULSE.rays.map((j) => {
    const m = front[j];
    const pts: Pt[] = [start, O, m, C, ...spiral, ...link.slice(1)];
    const total = vfLen(pts);
    return {
      m,
      d: `M${pts.map(vfFmt).join(' L')}`,
      fO: vfLen([start, O]) / total,
      fM: vfLen([start, O, m]) / total,
      fL: vfLen([start, O, m, C]) / total,
      fS: vfLen([start, O, m, C, ...spiral]) / total,
    };
  });
  const N = chains.length;
  const D = VF_PULSE.dur;
  const g = (k: string) => `pvVf${k}${lay.id}`;
  const race = (i: number) => ({ dur: `${VF_RACE.dur}s`, begin: `${((t0 ?? 0) + VF_RACE.at + i * 0.03).toFixed(3)}s`, fill: 'freeze' });
  return (
    <svg ref={svg} viewBox={lay.box} className={lay.vertical ? 'v' : undefined} aria-hidden="true">
      <defs>
        <radialGradient id={g('Glow')}><stop offset="0" stopColor="#9fb6cf" stopOpacity=".5" /><stop offset="1" stopColor="#9fb6cf" stopOpacity="0" /></radialGradient>
        <radialGradient id={g('Lead')}><stop offset="0" stopColor="#ffffff" stopOpacity=".42" /><stop offset="1" stopColor="#9fb6cf" stopOpacity="0" /></radialGradient>
        <radialGradient id={g('Flash')}><stop offset="0" stopColor="#ffffff" stopOpacity=".55" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
        <clipPath id={g('Field')}><path d={field} /></clipPath>
      </defs>
      {/* 01 : les fondateurs, et leur intention jusqu'à la machine */}
      <circle className="vf-fade" style={vfAt(0.1, 1.4)} cx={P(lay.F, 0)[0]} cy={P(lay.F, 0)[1]} r="62" fill={`url(#${g('Glow')})`} />
      <path className="vf-line vf-draw" style={vfAt(0.5, 0.8)} d={`M${vfFmt(start)} L${vfFmt(O)}`} pathLength={1} />
      {/* 02 : un marché entier, trois lignes seulement, et une onde qui le balaie d'un coup */}
      {front.map((m, j) => (
        <path key={`r${j}`} className="vf-ray vf-draw" style={vfAt(1.05, 0.9)} d={`M${vfFmt(O)} L${vfFmt(m)}`} pathLength={1} />
      ))}
      <g clipPath={`url(#${g('Field')})`}>
        <circle className="vf-sweep" style={vfAt(1.1, 1.5)} cx={O[0]} cy={O[1]} r={lay.R1 * 1.05} vectorEffect="non-scaling-stroke" />
      </g>
      {market.map((m, i) => <circle key={`m${i}`} className="vf-dot vf-fade" style={vfAt(m.d, 0.6)} cx={m.p[0]} cy={m.p[1]} r="2.1" />)}
      {/* 02 → 03 : chaque passage revient au cœur de la boucle */}
      {front.map((m, j) => (
        <path key={`k${j}`} className="vf-ret vf-draw" style={vfAt(2.25, 1)} d={`M${vfFmt(m)} L${vfFmt(C)}`} pathLength={1} />
      ))}
      {/* 03 : la boucle, qui s'élargit à chaque tour, et ses machines */}
      <circle className="vf-fade" style={vfAt(2.7, 1.4)} cx={C[0]} cy={C[1]} r="112" fill={`url(#${g('Glow')})`} />
      <path className="vf-line vf-draw" style={vfAt(2.9, 1.8)} d={`M${spiral.map(vfFmt).join(' L')}`} pathLength={1} />
      <circle className="vf-ring vf-fade" style={vfAt(3.6, 1)} cx={C[0]} cy={C[1]} r={VF_RING} />
      <g className="vf-orbit vf-fade" style={vfAt(3.7, 1)}>
        {machines.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
      </g>
      {/* 04 : la catégorie au coude à coude ; la chaîne arrive au-dessus de la foule, le leader monte
          la chercher, les autres retombent */}
      <line className="vf-base vf-fade" style={vfAt(4.1, 0.8)} x1={base[0][0]} y1={base[0][1]} x2={base[1][0]} y2={base[1][1]} />
      <path className="vf-line vf-draw" style={vfAt(4.9, 0.8)} d={`M${link.map(vfFmt).join(' L')}`} pathLength={1} />
      <circle className="vf-fade" style={vfAt(6.1, 1.4)} cx={top[0]} cy={top[1]} r="64" fill={`url(#${g('Lead')})`} />
      {bars.map((b, i) => {
        const at = still ? b.frames[3] : b.frames[0];
        const won = still && b.lead;
        return (
          <rect key={`b${i}`} x={at.x} y={at.y} width={at.width} height={at.height} rx="3"
                fill={won ? '#ffffff' : '#9fb6cf'} fillOpacity={won ? 1 : 0.42} opacity={still && !b.lead ? 0.5 : 1}>
            {t0 !== null && (['x', 'y', 'width', 'height'] as const)
              .filter((k) => new Set(b.frames.map((f) => f[k].toFixed(2))).size > 1)
              .map((k) => (
                <animate key={k} attributeName={k} values={b.frames.map((f) => f[k].toFixed(2)).join(';')} keyTimes="0;.35;.55;1"
                         calcMode="spline" keySplines=".2 .8 .2 1;0 0 1 1;.6 0 .2 1" {...race(i)} />
              ))}
            {t0 !== null && b.lead && (
              <>
                <animate attributeName="fill" values="#9fb6cf;#9fb6cf;#ffffff" keyTimes="0;.55;1" {...race(i)} />
                <animate attributeName="fill-opacity" values=".42;.42;1" keyTimes="0;.55;1" {...race(i)} />
              </>
            )}
            {t0 !== null && !b.lead && <animate attributeName="opacity" values="1;1;.5" keyTimes="0;.55;1" {...race(i)} />}
          </rect>
        );
      })}
      {founders.map(([x, y], i) => <circle key={`f${i}`} className="vf-hi" cx={x} cy={y} r="8" />)}
      <circle className="vf-node vf-fade" style={vfAt(0.95, 0.5)} cx={O[0]} cy={O[1]} r="3.4" />
      <circle className="vf-hi vf-fade" style={vfAt(2.8, 0.6)} cx={C[0]} cy={C[1]} r="4" />
      {live && t1 !== null && (
        <g className="vf-live">
          {chains.map((c, k) => {
            const run = { dur: `${D}s`, begin: `${(t1 + (k * D) / N).toFixed(3)}s`, repeatCount: 'indefinite' };
            return (
              <g key={k}>
                {/* une seule action balaie tout le marché */}
                <g clipPath={`url(#${g('Field')})`}>
                  <circle className="vf-wave" cx={O[0]} cy={O[1]} r={lay.R0 * 0.4} opacity="0">
                    <animate attributeName="r" values={`${lay.R0 * 0.4};${lay.R0 * 0.4};${lay.R1 * 1.05};${lay.R1 * 1.05}`}
                             keyTimes={vfKt([0, c.fO, c.fM, 1])} {...run} />
                    <animate attributeName="opacity" values="0;0;.6;0;0" keyTimes={vfKt([0, c.fO, c.fO + 0.012, c.fM + 0.01, 1])} {...run} />
                  </circle>
                </g>
                {/* le client touché */}
                <circle className="vf-ping" cx={c.m[0]} cy={c.m[1]} r="2" opacity="0">
                  <animate attributeName="r" values="2;2;14;14" keyTimes={vfKt([0, c.fM, c.fM + 0.06, 1])} {...run} />
                  <animate attributeName="opacity" values="0;0;.9;0;0" keyTimes={vfKt([0, c.fM - 0.002, c.fM, c.fM + 0.06, 1])} {...run} />
                </circle>
                {/* le retour au cœur */}
                <circle className="vf-ping" cx={C[0]} cy={C[1]} r="4" opacity="0">
                  <animate attributeName="r" values="4;4;28;28" keyTimes={vfKt([0, c.fL, c.fL + 0.07, 1])} {...run} />
                  <animate attributeName="opacity" values="0;0;.8;0;0" keyTimes={vfKt([0, c.fL - 0.002, c.fL, c.fL + 0.07, 1])} {...run} />
                </circle>
                {/* l'impulsion et son halo, qui grossissent en s'enroulant : elle compose */}
                <g opacity="0">
                  <animateMotion path={c.d} {...run} />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.02;.97;1" {...run} />
                  <circle r="12" fill={`url(#${g('Flash')})`}>
                    <animate attributeName="r" values="12;12;13;24;24" keyTimes={vfKt([0, c.fM, c.fL, c.fS, 1])} {...run} />
                  </circle>
                  <circle className="vf-pulse" r="3">
                    <animate attributeName="r" values="3;3;3.2;5.6;5.6" keyTimes={vfKt([0, c.fM, c.fL, c.fS, 1])} {...run} />
                  </circle>
                </g>
              </g>
            );
          })}
          {/* le leader s'allume à chaque arrivée : une toutes les D / N secondes, dès la première */}
          <circle cx={top[0]} cy={top[1]} r="50" fill={`url(#${g('Flash')})`} opacity="0">
            <animate attributeName="opacity" values="0;1;0" keyTimes="0;.12;1" dur={`${(D / N).toFixed(2)}s`}
                     begin={`${(t1 + D - (0.12 * D) / N).toFixed(3)}s`} repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}

export function WhatWeBack() {
  const [ref, seen] = useInView<HTMLElement>();
  // lu une fois, avant l'arrivée à l'écran : la course ne doit pas partir si le mouvement est réduit
  const [motion] = useState(() => {
    try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; }
  });
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!seen || !motion) return;
    const t = window.setTimeout(() => setLive(true), VF_DRAWN_MS);
    return () => window.clearTimeout(t);
  }, [seen, motion]);
  return (
    <section className="pv-sec night pv-vf-sec" id="back">
      <div className="pv-wrap">
        <p className="pv-kick">What we back</p>
        <h2 className="pv-say-h">The clearest minds, directing the most autonomous machines.</h2>
        <figure ref={ref} className={`pv-vf${seen ? ' in' : ''}`}>
          <div className="pv-vf-art h"><VisionArt lay={VF_H} seen={seen} motion={motion} live={live} /></div>
          <div className="pv-vf-art v"><VisionArt lay={VF_V} seen={seen} motion={motion} live={live} /></div>
          <ol className="pv-vf-zones" style={{ gridTemplateColumns: VF_ZONES.map((z) => `${z.w}fr`).join(' ') }}>
            {VF_ZONES.map((z) => (
              <li key={z.n} style={vfAt(z.at)}><span className="n">{z.n}</span><h3>{z.t}</h3><p>{z.d}</p></li>
            ))}
          </ol>
        </figure>
      </div>
    </section>
  );
}

// 07/11 (6e passe) : il doit sentir que nous sommes son Chief Fundraising Officer, dans la maison, et
// alignés à 100 % : son rôle en quatre verbes, le plan dans l'ordre qui dilue le moins, les étages et
// les tickets dedans (plus de pli). L'alignement se dit par ce qui est vrai : chaque action qu'il
// n'émet pas protège sa part ET la nôtre.
// 07/11 (8e passe) : plus le plan de capital (« revenus, prêts, equity » : tout directeur financier le
// sait). Ce que fait d'intelligent un Chief Fundraising Officer aligné : lever en position de force (le
// prêt porte jusqu'au point d'inflexion), nettoyer la table avant chaque tour, acheter sans diluer, et
// les plus gros tours en une seule ligne. Puis les tickets, en une bande.
// 10/11 (Alexandre) : plus seulement un Chief Fundraising Officer. Le fondateur n'a pas besoin d'un VC
// de plus mais d'un partenaire qui fait le travail : il lève (le CFO, détaillé dessous), il réfléchit
// avec lui (le sparring partner, jamais à sa place : pas de veto, clause 6) et ses agents IA agissent
// chaque jour (les deux moteurs, la section suivante). « Their votes move to your side » reste dans
// les règles, juste au-dessus, et quitte la ligne des rachats pour ne pas se répéter.
const ROLES: { t: string; d: string }[] = [
  { t: 'Your Chief Fundraising Officer.', d: 'Everything your company needs to reach its full potential, raised at the right moment and in the order that dilutes you least. Every share you don’t issue protects your stake, and ours.' },
  { t: 'Your sparring partner.', d: 'Every big call thought through with you before you make it: a hire, a price, a round, an acquisition. Then the call is yours.' },
  { t: 'AI agents, at work every day.', d: 'Our agents find your acquisitions, write your posts and source your leads. You approve, they act.' },
];

const MOVES: { t: string; d: string }[] = [
  { t: 'A clean cap table before every round.', d: 'We buy out angels and early funds, with your agreement.' },
  { t: 'Acquisitions without dilution.', d: 'Our External AI Growth Engine finds the targets. Our partner banks can finance them.' },
  { t: 'The largest rounds, one line on your cap table.', d: 'The largest funds lead. We stay at your side, with one SPV for our co-investors.' },
];

/** Lever en position de force : sans réserve, on lève au creux, à court de cash ; avec la dette levée
 *  auprès des banques partenaires (v3.17 : le fonds ne prête plus), on lève au point d'inflexion. */
function RaiseChart() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const d = 'M40 252 C140 240 240 198 320 178 C370 166 400 198 440 206 C520 222 600 150 700 104 C800 60 880 44 960 34';
  return (
    <div ref={ref} className={`pv-raise${seen ? ' in' : ''}`}>
      <div className="pv-raise-txt">
        <span className="n">01</span>
        <h3>Raise from strength.</h3>
        <p>Debt we raise for you from our partner banks carries you to your inflection. You raise equity when it pays, not when cash runs out.</p>
      </div>
      <div className="pv-raise-plot" aria-hidden="true">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
          <path className="area" d={`${d} L960 300 L40 300 Z`} />
          <path className="curve" d={d} vectorEffect="non-scaling-stroke" />
          <line className="mk" x1="440" y1="206" x2="440" y2="300" vectorEffect="non-scaling-stroke" />
          <line className="mk hi" x1="700" y1="104" x2="700" y2="300" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="pv-raise-run"><i />Bank debt carries you</span>
        <span className="pv-raise-dot weak" />
        <span className="pv-raise-dot strong" />
        <span className="pv-raise-lab weak">Out of cash: the usual moment to raise</span>
        <span className="pv-raise-lab strong">Your inflection: you raise here</span>
      </div>
      <ul className="pv-raise-key">
        <li><i className="weak" />Out of cash: the usual moment to raise</li>
        <li><i className="strong" />Your inflection: you raise here, from strength</li>
      </ul>
    </div>
  );
}

export function CapitalStack() {
  const [ref, seen] = useInView<HTMLOListElement>();
  const [rolesRef, rolesIn] = useInView<HTMLOListElement>();
  return (
    <section className="pv-sec pv-cfo-sec" id="capital">
      <div className="pv-wrap">
        <p className="pv-kick pv-cfo-k">AI-native, in-house</p>
        <h2 className="pv-say-h">Founders don’t need another VC. <span>They need a partner who does the work.</span></h2>
        <ol ref={rolesRef} className={`pv-ruled pv-roles${rolesIn ? ' in' : ''}`}>
          {ROLES.map((r, i) => (
            <li key={r.t} style={{ ['--d' as string]: `${0.1 + i * 0.18}s` }}>
              <h3>{r.t}</h3>
              <p>{r.d}</p>
            </li>
          ))}
        </ol>
        <p className="pv-kick pv-cfo-sub">How we raise</p>
        <RaiseChart />
        <ol ref={ref} className={`pv-moves${seen ? ' in' : ''}`}>
          {MOVES.map((m, i) => (
            <li key={m.t} style={{ ['--d' as string]: `${0.1 + i * 0.14}s` }}>
              <span className="n">{String(i + 2).padStart(2, '0')}</span>
              <h3>{m.t}</h3>
              <p>{m.d}</p>
            </li>
          ))}
        </ol>
        <div className="pv-tickets">
          <span className="pv-tickets-k">Our cheques</span>
          {STAGES.map((st) => <span key={st.layer}><b>{st.layer}</b>{st.ticket}</span>)}
          <span><b>Beyond</b>With SPVs</span>
        </div>
      </div>
    </section>
  );
}

// ── How we back them ─────────────────────────────────────────────────────────
const BLOCKS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'Equity, when you choose.',
    d: 'In new shares, from your first round to your largest. After that, we never push for a new round.' },
  { icon: 'banknote', t: 'Debt before equity.',
    d: 'We raise bank debt for you, to carry what it can: hiring, go-to-market, working capital, acquisitions.' },
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
          <p>Every right we hold is written in a public pact, the same for every founder.</p>
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
  return `VC path, calibrated on Carta medians (not specific to Europe): ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, founders at ${(FM.founders * 100).toFixed(1)}% after the Series A; then ${eur(FM.vc_equity, 'tile')} of equity over the Series B, C and D, each one preceded by a bridge, with option pool refreshes and 1× non-participating preferences. Founders hold ${AFTER('B')} after the Series B, ${AFTER('C')} after the C and ${AFTER('D')} after the D, Carta’s medians (27.3% for AI teams after the B; 16.1% after the C, when the employee pool overtakes the founders; 11.4% after the D). With ProFund: same seed, Series A and valuations. The same capital: ${eur(FM.loans, 'tile')} of bank loans, raised with our partner banks, replace part of the bridges, at ${pct(FM.loan_share.min)} to ${pct(FM.loan_share.max)} of the last round (usual range for venture debt: 20% to 40%). Half the capital: no bridges and no Series D. Credit alone: no further round and no pool refresh. ${eur(FM.loan_debt, 'tile')} of loans and interest repaid before equity, subject to our partner banks. Illustrative, not a forecast; no company has followed these paths yet. Sources: Carta, Founder Ownership Report 2026; Series D, Carta data reported by SaaStr; First Citizens, 22 September 2023.`;
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
              <b>{pct(p.stake, 1)}</b>
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
      lead={<p className="pv-say-p">Most founding teams end up with a fraction of what they built.</p>}>
      <StakeChart />
      <p className="pv-fine">
        Same company, same valuations. VC path: the medians of {A_('https://carta.com/data/founder-ownership-2026/', 'Carta’s Founder Ownership Report 2026')}, the
        Series D as reported by {A_('https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/', 'SaaStr')}. With us: {eur(FM.loans, 'tile')} of loans raised with our partner banks,
        at {pct(FM.loan_share.min)} to {pct(FM.loan_share.max)} of the last round, within the usual range for venture debt ({A_('https://innovation.firstcitizens.com/business-growth/access-to-capital/right-amount-of-venture-debt', 'First Citizens')}).
        Credit alone assumes no pool refresh. Buybacks and cancellations are not counted. Illustrative, not a forecast.
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
    what: 'Fresh growth rounds, buybacks of early funds, bank debt raised for growth and acquisitions' },
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
export function StageLadder() {
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
          <p className="sub">At every layer, a first equity cheque or a buyback of existing shares. Then bank debt we raise for you, and more equity whenever you choose, on the same terms.</p>
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
export function FinalCall({ onOpen }: { onOpen?: (panel: 'pact') => void }) {
  return (
    <section className="pv-sec pv-reserve-sec" id="final">
      <div className="pv-wrap">
        <div className="pv-band pv-final">
          <div>
            <h2>Exceptional numbers deserve exceptional terms.</h2>
            <p>A handful of founders a year.</p>
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

// La preuve (06/11, Antoine) : les sociétés que les moteurs font tourner aujourd'hui. 07/11
// (Alexandre, 11e passe) : six petites cartes identiques, une grille. Chaque carte porte les mêmes trois
// sous-moteurs dans le même ordre (corp dev sur le moteur externe ; inbound et outbound sur le moteur
// interne), allumés quand la société s'en sert, éteints sinon : Maximum Insurance inbound et outbound,
// pas de corp dev ; Sosuites inbound ; WinHealth Group outbound et corp dev ; Nexecur et S4BT corp dev
// (logo Nexecur sans celui du groupe). Ne jamais allumer un sous-moteur que la société ne fait pas
// tourner. La description de chaque société reste en infobulle.
type RunCap = 'corpdev' | 'inbound' | 'outbound';
const RUN_ENGINES: { icon: IconName; k: string; name: string; caps: { id: RunCap; t: string }[] }[] = [
  { icon: 'radar', k: 'External', name: 'External AI Growth Engine', caps: [{ id: 'corpdev', t: 'Corp dev' }] },
  { icon: 'bot', k: 'Internal', name: 'Internal AI Growth Engine', caps: [{ id: 'inbound', t: 'Inbound' }, { id: 'outbound', t: 'Outbound' }] },
];
const RUN_LABEL: Record<RunCap, string> = { corpdev: 'corporate development', inbound: 'inbound', outbound: 'outbound' };
/** `h` : la hauteur du logo en px (les logos n'ont pas les mêmes proportions). */
const RUN: { name: string; logo: string; href: string; h: number; d: string; caps: RunCap[] }[] = [
  { name: 'Proplace', logo: '/portfolio-proplace.png', href: 'https://proplace.co', h: 27,
    d: 'Autonomous AI operating system for corporate development and M&A.', caps: ['corpdev', 'inbound', 'outbound'] },
  { name: 'Maximum Insurance', logo: '/portfolio-maximum-insurance.svg', href: 'https://maximum-insurance.com', h: 14,
    d: 'Travel insurance and duty of care for companies and their teams abroad.', caps: ['inbound', 'outbound'] },
  { name: 'Sosuites', logo: '/portfolio-sosuites.png', href: 'https://www.sosuites.com', h: 17,
    d: 'AI-assisted personalised art prints to share.', caps: ['inbound'] },
  { name: 'WinHealth Group', logo: '/portfolio-winhealth.png', href: 'https://winhealthgroup.com', h: 23,
    d: 'Swiss broker in international health insurance for expatriates and their families.', caps: ['corpdev', 'outbound'] },
  { name: 'Nexecur', logo: '/ref-nexecur.png', href: 'https://www.nexecur.fr', h: 18,
    d: 'Home and business alarms with remote monitoring.', caps: ['corpdev'] },
  { name: 'S4BT', logo: '/ref-s4bt.svg', href: 'https://sforbt.com', h: 34,
    d: 'Solutions for Business Travel: booking, payment and travel technology.', caps: ['corpdev'] },
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
        <p>Live on our two engines, every day.</p>
      </div>
      <ul className="pv-run-key">
        {RUN_ENGINES.map((e) => (
          <li key={e.k}><Icon name={e.icon} /><b>{e.name}</b><span>{e.caps.map((x) => x.t).join(', ')}</span></li>
        ))}
      </ul>
      <div className="pv-run-grid">
        {RUN.map((c, i) => (
          <a key={c.name} className="pv-runc" href={c.href} target="_blank" rel="noopener noreferrer" title={c.d}
             aria-label={`${c.name}: ${c.caps.map((k) => RUN_LABEL[k]).join(', ')}, on our engines`}>
            <span className="pv-runc-top">
              <img src={c.logo} alt="" style={{ maxHeight: `min(${c.h}px, 100%)` }} />
              <span className="pv-runc-dot" aria-hidden="true" />
            </span>
            <span className="pv-runc-eng" aria-hidden="true">
              {RUN_ENGINES.map((e) => (
                <span key={e.k} className="pv-runc-row">
                  <span className="e"><Icon name={e.icon} />{e.k}</span>
                  <span className="ps">
                    {e.caps.map((x) => {
                      const on = c.caps.includes(x.id);
                      return <span key={x.id} className={`pv-runc-p${on ? ' on' : ''}`} style={vfAt(i * 0.55)}>{on && <i />}{x.t}</span>;
                    })}
                  </span>
                </span>
              ))}
            </span>
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
          <p className="sub">The engines that already run ProFund and the companies below.</p>
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
