import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <footer className="pf-footer">
      <span className="foot-r">© 2025 ProFund</span>
      <div className="foot-links">
        {!isHome && <Link to="/" style={{ fontSize: '12px', color: 'var(--mid)', textDecoration: 'none' }}>profund.vc</Link>}
        <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a>
        <Link to="/privacy" style={{ fontSize: '12px', color: 'var(--mid)', textDecoration: 'none' }}>Privacy</Link>
        <Link to="/legal" style={{ fontSize: '12px', color: 'var(--mid)', textDecoration: 'none' }}>Legal Notice</Link>
      </div>
    </footer>
  );
}
