import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './Thesis';

// La coquille des pages fondateurs et LP (/terms, /calculator, /sell, /lp) :
// même barre du haut, un héros court, puis le contenu.
const LINKS = [
  { href: '/#how', label: 'How we back' },
  { href: '/terms', label: 'The pact' },
  { href: '/calculator', label: 'Run your numbers' },
  { href: '/sell', label: 'Sell your shares' },
  { href: '/lp', label: 'LP access' },
];

export function SubHeader() {
  return (
    <SiteHeader links={LINKS}>
      <Link to="/#reserve" className="pv-btn">Reserve your round</Link>
    </SiteHeader>
  );
}

export default function SubPage({ kick, title, intro, children }: {
  kick: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  // une route s'ouvre en haut de page (le routeur garde sinon le défilement précédent)
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="pfh">
      <SubHeader />
      <header className="pv-hero pv-page-hero">
        <div className="pv-wrap">
          <p className="pv-kick">{kick}</p>
          <h1 className="pv-h1p">{title}</h1>
          {intro && <p className="pv-lead">{intro}</p>}
        </div>
      </header>
      {children}
    </div>
  );
}
