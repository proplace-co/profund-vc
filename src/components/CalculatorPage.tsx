import { useMemo, useState } from 'react';
import SubPage from './SubPage';
import { Icon } from './Thesis';
import { founderPaths } from '../lib/founderMath.js';
import { eur, fund, pct } from '../lib/fund';

// /calculator — « Run your numbers ». Même calcul que le tableau de l'accueil
// (src/lib/founderMath.js, vérifié contre fund.json au build) : préférences 1×
// non participantes pari passu côté VC, prêts remboursés à la sortie avant les
// fonds propres côté ProFund. Valeurs par défaut = les hypothèses du tableau publié.
const FM = fund.founder_math;
const INVESTORS = FM.holders.filter((h) => h.pref > 0);
// v3.15 : les investisseurs gardent leurs classes (seed, Series A), comme dans le modèle :
// avec cinq tours derrière, une classe fusionnée ne convertit pas au même moment et le
// calculateur s'écartait du tableau publié. La part et le montant levés saisis se répartissent
// entre les classes dans les proportions du tableau.
const INV_STAKE = INVESTORS.reduce((s, h) => s + h.stake, 0);
const INV_PREF = INVESTORS.reduce((s, h) => s + h.pref, 0);
const DEFAULT = {
  founders: FM.founders * 100,
  investors: INV_STAKE * 100,
  raised: FM.raised_before / 1e6,
  // v3.15 : les levées intermédiaires (« Bridge ») font partie du chemin par défaut
  rounds: FM.vc_rounds.map((r) => ({ label: r.label, amount: r.amount / 1e6, post: r.post / 1e6, pool: r.pool * 100 })),
  loans: FM.loans / 1e6,
  extra: 0,          // equity complémentaire si la dette ne suffit pas (pacte, préférence 1×)
  extraPost: 250,
  exit: FM.rows[1].exit / 1e6,
};
const MAX_ROUNDS = 8;
/** Le nom du tour ajouté : la série qui suit la dernière nommée (D → Series E). */
function nextLabel(rounds: { label: string }[]) {
  const last = [...rounds].reverse().find((r) => /^Series [A-Y]$/.test(r.label));
  return last ? `Series ${String.fromCharCode(last.label.charCodeAt(7) + 1)}` : 'Series B';
}

/** €38M au-delà de 10 M (comme le tableau publié), €7.4M en dessous. */
function money(v: number) {
  if (Math.abs(v) >= 1e7) return `€${Math.round(v / 1e6)}M`;
  if (Math.abs(v) >= 1e6) return `€${(v / 1e6).toFixed(1)}M`;
  return eur(Math.round(v / 1e4) * 1e4);
}

function Num({ label, value, onChange, unit, step = 1, hint }: {
  label: string; value: number; onChange: (v: number) => void; unit: string; step?: number; hint?: string;
}) {
  return (
    <label className="pv-fld">
      <span className="pv-fld-l">{label}</span>
      <span className="pv-num">
        <input className="pfm-in" type="number" inputMode="decimal" min={0} step={step}
               value={Number.isFinite(value) ? value : ''} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <em>{unit}</em>
      </span>
      {hint && <span className="pv-fld-h">{hint}</span>}
    </label>
  );
}

/** Le calculateur seul : la page /calculator et le panneau dépliable de l'accueil (v3.15). */
export function Calculator({ className = '' }: { className?: string }) {
  const [s, setS] = useState(DEFAULT);
  const set = <K extends keyof typeof DEFAULT>(k: K, v: (typeof DEFAULT)[K]) => setS((x) => ({ ...x, [k]: v }));
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

  const founders = Math.min(100, n(s.founders)) / 100;
  const investors = Math.min(100 - founders * 100, n(s.investors)) / 100;
  const r = useMemo(() => founderPaths({
    founders,
    holders: [
      ...INVESTORS.map((h) => ({ id: h.id, stake: (h.stake / INV_STAKE) * investors, pref: (h.pref / INV_PREF) * n(s.raised) * 1e6 })),
      { id: 'pool', stake: Math.max(0, 1 - founders - investors), pref: 0 },
    ],
    rounds: s.rounds.map((x) => ({ amount: n(x.amount) * 1e6, post: n(x.post) * 1e6, pool: n(x.pool) / 100 })),
    loans: n(s.loans) * 1e6,
    loanMultiple: FM.loan_multiple,
    extra: [{ amount: n(s.extra) * 1e6, post: n(s.extraPost) * 1e6 }],
    exit: n(s.exit) * 1e6,
  }), [s, founders, investors]);

  const vc = r.vc.founders;
  const pf = r.profund.founders;
  const top = Math.max(vc, pf, 1);
  const ratio = vc > 0 ? pf / vc : null;
  const roundErr = s.rounds.some((x) => n(x.post) > 0 && n(x.amount) >= n(x.post));

  function setRound(i: number, k: 'amount' | 'post' | 'pool', v: number) {
    set('rounds', s.rounds.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  }

  return (
    <div className={`pv-calc${className ? ` ${className}` : ''}`}>
      <div className="pv-calc-in">
        <div className="pv-card">
          <h2 className="pv-h3">Today</h2>
          <div className="pv-form-grid">
            <Num label="Your stake today" unit="%" value={s.founders} step={0.5} onChange={(v) => set('founders', v)}
                 hint="Founders together" />
            <Num label="Investors’ stake" unit="%" value={s.investors} step={0.5} onChange={(v) => set('investors', v)}
                 hint="With 1× preferences; the rest is the option pool" />
            <Num label="Raised so far" unit="€M" value={s.raised} step={0.5} onChange={(v) => set('raised', v)} />
            <Num label="Your expected exit" unit="€M" value={s.exit} step={10} onChange={(v) => set('exit', v)} />
          </div>
        </div>
        <div className="pv-card">
          <h2 className="pv-h3">The rounds you plan <small>VC path</small></h2>
          {s.rounds.map((x, i) => (
            <div key={i} className="pv-round">
              <span className="pv-round-n">{x.label}</span>
              <Num label="Amount" unit="€M" value={x.amount} onChange={(v) => setRound(i, 'amount', v)} />
              <Num label="Valuation, post-money" unit="€M" value={x.post} step={10} onChange={(v) => setRound(i, 'post', v)} />
              <Num label="Pool top-up" unit="%" value={x.pool} step={0.5} onChange={(v) => setRound(i, 'pool', v)} />
              <button type="button" className="pv-round-x" aria-label={`Remove ${x.label}`}
                      onClick={() => set('rounds', s.rounds.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          {roundErr && <p className="pfm-err">A round cannot be larger than its post-money valuation.</p>}
          <div className="pv-round-act">
            {s.rounds.length < MAX_ROUNDS && (
              <button type="button" className="pv-link" onClick={() => set('rounds', [...s.rounds, { label: nextLabel(s.rounds), amount: 20, post: 200, pool: 2 }])}>
                + Add a round
              </button>
            )}
            <button type="button" className="pv-link muted" onClick={() => setS(DEFAULT)}>Reset to the example</button>
          </div>
        </div>
        <div className="pv-card">
          <h2 className="pv-h3">Instead, with ProFund <small>ProFund path</small></h2>
          <div className="pv-form-grid">
            <Num label="Loans instead of these rounds" unit="€M" value={s.loans} onChange={(v) => set('loans', v)}
                 hint={`${pct(FM.loan_rate)} a year, about ${FM.loan_life} years on average: ${FM.loan_multiple.toFixed(1)}×, repaid before equity`} />
            <Num label="If debt is not enough: extra equity" unit="€M" value={s.extra} onChange={(v) => set('extra', v)}
                 hint="Your call. Led by us on the pact terms, 1× preference" />
            {n(s.extra) > 0 && (
              <Num label="Extra equity, post-money valuation" unit="€M" value={s.extraPost} step={10} onChange={(v) => set('extraPost', v)} />
            )}
          </div>
        </div>
      </div>

      <div className="pv-calc-out">
        <div className="pv-card pv-result">
          <p className="pv-kick">What you take home at {money(n(s.exit) * 1e6)}</p>
          <div className="pv-res-row">
            <span>VC path</span><b>{money(vc)}</b>
            <i><em style={{ width: `${Math.max(1.5, (vc / top) * 100)}%` }} /></i>
          </div>
          <div className="pv-res-row pf">
            <span>ProFund path</span><b>{money(pf)}</b>
            <i><em style={{ width: `${Math.max(1.5, (pf / top) * 100)}%` }} /></i>
          </div>
          <p className="pv-res-x">
            {ratio === null ? (pf > 0 ? 'On the VC path, the preferences take the whole exit.' : 'At this exit, nothing reaches the founders on either path.')
              : ratio >= 1.05 ? <><b>{ratio.toFixed(1)}×</b> what the VC path leaves you.</>
                : 'At this exit, the two paths are close: check your loan needs.'}
          </p>
          <table className="pv-res-t">
            <thead><tr><th>Your stake</th><th>VC path</th><th>ProFund path</th></tr></thead>
            <tbody>
              <tr><td>Today</td><td>{pct(founders, 1)}</td><td>{pct(founders, 1)}</td></tr>
              {r.vc.stakes.map((st, i) => (
                <tr key={i}><td>After {s.rounds[i]?.label ?? `round ${i + 1}`}</td><td>{pct(st, 1)}</td><td className="pf">{pct(founders, 1)}</td></tr>
              ))}
              {r.profund.equityRaised > 0 && (
                <tr><td>After the extra equity</td><td>–</td><td className="pf">{pct(r.profund.stakeAtExit, 1)}</td></tr>
              )}
              <tr className="sub"><td>Equity raised after today</td><td>{money(r.vc.equityRaised)}</td><td>{r.profund.equityRaised > 0 ? money(r.profund.equityRaised) : '€0'}, {money(n(s.loans) * 1e6)} of loans</td></tr>
            </tbody>
          </table>
        </div>
        <p className="pv-fine">
          VC path: 1× non-participating preferences, pari passu; each investor converts when it pays more; the option
          pool is topped up before each round. Defaults: calibrated on Carta medians (Founder Ownership Report 2026):
          founders at 37.5% after the Series A, then a bridge before the B and the C, as most companies raise one, so
          that founders hold Carta’s median stake after the Series B (AI teams) and the Series C. ProFund path: no new share after today unless you ask for extra equity (1× preference, like
          our first cheque); the pool is refilled with bought-back shares; loans repaid at exit, before equity. The annual
          cancellations that lift your stake are not counted here. Illustrative, not a forecast or an offer.
        </p>
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <SubPage kick="Run your numbers" title="Run your numbers."
      intro="Your stake today, the rounds you plan, your expected exit. What you take home on each path, and your stake after every round.">
      <section className="pv-sec pv-sec-tight">
        <div className="pv-wrap">
          <Calculator />
        </div>
      </section>
    </SubPage>
  );
}
