const LOGO_URL = '/logo.png';
const BREVO_IFRAME_SRC =
  'https://77f02b89.sibforms.com/serve/MUIFALUiZIPfuoaTzppPYzP7z6tpgQFfbhCHQuX8eO58o9PB8ue7e3ED7js4wkM1mNJErqEK2YtgwSU2koncoKMtNmozRmy55vEGK6wgnJk0AwqAxzWcwM67GiIBHz1XgOlkmNF00qqP7cGXUx69taacMVNXnPaZ3F9jnvVMDP-DFnCpN2SWKX10fWKRxNSpSxIZUKeJV4KlahCGNw==';

function HeroLite() {
  return (
    <div id="hero" style={{ padding: '52px 0 56px', borderBottom: '1px solid var(--line)' }}>
      <div className="pf-wrap" style={{ textAlign: 'center' }}>
        <img src={LOGO_URL} className="hero-logo" alt="ProFund" style={{ display: 'block', margin: '0 auto 20px' }} />
        <div style={{ display: 'inline-block', border: '1px solid var(--line)', color: 'var(--mid)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', padding: '8px 24px', marginBottom: '18px' }}>Pre-Marketing Phase</div>
        <span className="hero-tagline" style={{ display: 'block' }}>AI-Native Venture Platform</span>
        <h1 className="hero-title">We find Europe's next<br /><em>category winners.</em></h1>
        <p className="hero-sub" style={{ maxWidth: '640px', margin: '0 auto 18px' }}>Before the category is obvious. An AI-native venture platform that reads every weak signal in an emerging category — automatically, at a depth no human team can match.</p>
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

function CTALite() {
  return (
    <div id="contact" className="pf-section" style={{ textAlign: 'center', paddingBottom: '0' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Get in Touch</span>
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
      <CTALite />
    </>
  );
}
