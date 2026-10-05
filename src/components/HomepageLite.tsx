import { useEffect, useState } from 'react';
import DealFlowModal from './DealFlowModal';

const DEALFLOW_HASHES = new Set(['#dealflow', '#follow', '#deal-flow']);

function hashWantsDealflow() {
  return DEALFLOW_HASHES.has((window.location.hash || '').toLowerCase());
}

const LOGO_URL = '/logo.png';
const TRACK_RECORD_URL = '/track-record.png';
const PROPLACE_LOGO = '/portfolio-proplace.png';
const MAXIMUM_LOGO = '/portfolio-maximum-insurance.svg';
const SOSUITES_LOGO = '/portfolio-sosuites.png';
const FACTSHEET_URL = '/profund-factsheet.pdf?v=2026-10-05-edge';

// La these (EUR 35M, Lead at seed / co-invest Series A) vit ici.
// Construction detaillee, tickets et rendements cibles : fiche PDF + /pitch.

// Memes accroches que la fiche PDF (scripts/factsheet.py, PORTFOLIO).
const ONGOING = [
  {
    name: 'Proplace',
    logo: PROPLACE_LOGO,
    href: 'https://proplace.co',
    tagline: 'AI harness for corporate development',
  },
  {
    name: 'Maximum Insurance',
    logo: MAXIMUM_LOGO,
    href: 'https://maximum-insurance.com',
    tagline: 'Swiss travel insurtech & travel risk management platform',
    wide: true,
  },
  {
    name: 'Sosuites',
    logo: SOSUITES_LOGO,
    href: 'https://www.sosuites.com',
    tagline: 'AI-assisted personalised art prints',
    wide: true,
  },
];

// Les deux plateformes maison, cote a cote sous le chapeau du hero. Le chapeau
// dit l'avantage (Investment / Operations), le nom dit le modele — memes noms
// dans la fiche PDF (scripts/factsheet.py).
const PILLARS = [
  {
    kicker: 'Investment',
    title: 'Deal Engine',
    text: 'An in-house AI platform for sourcing and deal assessment. It monitors weak signals across emerging categories around the clock and identifies founders who match our thesis before they become obvious.',
    powers: ['ProFund'],
  },
  {
    kicker: 'Operations',
    title: 'Growth Engine',
    text: 'An in-house AI platform for inbound and outbound. It runs content and go-to-market for our portfolio companies.',
    powers: ['ProFund', 'Proplace', 'Maximum Insurance', 'Sosuites'],
  },
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

  function closeModal() {
    setOpen(false);
    if (hashWantsDealflow()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return (
    <div className="pfh">
      <header className="pfh-hero">
        <div className="pfh-wrap">
          <img src={LOGO_URL} className="pfh-hero-logo" alt="ProFund" />
          <h1 className="pfh-h1">ProFund builds and invests in<br /><em>AI-native companies</em></h1>
          <p className="pfh-lead">
            <span className="pfh-lead-line fit">A €35M early-stage fund acting as Lead investor at seed stage and co-investing in Series A.</span>
            <span className="pfh-lead-line">Targeting domain-specific AI harness with self-improving loops built by highly technical AI-native teams.</span>
          </p>
          <div className="pfh-pillars">
            {/* les deux moteurs sont l'avantage du fonds ET l'outil qui le fait
                tourner : l'en-tete le dit, les pastilles « Powers » le montrent */}
            <div className="pfh-pillars-hd">
              <p className="k">Our edge</p>
              <p className="t">Two in-house AI engines. ProFund itself runs on both.</p>
            </div>
            {PILLARS.map((p) => (
              <div key={p.title} className="pfh-pillar">
                <p className="k">{p.kicker}</p>
                <h2>{p.title}</h2>
                <p>{p.text}</p>
                <div className="runs">
                  <span className="l">Powers</span>
                  {p.powers.map((n) => (
                    <span key={n} className={n === 'ProFund' ? 'c pf' : 'c'}>{n}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="pfh-cta-row">
            <button className="pfh-btn" onClick={openModal}>Follow our deal flow live</button>
          </div>
        </div>
      </header>

      <section className="pfh-s pfh-prior" id="past">
        <div className="pfh-wrap">
          <p className="pfh-eyeb">Prior</p>
          <img src={TRACK_RECORD_URL} className="pfh-logos" alt="Partech · Ardian · Google · leboncoin" />
        </div>
      </section>

      <section className="pfh-s" id="ongoing">
        <div className="pfh-wrap">
          <p className="pfh-eyeb">Portfolio</p>
          <p className="pfh-port-note">
            All three run their content and go-to-market on <b>Growth Engine</b>.
          </p>
          <div className="pfh-port3">
            {ONGOING.map((p) => (
              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                <span className="lg">
                  <img src={p.logo} alt={p.name} className={"wide" in p && p.wide ? 'wide' : undefined} />
                </span>
                <span className="tg">{p.tagline}</span>
                <span className="st"><i aria-hidden="true" />Operating</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pfh-s" id="factsheet">
        <div className="pfh-wrap" style={{ textAlign: 'center' }}>
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

      <DealFlowModal open={open} onClose={closeModal} />
    </div>
  );
}
