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
  // 07/11 (Alexandre) : plus de truismes (« You dilute only when you choose », « Your exit, on your
  // timing ») ni de « Big cheques » face aux géants : le contrôle, ce que le pacte change vraiment.
  // 07/11 (2) : « trop peu » : six règles, chacune une clause (6, 6, 1, 1, 4, 11).
  { old: 'Their seats, their votes, their veto', now: 'One seat. Our shares vote with you.' },
  { old: 'Their consent on your budget, your hires, your next round', now: 'No veto on how you run, raise or sell.' },
  { old: 'A new round pushed on you every 18 months', now: 'We never push for a round.' },
  { old: 'A preference stacked on every round', now: 'At most a 1×. No participation.' },
  // ProFund rachète : ce sont nos titres qui montent ; les votes passent du côté du fondateur.
  { old: 'Angels and leavers stuck on your cap table', now: 'We buy them out. Their votes move to your side.' },
  { old: 'Resign during vesting, lose your shares', now: 'Resign, and keep every vested share.' },
];

/** Une règle : elle se barre quand elle arrive à l'écran, dans l'ordre, une après l'autre. `t0` : le
 *  départ commun, pour que l'enchaînement reste régulier même si on fait défiler vite. */
function RuleRow({ r, i, t0 }: { r: { old: string; now: string }; i: number; t0: { current: number | null } }) {
  const [ref, seen] = useInView<HTMLLIElement>();
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const now = performance.now();
    if (t0.current === null) t0.current = now;
    setD(Math.max(0.08, (t0.current + 250 + i * 420 - now) / 1000));
  }, [seen, i, t0]);
  return (
    <li ref={ref} className={`pv-rule${seen && d > 0 ? ' in' : ''}`} style={{ ['--d' as string]: `${d.toFixed(2)}s` }}>
      <span className="old"><span>{r.old}</span></span>
      <span className="arrow" aria-hidden="true"><Icon name="arrow" /></span>
      <span className="now">{r.now}</span>
    </li>
  );
}

/** La conclusion : ce que chaque tour prenait, barré morceau par morceau, puis la promesse. */
function RulesCoda() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const pieces = ['Your shares,', 'your board,', 'your exit.'];
  return (
    <div ref={ref} className={`pv-coda${seen ? ' in' : ''}`}>
      <p className="pv-coda-a">
        For fifty years, every round took a piece of it.{' '}
        {pieces.map((w, k) => (
          <span key={w}>{k > 0 && ' '}<span className="pv-coda-x" style={{ ['--d' as string]: `${0.55 + k * 0.38}s` }}>{w}</span></span>
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
        <RulesCoda />
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

/** La thèse (07/11, 6e passe) : après le contrôle, l'implosion dans sa carte. */
export function TheFew() {
  return (
    <Say id="few" title="The companies that define this era will be built by very few people.">
      <CollapseVisual />
      <p className="pv-few-quote">Capital is no longer scarce. <b>Control is.</b></p>
    </Say>
  );
}

// ── What we back (07/11, 7e passe) : la vision en un seul tracé. Les quatre lois ne sont pas
// quatre idées : c'est une chaîne. Quelques fondateurs (01) dirigent des machines qui forment une
// boucle qui s'améliore à chaque tour (02) ; la boucle conquiert un marché entier sans armée (03) ;
// la loi de puissance couronne un leader (04). « The clearest minds directing the most autonomous
// machines » : la phrase du manifeste (Thesis.tsx). À l'écran, la chaîne se dessine de gauche à
// droite ; sur mobile, de haut en bas.
const VF_ZONES = [
  { n: '01', w: 26, t: 'Visionary founders.', d: 'Obsessive from day one. They direct, the machine executes.' },
  { n: '02', w: 34, t: 'Self-improving systems.', d: 'Closed loops that compound with every run.' },
  { n: '03', w: 32, t: 'Maximum impact, minimum headcount.', d: 'Whole markets, with near-zero marginal labor.' },
  { n: '04', w: 28, t: 'Category leaders.', d: 'Built to dominate their category. The power law rewards the leader.' },
];

type VfLayout = { vertical: boolean; F: number; L: number; O: number; B: number; box: string; id: string };
const VF_H: VfLayout = { vertical: false, F: 100, L: 430, O: 552, B: 962, box: '0 0 1200 380', id: 'h' };
const VF_V: VfLayout = { vertical: true, F: 70, L: 300, O: 422, B: 760, box: '0 0 360 1000', id: 'v' };

function VisionArt({ lay, live }: { lay: VfLayout; live: boolean }) {
  // (t, s) : t le long de la chaîne, s en travers (positif = vers le haut à l'horizontale)
  const P = (t: number, s2: number): [number, number] => (lay.vertical ? [180 + s2, 20 + t] : [t, 190 - s2]);
  const pt = (t: number, s2: number) => P(t, s2).map((v) => v.toFixed(1)).join(' ');
  const founders = [[0, 15], [-13, -8], [13, -8]].map(([dt, ds]) => P(lay.F + dt, ds));
  const beam = `M${pt(lay.F + 34, 0)} L${pt(lay.L - 128, 0)}`;
  const spiral: string[] = [];
  for (let a = 0; a <= Math.PI * 5; a += 0.12) {
    const r = 8 + a * 6.4;
    spiral.push(pt(lay.L + Math.cos(a) * r, Math.sin(a) * r));
  }
  const spiralD = `M${spiral.join(' L')}`;
  const machines = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return P(lay.L + Math.cos(a) * 122, Math.sin(a) * 122);
  });
  const C = P(lay.L, 0);
  const market: { p: [number, number]; k: number }[] = [];
  [112, 160, 208, 256, 304].forEach((R, k) => {
    const amax = Math.asin(Math.min(0.92, 146 / R));
    const n = 7 + k * 3;
    for (let i = 0; i < n; i++) {
      const a = -amax + (2 * amax * i) / (n - 1);
      market.push({ p: P(lay.O + Math.cos(a) * R, Math.sin(a) * R), k });
    }
  });
  const rays = market.filter((m) => m.k === 4).filter((_, i) => i % 3 === 0);
  const O = P(lay.O, 0);
  const bars = Array.from({ length: 13 }, (_, i) => {
    const t = lay.B + i * 17;
    const h = 220 / Math.pow(i + 1, 1.15);
    const [x1, y1] = P(t - 4, -150);
    const [x2, y2] = P(t + 4, -150 + h);
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
  });
  const base = [P(lay.B - 20, -150), P(lay.B + 12 * 17 + 20, -150)];
  const top = P(lay.B, 70);
  const link = `M${pt(lay.O + 304, 0)} C${pt(lay.O + 360, 0)} ${pt(lay.B - 40, 70)} ${pt(lay.B - 8, 70)}`;
  const g = (k: string) => `pvVf${k}${lay.id}`;
  return (
    <svg viewBox={lay.box} className={lay.vertical ? 'v' : undefined} aria-hidden="true">
      <defs>
        <radialGradient id={g('Glow')}><stop offset="0" stopColor="#9fb6cf" stopOpacity=".5" /><stop offset="1" stopColor="#9fb6cf" stopOpacity="0" /></radialGradient>
        <radialGradient id={g('Lead')}><stop offset="0" stopColor="#ffffff" stopOpacity=".35" /><stop offset="1" stopColor="#9fb6cf" stopOpacity="0" /></radialGradient>
      </defs>
      {/* 01 : les fondateurs, et leur intention */}
      <circle className="vf-glow s1" cx={P(lay.F, 0)[0]} cy={P(lay.F, 0)[1]} r="62" fill={`url(#${g('Glow')})`} />
      <path className="vf-line vf-draw s2" d={beam} pathLength={1} />
      {/* 02 : la boucle de machines, qui s'élargit à chaque tour */}
      <circle className="vf-glow s3" cx={C[0]} cy={C[1]} r="110" fill={`url(#${g('Glow')})`} />
      <path className="vf-line vf-draw s3 slow" d={spiralD} pathLength={1} />
      <circle className="vf-ring s4" cx={C[0]} cy={C[1]} r="122" />
      <g className="vf-orbit s4">
        {machines.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
      </g>
      {/* 03 : un marché entier */}
      {rays.map((m, i) => <line key={`r${i}`} className="vf-ray" x1={O[0]} y1={O[1]} x2={m.p[0]} y2={m.p[1]} style={{ ['--d' as string]: `${2.3 + i * 0.05}s` }} />)}
      {market.map((m, i) => <circle key={`m${i}`} className="vf-dot" cx={m.p[0]} cy={m.p[1]} r="2.4" style={{ ['--d' as string]: `${2.5 + m.k * 0.2}s` }} />)}
      {/* 04 : le leader, et la longue traîne */}
      <path className="vf-line vf-draw s5" d={link} pathLength={1} />
      <line className="vf-base s5" x1={base[0][0]} y1={base[0][1]} x2={base[1][0]} y2={base[1][1]} />
      <circle className="vf-glow s6" cx={top[0]} cy={top[1]} r="56" fill={`url(#${g('Lead')})`} />
      {bars.map((r, i) => (
        <rect key={`b${i}`} className={`vf-bar${i === 0 ? ' hi' : ''}`} x={r.x} y={r.y} width={r.w} height={r.h} rx="3"
              style={{ ['--d' as string]: `${3.6 + i * 0.05}s` }} />
      ))}
      {founders.map(([x, y], i) => <circle key={`f${i}`} className="vf-hi" cx={x} cy={y} r="8" />)}
      <circle className="vf-hi vf-core" cx={C[0]} cy={C[1]} r="4" />
      {live && (
        <g className="vf-pulses">
          {[0, 1, 2].map((k) => (
            <circle key={`pb${k}`} r="3" opacity="0">
              <animateMotion dur="2.4s" begin={`${1.4 + k * 0.8}s`} repeatCount="indefinite" path={beam} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="2.4s" begin={`${1.4 + k * 0.8}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {rays.slice(0, 5).map((m, k) => {
            const d = `M${O[0].toFixed(1)} ${O[1].toFixed(1)} L${m.p[0].toFixed(1)} ${m.p[1].toFixed(1)}`;
            return (
              <circle key={`pr${k}`} r="2.4" opacity="0">
                <animateMotion dur="2.8s" begin={`${3 + k * 0.45}s`} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur="2.8s" begin={`${3 + k * 0.45}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </g>
      )}
    </svg>
  );
}

export function WhatWeBack() {
  const [ref, seen] = useInView<HTMLElement>();
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!seen) return;
    try { setLive(!window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch { setLive(true); }
  }, [seen]);
  return (
    <section className="pv-sec night pv-vf-sec" id="back">
      <div className="pv-wrap">
        <p className="pv-kick">What we back</p>
        <h2 className="pv-say-h">The clearest minds, directing the most autonomous machines.</h2>
        <figure ref={ref} className={`pv-vf${seen ? ' in' : ''}`}>
          <div className="pv-vf-art h"><VisionArt lay={VF_H} live={live} /></div>
          <div className="pv-vf-art v"><VisionArt lay={VF_V} live={live} /></div>
          <ol className="pv-vf-zones" style={{ gridTemplateColumns: VF_ZONES.map((z) => `${z.w}fr`).join(' ') }}>
            {VF_ZONES.map((z, i) => (
              <li key={z.n} style={{ ['--d' as string]: `${0.3 + i * 1.1}s` }}><span className="n">{z.n}</span><h3>{z.t}</h3><p>{z.d}</p></li>
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
const MOVES: { t: string; d: string }[] = [
  { t: 'A clean cap table before every round.', d: 'We buy out angels and early funds, with your agreement. Their votes move to your side.' },
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
  return (
    <section className="pv-sec pv-cfo-sec" id="capital">
      <div className="pv-wrap">
        <p className="pv-kick pv-cfo-k">AI-native, in-house</p>
        <h2 className="pv-say-h">Your Chief Fundraising Officer. <span>Perfectly aligned.</span></h2>
        <p className="pv-say-p">Everything your company needs to reach its full potential, raised at the right moment and in the order that dilutes you least. Every share you don’t issue protects your stake, and ours.</p>
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
            <span className="pv-run-live"><i />Running</span>
            <span className="pv-run-lg"><img src={c.logo} alt={c.name} className={c.wide ? 'wide' : undefined} /></span>
            <p>{c.d}</p>
            <ul>
              <li><Icon name="radar" />Corporate development<b>External AI Growth Engine</b><i className="pv-run-pulse" aria-hidden="true" /></li>
              <li><Icon name="bot" />Inbound and outbound<b>Internal AI Growth Engine</b><i className="pv-run-pulse" aria-hidden="true" /></li>
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
