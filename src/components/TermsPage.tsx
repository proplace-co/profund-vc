import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Thesis';
import { CLAUSES, CONFLICTS, N_CLAUSES } from './Pact';

// /terms — LE PACTE DES FONDATEURS (v3.14) : une page à part, sombre, sans barre du
// haut, dans l'esprit des règles barrées de l'accueil. Le texte vit dans Pact.tsx.
const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

export default function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="pv-terms-page">
      <div className="pv-wrap">
        <Link to="/" className="pv-terms-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
        <h1 className="pv-rules-h">The pact.</h1>
        <p className="pv-terms-lead">
          {WORDS[N_CLAUSES]} clauses. Signed with every company we back. The same for everyone, in public.
          Every option stays open: it is always your call.
        </p>
        <ol className="pv-terms-list">
          {CLAUSES.map((c, i) => (
            <li key={c.t}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <h2>{c.t}</h2>
              <p>{c.d}</p>
            </li>
          ))}
        </ol>
        <p className="pv-terms-conf"><Icon name="scale" />{CONFLICTS}</p>
        <div className="pv-ctas">
          <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
          <Link to="/" className="pv-btn ghost-light">Back to ProFund</Link>
        </div>
      </div>
    </div>
  );
}
