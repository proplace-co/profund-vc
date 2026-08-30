const LOGO_URL = '/logo.png';
const TRACK_RECORD_URL = '/track-record.png';
const PROPLACE_LOGO = '/portfolio-proplace.png';
const MAXIMUM_LOGO = '/portfolio-maximum-insurance.svg';
const FACTSHEET_URL = '/profund-factsheet.pdf';
const BREVO_IFRAME_SRC =
  'https://77f02b89.sibforms.com/serve/MUIFALUiZIPfuoaTzppPYzP7z6tpgQFfbhCHQuX8eO58o9PB8ue7e3ED7js4wkM1mNJErqEK2YtgwSU2koncoKMtNmozRmy55vEGK6wgnJk0AwqAxzWcwM67GiIBHz1XgOlkmNF00qqP7cGXUx69taacMVNXnPaZ3F9jnvVMDP-DFnCpN2SWKX10fWKRxNSpSxIZUKeJV4KlahCGNw==';

// ⚠️ AUCUN MONTANT SUR CETTE PAGE — décision d'Antoine du 30/08 : la taille du
// fonds, la construction et les rendements cibles vivent UNIQUEMENT dans la
// fiche PDF (scripts/factsheet.py), qui porte la mention de pré-commercialisation.
// Ne pas réintroduire ici de chiffre de levée, de ticket ou de TRI.

// Marques dont le logo n'existe pas en fichier : rendues en wordmark texte, sous
// la bande `track-record.png`. Déposer le PNG dans public/ et les basculer ici.
const PAST_WORDMARKS = ['OneStaff', 'Planity', 'Captain Train', 'MB Diffusion'];

const ONGOING = [
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

const SETTINGS = [
  ['Rhythm', 'Every morning, or once a week'],
  ['Time', 'The hour it lands, Paris time'],
  ['Sections', 'Only the parts you want to read'],
];

function Hero() {
  return (
    <header className="pfh-hero">
      <div className="pfh-wrap">
        <img src={LOGO_URL} className="pfh-hero-logo" alt="ProFund" />
        <p className="pfh-eyeb">Early-stage venture capital · Paris, then Europe</p>
        <h1 className="pfh-h1">Backing Europe's next<br /><em>category winners.</em></h1>
        <p className="pfh-lead">
          Investors and builders. We built and scaled companies first, and we extend that
          operating experience to investment — with a platform that reads every weak signal
          in an emerging category before it is obvious.
        </p>
        <div className="pfh-cta-row">
          <a href="#live" className="pfh-btn">Follow our deal flow live</a>
          <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Fund fact sheet (PDF)</a>
        </div>
      </div>
    </header>
  );
}

function Past() {
  return (
    <section className="pfh-s" id="past">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">Past</p>
        <h2 className="pfh-h2">Where we come from.</h2>
        <div style={{ marginTop: '52px' }}>
          <img src={TRACK_RECORD_URL} className="pfh-logos" alt="Partech · Ardian · Google · Mirakl · leboncoin" />
          <div className="pfh-words">
            {PAST_WORDMARKS.map((b) => <span key={b}>{b}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Ongoing() {
  return (
    <section className="pfh-s tint" id="ongoing">
      <div className="pfh-wrap">
        <p className="pfh-eyeb">Ongoing</p>
        <h2 className="pfh-h2">What we are building now.</h2>
        <div className="pfh-pf">
          {ONGOING.map((p) => (
            <div className="pfh-pfc" key={p.name}>
              <img src={p.logo} alt={p.name} />
              <p>{p.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Live() {
  return (
    <section className="pfh-s dark" id="live">
      <div className="pfh-wrap nar" style={{ textAlign: 'center' }}>
        <p className="pfh-eyeb">
          <span className="pfh-live"><span className="pfh-dot" />Live</span>
        </p>
        <h2 className="pfh-h2">Follow our deal flow, live.</h2>
        <p className="pfh-lead">
          The companies our platform detects, every morning — before they are obvious.
          You choose what you receive, and you can stop in one click.
        </p>
        <div className="pfh-set">
          {SETTINGS.map(([k, v]) => (
            <div className="pfh-setrow" key={k}><span>{k}</span><span>{v}</span></div>
          ))}
        </div>
        <div style={{ marginTop: '38px', background: '#fff', borderRadius: '2px' }}>
          <iframe
            width="540"
            height="700"
            src={BREVO_IFRAME_SRC}
            frameBorder={0}
            scrolling="auto"
            allowFullScreen
            style={{ display: 'block', margin: '0 auto', width: '100%', maxWidth: '540px', marginBottom: '-6px' }}
            title="Follow our deal flow"
          />
        </div>
      </div>
    </section>
  );
}

function FactSheet() {
  return (
    <section className="pfh-s" id="factsheet">
      <div className="pfh-wrap nar">
        <div className="pfh-fs">
          <div>
            <h3>Fund fact sheet</h3>
            <p>Strategy, fund construction, target returns and track record. Two pages, PDF.</p>
          </div>
          <a href={FACTSHEET_URL} className="pfh-btn ghost" download>Download</a>
        </div>
        <p className="pfh-note" style={{ textAlign: 'center' }}>
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
      <Past />
      <Ongoing />
      <Live />
      <FactSheet />
    </div>
  );
}
