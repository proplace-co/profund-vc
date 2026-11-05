import { Link, useLocation } from 'react-router-dom';

// Le pied de page commun. v3 (05/11) : « ProFund · EuVECA fund, Luxembourg ·
// alexandre@profund.vc », et les pages fondateurs et LP.
export default function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer className={`pf-footer${isHome ? ' on-grey' : ''}`}>
      <span className="foot-r">ProFund · EuVECA fund, Luxembourg</span>
      <div className="foot-links">
        {!isHome && <Link to="/">profund.vc</Link>}
        <Link to="/terms">The pact</Link>
        <Link to="/calculator">Run your numbers</Link>
        <Link to="/sell">Sell your shares</Link>
        <Link to="/lp">LP access</Link>
        <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a>
        <Link to="/privacy">Privacy</Link>
        <Link to="/legal">Legal Notice</Link>
      </div>
    </footer>
  );
}
