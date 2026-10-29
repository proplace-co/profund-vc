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
const FACTSHEET_URL = '/profund-factsheet.pdf?v=2026-10-29-v3';

// AUCUN MONTANT SUR CETTE PAGE (decision d'Antoine, 30/08) : la these tient en
// une phrase. Taille du fonds, construction, tickets et rendements cibles vivent
// dans la fiche PDF et sur /pitch, tous deux generes depuis src/data/fund.json.

// Les sociétés que le GP opère avec ses agents, hors du fonds (détenues à 100 %).
// Mêmes accroches que la fiche PDF (scripts/factsheet.py, PORTFOLIO).
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
    text: 'Reads every European seed round, every senior hire and every launch, around the clock. It scores each founder against our thesis and flags the inflection point before it becomes obvious.',
    powers: ['ProFund'],
  },
  {
    kicker: 'Operations',
    title: 'Growth Engine',
    text: 'AI agents that run content, inbound and outbound, end to end. They operate the fund and the GP’s companies today, and they work for the founders we back.',
    powers: ['ProFund', 'Proplace', 'Maximum Insurance', 'Sosuites'],
  },
];

// Ce que nous cherchons : la thèse du fonds (theses/profund_vc/v2.json du monorepo),
// sans montant — les seuils chiffrés vivent sur /pitch et dans la fiche.
const CRITERIA = [
  { t: 'Founders, from day one', d: 'Exceptional, highly technical founders, found before their first round. At seed, we lead.' },
  { t: 'Every seed round', d: 'Our Seed Radar follows every European seed round and re-scores each company, every week.' },
  { t: 'The inflection', d: 'We double down when the curve bends: revenue tripling within a year, record revenue per employee.' },
  { t: 'Category winners', d: 'Companies that can lead their category in Europe and win globally. Each one could return the fund.' },
  { t: 'Autonomy by design', d: 'Self-improving AI loops at the core, run by teams that pilot AI agents with maximum leverage.' },
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
            <span className="pfh-lead-line fit">One European fund, seed to growth. We read every seed round and back the companies that go exponential.</span>
            <span className="pfh-lead-line">Domain-specific AI harnesses with self-improving loops, built by small, highly technical teams that pilot AI agents with maximum leverage.</span>
          </p>
          <div className="pfh-pillars">
            {/* les deux moteurs sont l'avantage du fonds ET l'outil qui le fait
                tourner : l'en-tete le dit, les pastilles « Powers » le montrent */}
            <div className="pfh-pillars-hd">
              <p className="k">Our edge</p>
              <p className="t">We run on what we back: two in-house AI engines, one GP and his agents.</p>
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

      <section className="pfh-s" id="thesis">
        <div className="pfh-wrap" style={{ textAlign: 'center' }}>
          <p className="pfh-eyeb pfh-eyeb-port">What we back</p>
          <h2 className="pfh-h2">An age of abundance is starting.<br /><em>We back the people who will build it.</em></h2>
          <p className="pfh-lead pfh-vision">
            With AI, a handful of people can now build what once took thousands. Founders who direct
            AI agents will turn their ambitions into companies in record time. We believe AI will first
            free humanity from material constraints, then give people the time and freedom to pursue
            what matters most.
          </p>
          <div className="pfh-crit">
            {CRITERIA.map((c, i) => (
              <div key={c.t} className="pfh-crit-i">
                <b>{String(i + 1).padStart(2, '0')}</b>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            ))}
          </div>
          <p className="pfh-crit-foot">These criteria are our fund thesis. They drive the Deal Engine every morning.</p>
        </div>
      </section>

      <section className="pfh-s" id="ongoing">
        <div className="pfh-wrap">
          <p className="pfh-eyeb">Operated by the GP</p>
          <p className="pfh-port-note">
            We live what we back. <b>Proplace, Maximum Insurance and Sosuites are run almost autonomously
            by AI agents and the GP</b>, who owns them outright: they sit outside the fund.
          </p>
          <div className="pfh-port3">
            {ONGOING.map((p) => (
              <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer">
                <span className="lg">
                  <img src={p.logo} alt={p.name} className={"wide" in p && p.wide ? 'wide' : undefined} />
                </span>
                <span className="tg">{p.tagline}</span>
              </a>
            ))}
          </div>
          <p className="pfh-port-note pfh-port-after">
            The fund works the same way. We look for people who pilot AI agents with maximum leverage,
            to build the most ambitious things.
          </p>
        </div>
      </section>

      <section className="pfh-s pfh-prior" id="past">
        <div className="pfh-wrap">
          <p className="pfh-eyeb">Prior</p>
          <img src={TRACK_RECORD_URL} className="pfh-logos" alt="Partech · Ardian · Google · leboncoin" />
        </div>
      </section>


      <section className="pfh-s" id="factsheet">
        <div className="pfh-wrap" style={{ textAlign: 'center' }}>
          <div className="pfh-cta-row">
            <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Download the fact sheet</a>
          </div>
          <p className="pfh-note">
            EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
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
