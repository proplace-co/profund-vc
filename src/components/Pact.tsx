// LE PACTE DES FONDATEURS (Antoine, 05/11 ; v3.11 : l'equity complémentaire dite en
// clair ; v3.12 : la liquidité partielle supprimée). Texte contractuel public : ne pas le
// reformuler sans demande explicite. Rendu par /terms (page sombre) et dans le panneau
// dépliable de l'accueil (v3.15) ; /pitch y renvoie ; la fiche (factsheet.py, PACT) en
// porte un résumé, /lp ses listes GIVE, KEEP et PROTECTION : les changer ensemble. Le modèle
// (scripts/fund_model.py) suit ces clauses : rachats et recharge du pool (4), dette bancaire du
// tableau des fondateurs (3, v3.17 : le fonds ne prête plus),
// suivi en actions nouvelles quand le fondateur lève ailleurs (8). Le nombre se lit dans
// N_CLAUSES, jamais en dur.
// v3.15 (06/11, Antoine) : une logique : on rend le contrôle de la gestion, on garde la
// protection du capital. v3.19 (07/11, Alexandre, relu côté LPs) : les protections qui
// manquaient, sans rien reprendre de la gestion :
//   1  anti-dilution moyenne pondérée large (plus de « no ratchet » ambigu), garanties usuelles ;
//   2  plus d'engagement ouvert : « we can lead », comité d'investissement, limites du fonds,
//      prêts par tranches contre des jalons ;
//   3  un impayé non réglé sous 30 jours rend le prêt exigible et réveille la clause 12 ;
//   4  les deux clauses de rachat fusionnées ; le rachat annuel sur réserves distribuables,
//      jamais pendant un défaut, jamais auprès d'un fondateur sans nous ;
//   5  plus de droits de vote multiples ; la convention de vote a une durée et ne couvre jamais
//      ce qui protège le capital ;
//   7  la rémunération hors budget, les contrats avec des parties liées et le rachat des titres
//      d'un fondateur demandent l'accord de notre administrateur ;
//   8  droit au prorata ; un lead tiers : nos titres gardent leurs droits, on investit à ses
//      termes, jamais mieux (on devient alors un co-investisseur classique) ;
//   9  NOUVELLE : les titres des fondateurs (incessibilité, préemption, sortie conjointe) ;
//   10 renforcée : jamais de sortie forcée sous notre mise sans notre accord, acheteur
//      indépendant, cash ou titres cotés, garanties plafonnées, tout avantage versé à un
//      fondateur au-delà du marché compté dans le prix ;
//   11 cliff d'un an, crédit d'ancienneté plafonné à un an, le bad leaver rend tout au plus bas
//      du coût et de la valeur, non-concurrence d'un an ;
//   12 les protections dormantes : ce qui les réveille, et ce qui se réveille.
// 07/11 (2) : le co-financement est réservé aux banques partenaires et à la BEI, sans BSA (clause 2) :
// des BSA chez un fonds de dette créeraient des actions nouvelles.
// v3.17 (07/11, 3, Alexandre) : LE FONDS NE PRÊTE PLUS. La clause 3 devient « Debt, raised for you » :
// ProFund fait lever la dette auprès des banques partenaires, le prêt est entre la société et la banque,
// sans frais ni BSA pour nous (si la banque demande des BSA, c'est le choix du fondateur). Les renvois
// aux prêts du fonds quittent les clauses 2, 4, 6, 7, 10 et 12 ; 12 clauses, la numérotation ne bouge pas.
// La durée de la convention de vote, sa validité et la conformité EuVECA restent à faire
// valider par un avocat avant toute signature.
// `vc` : ce que dit un term sheet classique sur le même sujet (notre résumé, pas une citation,
// pas une clause) ; c'est l'ancien tableau « The term sheet, rewritten », fondu dans le pacte.
export const CLAUSES: { t: string; d: string; vc: string }[] = [
  { t: 'Equity, only when you choose.', d: 'The most we ever ask is a 1× non-participating preference and the usual broad-based weighted-average anti-dilution: no participation, no full ratchet, no cumulative dividend. You and the company give the usual warranties on the cap table, the IP and the accounts. We never push for a new round: every follow-on, ours or anyone else’s, is your call.', vc: 'A new round every 18 months, a preference stacked at each one, sometimes participating.' },
  { t: 'Follow-on capital, reserved for you.', d: 'From day one, we reserve what comes next: buying back your early shareholders (clause 4), and new equity whenever you ask for it. We can lead that round ourselves, on these same terms, at a price set at the time, with SPVs and co-investors alongside the fund for the largest rounds. Every cheque goes through our investment committee and stays within the fund’s limits. Asking is always your call.', vc: 'A new fundraise at every stage.' },
  { t: 'Debt, raised for you.', d: 'When debt can carry your growth (hiring, go-to-market, working capital, acquisitions), we raise it for you from our partner banks, in tranches sized to your revenue and your last round. We build the case, negotiate the terms and sit at the table with you. The loan is between the company and the bank: we take no fee on it and no warrants. If a lender asks for warrants, accepting them is your call.', vc: 'Venture debt you find on your own, often with warrants.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Their votes move to your side. Each year, the company can also buy back shares: it cancels them, which lifts your stake, or refills your option pool without creating new shares. Only out of distributable reserves, never while the company is in default on its debt, never from a founder without our consent. Every buyback is priced by an independent valuer.', vc: 'Angels and early funds stay on your cap table, with their votes. Your stake only goes down: 11.4% after the Series D, at the median.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement, for up to ten years, or until a sale or an IPO. It belongs to the founders who run the company: it ends if you leave it or sell control. It never covers what protects our capital: the consents of clauses 6 and 7, and the terms of a sale in clause 10.', vc: 'Every investor votes its own shares.' },
  { t: 'One board seat. No veto on how you run, raise or sell.', d: 'We take one seat, with monthly figures, quarterly accounts and the annual budget. You keep the majority. Our consent is needed only for what would change our shares behind our back: shares ranking ahead of ours, a change to our rights, selling the IP or most of the business outside a sale of the company, a dissolution.', vc: 'A seat for every lead. Consent on the budget, key hires, new rounds, the sale.' },
  { t: 'Neither of us decides on ourselves.', d: 'When a decision is about ProFund, such as a buyback by us, our shares don’t vote. When it is about you personally, our director must agree: your pay beyond the approved budget, a deal with a company you or your family own, a buyback of your shares.', vc: 'Investor consent on the budget, senior pay and every related-party deal.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We can invest our pro-rata share of every new issue, and we have a right of first offer. If another investor leads a priced round, the voting agreement ends: our shares keep the rights they have, and in that round we invest on the new lead’s terms, never better.', vc: 'Investor consent on new rounds.' },
  { t: 'Your shares, alongside ours.', d: 'Until a sale or an IPO, your shares stay with you: a transfer needs our agreement, except to your own holding company. When you sell some, in a round or on your own, we can buy them first or sell alongside you, on the same terms.', vc: 'The same: a lock-up, a right of first refusal and co-sale.' },
  { t: 'Your exit.', d: 'We never block a sale that pays back what we invested. If you sell control, we can sell alongside you on the same terms. You can drag us into a sale to an independent buyer, for cash or listed shares, on the same terms per share as everyone, any 1× preference of ours included, with warranties capped at what each seller receives. Anything the buyer pays a founder beyond market pay (a bonus, an earn-out, a retention package) counts as sale price and is shared by the same rules. A sale that returns less than we invested needs our consent.', vc: 'Investor consent on the sale.' },
  { t: 'Vesting and leavers.', d: 'The IP belongs to the company. Your shares vest over four years, after a one-year cliff, with credit for up to a year already served. A good leaver, including one who resigns, keeps every vested share; unvested shares go back at nominal value. Only fraud, gross misconduct, a material breach of this pact or competing with the company makes a bad leaver: all their shares then go back at the lower of cost and fair value. For a year after leaving, you neither compete nor hire away the team. Shares that come back are cancelled or refill your pool, never ours. If the company is sold and the buyer lets you go, all your shares vest at once.', vc: 'Bad leaver for resigning during vesting.' },
  { t: 'If things go wrong.', d: 'Our protections sleep while you run the company in good faith. They wake up in case of fraud, gross misconduct, a material breach of this pact, a payment default on the company’s debt not cured within 30 days, a deal with a related party made without our approval, or insolvency proceedings. The voting agreement then ends, and we hold the consents of a classic lead: the annual budget, new debt, acquisitions and disposals, new shares.', vc: 'Investor rights apply at all times.' },
];

export const N_CLAUSES = CLAUSES.length;
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen'];
/** L'ouverture du pacte, sur /terms et dans le panneau de l'accueil. */
export const PACT_LEAD = `${WORDS[N_CLAUSES] ?? N_CLAUSES} clauses, the same for every company we back, in public. Running the company is yours. Protecting the capital is ours.`;

/** Les clauses, numérotées (styles .pv-terms-list, fond sombre). */
export function PactList({ heading: H = 'h2' }: { heading?: 'h2' | 'h3' }) {
  return (
    <ol className="pv-terms-list">
      {CLAUSES.map((c, i) => (
        <li key={c.t} style={{ ['--d' as string]: `${0.1 + i * 0.06}s` }}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <H>{c.t}</H>
          <p>{c.d}</p>
          <p className="vc"><span>Classic VC</span>{c.vc}</p>
        </li>
      ))}
      <li className="pv-terms-note">
        “Classic VC”: common terms as we read them, not the text of any fund, and not part of the pact. 11.4%: the median
        founding team after a Series D, Carta data reported by <a href="https://www.saastr.com/the-state-of-seed-today-10-key-learnings-from-cartas-latest-data/" target="_blank" rel="noopener noreferrer">SaaStr</a>.
      </li>
    </ol>
  );
}
