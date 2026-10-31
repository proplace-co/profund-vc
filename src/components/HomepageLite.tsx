import { useEffect, useState } from 'react';
import DealFlowModal from './DealFlowModal';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork, SiteHeader } from './Thesis';
import { eur, fund } from '../lib/fund';
import { FACTSHEET_URL } from '../lib/links';
import { savedAccess } from '../lib/access';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

// UN SEUL MONTANT SUR CETTE PAGE : la taille du fonds, dans la phrase du héros et
// dans la loi 04 (texte d'Antoine du 30/10), lue dans src/data/fund.json.
// Construction, tickets et rendements cibles vivent dans la fiche PDF et sur
// /pitch seulement.
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

const LINKS = [
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#thesis', label: 'What we back' },
  { href: '#edge', label: 'Our edge' },
  { href: '#proof', label: 'Proof of work' },
];

export default function HomepageLite() {
  const [open, setOpen] = useState(() => hashWantsDealflow());

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

  // « Follow live deal flow » : le deal flow directement si ce navigateur en a
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
        <button type="button" className="pv-btn" onClick={follow}>Follow live deal flow</button>
      </SiteHeader>

      <header className="pv-hero">
        <div className="pv-wrap pv-hero-grid">
          <div className="pv-hero-copy">
            <span className="pv-eyebrow"><b />AI-native venture fund · Europe</span>
            <h1 className="pv-h1 pv-h1-one">Where pure vision directs recursive AI.</h1>
            <p className="pv-lead pv-lead-k">Seed to Growth. {FUND_SIZE}.</p>
            <p className="pv-lead">
              We don’t fund headcount. We back tight-knit, AI-native teams building <span className="nw">self-improving</span> systems
              across the world’s largest markets.
            </p>
            <div className="pv-ctas">
              <button type="button" className="pv-btn" onClick={follow}>
                Follow live deal flow <Icon name="arrow" />
              </button>
              <a href={FACTSHEET_URL} className="pv-btn line" download>
                <Icon name="file" />Download the fact sheet
              </a>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <Manifesto />
      <FourLaws />
      <OurEdge onFollow={follow} />
      <ProofOfWork />

      <section className="pv-sec pv-sec-end" id="factsheet">
        <div className="pv-wrap">
          <div className="pv-band">
            <div>
              <h2>Follow our deal flow live</h2>
              <p>Every evening, the companies we reviewed that day, the ones we kept, and why.</p>
            </div>
            <div className="pv-band-ctas">
              <button type="button" className="pv-btn light" onClick={openModal}>
                Apply to follow <Icon name="arrow" />
              </button>
              <a href={FACTSHEET_URL} className="pv-btn ghost-light" download>
                <Icon name="file" />Download the fact sheet
              </a>
            </div>
          </div>
          <p className="pv-note">
            EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
          </p>
        </div>
      </section>

      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
