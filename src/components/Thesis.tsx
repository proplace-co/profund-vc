import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { eur, fund } from '../lib/fund';

// LE TEXTE DE LA THÈSE (Antoine, 30/10) : manifeste, quatre lois, deux moteurs,
// proof of work. L'accueil ET /pitch rendent ces composants, la fiche PDF
// (scripts/factsheet.py) en porte la même copie : les changer ensemble.
// Seul montant : la taille du fonds, lue dans fund.json (loi 04).
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

// Icônes au trait (tracés Lucide, licence ISC), 24 × 24, couleur du texte.
type IconName = 'crown' | 'loop' | 'globe' | 'trend' | 'radar' | 'bot' | 'check' | 'arrow'
  | 'out' | 'sheet' | 'file';
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
          {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="pv-top-act">{children}</div>
      </div>
    </div>
  );
}

// Le visuel du héros : la vraie capture du deal flow (profund.vc/dealflow) dans
// une fenêtre, et la carte du fonds posée de biais, comme les Pass de Maximum.
// `amount` : seulement sur /pitch — l'accueil n'a qu'un montant, dans sa phrase.
export function HeroVisual({ amount }: { amount?: string }) {
  return (
    <div className="pv-visual" aria-hidden="true">
      <div className="pv-shot">
        <div className="pv-shot-bar"><i /><i /><i /><span className="pv-shot-url">profund.vc/dealflow</span></div>
        <img src="/dealflow-cockpit.jpg" alt="" width={1600} height={900} />
        <span className="pv-live pv-shot-live"><span className="pv-dot" />Live deal flow</span>
      </div>
      <div className="pv-fund">
        <div className="pv-fund-top"><img src="/logo.png" alt="" /><span>Fund I</span></div>
        <div className="pv-fund-mid">
          {amount && <b>{amount}</b>}
          <span>Seed → Venture → Growth</span>
        </div>
        <div className="pv-fund-bot"><span>EuVECA · Luxembourg</span><span className="pv-fund-live"><i />Deal Engine</span></div>
      </div>
    </div>
  );
}

export function Manifesto({ tint = false }: { tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="manifesto">
      <div className="pv-wrap pv-mani">
        <div className="pv-head">
          <p className="pv-kick">The manifesto</p>
          <h2 className="pv-h2">The end of human friction.</h2>
        </div>
        <div className="pv-mani-body">
          <p className="big">
            For two centuries, scaling a company meant scaling human labor—hiring thousands of
            people to execute the vision of one. <b>That era is over.</b>
          </p>
          <p>
            Today, a single visionary who knows how to challenge, direct, and iterate with AI can
            architect an integral, self-improving system in record time. AI frees humanity from
            mechanical execution, returning creation to pure thought. <b>We don’t fund headcount.</b> We
            back sovereign founders building autonomous giants with colossal real-world utility.
          </p>
        </div>
      </div>
    </section>
  );
}

const LAWS: { icon: IconName; t: string; d: string }[] = [
  {
    icon: 'crown',
    t: 'Sovereign Architects, Not Managers',
    d: 'We back obsessive, highly technical visionaries from Day 1. Founders who don’t build org charts, but iterate directly with AI until the machine mirrors their exact ambition.',
  },
  {
    icon: 'loop',
    t: 'Self-Improving Systems',
    d: 'We look for closed-loop architectures. Products that don’t just automate a task, but compound in intelligence, precision, and autonomy with every single run.',
  },
  {
    icon: 'globe',
    t: 'Colossal Utility. Minimum Headcount.',
    d: 'No gimmicks. We invest in integral systems solving massive, painful problems in the world’s largest markets—operated with near-zero marginal labor.',
  },
  {
    icon: 'trend',
    t: 'Fund-Returning Physics',
    d: `We enter at Pre-Seed/Seed and double down at the exact inflection point. Every check we write backs a company built to dominate its category globally and return our entire ${FUND_SIZE} fund.`,
  },
];

export function FourLaws({ tint = true }: { tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="thesis">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">What we back</p>
          <h2 className="pv-h2">Four laws drive our thesis—and our Deal Engine every morning.</h2>
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

export function OurEdge({ onFollow }: { onFollow: () => void }) {
  return (
    <section className="pv-sec night" id="edge">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Our edge</p>
          <h2 className="pv-h2">One GP. Zero Analysts. Two Autonomous Engines.</h2>
          <p className="sub">We run on what we back.</p>
        </div>
        <div className="pv-edge">
          <div className="pv-eng">
            <span className="pv-ic"><Icon name="radar" /></span>
            <h3>The Deal Engine</h3>
            <p>
              Reads every European seed round, key engineering move, and product launch in real
              time. It scores every founder against our thesis and flags inflection points before
              they become consensus.
            </p>
            <button type="button" className="pv-btn light" onClick={onFollow}>
              Follow live deal flow <Icon name="arrow" />
            </button>
          </div>
          <div className="pv-eng">
            <span className="pv-ic"><Icon name="bot" /></span>
            <h3>The Growth Engine</h3>
            <p>
              Autonomous AI agents running content, inbound, and outbound end-to-end. They operate
              our fund and the GP’s companies today—and plug directly into the founders we back
              tomorrow.
            </p>
            {/* qui tourne sur ce moteur — mêmes pastilles que la fiche PDF */}
            <div className="pv-chips">
              <b>Powers</b>
              {['ProFund', 'Proplace', 'Maximum Insurance', 'Sosuites'].map((n) => (
                <span key={n} className={n === 'ProFund' ? 'pf' : undefined}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Hors du fonds, détenues à 100 % par le GP : la note le dit, pour qu'aucun LP
// ne les prenne pour des lignes du portefeuille.
const PROOF = [
  { name: 'Proplace', logo: '/portfolio-proplace.png', href: 'https://proplace.co', wide: false,
    tagline: 'Autonomous AI operating system for corporate development & M&A.' },
  { name: 'Maximum Insurance', logo: '/portfolio-maximum-insurance.svg', href: 'https://maximum-insurance.com', wide: true,
    tagline: 'Travel Insurtech.' },
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
            Before funding autonomous companies, we built our own. The companies below are operated
            almost entirely by our in-house engines and agents:
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
        <p className="pv-proof-note">Outside the fund, 100% owned by the GP.</p>
      </div>
    </section>
  );
}
