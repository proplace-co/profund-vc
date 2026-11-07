import { useMemo, useState } from 'react';
import SubPage from './SubPage';
import { Icon } from './Thesis';
import { creditPlan, founderPaths, halfCapitalPlan, sameCapitalPlan } from '../lib/founderMath.js';
import { eur, fund, pct } from '../lib/fund';

// /calculator — « Run your numbers ». Même moteur que le tableau publié (src/lib/founderMath.js,
// vérifié contre fund.json au build) : préférences 1× non participantes pari passu, prêts
// remboursés à la sortie avant les fonds propres. 07/11 : PAR DÉFAUT, LA MÊME LEVÉE SUR LES DEUX
// CHEMINS, avec des prêts à la taille du marché (au plus 40 % du dernier tour) ; le résultat montre
// d'un coup d'œil ce que donnent la moitié du capital et le crédit seul, et dit quand les deux
// chemins ne lèvent pas la même somme.
const FM = fund.founder_math;
const INVESTORS = FM.holders.filter((h) => h.pref > 0);
// v3.15 : les investisseurs gardent leurs classes (seed, Series A), comme dans le modèle :
// avec cinq tours derrière, une classe fusionnée ne convertit pas au même moment et le
// calculateur s'écartait du tableau publié. La part et le montant levés saisis se répartissent
// entre les classes dans les proportions du tableau.
const INV_STAKE = INVESTORS.reduce((s, h) => s + h.stake, 0);
const INV_PREF = INVESTORS.reduce((s, h) => s + h.pref, 0);
const SERIES_A = FM.holders.find((h) => h.id === 'series_a')!;
const SIZE_MAX = 0.4;   // la venture debt : 20 à 40 % du dernier tour (First Citizens, ex-SVB)

type Round = { label: string; amount: number; post: number; pool: number; bridge: boolean; defLoan: number; loan: number; skip: boolean };
type Preset = 'same' | 'half' | 'credit';
const PRESETS: { id: Preset; label: string }[] = [
  { id: 'same', label: 'The same capital' },
  { id: 'half', label: 'Half the capital' },
  { id: 'credit', label: 'Credit alone' },
];

const DEFAULT = {
  founders: FM.founders * 100,
  investors: INV_STAKE * 100,
  raised: FM.raised_before / 1e6,
  // v3.15 : les levées intermédiaires (« Bridge ») font partie du chemin par défaut
  rounds: FM.vc_rounds.map((r): Round => ({
    label: r.label, amount: r.amount / 1e6, post: r.post / 1e6, pool: r.pool * 100, bridge: !!r.bridge,
    defLoan: (r.loan ?? 0) / 1e6, loan: (r.loan ?? 0) / 1e6, skip: false,
  })),
  loans: 0,
  poolBuyback: false,
  exit: FM.rows[FM.rows.length - 1].exit / 1e6,
};
const MAX_ROUNDS = 8;

/** Le nom du tour ajouté : la série qui suit la dernière nommée (D → Series E). */
function nextLabel(rounds: { label: string }[]) {
  const last = [...rounds].reverse().find((r) => /^Series [A-Y]$/.test(r.label));
  return last ? `Series ${String.fromCharCode(last.label.charCodeAt(7) + 1)}` : 'Series B';
}

/** €1.2B au-delà du milliard, €38M au-delà de 10 M (comme le tableau publié), €7.4M en dessous. */
function money(v: number) {
  if (Math.abs(v) >= 1e9) return `€${(v / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`;
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

/** Le plan d'un préréglage, sur les tours saisis. */
function presetRounds(id: Preset, rounds: Round[]): Round[] {
  const plan = id === 'same'
    ? sameCapitalPlan(rounds.map((r) => ({ loan: r.defLoan })))
    : id === 'half' ? halfCapitalPlan(rounds) : creditPlan(rounds);
  return rounds.map((r, i) => ({ ...r, skip: !!plan[i].skip, loan: plan[i].loan ?? 0 }));
}
const presetLoans = (id: Preset) => (id === 'same' ? 0 : FM.loans / 1e6);

/** Le calculateur seul : la page /calculator et le panneau dépliable de l'accueil (v3.15). */
export function Calculator({ className = '' }: { className?: string }) {
  const [s, setS] = useState(DEFAULT);
  const set = <K extends keyof typeof DEFAULT>(k: K, v: (typeof DEFAULT)[K]) => setS((x) => ({ ...x, [k]: v }));
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);

  const founders = Math.min(100, n(s.founders)) / 100;
  const investors = Math.min(100 - founders * 100, n(s.investors)) / 100;
  const run = (rounds: Round[], loans: number, poolBuyback: boolean) => founderPaths({
    founders,
    holders: [
      ...INVESTORS.map((h) => ({ id: h.id, stake: (h.stake / INV_STAKE) * investors, pref: (h.pref / INV_PREF) * n(s.raised) * 1e6 })),
      { id: 'pool', stake: Math.max(0, 1 - founders - investors), pref: 0 },
    ],
    rounds: rounds.map((x) => ({ amount: n(x.amount) * 1e6, post: n(x.post) * 1e6, pool: n(x.pool) / 100 })),
    loans: n(loans) * 1e6,
    loanMultiple: FM.loan_multiple,
    plan: rounds.map((x) => ({ skip: x.skip, loan: n(x.loan) * 1e6 })),
    poolBuyback,
    exit: n(s.exit) * 1e6,
  });
  const r = useMemo(() => run(s.rounds, s.loans, s.poolBuyback), [s, founders, investors]); // eslint-disable-line react-hooks/exhaustive-deps
  // les trois chemins, sur les mêmes tours et la même sortie : l'écart se lit d'un coup d'œil
  const tabs = useMemo(() => PRESETS.map((p) => ({
    ...p,
    out: run(presetRounds(p.id, s.rounds), presetLoans(p.id), false).profund.founders,
    on: !s.poolBuyback && n(s.loans) === presetLoans(p.id) && presetRounds(p.id, s.rounds).every((x, i) => x.skip === s.rounds[i].skip && (x.skip || x.loan === n(s.rounds[i].loan))),
  })), [s, founders, investors]); // eslint-disable-line react-hooks/exhaustive-deps

  const vc = r.vc.founders;
  const pf = r.profund.founders;
  const top = Math.max(vc, pf, 1);
  const ratio = vc > 0 ? pf / vc : null;
  const roundErr = s.rounds.some((x) => n(x.post) > 0 && n(x.amount) >= n(x.post));
  const pfCapital = r.profund.equityRaised + r.profund.lent;
  const sameCapital = Math.abs(pfCapital - r.vc.equityRaised) < 1;
  // au-delà de 40 % du dernier tour, un prêteur a peu de chances de suivre : on le dit
  const sizing = (() => {
    let prev = (SERIES_A.pref / INV_PREF) * n(s.raised);
    for (const x of s.rounds) {
      if (!x.skip && n(x.loan) > SIZE_MAX * prev + 1e-9) return false;
      if (!x.bridge && !x.skip) prev = n(x.amount);
    }
    return true;
  })();

  function setRound(i: number, patch: Partial<Round>) {
    set('rounds', s.rounds.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function usePreset(id: Preset) {
    setS((x) => ({ ...x, poolBuyback: false, loans: presetLoans(id), rounds: presetRounds(id, x.rounds) }));
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
              <Num label="Amount" unit="€M" value={x.amount} onChange={(v) => setRound(i, { amount: v })} />
              <Num label="Valuation, post-money" unit="€M" value={x.post} step={10} onChange={(v) => setRound(i, { post: v })} />
              <Num label="Pool top-up" unit="%" value={x.pool} step={0.5} onChange={(v) => setRound(i, { pool: v })} />
              <button type="button" className="pv-round-x" aria-label={`Remove ${x.label}`}
                      onClick={() => set('rounds', s.rounds.filter((_, j) => j !== i))}>×</button>
              <div className="pv-seg" role="group" aria-label={`${x.label} on the ProFund path`}>
                <span>With ProFund</span>
                <button type="button" className={!x.skip ? 'on' : undefined} aria-pressed={!x.skip} onClick={() => setRound(i, { skip: false })}>Raise it</button>
                <button type="button" className={x.skip ? 'on' : undefined} aria-pressed={x.skip} onClick={() => setRound(i, { skip: true })}>Not needed</button>
                {!x.skip && (
                  <label className="pv-seg-loan">
                    <span>of which loans</span>
                    <input type="number" inputMode="decimal" min={0} step={1} value={Number.isFinite(x.loan) ? x.loan : ''}
                           onChange={(e) => setRound(i, { loan: parseFloat(e.target.value) })} />
                    <em>€M</em>
                  </label>
                )}
              </div>
            </div>
          ))}
          {roundErr && <p className="pfm-err">A round cannot be larger than its post-money valuation.</p>}
          <div className="pv-round-act">
            {s.rounds.length < MAX_ROUNDS && (
              <button type="button" className="pv-link" onClick={() => set('rounds', [...s.rounds, { label: nextLabel(s.rounds), amount: 20, post: 200, pool: 2, bridge: false, defLoan: 0, loan: 0, skip: false }])}>
                + Add a round
              </button>
            )}
            <button type="button" className="pv-link muted" onClick={() => setS(DEFAULT)}>Reset to the example</button>
          </div>
        </div>
        <div className="pv-card">
          <h2 className="pv-h3">Beyond the rounds <small>ProFund path</small></h2>
          <div className="pv-form-grid">
            <Num label="Other loans" unit="€M" value={s.loans} onChange={(v) => set('loans', v)}
                 hint={`All loans: ${pct(FM.loan_rate)} a year, about ${FM.loan_life} years on average: ${FM.loan_multiple.toFixed(1)}×, repaid before equity`} />
          </div>
          <label className="pv-check">
            <input type="checkbox" checked={s.poolBuyback} onChange={(e) => set('poolBuyback', e.target.checked)} />
            <span><b>Refill the pool with bought-back shares</b>No new shares for the pool: your stake goes up. The company pays for them at the round’s valuation, on top of the capital it raises.</span>
          </label>
        </div>
      </div>

      <div className="pv-calc-out">
        <div className="pv-card pv-result">
          <p className="pv-kick">What you take home at {money(n(s.exit) * 1e6)}</p>
          <div className="pv-res-tabs" role="group" aria-label="The ProFund path">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={t.on ? 'on' : undefined} aria-pressed={t.on} onClick={() => usePreset(t.id)}>
                <span>{t.label}</span><b>{money(t.out)}</b>
              </button>
            ))}
          </div>
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
                : ratio <= 0.95 ? 'At this exit, the VC path leaves you more: loans come first.'
                  : 'At this exit, the two paths are close.'}
          </p>
          {!sameCapital && (
            <p className="pv-res-warn">Not the same capital: {money(r.vc.equityRaised)} on the VC path, {money(pfCapital)} on the ProFund path. Most of the gap comes from raising less.</p>
          )}
          {r.profund.poolCost > 0 && (
            <p className="pv-res-warn">The pool buybacks cost {money(r.profund.poolCost)}, on top of the capital raised.</p>
          )}
          {!sizing && (
            <p className="pv-res-warn">Some loans are above {pct(SIZE_MAX)} of the last round, the top of the usual range for venture debt. Lenders may not follow.</p>
          )}
          <table className="pv-res-t">
            <thead><tr><th>Your stake</th><th>VC path</th><th>ProFund path</th></tr></thead>
            <tbody>
              <tr><td>Today</td><td>{pct(founders, 1)}</td><td>{pct(founders, 1)}</td></tr>
              {r.vc.stakes.map((st, i) => (
                <tr key={i}><td>After {s.rounds[i]?.label ?? `round ${i + 1}`}</td><td>{pct(st, 1)}</td><td className="pf">{pct(r.profund.stakes[i] ?? founders, 1)}</td></tr>
              ))}
              <tr className="sub"><td>Capital raised after today</td><td>{money(r.vc.equityRaised)}, all equity</td><td>{money(pfCapital)}: {money(r.profund.equityRaised)} equity, {money(r.profund.lent)} loans</td></tr>
              <tr><td>Paid before your share of the exit</td><td>–</td><td>{money(r.profund.debt)} loans with interest{r.profund.poolCost > 0 ? `, ${money(r.profund.poolCost)} pool buybacks` : ''}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="pv-fine">
          Both paths: 1× non-participating preferences, pari passu; each investor converts when it pays more. VC path:
          defaults calibrated on Carta medians (Founder Ownership Report 2026, not specific to Europe), founders at 37.5%
          after the Series A, then a bridge before the B, the C and the D, with the option pool topped up before each round,
          so that founders hold Carta’s median stake after each round (AI teams after the B). ProFund path: same valuations,
          with at most a 1× preference on our equity; the pool tops up in new shares, unless you refill it with bought-back
          shares; loans repaid at exit, before equity, sized by default at {pct(FM.loan_share.min)} to {pct(FM.loan_share.max)} of
          the last round (usual range for venture debt: 20% to 40%, <a href="https://innovation.firstcitizens.com/business-growth/access-to-capital/right-amount-of-venture-debt" target="_blank" rel="noopener noreferrer">First Citizens</a>), and subject to our partner lenders.
          Half the capital: no bridges and no last round. Credit alone: no further round and no pool top-up. Buybacks and the
          annual cancellations that lift your stake are not counted. Illustrative, not a forecast or an offer.
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
