import { Link } from 'react-router-dom';
import SubPage from './SubPage';
import { Icon } from './Thesis';

// /terms — LE PACTE DES FONDATEURS : le texte vit dans Pact.tsx (aussi rendu par l'accueil).
import { N_CLAUSES, PactList } from './Pact';

export default function TermsPage() {
  return (
    <SubPage
      kick="The pact"
      title={<>The founders’ pact. <span>{N_CLAUSES} clauses, the same for everyone.</span></>}
      intro="Signed with every company we back. The same for everyone, in public. Every option stays open: it is always your call."
    >
      <section className="pv-sec pv-sec-tight">
        <div className="pv-wrap">
          <PactList />
          <div className="pv-ctas pv-ctas-c">
            <Link to="/calculator" className="pv-btn"><Icon name="calc" />Run your numbers <Icon name="arrow" /></Link>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
