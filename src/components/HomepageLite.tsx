const LOGO_URL = '/logo.png';
const TRACK_RECORD_URL = '/track-record.png';
const PROPLACE_LOGO = '/portfolio-proplace.png';
const MAXIMUM_LOGO = '/portfolio-maximum-insurance.svg';
const FACTSHEET_URL = '/profund-factsheet.pdf';
const BREVO_IFRAME_SRC =
  'https://77f02b89.sibforms.com/serve/MUIFALUiZIPfuoaTzppPYzP7z6tpgQFfbhCHQuX8eO58o9PB8ue7e3ED7js4wkM1mNJErqEK2YtgwSU2koncoKMtNmozRmy55vEGK6wgnJk0AwqAxzWcwM67GiIBHz1XgOlkmNF00qqP7cGXUx69taacMVNXnPaZ3F9jnvVMDP-DFnCpN2SWKX10fWKRxNSpSxIZUKeJV4KlahCGNw==';

// Marques dont le logo n'existe pas encore en fichier : rendues en wordmark
// texte, sous la bande `track-record.png`. Déposer le PNG dans public/ et les
// basculer ici dès qu'on les a.
const PENDING_BRANDS = ['OneStaff', 'Planity', 'Captain Train', 'MB Diffusion'];

// ⚠️ Ces chiffres sont ceux de /pitch (ProFundPage.tsx) et du PDF généré par
// scripts/factsheet.py. Les TROIS sources doivent rester d'accord : ne jamais
// en modifier un ici sans répercuter dans les deux autres.
const HERO_STATS = [
  { n: '€35M', l: 'Target fund size, including follow-on reserves' },
  { n: '21', l: 'Deals — 12 Scout (€150K) + 9 Core (€1.1M)' },
  { n: '26%', l: 'Target net IRR · 15% base case' },
  { n: '6–18mo', l: 'Average detection lead before public announcement' },
];

const SCOUT_ROWS = [
  ['Ticket', '€150K initial · follow-on reserved'],
  ['Entry valuation', '€4M – €6M post-money'],
  ['Stage', 'Pre-seed'],
  ['Graduation', '3 of 12 graduate to Core'],
  ['Target MOIC', '2.5× · €23.7M exit value'],
];

const CORE_ROWS = [
  ['Ticket', '€1.1M · co-investing with Tier 1 leads'],
  ['Entry valuation', '€25M – €35M pre-money'],
  ['Stage', 'Seed+ / Series A'],
  ['Portfolio', '9 direct + 3 Scout graduates'],
  ['Target MOIC', '3.1× · €74.9M exit value'],
];

const ALLOCATION = [
  { n: '€1.8M', l: 'Scout initial tickets — 12 deals at €150K' },
  { n: '€9.9M', l: 'Core initial tickets — 9 deals at €1.1M' },
  { n: '€21.5M', l: 'Follow-on reserves — €7.5M Scout + €14M Core' },
  { n: '€98.6M', l: 'Target gross exit value on €35M deployed' },
];

const PORTFOLIO = [
  {
    name: 'Proplace',
    logo: PROPLACE_LOGO,
    tag: 'Operating',
    line: 'AI-native sourcing platform for venture and private equity funds. The engine that runs our own deal flow.',
  },
  {
    name: 'Maximum Insurance',
    logo: MAXIMUM_LOGO,
    tag: 'Operating',
    line: 'Swiss travel insurtech — duty of care for companies and the people they send abroad.',
  },
];

const STEPS = [
  { n: '1', p: 'Apply below. We review every application — the fund is open to qualified investors only.' },
  { n: '2', p: 'Once approved, you receive the deal flow every morning: the companies detected, their score, and the thesis behind them.' },
  { n: '3', p: 'You set the rhythm — daily or weekly, the hour, and which sections you want. Unsubscribe in one click.' },
];

function Hero() {
  return (
    <header className="pfh-hero">
      <div className="pfh-wrap">
        <img src={LOGO_URL} className="pfh-hero-logo" alt="ProFund" />
        <p className="pfh-eyeb">Early-stage venture capital · Paris</p>
        <h1 className="pfh-h1">Backing Europe's next<br /><em>category winners.</em></h1>
        <p className="pfh-lead">
          A <b>€35M early-stage fund</b> investing in 21 European companies. Investors and builders:
          we built and scaled companies first, and we extend that operating experience to investment —
          with a platform that reads every weak signal in an emerging category before it is obvious.
        </p>
        <div className="pfh-cta-row">
          <a href="#follow" className="pfh-btn">Follow the portfolio live</a>
          <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Download the fact sheet</a>
        </div>
        <div className="pfh-stats">
          {HERO_STATS.map((s) => (
            <div className="pfh-stat" key={s.n}><b>{s.n}</b><span>{s.l}</span></div>
          ))}
        </div>
      </div>
    </header>
  );
}

function TheFund() {
  return (
    <section className="pfh-s tint" id="fund">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">The fund</p>
        <h2 className="pfh-h2">€35M, deployed across <em>21 companies.</em></h2>
        <p className="pfh-lead">
          Two-tier construction. <b>Scout</b> tickets buy asymmetric exposure at pre-seed, where the
          platform's detection lead is worth the most. <b>Core</b> tickets concentrate capital on
          validated conviction at Seed+ and Series A. The best Scout bets graduate to Core.
        </p>
        <div className="pfh-cols">
          <div className="pfh-col">
            <h3>Scout portfolio</h3>
            <span className="amt">12 deals · €1.8M initial + €7.5M follow-on</span>
            {SCOUT_ROWS.map(([k, v]) => (
              <div className="pfh-row" key={k}><span>{k}</span><span>{v}</span></div>
            ))}
          </div>
          <div className="pfh-col">
            <h3>Core portfolio</h3>
            <span className="amt">9 deals · €9.9M initial + €14M follow-on</span>
            {CORE_ROWS.map(([k, v]) => (
              <div className="pfh-row" key={k}><span>{k}</span><span>{v}</span></div>
            ))}
          </div>
        </div>
        <div className="pfh-stats">
          {ALLOCATION.map((s) => (
            <div className="pfh-stat" key={s.n}><b>{s.n}</b><span>{s.l}</span></div>
          ))}
        </div>
        <p className="pfh-note">
          Target net IRR 26% and net DPI ~2.8×, against a 15% base case built without a unicorn.
          Paris first, then Europe. Full construction, line by line, in the <a href="/pitch">investment deck</a>.
        </p>
      </div>
    </section>
  );
}

function TrackRecord() {
  return (
    <section className="pfh-s">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">Track record</p>
        <h2 className="pfh-h2">Where the experience comes from.</h2>
        <p className="pfh-lead">
          Operating and investing roles across venture, private equity, marketplaces and platforms —
          from seed tickets returning 19× to a €45M buyout still held at 2.5× cash-on-cash.
        </p>
        <div style={{ marginTop: '52px' }}>
          <img src={TRACK_RECORD_URL} className="pfh-logos" alt="Partech · Ardian · Google · Mirakl · leboncoin" />
          <div className="pfh-words">
            {PENDING_BRANDS.map((b) => <span key={b}>{b}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  return (
    <section className="pfh-s tint" id="portfolio">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">Portfolio</p>
        <h2 className="pfh-h2">Already active. <em>Two companies built.</em></h2>
        <p className="pfh-lead">
          We are not waiting for a first close to operate. Two companies are built and held today —
          one of them is the sourcing platform that runs the fund's own deal flow. We invest the way we build.
        </p>
        <div className="pfh-pf">
          {PORTFOLIO.map((p) => (
            <div className="pfh-pfc" key={p.name}>
              <img src={p.logo} alt={p.name} />
              <span className="pfh-tag">{p.tag}</span>
              <p>{p.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FollowLive() {
  return (
    <section className="pfh-s dark" id="follow">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">
          <span className="pfh-live"><span className="pfh-dot" />Live</span>
        </p>
        <h2 className="pfh-h2">Follow the portfolio as it is built.</h2>
        <p className="pfh-lead">
          Prospective LPs do not wait for a quarterly letter. Apply below and you receive the same deal
          flow the GP reviews every morning — the companies our platform detected, their score, and the
          thesis they match. You see the fund being built, deal by deal, before the portfolio is closed.
        </p>
        <div className="pfh-steps">
          {STEPS.map((s) => (
            <div className="pfh-step" key={s.n}><b>{s.n}</b><p>{s.p}</p></div>
          ))}
        </div>
        <div className="pfh-cta-row">
          <a href="#contact" className="pfh-btn">Apply as an LP</a>
        </div>
      </div>
    </section>
  );
}

function Apply() {
  return (
    <section className="pfh-s" id="contact">
      <div className="pfh-wrap nar" style={{ textAlign: 'center' }}>
        <p className="pfh-eyeb">Apply</p>
        <h2 className="pfh-h2">Request access to the deal flow.</h2>
        <p className="pfh-lead">
          One email a day, or one a week — you choose. Every application is reviewed:
          the fund is open to qualified investors only.
        </p>
        <div style={{ marginTop: '40px', background: '#fff' }}>
          <iframe
            width="540"
            height="700"
            src={BREVO_IFRAME_SRC}
            frameBorder={0}
            scrolling="auto"
            allowFullScreen
            style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: '540px', marginBottom: '-6px' }}
            title="Request access to the deal flow"
          />
        </div>
        <div className="pfh-fs">
          <div>
            <h3>Fund fact sheet</h3>
            <p>Strategy, construction, target returns and terms — two pages, PDF.</p>
          </div>
          <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Download PDF</a>
        </div>
        <p className="pfh-note">
          Questions: <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a>
        </p>
      </div>
    </section>
  );
}

export default function HomepageLite() {
  return (
    <div className="pfh">
      <Hero />
      <TheFund />
      <TrackRecord />
      <Portfolio />
      <FollowLive />
      <Apply />
    </div>
  );
}
