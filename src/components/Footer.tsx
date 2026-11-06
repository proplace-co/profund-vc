import { Link, useLocation } from 'react-router-dom';

// Le pied de page commun. v3.15 (06/11) : la signature « Venture capital for the AI
// era » remplace « EuVECA fund, Luxembourg » ; Privacy et Legal Notice sont masqués pour
// le moment (les pages /privacy et /legal restent en ligne : le popup du deal flow et le
// bandeau cookies y renvoient). Le pacte et le calculateur s'ouvrent dans l'accueil.
export default function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer className={`pf-footer${isHome ? ' on-grey' : ''}`}>
      <span className="foot-r">ProFund · Venture capital for the AI era</span>
      <div className="foot-links">
        {!isHome && <Link to="/">profund.vc</Link>}
        <Link to="/#pact">The pact</Link>
        <Link to="/#calculator">Run your numbers</Link>
        <Link to="/lp">LPs</Link>
        <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a>
      </div>
    </footer>
  );
}
