// LE PACTE DES FONDATEURS (Antoine, 05/11 ; v3.11 : l'equity complémentaire dite en
// clair ; v3.12 : la liquidité partielle supprimée). Texte contractuel public : ne pas le
// reformuler sans demande explicite. Rendu par /terms (page sombre) et dans le panneau
// dépliable de l'accueil (v3.15) ; /pitch y renvoie ; la fiche (factsheet.py, PACT) en
// porte un résumé. Le modèle (scripts/fund_model.py) suit ces clauses : prêts (2, 3),
// rachats (4), recharge du pool par des titres rachetés (5), suivi en actions nouvelles
// quand le fondateur lève ailleurs (9). Le nombre se lit dans N_CLAUSES, jamais en dur.
// v3.15 (06/11, Antoine) : 12 clauses. Une logique : on rend le contrôle de la gestion,
// on garde la protection du capital, et ce qui protège ne joue que si le fondateur quitte
// notre chemin ou se conduit mal. Un siège au conseil (seul « a veto » est barré à
// l'accueil) ; consentement limité à l'anti-spoliation ; prêts aux conditions d'un prêteur ;
// conflits dans les deux sens ; la convention de vote tombe si un tiers mène un tour (droits
// du nouveau lead, jamais plus), si le fondateur part ou cède le contrôle, et dans les cas
// de repli ; sortie conjointe, sortie forcée aux mêmes conditions ; vesting et leavers
// (standard BVCA, dans l'esprit « be generous to leavers » d'Index : seul un départ fautif
// fait un bad leaver, les titres acquis restent au fondateur). La phrase sur la politique
// de conflits du FONDS (comité consultatif des LPs) reste côté LPs (/lp, fiche p. 2).
export const CLAUSES: { t: string; d: string }[] = [
  { t: 'One equity round.', d: 'We invest once, in preferred shares with a 1× non-participating preference. Nothing more: no participation, no ratchet, no cumulative dividend. After that, we never create a new share while you grow with us, unless you ask for more equity.' },
  { t: 'A reserved loan line, then equity if you need it.', d: 'Reserved from day one with our fund and partner lenders, drawn in tranches when you need it: hiring, go-to-market, working capital, acquisitions. If debt is not enough, or lenders cannot take the full line, we go and get the equity: we lead it ourselves, on these same terms (with the same 1× preference as our first cheque), with SPVs and co-investors alongside the fund. Every option stays open. It is always your call.' },
  { t: 'Loans, on lender terms.', d: 'Our loans carry what any venture lender asks: monthly figures, no new senior debt without our consent, repayment if control of the company changes. If a payment is missed, the voting agreement is suspended until it is made.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Their votes move to your side. Every buyback is priced by an independent valuer.' },
  { t: 'Annual buyback.', d: 'Each year, the company can buy back shares. It cancels them, which lifts your stake, or uses them to refill your option pool, without creating new shares.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement. Where the law allows, you hold multiple voting rights. Both belong to the founders who run the company: they end if you leave it or sell control.' },
  { t: 'One board seat. No veto on how you run, raise or sell.', d: 'We take one seat, with monthly figures, quarterly accounts and the annual budget. You keep the majority. Our consent is needed only for what would change our shares behind our back: shares ranking ahead of ours, a change to our rights, dividends while one of our loans is outstanding, selling the IP outside a sale of the company, a dissolution.' },
  { t: 'Conflicts, both ways.', d: 'When a decision involves ProFund (a loan, a buyback), our shares abstain. When it involves a founder personally (pay, a deal with a company you own), the voting agreement does not apply.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We have a right of first offer, and we can follow or lead the round in new shares. If another investor leads a priced round, the voting agreement ends and we hold the same rights as the new lead, never more.' },
  { t: 'Your exit.', d: 'No veto on a sale. Ever. If you sell control, we can sell alongside you on the same terms, and our loans are repaid at closing. You can drag us into a sale on the same terms as every other shareholder, our 1× preference included.' },
  { t: 'Vesting and leavers.', d: 'The IP belongs to the company. Your shares vest over four years, with credit for the time you have already served. A good leaver keeps every vested share. Only fraud, gross misconduct or competing with the company makes a bad leaver: unvested shares then go back at nominal value. Shares that come back are cancelled or refill your pool, never ours. If you are let go after a sale, everything vests.' },
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
