// LE PACTE DES FONDATEURS (Antoine, 05/11 ; v3.11 : l'equity complémentaire dite en
// clair, clauses 1 et 2 ; v3.12 : la liquidité partielle supprimée, 9 clauses ; les
// rachats de ProFund font passer les votes du côté du fondateur ; conflits en clair). Texte contractuel public : ne pas le reformuler sans demande
// explicite. Rendu par /terms (page sombre, v3.14) ; l'accueil et /pitch y renvoient. Le modèle
// (scripts/fund_model.py) suit ces clauses : rachats (3),
// prêts (2), suivi en actions nouvelles quand le fondateur lève ailleurs (7).
// Le nombre de clauses se lit partout dans N_CLAUSES : ne pas l'écrire en dur.
export const CLAUSES: { t: string; d: string }[] = [
  { t: 'One equity round.', d: 'We invest once in new shares. After that, we never create a new share while you grow with us, unless you ask for more equity.' },
  { t: 'A reserved loan line, then equity if you need it.', d: 'Reserved from day one with our fund and partner lenders, drawn in tranches when you need it: hiring, go-to-market, working capital, acquisitions. If debt is not enough, or lenders cannot take the full line, we go and get the equity: we lead it ourselves, on these same terms (with the same 1× preference as our first cheque), with SPVs and co-investors alongside the fund. Every option stays open. It is always your call.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Their votes move to your side. Every buyback is priced by an independent valuer.' },
  { t: 'Annual buyback.', d: 'Each year, the company can buy back shares. It cancels them, which lifts your stake, or uses them to refill your option pool, without creating new shares.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement. Where the law allows, you hold multiple voting rights.' },
  { t: 'No board seat, no veto.', d: 'We get information, not control.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We have a right of first offer, and we can follow or lead the round in new shares.' },
  { t: 'Your exit.', d: 'No veto on a sale. Ever.' },
  { t: 'Fallback.', d: 'In case of fraud or gross misconduct, the voting agreement ends.' },
];

export const CONFLICTS = 'When a decision involves ProFund itself (a loan, a buyback, the price of our shares), our shares don’t vote. Conflicts of interest on the fund side go to the LP advisory committee.';
export const N_CLAUSES = CLAUSES.length;
