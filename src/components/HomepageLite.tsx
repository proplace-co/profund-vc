import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CapitalStack, FinalCall, FounderEngines, TheFew, TheMath, TheRules } from './Founders';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// Les deux panneaux dépliables (v3.15) : leur ancre ouvre le panneau (/#pact, /#calculator).
type Panel = 'pact' | 'calculator';
const isPanel = (id: string): id is Panel => id === 'pact' || id === 'calculator';

function hashIs(panel: Panel) {
  return (window.location.hash || '').toLowerCase() === `#${panel}`;
}

// L'ACCUEIL v3.9 (Antoine, 05/11) : pour les fondateurs d'exception, et pour eux seuls.
// 06/11 (6), la voix : les règles, les très rares qu'on attend, le capital (tout ce que
// proposent les meilleurs, la table retournée, sans se comparer), ce qu'ils gardent, les
// moteurs. Le technique est replié. La thèse et le deal flow sont pour les LPs : /lp.
// Montants permis ici, tous lus dans src/data/fund.json : tickets et tableau des
// fondateurs (illustratif). JAMAIS de frais, de carry ni de rendement cible. Le shell
// index.html reste sans montant (scripts/prerender.mjs le vérifie).
// Le popup du deal flow reste monté pour profund.vc/#dealflow (le QR de la fiche).
// Pas de barre du haut (Antoine, 05/11) : le logo blanc ouvre le héros, un seul bouton.
// v3.15 (06/11) : le pacte et le calculateur se déplient dans la page ; plus de
// Founding Partner ni de mention EuVECA sur l'accueil (elles restent sur /lp).

export default function HomepageLite() {
  const [open, setOpen] = useState(() => hashWantsDealflow());
  const [pact, setPact] = useState(() => hashIs('pact'));
  const [calc, setCalc] = useState(() => hashIs('calculator'));
  const { hash, key } = useLocation();

  // Ouvre un panneau et y défile (boutons lointains, ancres du pied de page).
  const reveal = useCallback((panel: Panel) => {
    (panel === 'pact' ? setPact : setCalc)(true);
    requestAnimationFrame(() => {
      document.getElementById(`${panel}-dock`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Le bouton du panneau : ouvre ou ferme. Fermé depuis le bas du panneau, on remonte à son bouton.
  function toggle(panel: Panel) {
    const wasOpen = panel === 'pact' ? pact : calc;
    (panel === 'pact' ? setPact : setCalc)(!wasOpen);
    if (!wasOpen) return;
    const dock = document.getElementById(`${panel}-dock`);
    if (dock && dock.getBoundingClientRect().top < 0) dock.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Arrivée depuis une autre page sur « /#math »… : le routeur ne défile pas vers
  // l'ancre, on le fait une fois la page rendue. `key` : un second clic sur le même
  // lien (/#pact) rouvre le panneau.
  useEffect(() => {
    if (!hash || DEALFLOW_HASHES.has(hash.toLowerCase())) return;
    const id = decodeURIComponent(hash.slice(1)).toLowerCase();
    if (isPanel(id)) { reveal(id); return; }
    const el = document.getElementById(id);
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }, [hash, key, reveal]);

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
      <TheRules hero pactOpen={pact} onPact={() => toggle('pact')} onRun={() => reveal('calculator')} />
      <TheFew />
      <CapitalStack />
      <TheMath calcOpen={calc} onCalc={() => toggle('calculator')} onPact={() => reveal('pact')} />
      <FounderEngines />
      <FinalCall onOpen={reveal} />
      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
