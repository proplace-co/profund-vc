import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { eur, fund } from '../lib/fund';

// LE TEXTE DE LA THÈSE (Antoine, 30/10, v3 du 05/11) : manifeste et sa chute,
// quatre lois, deux moteurs, proof of work. L'accueil ET /pitch rendent ces
// composants, la fiche PDF (scripts/factsheet.py) en porte la même copie : les
// changer ensemble. Montant : la taille du fonds, lue dans fund.json (loi 04).
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

// Icônes au trait (tracés Lucide, licence ISC), 24 × 24, couleur du texte.
export type IconName = 'crown' | 'loop' | 'globe' | 'trend' | 'radar' | 'bot' | 'check' | 'arrow'
  | 'out' | 'sheet' | 'file' | 'target' | 'banknote' | 'shield' | 'door' | 'scale' | 'calc'
  | 'handshake' | 'lock' | 'mail' | 'phone';
const PATHS: Record<IconName, ReactNode> = {
  crown: <><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5 21h14" /></>,
  loop: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></>,
  trend: <><path d="M22 7 13.5 15.5 8.5 10.5 2 17" /><path d="M16 7h6v6" /></>,
  radar: <><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" /></>,
  bot: <><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  out: <><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>,
  sheet: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  banknote: <><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  door: <><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" /><path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" /></>,
  scale: <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  calc: <><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M8 6h8" /><path d="M16 14v4" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></>,
  handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// Barre du haut, commune à l'accueil et à /pitch : logo, ancres, actions.
export function SiteHeader({ links, children }: { links: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <div className="pv-top">
      <div className="pv-wrap pv-top-in">
        <Link to="/" className="pv-top-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" /></Link>
        <nav className="pv-top-nav">
          {/* une route (« /terms ») passe par le routeur ; une ancre (« #math », « /#how ») reste un lien */}
          {links.map((l) => (l.href.startsWith('/') && !l.href.includes('#')
            ? <Link key={l.href} to={l.href}>{l.label}</Link>
            : <a key={l.href} href={l.href}>{l.label}</a>))}
        </nav>
        <div className="pv-top-act">{children}</div>
      </div>
    </div>
  );
}

// Le visuel du héros : une vraie capture du deal flow ProFund, la carte et ses encadrés
// dans une fenêtre. Capture 3x de la vue LP (profund.vc/dealflow), 30/10 : jamais de
// rotation CSS, elle rend le texte flou. 06/11 : la capture du pipeline posée devant est
// retirée du site (elle surchargeait) ; la fiche p. 1 garde les deux.
export function HeroVisual() {
  return (
    <div className="pv-visual solo" aria-hidden="true">
      <div className="pv-shot">
        <div className="pv-shot-bar"><i /><i /><i /><span className="pv-shot-url">profund.vc/dealflow</span></div>
        <img src="/dealflow-map.jpg" alt="" width={2000} height={1212} />
        <span className="pv-live pv-shot-live"><span className="pv-dot" />Live deal flow</span>
      </div>
    </div>
  );
}

export function Manifesto({ tint = false, lp = false }: { tint?: boolean; lp?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="manifesto">
      <div className="pv-wrap pv-mani">
        <div className="pv-head">
          <p className="pv-kick">The manifesto</p>
          <h2 className="pv-h2">The end of human friction.</h2>
        </div>
        <div className="pv-mani-body">
          <p className="big">
            For two centuries, scaling a company meant scaling human labor, hiring thousands of
            people to execute the vision of one. <b>That era is over.</b>
          </p>
          <p>
            Today, a tight-knit team that knows how to challenge, direct, and iterate with AI can
            architect an integral, self-improving system in record time. AI frees humanity from
            mechanical execution, returning creation to pure thought.
          </p>
          <p>
            <b>The future doesn’t belong to the largest organizations.</b> It belongs to the clearest
            minds directing the most autonomous machines.
          </p>
          {/* La chute v3 (05/11) : la fiche porte sa variante LP (« …we raise their debt, we buy… », v3.17 : le fonds ne prête plus). 07/11 : « Control is. »,
              comme l'accueil et /lp (le positionnement sur le contrôle, Alexandre). */}
          <p className="chute">
            <b>Capital is no longer scarce. Control is.</b> A team that doesn’t need an army doesn’t
            need a round every 18 months. {lp ? 'So we don’t sell it one: we raise its debt, we buy, and equity comes only when the founder chooses.' : 'So we don’t sell you one.'}
          </p>
        </div>
      </div>
    </section>
  );
}

// L'ordre des lois (07/11, Alexandre) : une chaîne. Les fondateurs dirigent, la machine atteint un
// marché entier sans armée, chaque passage nourrit la boucle qui compose, le leader l'emporte. Même
// ordre dans `WhatWeBack` (Founders.tsx) et la fiche (factsheet.py).
const LAWS: { icon: IconName; t: string; d: string }[] = [
  {
    icon: 'crown',
    t: 'Visionary founders',
    d: 'We back obsessive visionaries from Day 1. Founders who don’t build org charts, but iterate directly with AI until the machine mirrors their exact ambition.',
  },
  {
    icon: 'globe',
    t: 'Maximum impact. Minimum headcount.',
    d: 'We invest in integral systems solving massive, painful problems in the world’s largest markets, operated with near-zero marginal labor.',
  },
  {
    icon: 'loop',
    t: 'Self-improving systems',
    d: 'We look for closed-loop architectures. Products that don’t just automate a task, but compound in intelligence, precision, and autonomy with every single run.',
  },
  {
    icon: 'trend',
    t: 'Fund-returning physics',
    d: `Every check we write backs a company built to dominate its category globally and return our entire ${FUND_SIZE} fund.`,
  },
];

export function FourLaws({ tint = true }: { tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="thesis">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">What we back</p>
          <h2 className="pv-h2">Four laws drive our thesis and our engines every morning.</h2>
        </div>
        <ol className="pv-laws">
          {LAWS.map((l, i) => (
            <li key={l.t} className="pv-law">
              <span className="pv-ic"><Icon name={l.icon} /></span>
              <span className="pv-law-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{l.t}</h3>
              <p>{l.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Qui tourne sur un moteur : mêmes pastilles que la fiche PDF.
function Powers({ names }: { names: string[] }) {
  return (
    <div className="pv-chips">
      <b>Powers</b>
      {names.map((n) => <span key={n} className={n === 'ProFund' ? 'pf' : undefined}>{n}</span>)}
    </div>
  );
}

export function OurEdge({ onFollow }: { onFollow?: () => void }) {
  return (
    <section className="pv-sec night" id="edge">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Our edge</p>
          <h2 className="pv-h2">Two autonomous AI engines. We run on what we back.</h2>
        </div>
        <div className="pv-edge">
          <div className="pv-eng">
            <span className="pv-ic"><Icon name="radar" /></span>
            <h3>The External AI Growth Engine</h3>
            <p>
              Scores every company against our thesis and flags inflection points before they
              become consensus. For our founders, it sources, assesses and qualifies every day the
              startups that could create the strongest synergies with their company.
            </p>
            <Powers names={['ProFund', 'Proplace', 'WinHealth Group', 'Nexecur', 'S4BT', 'Portfolio companies']} />
            {onFollow && (
              <button type="button" className="pv-btn light" onClick={onFollow}>
                Follow live deal flow <Icon name="arrow" />
              </button>
            )}
          </div>
          <div className="pv-eng">
            <span className="pv-ic"><Icon name="bot" /></span>
            <h3>The Internal AI Growth Engine</h3>
            <p>
              Autonomous AI agents running content, inbound and outbound. For our founders: a daily
              feed of LinkedIn and X posts and of intent-based leads with personalised sequences,
              built on their ideal customer profiles, ready to approve.
            </p>
            <Powers names={['ProFund', 'Proplace', 'Maximum Insurance', 'Sosuites', 'WinHealth Group', 'Portfolio companies']} />
          </div>
        </div>
        <div className="pv-edge-figs">
          <div><b>Every</b><span>European seed round tracked by the Seed Radar, weekly</span></div>
          <div><b>6–18 months</b><span>detection lead before announcement</span></div>
        </div>
      </div>
    </section>
  );
}

// Sociétés du GP, hors du fonds (la note « Outside the fund » a été retirée le 30/10).
const PROOF = [
  { name: 'Proplace', logo: '/portfolio-proplace.png', href: 'https://proplace.co', wide: false,
    tagline: 'Autonomous AI operating system for corporate development & M&A.' },
  { name: 'Maximum Insurance', logo: '/portfolio-maximum-insurance.svg', href: 'https://maximum-insurance.com', wide: true,
    tagline: 'Travel insurance and duty of care for companies and their teams abroad.' },
  { name: 'Sosuites', logo: '/portfolio-sosuites.png', href: 'https://www.sosuites.com', wide: true,
    tagline: 'AI-assisted personalised art prints to share.' },
];

export function ProofOfWork({ tint = false }: { tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="proof">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Proof of work</p>
          <h2 className="pv-h2">We live what we back.</h2>
          <p className="sub">
            ProFund and the companies below are operated almost entirely by our in-house engines
            and agents:
          </p>
        </div>
        <div className="pv-proof">
          {PROOF.map((p) => (
            <a key={p.name} className="pv-co" href={p.href} target="_blank" rel="noopener noreferrer">
              <span className="pv-co-lg"><img src={p.logo} alt={p.name} className={p.wide ? 'wide' : undefined} /></span>
              <p>{p.tagline}</p>
              <span className="pv-co-go">{p.href.replace(/^https:\/\/(www\.)?/, '')} <Icon name="out" /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
