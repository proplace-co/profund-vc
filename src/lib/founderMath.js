// Le calcul « Same company. Same exit. » : ce que touchent les fondateurs à la sortie
// sur le chemin VC (tours B à D en actions, préférences 1× non participantes pari
// passu) et sur le chemin ProFund (aucune action nouvelle, des prêts remboursés à
// la sortie avant les fonds propres).
//
// MÊME CALCUL que founder_math() dans scripts/fund_model.py, qui produit le tableau
// publié (accueil, /pitch, fiche). En JS pur, pas en TS, pour que
// scripts/prerender.mjs puisse l'importer : le build échoue si ce moteur, nourri
// des hypothèses de fund.json, ne retombe pas sur le tableau publié.

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

/**
 * Les deux chemins pour un fondateur.
 * @param {{
 *   founders: number,            // part des fondateurs aujourd'hui (0..1)
 *   holders: {id: string, stake: number, pref: number}[],  // les autres porteurs aujourd'hui
 *   rounds: {amount: number, post: number, pool?: number}[], // tours prévus, chemin VC (pool : recharge avant le tour)
 *   loans: number, loanMultiple: number,                   // chemin ProFund
 *   extra?: {amount: number, post: number}[],              // ProFund : equity si la dette ne suffit pas
 *   exit: number,
 * }} input
 */
export function founderPaths({ founders, holders, rounds, loans, loanMultiple, extra = [], exit }) {
  const base = [{ id: 'founders', stake: founders, pref: 0 }, ...holders.map((h) => ({ ...h }))];
  // Chemin ProFund : l'equity complémentaire, au choix du fondateur, aux conditions du
  // pacte (préférence 1× non participante, comme notre premier chèque).
  const pf = base.map((h) => ({ ...h }));
  extra.forEach((r, i) => {
    const k = r.post > 0 ? Math.min(1, r.amount / r.post) : 0;
    if (!(k > 0)) return;
    for (const h of pf) h.stake *= 1 - k;
    pf.push({ id: `extra${i}`, stake: k, pref: r.amount });
  });
  const vc = base.map((h) => ({ ...h }));
  if (!vc.some((h) => h.id === 'pool')) vc.push({ id: 'pool', stake: 0, pref: 0 });
  const stakes = [];
  rounds.forEach((r, i) => {
    // la recharge du pool d'options, avant l'argent frais (actions ordinaires nouvelles)
    const p = r.pool > 0 ? Math.min(0.5, r.pool) : 0;
    if (p) {
      for (const h of vc) h.stake *= 1 - p;
      vc.find((h) => h.id === 'pool').stake += p;
    }
    const k = r.post > 0 ? Math.min(1, r.amount / r.post) : 0;
    for (const h of vc) h.stake *= 1 - k;
    vc.push({ id: `round${i}`, stake: k, pref: r.amount });
    stakes.push(vc[0].stake);
  });
  const debt = loans * loanMultiple;
  const pv = payout(exit, vc);
  const pp = payout(Math.max(0, exit - debt), pf);
  return {
    vc: { founders: pv.founders, stakeAtExit: vc[0].stake, stakes, equityRaised: rounds.reduce((s, r) => s + r.amount, 0) },
    profund: { founders: pp.founders, stakeAtExit: pf[0].stake, debt,
               equityRaised: extra.reduce((s, r) => s + (r.amount > 0 ? r.amount : 0), 0) },
    payouts: { vc: pv, profund: pp },
  };
}

/** Arrondi au million, comme le tableau publié. */
export function millions(v) {
  return Math.round(v / 1e6) * 1e6;
}
