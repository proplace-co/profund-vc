// LE PACTE DES FONDATEURS (Antoine, 05/11 ; v3.11 : l'equity complémentaire dite en
// clair ; v3.12 : la liquidité partielle supprimée). Texte contractuel public : ne pas le
// reformuler sans demande explicite. Rendu par /terms (page sombre) et dans le panneau
// dépliable de l'accueil (v3.15) ; /pitch y renvoie ; la fiche (factsheet.py, PACT) en
// porte un résumé. Le modèle (scripts/fund_model.py) suit ces clauses : prêts (2, 3),
// rachats (4), recharge du pool par des titres rachetés (5), suivi en actions nouvelles
// quand le fondateur lève ailleurs (9). Le nombre se lit dans N_CLAUSES, jamais en dur.
// 06/11 (2) : clauses 1 et 2 réécrites, « Equity, only when you choose » et « Follow-on
// capital, reserved for you » : plus de « We invest once », qui laissait croire qu'on ne
// suivrait pas ; le fond ne change pas (pas de tour poussé par nous, l'equity complémentaire
// à la demande du fondateur, aux mêmes termes, SPV pour les plus gros tours).
// 06/11 (3) : plus de « We invest in preferred shares » : les petits tours de seed n'en ont pas
// forcément ; la clause dit le plafond, « The most we ever ask is a 1× … » (clauses 1, 2, 10).
// v3.15 (06/11, Antoine) : 12 clauses. Une logique : on rend le contrôle de la gestion,
// on garde la protection du capital, et ce qui protège ne joue que si le fondateur quitte
// notre chemin ou se conduit mal. Un siège au conseil (barré en entier à
// l'accueil depuis le 06/11) ; consentement limité à l'anti-spoliation ; prêts aux conditions d'un prêteur ;
// conflits dans les deux sens ; la convention de vote tombe si un tiers mène un tour (droits
// du nouveau lead, jamais plus), si le fondateur part ou cède le contrôle, et dans les cas
// de repli ; sortie conjointe, sortie forcée aux mêmes conditions ; vesting et leavers
// (standard BVCA, dans l'esprit « be generous to leavers » d'Index : seul un départ fautif
// fait un bad leaver, les titres acquis restent au fondateur). La phrase sur la politique
// de conflits du FONDS (comité consultatif des LPs) reste côté LPs (/lp, fiche p. 2).
export const CLAUSES: { t: string; d: string }[] = [
  { t: 'Equity, only when you choose.', d: 'The most we ever ask is a 1× non-participating preference: no participation, no ratchet, no cumulative dividend. We never push for a new round: every follow-on, ours or anyone else’s, is your call.' },
  { t: 'Follow-on capital, reserved for you.', d: 'From day one, we reserve what comes next. A loan line with our fund and partner lenders, drawn in tranches when you need it: hiring, go-to-market, working capital, acquisitions. And equity whenever you ask: we lead it ourselves, on these same terms (a 1× preference at most), with SPVs and co-investors alongside the fund for the largest rounds. Every option stays open. It is always your call.' },
  { t: 'Loans, on lender terms.', d: 'Our loans carry what any venture lender asks: monthly figures, no new senior debt without our consent, repayment if control of the company changes. If a payment is missed, the voting agreement is suspended until it is made.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Their votes move to your side. Every buyback is priced by an independent valuer.' },
  { t: 'Annual buyback.', d: 'Each year, the company can buy back shares. It cancels them, which lifts your stake, or uses them to refill your option pool, without creating new shares.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement. Where the law allows, you hold multiple voting rights. Both belong to the founders who run the company: they end if you leave it or sell control.' },
  { t: 'One board seat. No veto on how you run, raise or sell.', d: 'We take one seat, with monthly figures, quarterly accounts and the annual budget. You keep the majority. Our consent is needed only for what would change our shares behind our back: shares ranking ahead of ours, a change to our rights, dividends while one of our loans is outstanding, selling the IP outside a sale of the company, a dissolution.' },
  { t: 'Neither of us votes on ourselves.', d: 'When a decision is about ProFund (our loan, a buyback by us), our shares don’t vote. When it is about you personally (your pay, a deal with a company you own), our shares vote freely, not with you.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We have a right of first offer, and we can follow or lead the round in new shares. If another investor leads a priced round, the voting agreement ends and we hold the same rights as the new lead, never more.' },
  { t: 'Your exit.', d: 'No veto on a sale. Ever. If you sell control, we can sell alongside you on the same terms, and our loans are repaid at closing. You can drag us into a sale on the same terms as every other shareholder, any 1× preference of ours included.' },
  { t: 'Vesting and leavers.', d: 'The IP belongs to the company. Your shares vest over four years, with credit for the time you have already served. A good leaver keeps every vested share. Only fraud, gross misconduct or competing with the company makes a bad leaver: unvested shares then go back at nominal value. Shares that come back are cancelled or refill your pool, never ours. If the company is sold and the buyer lets you go, all your shares vest at once.' },
  { t: 'Fallback.', d: 'The voting agreement ends in case of fraud, gross misconduct, a material breach of this pact or insolvency proceedings.' },
];

export const N_CLAUSES = CLAUSES.length;
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen'];
/** L'ouverture du pacte, sur /terms et dans le panneau de l'accueil. */
export const PACT_LEAD = `${WORDS[N_CLAUSES] ?? N_CLAUSES} clauses. Signed with every company we back. The same for everyone, in public. Every option stays open: it is always your call.`;

/** Les clauses, numérotées (styles .pv-terms-list, fond sombre). */
export function PactList({ heading: H = 'h2' }: { heading?: 'h2' | 'h3' }) {
  return (
    <ol className="pv-terms-list">
      {CLAUSES.map((c, i) => (
        <li key={c.t} style={{ ['--d' as string]: `${0.1 + i * 0.06}s` }}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <H>{c.t}</H>
          <p>{c.d}</p>
        </li>
      ))}
    </ol>
  );
}
