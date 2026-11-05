import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CapitalStack, EveryStage, FinalCall, FounderEngines, TheMath, TheRules, TheTeam } from './Founders';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// L'ACCUEIL v3.9 (Antoine, 05/11) : pour les fondateurs d'exception, et pour eux seuls.
// Il s'ouvre sur les règles (le contrôle revient au fondateur), puis le capital
// (financé comme les leaders, dilué comme personne), les chiffres, le partner, et un
// seul bouton. La thèse, la vision et le deal flow sont pour les LPs : /lp.
// Montants permis ici, tous lus dans src/data/fund.json : tickets et tableau des
// fondateurs (illustratif). JAMAIS de frais, de carry ni de rendement cible. Le shell
// index.html reste sans montant (scripts/prerender.mjs le vérifie).
// Le popup du deal flow reste monté pour profund.vc/#dealflow (le QR de la fiche).
// Pas de barre du haut (Antoine, 05/11) : le logo blanc ouvre le héros, un seul bouton.

export default function HomepageLite() {
  const [open, setOpen] = useState(() => hashWantsDealflow());
  const { hash } = useLocation();

  // Arrivée depuis une autre page sur « /#math »… : le routeur ne défile pas vers
  // l'ancre, on le fait une fois la page rendue.
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
      <TheRules hero />
      <CapitalStack />
      <EveryStage tint kicker={false} />
      <TheMath tint={false} />
      <FounderEngines />
      <TheTeam tint={false} />
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
