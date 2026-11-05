import { useEffect, useRef, useState } from 'react';
import { Icon } from './Thesis';

// LE PACTE DES FONDATEURS (Antoine, 05/11 ; v3.11 : l'equity complémentaire dite en
// clair, clauses 1 et 2). Texte contractuel public : ne pas le reformuler sans demande
// explicite. Rendu par l'accueil (section « The pact ») et par /terms. Le modèle
// (scripts/fund_model.py) suit ces clauses : liquidité partielle (9), rachats (3),
// prêts (2), suivi en actions nouvelles quand le fondateur lève ailleurs (7).
export const CLAUSES: { t: string; d: string }[] = [
  { t: 'One equity round.', d: 'We invest once in new shares. After that, we never create a new share while you grow with us, unless you ask for more equity.' },
  { t: 'A reserved loan line, then equity if you need it.', d: 'Reserved from day one with our fund and partner lenders, drawn in tranches when you need it: hiring, go-to-market, working capital, acquisitions. If debt is not enough, or lenders cannot take the full line, we go and get the equity: we lead it ourselves, on these same terms (with the same 1× preference as our first cheque), with SPVs and co-investors alongside the fund. Every option stays open. It is always your call.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Every buyback is priced by an independent valuer.' },
  { t: 'Annual cancellation.', d: 'Each year, the company can buy back and cancel shares. Every cancellation lifts your stake.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement. Where the law allows, you hold multiple voting rights.' },
  { t: 'No board seat, no veto.', d: 'We get information, not control.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We have a right of first offer, and we can follow or lead the round in new shares.' },
  { t: 'Your exit.', d: 'No veto on a sale. Ever.' },
  { t: 'Partial liquidity.', d: 'From year 6, the company can buy back up to a quarter of our stake, at a discount, and cancel it.' },
  { t: 'Fallback.', d: 'In case of fraud or gross misconduct, the voting agreement ends.' },
];

export const CONFLICTS = 'Our votes are excluded from any decision that involves ProFund. Conflicts go to the fund’s LP advisory committee.';

/** Les dix clauses, en grille éditoriale : grand numéro, titre, texte. */
export function PactList() {
  const ref = useRef<HTMLOListElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <ol ref={ref} className={`pv-pact-list${seen ? ' in' : ''}`}>
        {CLAUSES.map((c, i) => (
          <li key={c.t} style={{ ['--d' as string]: `${i * 0.06}s` }}>
            <span className="n">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="pv-callout pv-pact-conf">
        <span className="pv-tick soft"><Icon name="scale" /></span>
        <p>{CONFLICTS}</p>
      </div>
    </>
  );
}

/** La section de l'accueil. */
export function ThePact() {
  return (
    <section className="pv-sec tint" id="pact">
      <div className="pv-wrap">
        <div className="pv-head">
          <h2 className="pv-h2 pv-pact-h">The pact.</h2>
          <p className="sub">Ten clauses. Signed with every company we back. The same for everyone, in public.</p>
        </div>
        <PactList />
      </div>
    </section>
  );
}
