import { Link } from 'react-router-dom';
import SubPage from './SubPage';
import { Icon } from './Thesis';

// /terms — LE PACTE DES FONDATEURS (Antoine, 05/11). Texte contractuel public :
// ne pas le reformuler sans demande explicite. Le modèle (scripts/fund_model.py)
// suit ces clauses : liquidité partielle (clause 9), rachats (3), prêts (2),
// suivi en actions nouvelles quand le fondateur lève ailleurs (7).
const CLAUSES: { t: string; d: string }[] = [
  { t: 'One equity round.', d: 'We invest once in new shares. After that, we never create a new share while you grow with us.' },
  { t: 'A reserved loan line.', d: 'Reserved from day one, drawn in tranches when you need it: hiring, go-to-market, working capital, acquisitions. If debt is not enough, or lenders cannot take the full line, you can ask us to lead extra equity on these same terms (with the same 1× preference as our first cheque), with SPVs and co-investors alongside the fund.' },
  { t: 'Buybacks, only with you.', d: 'We buy shares from your angels, leavers and early funds, never without your agreement. Every buyback is priced by an independent valuer.' },
  { t: 'Annual cancellation.', d: 'Each year, the company can buy back and cancel shares. Every cancellation lifts your stake.' },
  { t: 'Your votes.', d: 'Our shares vote with you under a voting agreement. Where the law allows, you hold multiple voting rights.' },
  { t: 'No board seat, no veto.', d: 'We get information, not control.' },
  { t: 'Raise elsewhere, freely.', d: 'You can raise from anyone, at any time. We have a right of first offer, and we can follow or lead the round in new shares.' },
  { t: 'Your exit.', d: 'No veto on a sale. Ever.' },
  { t: 'Partial liquidity.', d: 'From year 6, the company can buy back up to a quarter of our stake, at a discount, and cancel it.' },
  { t: 'Fallback.', d: 'In case of fraud or gross misconduct, the voting agreement ends.' },
];

export default function TermsPage() {
  return (
    <SubPage
      kick="The pact"
      title={<>The founders’ pact. <span>10 clauses, the same for everyone.</span></>}
      intro="Signed with every company we back. Read it before you talk to us."
    >
      <section className="pv-sec pv-sec-tight">
        <div className="pv-wrap">
          <ol className="pv-clauses">
            {CLAUSES.map((c, i) => (
              <li key={c.t} className="pv-clause">
                <span className="pv-clause-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h2>{c.t}</h2>
                  <p>{c.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="pv-callout">
            <span className="pv-tick soft"><Icon name="scale" /></span>
            <p>Our votes are excluded from any decision that involves ProFund. Conflicts go to the fund’s LP advisory committee.</p>
          </div>
          <div className="pv-ctas pv-ctas-c">
            <Link to="/calculator" className="pv-btn"><Icon name="calc" />Run your numbers <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
