import { useEffect, useRef, useState } from 'react';
import { dealFlowPreview } from '../lib/dealFlowPreview';
import { PORTFOLIO, type PortfolioCo } from './Founders';

// /lp, sous le portefeuille (17/11, Alexandre). Deux blocs que les LPs séparent dans leur tête :
//  · « Deal flow » : le cockpit du fonds tel qu'il s'ouvre par défaut, sans société choisie (le même
//    que /dealflow : proplace.co/cibles/profund-vc redirige vers le jeton de `dealFlowPreview`), en
//    anglais (`/carte/`), lecture seule (`guest=lp`, sans `lpk`).
//  · « Live reporting » : le Reporting de la société choisie (Proplace d'abord), DESSINÉ PAR /lp, sans
//    liste ni bandeau de thèse. Le cockpit ne sait pas ouvrir son onglet Reporting par lien (vérifié le
//    17/11, code et version en ligne) et la règle d'Alexandre interdit d'en modifier le code : on lit la
//    route que l'onglet Reporting du cockpit appelle lui-même, POST /cibles/reporting/company du proxy
//    Modal (monorepo, modal_proxy/proxy.py ; contrat dans services/reporting/README.md), ouverte (CORS *).
//    Les chiffres des trois sociétés sont lisibles sans session parce que l'opérateur les a rendus
//    publics le 14/11 (`public: true`) ; si ce drapeau tombe, les tuiles privées reviennent « réservées ».
//    API interne, pas un contrat stable : la réponse est validée, sinon « indisponible ». On ne montre
//    ni les connecteurs, ni la comparaison, ni les approches (masquées aux LPs dans le cockpit). Comme à
//    l'ouverture de l'onglet, un relevé de plus de 15 min lance un rafraîchissement côté proxy.
const PROXY = 'https://alexandre-79537--proplace-chat-proxy-fastapi-app.modal.run';
const FUND_TOKEN = new URL(dealFlowPreview()).searchParams.get('cb') || '';
const TIMEOUT_MS = 20000;   // le proxy Modal peut mettre des dizaines de secondes à se réveiller
const TRIES = 2;

/** Le cockpit tel qu'il s'ouvre par défaut, en anglais. */
function dealFlowSrc(): string {
  const u = new URL(dealFlowPreview());
  u.pathname = '/carte/';
  return u.href;
}

// ── Le relevé : le sous-ensemble de la réponse que /lp lit ───────────────────
type Status = 'ok' | 'locked' | 'off' | 'pending' | 'missing';
type Tile = {
  key: string; label: string; unit: string; status: Status; value: number | null;
  delta_pct: number | null; trend: string | null; series?: [string, number][];
  source: string | null; as_of: string | null; note: string | null;
};
type Group = { key: string; label: string; question: string; verdict: string; tiles: string[] };
type Report = {
  coverage: number; momentum: { up: number; down: number }; computed_at: string; stale: boolean;
  portfolio: boolean; groups: Group[]; tiles: Tile[];
};

function asReport(d: unknown): Report | null {
  const r = d as Partial<Report> & { ok?: boolean };
  if (!r || r.ok !== true || !Array.isArray(r.groups) || !Array.isArray(r.tiles)) return null;
  if (typeof r.coverage !== 'number' || !r.momentum) return null;
  return r as Report;
}

const domainOf = (c: PortfolioCo) => new URL(c.href).hostname.replace(/^www\./, '');
const CACHE = new Map<string, Report>();

async function loadReport(c: PortfolioCo): Promise<Report | null> {
  for (let i = 0; i < TRIES; i++) {
    const ctl = new AbortController();
    const t = window.setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`${PROXY}/cibles/reporting/company`, {
        method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: FUND_TOKEN, key: domainOf(c), name: c.name, lang: 'en' }),
      });
      const rep = r.ok ? asReport(await r.json().catch(() => null)) : null;
      if (rep) return rep;
      if (r.status >= 400 && r.status < 500) return null;   // requête refusée : inutile de retenter
    } catch { /* délai dépassé ou réseau : on retente */ } finally {
      window.clearTimeout(t);
    }
  }
  return null;
}

// ── Les formats (repris de fmtKpi, reportingData.ts du cockpit, en anglais) ───
const nf = (max: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: max });
function compact(v: number, cur: boolean): string {
  if (Math.abs(v) >= 1e6) return `${nf(1).format(v / 1e6)}M`;
  if (Math.abs(v) >= 1e4) return `${nf(1).format(v / 1e3)}k`;
  return nf(cur ? 0 : 1).format(v);
}
function fmt(unit: string, v: number | null): string {
  if (v === null || !Number.isFinite(v)) return '–';
  switch (unit) {
    case 'eur': return `€${compact(v, true)}`;
    case 'usd': return `$${compact(v, true)}`;
    case 'pct': return `${v > 0 ? '+' : ''}${nf(Math.abs(v) < 10 ? 1 : 0).format(v)}%`;
    case 'rank': return `#${nf(0).format(v)}`;
    case 'rating': return `${nf(1).format(v)}/5`;
    case 'months': return `${nf(1).format(v)} mo`;
    default: return compact(v, false);
  }
}
function measured(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === new Date().toDateString() ? `today at ${time}`
    : `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${time}`;
}
const day = (iso: string | null) => (iso && Number.isFinite(Date.parse(iso))
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');
const SOURCES: Record<string, string> = {
  stripe: 'Stripe', github_activity: 'GitHub', press: 'Google News', inbound: 'Inbound engine',
  outbound: 'Outbound engine', ai_spend: 'AI and API billing',
};
const sourceName = (s: string | null) => (s ? SOURCES[s] || s.replace(/_/g, ' ') : '');
const VERDICT: Record<string, string> = { up: '▲ Improving', down: '▼ Declining', flat: '= Stable', locked: 'Reserved', none: 'To connect' };
const EMPTY: Record<Exclude<Status, 'ok'>, string> = {
  locked: 'Fund team only', pending: 'Connected, first reading in progress', off: 'Source switched off', missing: 'To connect',
};

function Spark({ series, trend }: { series: [string, number][]; trend: string }) {
  const pts = series.slice(-30);
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p[1]);
  const lo = Math.min(...vals);
  const span = Math.max(...vals) - lo || 1;
  const xy = pts.map((p, i) => [2 + i * (92 / (pts.length - 1)), 24 - ((p[1] - lo) / span) * 22]);
  const last = xy[xy.length - 1];
  return (
    <svg className={`lp-rp-spark ${trend}`} width={96} height={26} viewBox="0 0 96 26" aria-hidden="true" focusable="false">
      <polyline points={xy.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')} />
      <circle cx={last[0]} cy={last[1]} r={2.2} />
    </svg>
  );
}

function TileCard({ t }: { t: Tile }) {
  if (t.status !== 'ok') {
    return <li className="lp-rp-tile na"><span className="l">{t.label}</span><span className="e">{EMPTY[t.status] || EMPTY.missing}</span></li>;
  }
  const d = t.delta_pct;
  const trend = t.trend || 'flat';
  return (
    <li className="lp-rp-tile" title={t.note || undefined}>
      <span className="l">{t.label}</span>
      <b className="v">{fmt(t.unit, t.value)}</b>
      {d !== null && t.unit !== 'pct'
        ? <span className="d"><span className={trend}>{d > 0 ? '▲' : d < 0 ? '▼' : '='} {fmt('pct', d)}</span> vs one month ago</span>
        : <span className="d">&nbsp;</span>}
      {t.series && <Spark series={t.series} trend={trend} />}
      <span className="s">{[sourceName(t.source), day(t.as_of)].filter(Boolean).join(' · ')}</span>
    </li>
  );
}

function ReportView({ co, rep }: { co: PortfolioCo; rep: Report }) {
  const byKey = new Map(rep.tiles.map((t) => [t.key, t]));
  return (
    <>
      <header className="lp-rp-head">
        <div>
          <h4 className="lp-rp-name">{co.name}</h4>
          <p className="lp-rp-meta">
            {rep.portfolio && <span className="lp-rp-badge">In portfolio · Seed</span>}
            {rep.computed_at && <span>Measured {measured(rep.computed_at)}{rep.stale ? ', last known reading' : ''}</span>}
          </p>
        </div>
        <div className="lp-rp-kpis">
          <div className="lp-rp-cov" title="Share of the essential KPIs that have a connected source, weighted by importance.">
            <span className="k">Coverage <b>{rep.coverage}%</b></span>
            <span className="lp-rp-bar" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, rep.coverage))}%` }} /></span>
          </div>
          <span className="lp-rp-mom" title="KPIs moving the right way / the wrong way, over one month.">
            <span className="up">{rep.momentum.up} ▲</span> · <span className="down">{rep.momentum.down} ▼</span>
          </span>
        </div>
      </header>

      {rep.groups.length > 0 && (
        <section aria-label="Company health">
          <h5 className="lp-rp-h">Company health</h5>
          <ul className="lp-rp-health">
            {rep.groups.map((g) => (
              <li key={g.key} className={`v-${g.verdict}`} title={g.question}>
                <span>{g.label}</span><b>{VERDICT[g.verdict] || g.verdict}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Essential KPIs">
        <h5 className="lp-rp-h">Essential KPIs</h5>
        {rep.groups.map((g) => {
          const tiles = g.tiles.map((k) => byKey.get(k)).filter((t): t is Tile => !!t);
          if (!tiles.length) return null;
          return (
            <div key={g.key} className="lp-rp-grp">
              <h6 className="lp-rp-gh">{g.label}<span className={`v-${g.verdict}`}>{VERDICT[g.verdict] || ''}</span></h6>
              {g.question && <p className="lp-rp-gq">{g.question}</p>}
              <ul className="lp-rp-grid">{tiles.map((t) => <TileCard key={t.key} t={t} />)}</ul>
            </div>
          );
        })}
      </section>
      <p className="lp-rp-foot">Read live from each company’s connected sources by our engines. Unaudited.</p>
    </>
  );
}

/** « Deal flow » : le cockpit du fonds, tel qu'il s'ouvre par défaut. */
export function DealFlowEmbed() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="lp-live">
      <h3 className="lp-live-h"><span className="pv-dot" />Deal flow</h3>
      <p className="lp-live-sub">Every company we review, every evening.</p>
      <div className="lp-live-pane">
        {!loaded && <p className="lp-live-wait">Opening the live deal flow…</p>}
        <iframe title="ProFund deal flow" src={dealFlowSrc()} loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} />
      </div>
    </div>
  );
}

/** « Live reporting » : le Reporting de la société choisie, dessiné par /lp. */
export default function LiveReporting() {
  const [sel, setSel] = useState(PORTFOLIO[0].name);
  const co = PORTFOLIO.find((c) => c.name === sel) ?? PORTFOLIO[0];
  const [near, setNear] = useState(false);
  const [state, setState] = useState<{ name: string; rep: Report | null; done: boolean }>({ name: '', rep: null, done: false });
  const [attempt, setAttempt] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  // ne lire que quand le bloc approche de l'écran (chaque lecture peut réveiller le proxy)
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const hit = CACHE.get(co.name);
    if (hit) { setState({ name: co.name, rep: hit, done: true }); return; }
    let stop = false;
    setState({ name: co.name, rep: null, done: false });
    void loadReport(co).then((rep) => {
      if (rep) CACHE.set(co.name, rep);
      if (!stop) setState({ name: co.name, rep, done: true });
    });
    return () => { stop = true; };
  }, [co, near, attempt]);

  const mine = state.name === co.name;
  return (
    <div className="lp-live" ref={box}>
      <h3 className="lp-live-h"><span className="pv-dot" />Live reporting</h3>
      <div className="lp-live-cos" role="group" aria-label="Portfolio companies">
        {PORTFOLIO.map((c) => (
          <button key={c.name} type="button" aria-pressed={c.name === co.name} aria-controls="lp-rp" onClick={() => setSel(c.name)}>
            <img src={c.logo} alt={c.name} style={{ maxHeight: c.h }} />
            <small>Seed · {c.caps.map((k) => ({ corpdev: 'Corp dev', inbound: 'Inbound', outbound: 'Outbound' })[k]).join(', ')}</small>
          </button>
        ))}
      </div>
      <div id="lp-rp" className="lp-rp" role="region" aria-label={`${co.name}, live reporting`} aria-busy={!(mine && state.done)}>
        {mine && state.rep ? <ReportView co={co} rep={state.rep} />
          : mine && state.done ? (
            <p className="lp-rp-wait">
              {co.name}’s reporting is unavailable for now.{' '}
              <button type="button" className="pv-link" onClick={() => setAttempt((a) => a + 1)}>Try again</button>
            </p>
          ) : <p className="lp-rp-wait">Loading {co.name}’s live reporting…</p>}
      </div>
    </div>
  );
}
