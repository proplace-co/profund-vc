import { useState } from 'react';
import DealFlowModal from './DealFlowModal';

const LOGO_URL = '/logo.png';
const TRACK_RECORD_URL = '/track-record.png';
const PROPLACE_LOGO = '/portfolio-proplace.png';
const MAXIMUM_LOGO = '/portfolio-maximum-insurance.svg';
const FACTSHEET_URL = '/profund-factsheet.pdf';

// ⚠️ AUCUN MONTANT SUR CETTE PAGE — décision d'Antoine du 30/08 : la taille du
// fonds, la construction et les rendements cibles vivent UNIQUEMENT dans la
// fiche PDF (scripts/factsheet.py), qui porte la mention de pré-commercialisation.

const ONGOING = [
  {
    name: 'Proplace',
    logo: PROPLACE_LOGO,
    line: 'Your AI Corporate Developer',
  },
  {
    name: 'Maximum Insurance',
    logo: MAXIMUM_LOGO,
    line: 'Swiss Travel Insurtech',
    wide: true,
  },
];

export default function HomepageLite() {
  const [open, setOpen] = useState(false);

  return (
    <div className="pfh">
      <header className="pfh-hero">
        <div className="pfh-wrap">
          <img src={LOGO_URL} className="pfh-hero-logo" alt="ProFund" />
          <h1 className="pfh-h1">ProFund builds and invests in<br /><em>AI-native companies</em></h1>
          <p className="pfh-lead">
            Seed with traction and Series A, as co-investor. Pre-seed stays in detection.
            The same platform already operates two companies.
          </p>
          <div className="pfh-cta-row">
            <button className="pfh-btn" onClick={() => setOpen(true)}>Follow our deal flow live</button>
          </div>
        </div>
      </header>

      <section className="pfh-s" id="past">
        <div className="pfh-wrap">
          <p className="pfh-eyeb">Prior</p>
          <img src={TRACK_RECORD_URL} className="pfh-logos" alt="Partech · Ardian · Google · Mirakl · leboncoin" />
        </div>
      </section>

      <section className="pfh-s" id="ongoing">
        <div className="pfh-wrap nar">
          <p className="pfh-eyeb">Portfolio</p>
          <div className="pfh-list">
            {ONGOING.map((p) => (
              <div className="pfh-li" key={p.name}>
                <img src={p.logo} alt={p.name} className={"wide" in p && p.wide ? 'wide' : undefined} />
                <p>{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pfh-s" id="factsheet">
        <div className="pfh-wrap nar" style={{ textAlign: 'center' }}>
          <h2 className="pfh-h2">Build &amp; invest with us.</h2>
          <div className="pfh-cta-row">
            <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Download the fact sheet</a>
          </div>
          <p className="pfh-note">
            Pre-marketing communication, professional investors only. Not an offer to subscribe.
          </p>
        </div>
      </section>

      {/* Pas de bande sombre finale : elle ne portait qu'une reprise du bouton du
          hero et faisait deborder la page d'un ecran. Le seul appel a l'action
          vit en haut. */}

      <DealFlowModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
