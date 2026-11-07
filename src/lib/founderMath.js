// Le calcul des chemins du fondateur : ce qu'il touche à la sortie sur le chemin VC (tours en
// actions, préférences 1× non participantes pari passu) et avec ProFund (des prêts remboursés à
// la sortie avant les fonds propres, l'equity seulement là où elle sert).
//
// MÊME CALCUL que founder_math() dans scripts/fund_model.py, qui produit le tableau publié
// (/lp, /pitch, fiche). En JS pur, pas en TS, pour que scripts/prerender.mjs puisse l'importer :
// le build échoue si ce moteur, nourri des hypothèses de fund.json, ne retombe pas sur le tableau.

/**
 * Répartition d'un prix de sortie. Chaque porteur de préférence convertit si c'est
 * plus avantageux ; l'équilibre est trouvé par basculements successifs.
 * @param {number} value
 * @param {{id: string, stake: number, pref: number}[]} holders
 * @returns {Record<string, number>}
 */
export function payout(value, holders) {
  return equilibrium(value, holders).out;
}

function equilibrium(value, holders) {
  const alloc = (conv) => {
    const out = {};
    const prefs = holders.filter((h) => h.pref > 0 && !conv.has(h.id));
    const total = prefs.reduce((s, h) => s + h.pref, 0);
    const paid = Math.min(value, total);
    for (const h of prefs) out[h.id] = (paid * h.pref) / total;
    const rest = value - paid;
    const common = holders.filter((h) => !(h.pref > 0) || conv.has(h.id));
    const shares = common.reduce((s, h) => s + h.stake, 0);
    for (const h of common) out[h.id] = shares > 0 ? (rest * h.stake) / shares : 0;
    return out;
  };
  let conv = new Set();
  for (let i = 0; i < 4 * holders.length + 4; i++) {
    const now = alloc(conv);
    let flipped = false;
    for (const h of holders) {
      if (!(h.pref > 0)) continue;
      const alt = new Set(conv);
      if (alt.has(h.id)) alt.delete(h.id); else alt.add(h.id);
      if (alloc(alt)[h.id] > now[h.id] + 1e-6) { conv = alt; flipped = true; break; }
    }
    if (!flipped) return { out: now, conv };
  }
  return { out: alloc(conv), conv };
}

// Les trois chemins avec ProFund (07/11). Un plan dit, tour par tour, ce que devient le tour du
// chemin VC : { skip: true } s'il n'a pas lieu, { loan } pour la part que le crédit porte.

/** Le même capital : chaque tour a lieu, les prêts du modèle en portent une part. */
export function sameCapitalPlan(rounds) {
  return rounds.map((r) => ({ loan: r.loan ?? 0 }));
}

/** La moitié du capital : ni levées intermédiaires ni dernier tour chiffré ; les prêts en plus. */
export function halfCapitalPlan(rounds) {
  const last = rounds.reduce((k, r, i) => (r.bridge ? k : i), -1);
  return rounds.map((r, i) => (r.bridge || i === last ? { skip: true } : { loan: 0 }));
}

/** Le crédit seul : aucun tour ; les prêts à part. */
export function creditPlan(rounds) {
  return rounds.map(() => ({ skip: true }));
}

/**
 * Les deux chemins pour un fondateur. Sans `plan` : le crédit seul.
 * La part en prêts réduit le tour au même pre-money : equity / (post − prêt).
 * Le pool se recharge en actions nouvelles à chaque tour qui a lieu, comme sur le chemin VC ;
 * avec `poolBuyback` (pacte, clause 5), la société rachète ces titres au prix du tour : le coût
 * est compté, avant la répartition de la sortie.
 * @param {{
 *   founders: number,            // part des fondateurs aujourd'hui (0..1)
 *   holders: {id: string, stake: number, pref: number}[],  // les autres porteurs aujourd'hui
 *   rounds: {amount: number, post: number, pool?: number}[], // tours prévus, chemin VC
 *   loans: number, loanMultiple: number,                   // prêts hors des tours, leur prix
 *   plan?: {loan?: number, skip?: boolean}[],
 *   poolBuyback?: boolean,
 *   exit: number,
 * }} input
 */
export function founderPaths({ founders, holders, rounds, loans, loanMultiple, plan, poolBuyback = false, exit }) {
  const base = [{ id: 'founders', stake: founders, pref: 0 }, ...holders.map((h) => ({ ...h }))];
  if (!base.some((h) => h.id === 'pool')) base.push({ id: 'pool', stake: 0, pref: 0 });
  const refill = (hs, p) => {
    for (const h of hs) h.stake *= 1 - p;
    hs.find((h) => h.id === 'pool').stake += p;
  };
  const issue = (hs, id, k, pref) => {
    for (const h of hs) h.stake *= 1 - k;
    hs.push({ id, stake: k, pref });
  };

  // Avec ProFund
  const pf = base.map((h) => ({ ...h }));
  const pfStakes = [];
  let lent = loans;
  let pfEquity = 0;
  let poolCost = 0;
  rounds.forEach((r, i) => {
    const step = plan?.[i] ?? { skip: true };
    if (!step.skip) {
      const p = r.pool > 0 ? Math.min(0.5, r.pool) : 0;
      if (p && poolBuyback) poolCost += p * r.post;
      else if (p) refill(pf, p);
      const loan = Math.min(step.loan ?? 0, r.amount);
      const equity = r.amount - loan;
      lent += loan;
      if (equity > 0 && r.post - loan > 0) {
        issue(pf, `pfround${i}`, Math.min(1, equity / (r.post - loan)), equity);
        pfEquity += equity;
      }
    }
    pfStakes.push(pf[0].stake);
  });

  // Chemin VC
  const vc = base.map((h) => ({ ...h }));
  const stakes = [];
  rounds.forEach((r, i) => {
    const p = r.pool > 0 ? Math.min(0.5, r.pool) : 0;
    if (p) refill(vc, p);
    issue(vc, `round${i}`, r.post > 0 ? Math.min(1, r.amount / r.post) : 0, r.amount);
    stakes.push(vc[0].stake);
  });

  const debt = lent * loanMultiple;
  const pv = payout(exit, vc);
  const pp = payout(Math.max(0, exit - debt - poolCost), pf);
  return {
    vc: { founders: pv.founders, stakeAtExit: vc[0].stake, stakes, equityRaised: rounds.reduce((s, r) => s + r.amount, 0) },
    profund: { founders: pp.founders, stakeAtExit: pf[0].stake, stakes: pfStakes, debt, lent, poolCost, equityRaised: pfEquity },
    payouts: { vc: pv, profund: pp },
  };
}

/** Arrondi au million, comme le tableau publié. */
export function millions(v) {
  return Math.round(v / 1e6) * 1e6;
}
