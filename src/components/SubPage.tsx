import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './Thesis';

// La coquille des pages fondateurs (/terms, /calculator) ; /lp a son propre héros :
// même barre du haut, un héros court, puis le contenu.
const LINKS = [
  { href: '/#rules', label: 'The rules' },
  { href: '/terms', label: 'The pact' },
];

export function SubHeader({ action, links = LINKS }: { action?: ReactNode; links?: { href: string; label: string }[] }) {
  return (
    <SiteHeader links={links}>
      {action ?? <Link to="/terms" className="pv-btn">Read the pact</Link>}
    </SiteHeader>
  );
}

export default function SubPage({ kick, title, intro, action, children }: {
  kick: string;
  action?: ReactNode;          // le bouton de la barre du haut (LPs : Request LP access)
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  // une route s'ouvre en haut de page (le routeur garde sinon le défilement précédent)
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="pfh">
      <SubHeader action={action} />
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
