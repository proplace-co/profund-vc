import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { CapitalStack, FinalCall, FounderEngines, TheFew, TheRules, WhatWeBack } from './Founders';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// Le panneau dépliable du pacte (v3.15) : son ancre l'ouvre (/#pact). 07/11 : le calculateur quitte
// l'accueil (on ne vend plus la dilution) ; /calculator reste en ligne, hors du sitemap.
type Panel = 'pact';
const isPanel = (id: string): id is Panel => id === 'pact';

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
  const { hash, key } = useLocation();

  // Ouvre un panneau et y défile (boutons lointains, ancres du pied de page).
  const reveal = useCallback((panel: Panel) => {
    setPact(true);
    requestAnimationFrame(() => {
      document.getElementById(`${panel}-dock`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Le bouton du panneau : ouvre ou ferme. Fermé depuis le bas du panneau, on remonte à son bouton.
  function toggle(panel: Panel) {
    const wasOpen = pact;
    setPact(!wasOpen);
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
      {/* 07/11 (6e passe, Alexandre) : le contrôle en ouverture, l'implosion, la vision en grand, le
          Chief Fundraising Officer aligné, les moteurs, le bandeau. Plus de graphique de dilution ni
          de calculateur : le crédit est un outil, pas la promesse. */}
      <TheRules hero pactOpen={pact} onPact={() => toggle('pact')} />
      <TheFew />
      <WhatWeBack />
      <CapitalStack />
      <FounderEngines />
      <FinalCall onOpen={reveal} />
      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
