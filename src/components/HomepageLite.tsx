import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork, SiteHeader } from './Thesis';
import { EveryStage, FinalCall, HowWeBack, TheMath, TheRules, TheTeam } from './Founders';
import { eur, fund } from '../lib/fund';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// L'ACCUEIL v3.8 (Antoine, 05/11) ne parle QU'AUX fondateurs, comme Sequoia ou Index :
// le contrôle revient au fondateur. Rien pour les LPs ici (un lien « LPs » discret en
// pied de page vers /lp) ; le popup du deal flow reste monté pour profund.vc/#dealflow
// (le QR de la fiche), sans bouton visible. Un tour en actions, puis des prêts et des rachats. Montants permis ici, tous lus dans src/data/fund.json : la
// taille du fonds, les tickets des étages et le tableau des fondateurs (illustratif).
// JAMAIS de frais, de carry ni de rendement cible : ils restent derrière /lp
// (fiche PDF, modèle Excel, /pitch). Le shell index.html reste sans montant
// (scripts/prerender.mjs le vérifie).
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

const LINKS = [
  { href: '#rules', label: 'The rules' },
  { href: '#math', label: 'The math' },
  { href: '#how', label: 'How we back' },
  { href: '#edge', label: 'Our edge' },
  { href: '#team', label: 'Founding Partner' },
];

export default function HomepageLite() {
  const [open, setOpen] = useState(() => hashWantsDealflow());
  const { hash } = useLocation();

  // Arrivée depuis une autre page sur « /#how », « /#math »… : le routeur ne
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

  function closeModal() {
    setOpen(false);
    if (hashWantsDealflow()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return (
    <div className="pfh">
      <SiteHeader links={LINKS}>
        <Link to="/calculator" className="pv-btn">Run your numbers</Link>
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
              <Link to="/calculator" className="pv-btn">Run your numbers <Icon name="arrow" /></Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <TheRules />
      <TheMath />
      <HowWeBack />
      <Manifesto tint />
      <FourLaws tint={false} />
      <EveryStage tint />
      <OurEdge />
      <ProofOfWork />
      <TheTeam />
      <FinalCall />
      <div className="pv-wrap">
        <p className="pv-note pv-note-end">
          EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
        </p>
      </div>

      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
