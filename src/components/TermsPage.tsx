import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Thesis';
import { PACT_LEAD, PactList } from './Pact';

// /terms — LE PACTE DES FONDATEURS (v3.14) : une page à part, sombre, sans barre du
// haut, dans l'esprit des règles barrées de l'accueil. Le texte vit dans Pact.tsx ;
// l'accueil le montre aussi, dans un panneau dépliable (v3.15).
export default function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="pv-terms-page">
      <div className="pv-wrap">
        <Link to="/" className="pv-terms-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
        <h1 className="pv-rules-h">The pact.</h1>
        <p className="pv-terms-lead">{PACT_LEAD}</p>
        <PactList />
        <div className="pv-ctas pv-terms-ctas">
          <Link to="/#calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
          <Link to="/" className="pv-btn ghost-light">Back to ProFund</Link>
        </div>
      </div>
    </div>
  );
}
