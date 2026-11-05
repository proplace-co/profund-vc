import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork, SiteHeader } from './Thesis';
import { EveryStage, HowWeBack, ReserveSection, TheMath, ThePact, TheTeam } from './Founders';
import { eur, fund } from '../lib/fund';
import { savedAccess } from '../lib/access';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// L'ACCUEIL v3 (Antoine, 05/11) parle aux fondateurs : un tour en actions, puis des
// prêts et des rachats. Montants permis ici, tous lus dans src/data/fund.json : la
// taille du fonds, les tickets des étages et le tableau des fondateurs (illustratif).
// JAMAIS de frais, de carry ni de rendement cible : ils restent derrière /lp
// (fiche PDF, modèle Excel, /pitch). Le shell index.html reste sans montant
// (scripts/prerender.mjs le vérifie).
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

const LINKS = [
  { href: '#how', label: 'How we back' },
  { href: '#math', label: 'The math' },
  { href: '#pact', label: 'The pact' },
  { href: '#edge', label: 'Our edge' },
  { href: '#team', label: 'Team' },
];

export default function HomepageLite() {
  const [open, setOpen] = useState(() => hashWantsDealflow());
  const { hash } = useLocation();

  // Arrivée depuis une autre page sur « /#reserve », « /#how »… : le routeur ne
  // défile pas vers l'ancre, on le fait une fois la page rendue.
  useEffect(() => {
    if (!hash || DEALFLOW_HASHES.has(hash.toLowerCase())) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }, [hash]);

  useEffect(() => {
    const onHash = () => setOpen(hashWantsDealflow());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function openModal() {
    setOpen(true);
    if (!hashWantsDealflow()) {
      window.history.replaceState(null, '', '#dealflow');
    }
  }

  // « Follow our deal flow live » : le deal flow directement si ce navigateur en a
  // déjà l'accès (lib/access.ts), sinon la boîte de candidature / lien.
  function follow() {
    if (savedAccess()) window.location.href = '/dealflow/';
    else openModal();
  }

  function closeModal() {
    setOpen(false);
    if (hashWantsDealflow()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return (
    <div className="pfh">
      <SiteHeader links={LINKS}>
        <Link to="/calculator" className="pv-btn line pv-hide-sm">Run your numbers</Link>
        <a href="#reserve" className="pv-btn">Reserve your round</a>
      </SiteHeader>

      <header className="pv-hero">
        <div className="pv-wrap pv-hero-grid">
          <div className="pv-hero-copy">
            <span className="pv-eyebrow caps"><b />Venture capital · Pre-seed to growth · Europe</span>
            <h1 className="pv-h1 pv-h1-one">Where pure vision directs recursive AI.</h1>
            <p className="pv-lead pv-lead-k">Pre-seed to Growth. {FUND_SIZE}.</p>
            <p className="pv-lead">
              We don’t fund headcount. We back tight-knit, AI-native teams building <span className="nw">self-improving</span> systems
              across the world’s largest markets.
            </p>
            <p className="pv-strong">
              One round. Then never diluted again. As long as you grow with us, your stake never goes
              down. You keep control. By contract.
            </p>
            <div className="pv-ctas">
              <a href="#reserve" className="pv-btn">Reserve your round <Icon name="arrow" /></a>
              <Link to="/calculator" className="pv-btn line"><Icon name="calc" />Run your numbers</Link>
            </div>
            <div className="pv-hero-foot">
              <button type="button" className="pv-link" onClick={follow}>
                <span className="pv-dot" />Follow our deal flow live <Icon name="arrow" />
              </button>
              <span className="pv-badge"><Icon name="shield" />EuVECA fund, Luxembourg</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <Manifesto />
      <FourLaws />
      <HowWeBack />
      <TheMath />
      <EveryStage />
      <ThePact />
      <OurEdge onFollow={follow} />
      <ProofOfWork />
      <TheTeam />
      <ReserveSection onFollow={follow} />
      <div className="pv-wrap">
        <p className="pv-note pv-note-end">
          EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
        </p>
      </div>

      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
