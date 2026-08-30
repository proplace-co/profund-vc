const LOGO_URL = '/logo.png';
const TRACK_RECORD_URL = '/track-record.png';
const PROPLACE_LOGO = '/portfolio-proplace.png';
const MAXIMUM_LOGO = '/portfolio-maximum-insurance.svg';
const BREVO_IFRAME_SRC =
  'https://77f02b89.sibforms.com/serve/MUIFALUiZIPfuoaTzppPYzP7z6tpgQFfbhCHQuX8eO58o9PB8ue7e3ED7js4wkM1mNJErqEK2YtgwSU2koncoKMtNmozRmy55vEGK6wgnJk0AwqAxzWcwM67GiIBHz1XgOlkmNF00qqP7cGXUx69taacMVNXnPaZ3F9jnvVMDP-DFnCpN2SWKX10fWKRxNSpSxIZUKeJV4KlahCGNw==';

// Marques dont le logo n'existe pas encore en fichier : rendues en wordmark texte,
// dans la même bande que `track-record.png`. Déposer le PNG dans public/ et les
// basculer ici dès qu'on les a.
const PENDING_BRANDS = ['OneStaff', 'Planity', 'Captain Train', 'MB Diffusion'];

const PORTFOLIO = [
  {
    name: 'Proplace',
    logo: PROPLACE_LOGO,
    line: 'AI-native sourcing platform for venture and private equity funds.',
  },
  {
    name: 'Maximum Insurance',
    logo: MAXIMUM_LOGO,
    line: 'Swiss travel insurtech — duty of care for companies and their travellers.',
  },
];

function HeroLite() {
  return (
    <div id="hero" style={{ padding: '52px 0 56px', borderBottom: '1px solid var(--line)' }}>
      <div className="pf-wrap" style={{ textAlign: 'center' }}>
        <img src={LOGO_URL} className="hero-logo" alt="ProFund" style={{ display: 'block', margin: '0 auto 20px' }} />
        <div style={{ display: 'inline-block', border: '1px solid var(--line)', color: 'var(--mid)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', padding: '8px 24px', marginBottom: '18px' }}>Pre-Marketing Phase</div>
        <span className="hero-tagline" style={{ display: 'block' }}>AI-Native Venture Platform</span>
        <h1 className="hero-title">Backing Europe's next<br /><em>category winners.</em></h1>
        <p className="hero-sub" style={{ maxWidth: '640px', margin: '0 auto 18px' }}>Investors and builders. We built and scaled companies first — and we are extending that operating experience to investment, with a platform that reads every weak signal in an emerging category before it is obvious.</p>
        <p className="hero-note">€35M Target · 21 Deals · Paris first, then Europe</p>
        <div style={{ marginBottom: '40px' }}>
          <a href="#contact" className="btn">Request LP Access</a>
        </div>
        <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">€35M</span><span className="sg-l">Target fund size · High-conviction reserves</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">21</span><span className="sg-l">Deals · 12 Scout (€150K) + 9 Core (€1.1M)</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">Weekly</span><span className="sg-l">Thesis calibration — detection parameters updated every Monday</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">6–18mo</span><span className="sg-l">Average detection lead before public announcement</span></div>
        </div>
      </div>
    </div>
  );
}

function TrackRecord() {
  return (
    <div className="pf-section" style={{ textAlign: 'center' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Track Record</span>
        <p className="hero-sub" style={{ maxWidth: '620px', margin: '12px auto 34px' }}>Where the operating and investing experience comes from.</p>
        <img
          src={TRACK_RECORD_URL}
          alt="Partech · Ardian · Google · Mirakl · leboncoin"
          style={{ display: 'block', width: '100%', maxWidth: '880px', height: 'auto', margin: '0 auto' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '18px 46px', marginTop: '26px' }}>
          {PENDING_BRANDS.map((b) => (
            <span key={b} style={{ color: 'var(--mid)', fontSize: '15px', fontWeight: 700, letterSpacing: '.02em' }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Portfolio() {
  return (
    <div className="pf-section" style={{ textAlign: 'center' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Portfolio</span>
        <p className="hero-sub" style={{ maxWidth: '620px', margin: '12px auto 34px' }}>We are already active: two startups built and held in portfolio. We invest the way we build.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: 'var(--line)', border: '1px solid var(--line)' }}>
          {PORTFOLIO.map((p) => (
            <div key={p.name} style={{ background: '#fff', padding: '34px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <img src={p.logo} alt={p.name} style={{ display: 'block', height: '34px', width: 'auto', maxWidth: '100%' }} />
              <p style={{ color: 'var(--mid)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{p.line}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTALite() {
  return (
    <div id="contact" className="pf-section" style={{ textAlign: 'center', paddingBottom: '0' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Get in Touch</span>
        <p className="hero-sub" style={{ maxWidth: '620px', margin: '12px auto 0' }}>To follow us, subscribe to our deal flow: you receive what we see, as we see it.</p>
        <p className="cta-note" style={{ fontSize: '15px', marginTop: '12px' }}>Contact: <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a></p>
        <div style={{ marginTop: '40px', background: '#fff' }}>
          <iframe
            width="540"
            height="700"
            src={BREVO_IFRAME_SRC}
            frameBorder={0}
            scrolling="auto"
            allowFullScreen
            style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '100%', maxWidth: '540px', marginBottom: '-6px' }}
            title="Get in Touch"
          />
        </div>
      </div>
    </div>
  );
}

export default function HomepageLite() {
  return (
    <>
      <HeroLite />
      <hr className="pf-div" />
      <TrackRecord />
      <hr className="pf-div" />
      <Portfolio />
      <hr className="pf-div" />
      <CTALite />
    </>
  );
}
