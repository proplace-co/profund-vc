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
const DEFAULT = {
  founders: FM.founders * 100,
  investors: INVESTORS.reduce((s, h) => s + h.stake, 0) * 100,
  raised: FM.raised_before / 1e6,
  rounds: FM.vc_rounds.map((r) => ({ amount: r.amount / 1e6, post: r.post / 1e6 })),
  loans: FM.loans / 1e6,
  exit: FM.rows[1].exit / 1e6,
};
const ROUND_NAMES = ['B', 'C', 'D', 'E', 'F'];

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

export default function CalculatorPage() {
  const [s, setS] = useState(DEFAULT);
  const set = <K extends keyof typeof DEFAULT>(k: K, v: (typeof DEFAULT)[K]) => setS((x) => ({ ...x, [k]: v }));
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

  const founders = Math.min(100, n(s.founders)) / 100;
  const investors = Math.min(100 - founders * 100, n(s.investors)) / 100;
  const r = useMemo(() => founderPaths({
    founders,
    holders: [
      { id: 'investors', stake: investors, pref: n(s.raised) * 1e6 },
      { id: 'others', stake: Math.max(0, 1 - founders - investors), pref: 0 },
    ],
    rounds: s.rounds.map((x) => ({ amount: n(x.amount) * 1e6, post: n(x.post) * 1e6 })),
    loans: n(s.loans) * 1e6,
    loanMultiple: FM.loan_multiple,
    exit: n(s.exit) * 1e6,
  }), [s, founders, investors]);

  const vc = r.vc.founders;
  const pf = r.profund.founders;
  const top = Math.max(vc, pf, 1);
  const ratio = vc > 0 ? pf / vc : null;
  const roundErr = s.rounds.some((x) => n(x.post) > 0 && n(x.amount) >= n(x.post));

  function setRound(i: number, k: 'amount' | 'post', v: number) {
    set('rounds', s.rounds.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  }

  return (
    <SubPage kick="Run your numbers" title="Run your numbers."
      intro="Your stake today, the rounds you plan, your expected exit. What you take home on each path, and your stake after every round.">
      <section className="pv-sec pv-sec-tight">
        <div className="pv-wrap pv-calc">
          <div className="pv-calc-in">
            <div className="pv-card">
              <h2 className="pv-h3">Today</h2>
              <div className="pv-form-grid">
                <Num label="Your stake today" unit="%" value={s.founders} step={0.5} onChange={(v) => set('founders', v)}
                     hint="Founders together" />
                <Num label="Investors’ stake" unit="%" value={s.investors} step={0.5} onChange={(v) => set('investors', v)}
                     hint="With 1× preferences; the rest is pool and others" />
                <Num label="Raised so far" unit="€M" value={s.raised} step={0.5} onChange={(v) => set('raised', v)} />
                <Num label="Your expected exit" unit="€M" value={s.exit} step={10} onChange={(v) => set('exit', v)} />
              </div>
            </div>
            <div className="pv-card">
              <h2 className="pv-h3">The rounds you plan <small>VC path</small></h2>
              {s.rounds.map((x, i) => (
                <div key={i} className="pv-round">
                  <span className="pv-round-n">Series {ROUND_NAMES[i]}</span>
                  <Num label="Amount" unit="€M" value={x.amount} onChange={(v) => setRound(i, 'amount', v)} />
                  <Num label="Valuation, post-money" unit="€M" value={x.post} step={10} onChange={(v) => setRound(i, 'post', v)} />
                  <button type="button" className="pv-round-x" aria-label={`Remove Series ${ROUND_NAMES[i]}`}
                          onClick={() => set('rounds', s.rounds.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              {roundErr && <p className="pfm-err">A round cannot be larger than its post-money valuation.</p>}
              <div className="pv-round-act">
                {s.rounds.length < ROUND_NAMES.length && (
                  <button type="button" className="pv-link" onClick={() => set('rounds', [...s.rounds, { amount: 20, post: 200 }])}>
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
                    <tr key={i}><td>After Series {ROUND_NAMES[i]}</td><td>{pct(st, 1)}</td><td className="pf">{pct(founders, 1)}</td></tr>
                  ))}
                  <tr className="sub"><td>Equity raised after today</td><td>{money(r.vc.equityRaised)}</td><td>€0, {money(n(s.loans) * 1e6)} of loans</td></tr>
                </tbody>
              </table>
            </div>
            <p className="pv-fine">
              VC path: 1× non-participating preferences, pari passu; each investor converts when it pays more.
              ProFund path: no new share after today; loans repaid at exit, before equity. On the ProFund path your stake
              never goes down (the annual cancellations that lift it are not counted here). Illustrative, not a forecast or an offer.
            </p>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
