import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SubHeader } from './SubPage';
import DealFlowModal from './DealFlowModal';
import LeadForm, { CONTACT, type Field } from './LeadForm';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork, type IconName } from './Thesis';
import { FounderTable, TheTeam, founderNote } from './Founders';
import { savedAccess } from '../lib/access';
import { eur, eurRange, fund, mult } from '../lib/fund';

// /lp — LA PAGE DES LPs (v3.10, Antoine, 05/11). Rien qui s'adresse aux fondateurs
// (c'est l'accueil) : la vision, pourquoi le marché impose ce modèle, comment le fonds
// gagne de l'argent, pourquoi les meilleurs fondateurs le choisiront, et la protection
// des LPs (préférence 1×, prêts avant les fonds propres…). Frais, carry et rendements
// cibles ne sont PAS ici : la fiche, le modèle Excel et /pitch s'envoient sur demande.
// Chiffres de tiers (Lovable, Stripe) sourcés en note : ne pas les modifier sans relire
// la source. La mention de pré-commercialisation est celle de /legal, de la fiche et du
// popup : les changer ensemble.
// v3.15 (06/11) : la page est réservée aux candidats acceptés, derrière la MÊME
// candidature que le deal flow (DealFlowModal, `lp`). Elle s'ouvre quand ce navigateur
// a l'accès retenu par /dealflow (lib/access.ts : lien magique vérifié une fois), ou
// avec ?gp dans l'URL (aperçu du GP : profund.vc/lp/?gp). Barrière côté client : le
// texte reste dans le bundle JS, ne rien mettre ici qui doive rester secret.
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const FUND_SIZE = eur(F.commitments, 'tile');
const AT_250 = FM.rows.find((r) => r.exit === 250e6) ?? FM.rows[1];

const FIELDS: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'organisation', label: 'Organisation', required: true },
  { name: 'type', label: 'Investor type', type: 'seg', required: true,
    options: ['Professional investor', 'Commitment of €100,000 or more'] },
  { name: 'ticket', label: 'Indicative ticket', type: 'select',
    options: ['€100K – €500K', '€500K – €1M', '€1M – €2.5M', '€2.5M – €5M', '€5M and above'] },
  { name: 'contact', label: 'Contact (email)', type: 'email', required: true },
];

const LINKS = [
  { href: '#shift', label: 'The shift' },
  { href: '#model', label: 'The model' },
  { href: '#protection', label: 'Protection' },
  { href: '#edge', label: 'Our edge' },
  { href: '#team', label: 'Founding Partner' },
];

// Le modèle, vu du fonds : quatre moteurs de détention.
const MODEL: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'One equity round per company',
    d: 'A first cheque in new shares, from pre-seed to growth, with a 1× non-participating preference. Then no new shares while the founder grows with us.' },
  { icon: 'trend', t: 'Buybacks at a discount',
    d: 'Our exposure to the winners grows by buying existing shares from angels, leavers and end-of-life funds, with the founder’s agreement, at an independent valuation, below the price of the time.' },
  { icon: 'banknote', t: 'A loan book',
    d: `Growth is financed by loans, drawn in tranches and repaid before equity, within the EuVECA limit of ${Math.round(F.loan_cap_pct * 100)}% of commitments. Priced like venture debt, without warrants.` },
  { icon: 'loop', t: 'Annual cancellations',
    d: 'Every year, companies can buy back and cancel shares. Every cancellation lifts the founder’s stake, and ours.' },
];

const LAYERS = [
  { name: 'Seed', stage: 'Pre-seed and seed', ticket: eurRange(L.seed.ticket_min, L.seed.ticket_max),
    d: `${L.seed.tracks!.lead.companies} conviction leads and ${L.seed.tracks!.radar.companies} radar tickets: each one an option to buy more when a company breaks out.` },
  { name: 'Venture', stage: 'Seed+ and Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    d: 'A first cheque at the inflection, or a buyback of the angels and leavers.' },
  { name: 'Growth', stage: 'Series B and beyond', ticket: eurRange(L.growth.ticket_min, F.company_cap),
    d: 'Blocks bought from end-of-life funds, fresh growth rounds, and more of our own winners.' },
];

// v3.15 (06/11) : les protections du pacte à 12 clauses (Pact.tsx), vues des LPs.
const PROTECTION: { icon: IconName; t: string; d: string }[] = [
  { icon: 'shield', t: '1× preference', d: 'Every first cheque, and any extra equity a founder asks for, carries a 1× non-participating preference. No ratchet, no cumulative dividend.' },
  { icon: 'banknote', t: 'Loans, on lender terms', d: 'Covenants, no new senior debt without our consent, repaid before any equity and on any change of control. A missed payment suspends the voting agreement.' },
  { icon: 'file', t: 'A board seat', d: 'One seat in every company, with monthly figures and quarterly accounts. Our consent for anything that would change our shares: senior shares, our rights, dividends while a loan runs, the IP, a dissolution.' },
  { icon: 'scale', t: 'Independent pricing', d: 'Every buyback is priced by an independent valuer.' },
  { icon: 'trend', t: 'If a founder raises elsewhere', d: 'A right of first offer; we follow or lead. If another investor leads a priced round, the voting agreement ends and we hold the same rights as the new lead.' },
  { icon: 'door', t: 'Exit', d: 'Tag-along on any sale of control, drag-along only on the same terms for every shareholder, our loans repaid at closing.' },
  { icon: 'handshake', t: 'Vesting and leavers', d: 'Four-year founder vesting; a bad leaver gives back unvested shares at nominal value. The voting agreement ends when a founder leaves or sells control.' },
  { icon: 'lock', t: 'Conflicts', d: 'ProFund’s shares abstain on its own loans and buybacks; the voting agreement does not apply to a founder’s personal interest. Fund-side conflicts go to the LP advisory committee.' },
  { icon: 'check', t: 'Fallback', d: 'Fraud, gross misconduct, a material breach of the pact or insolvency proceedings end the voting agreement. An investment committee and a key-person clause in the fund.' },
];

function Cards({ items, cols = 4 }: { items: { icon: IconName; t: string; d: string }[]; cols?: 3 | 4 }) {
  return (
    <ol className={`pv-cards c${cols}`}>
      {items.map((x) => (
        <li key={x.t} className="pv-block">
          <span className="pv-ic"><Icon name={x.icon} /></span>
          <h3>{x.t}</h3>
          <p>{x.d}</p>
        </li>
      ))}
    </ol>
  );
}

/** L'accès à la page : l'aperçu du GP (?gp), ou l'accès au deal flow de ce navigateur. */
function lpAccess(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has('gp')) return true;
  } catch { /* URL illisible : on retombe sur l'accès retenu */ }
  return !!savedAccess();
}

// Ce que la page ouvre, montré fermé (pas de chiffre : la porte est publique).
const BEHIND = ['The thesis and the shift', 'The model, layer by layer', 'Founder math, investor side',
  'How LPs are protected', 'The engines and the team', 'Fact sheet and fund model, on request'];

function LpGate() {
  const [modal, setModal] = useState<'apply' | 'returning' | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <>
    <div className="pv-terms-page pv-gate">
      <div className="pv-wrap pv-gate-grid">
        <div>
          <Link to="/" className="pv-terms-logo" aria-label="ProFund"><img src="/logo.png" alt="ProFund" width={150} height={40} /></Link>
          <p className="pv-kick pv-gate-kick"><Icon name="lock" />LPs · Private access</p>
          <h1 className="pv-rules-h">Where pure vision directs recursive AI.</h1>
          <p className="pv-terms-lead">
            This page is for the investors we accept. Apply once. When we accept you, your private link
            opens this page and our live deal flow.
          </p>
          <p className="pv-terms-lead pv-gate-who">Our LPs are mainly high-net-worth individuals and family offices.</p>
          <div className="pv-ctas">
            <button type="button" className="pv-btn light" onClick={() => setModal('apply')}>Apply for LP access <Icon name="arrow" /></button>
            <button type="button" className="pv-btn ghost-light" onClick={() => setModal('returning')}>Already accepted? Get my link</button>
          </div>
        </div>
        <div className="pv-gate-card" aria-label="What the LP page holds">
          <p className="pv-gate-card-h">Behind the door</p>
          <ul>
            {BEHIND.map((b) => <li key={b}><Icon name="lock" />{b}</li>)}
            <li className="live"><span className="pv-dot" />Live deal flow, every evening</li>
          </ul>
        </div>
        <p className="pv-gate-note">
          EuVECA pre-marketing communication, professional and eligible investors only. Not an offer to subscribe.
        </p>
      </div>
    </div>
    {/* hors du fond sombre : la boîte garde ses couleurs */}
    <DealFlowModal lp open={modal !== null} startPane={modal ?? 'apply'} onClose={() => setModal(null)} />
    </>
  );
}

export default function LpPage() {
  const [access] = useState(lpAccess);
  return access ? <LpContent /> : <LpGate />;
}

function LpContent() {
  // Le deal flow live : directement si ce navigateur en a l'accès, sinon la candidature.
  const [open, setOpen] = useState(false);
  const follow = () => { if (savedAccess()) window.location.href = '/dealflow/'; else setOpen(true); };
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  return (
    <div className="pfh">
      <SubHeader links={LINKS} action={<a href="#request" className="pv-btn">Request LP access</a>} />

      <header className="pv-hero">
        <div className="pv-wrap pv-hero-grid">
          <div className="pv-hero-copy">
            <span className="pv-eyebrow caps"><b />LPs · Pre-marketing phase · EuVECA</span>
            <h1 className="pv-h1 pv-h1-one">Where pure vision directs recursive AI.</h1>
            <p className="pv-lead pv-lead-k">Pre-seed to Growth. {FUND_SIZE}.</p>
            <p className="pv-lead">
              We don’t fund headcount. We back tight-knit, AI-native teams building <span className="nw">self-improving</span> systems
              across the world’s largest markets.
            </p>
            {/* la ligne forte, version LPs (la fiche, page 1) */}
            <p className="pv-strong">
              One round. Then never diluted again. One equity round per company, then loans and buybacks:
              founders own more at every stage, and so do our LPs.
            </p>
            <div className="pv-ctas">
              <a href="#request" className="pv-btn">Request LP access <Icon name="arrow" /></a>
              <button type="button" className="pv-btn line" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <Manifesto lp />

      <section className="pv-sec tint" id="shift">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">The shift</p>
            <h2 className="pv-h2">AI collapsed the cost of building. Venture has not caught up.</h2>
          </div>
          <div className="pv-duo">
            <div className="pv-duo-txt">
              <p className="big">The best AI companies no longer need €50M.</p>
              <p>Tight teams reach growth-stage revenue with a fraction of the capital and the people software used to need. Yet the venture model still sells them a Series B, C and D, and needs a unicorn to make its returns.</p>
              <p><b>Capital is abundant. Ownership is scarce.</b> The capital that wins the next decade buys ownership, not dilution.</p>
            </div>
            <div>
              <div className="fw-stats">
                <div className="fw-s hl"><span className="fw-big">8 mo</span><div className="fw-det"><strong>Lovable (Stockholm)</strong> went from launch to $100M ARR in eight months, with 45 employees.¹</div></div>
                <div className="fw-s"><span className="fw-big">24 mo</span><div className="fw-det"><strong>To $5M ARR</strong> for the top 100 AI companies on Stripe (2024), against 37 months for SaaS companies (2018).²</div></div>
              </div>
              <p className="pf-fine">¹ TechCrunch, 23 July 2025 (company-reported figures). ² Stripe 2025 annual letter, reported by TechCrunch on 27 February 2025.</p>
            </div>
          </div>
        </div>
      </section>

      <FourLaws tint={false} />

      <section className="pv-sec tint" id="model">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">The model</p>
            <h2 className="pv-h2">One equity round. Then we lend and we buy.</h2>
            <p className="sub">Founders own more at every stage. So does the fund.</p>
          </div>
          <Cards items={MODEL} />
          <div className="pv-stages pv-lp-layers">
            {LAYERS.map((x, i) => (
              <div key={x.name} className="pv-stage">
                <span className="pv-stage-n">Layer {i + 1}</span>
                <h3>{x.name}</h3>
                <dl>
                  <div><dt>Stage</dt><dd>{x.stage}</dd></div>
                  <div><dt>First ticket</dt><dd className="tk">{x.ticket}</dd></div>
                  <div><dt>Role</dt><dd>{x.d}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-sec" id="founders">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">Why the best founders will choose it</p>
            <h2 className="pv-h2">The capital they don’t raise is the company they keep.</h2>
            <p className="sub">Same exit. The usual path sells {eur(FM.vc_equity, 'tile')} of equity after the Series A. An AI-native company on our terms needs {eur(FM.loans, 'tile')} of debt. The deal flow follows the terms.</p>
          </div>
          <FounderTable investor />
          <p className="pv-fine">{founderNote()}</p>
        </div>
      </section>

      <section className="pv-sec tint" id="wins">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">Everyone wins</p>
            <h2 className="pv-h2">At a {eur(AT_250.exit, 'val')} exit, everyone wins.</h2>
          </div>
          <div className="table-scroll pv-ts"><table className="fund-table pv-wins">
            <thead><tr><th>At a {eur(AT_250.exit, 'val')} exit</th><th>VC path</th><th>ProFund path</th></tr></thead>
            <tbody>
              <tr><td>Founders</td><td>{eur(AT_250.founders_vc, 'tile')}</td><td className="pf">{eur(AT_250.founders_profund, 'tile')}</td></tr>
              <tr><td>Series A investor, equity multiple</td><td>{mult(AT_250.series_a_vc)}</td><td className="pf">{mult(AT_250.series_a_profund)} (ProFund)</td></tr>
              <tr><td>Angels</td><td>Wait for the exit</td><td className="pf">Liquidity at year 2</td></tr>
              <tr><td>LPs</td><td>Need a unicorn</td><td className="pf">Returns built on ownership, not on unicorns</td></tr>
            </tbody>
          </table></div>
          <p className="pv-punch">The only one who loses is the VC who would have sold rounds B, C and D.</p>
        </div>
      </section>

      <section className="pv-sec" id="protection">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">Protection</p>
            <h2 className="pv-h2">Founders get control. LPs keep the protection.</h2>
            <p className="sub">We give up the veto on how founders run, raise or sell. We keep a board seat and every right that protects capital.</p>
          </div>
          <Cards items={PROTECTION} cols={3} />
        </div>
      </section>

      <OurEdge onFollow={follow} />
      <ProofOfWork />
      <TheTeam lp />

      <section className="pv-sec" id="request">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">LP access</p>
            <h2 className="pv-h2">ProFund Fund I. {FUND_SIZE}, EuVECA, Luxembourg.</h2>
            <p className="sub">Closed-ended fund. Our LPs are mainly high-net-worth individuals and family offices. Fact sheet, fund model (Excel) and data room on request, for professional and eligible investors.</p>
          </div>
          <div className="pv-split">
            <div>
              <div className="pv-notice">
                <p className="pv-notice-h">Pre-marketing phase</p>
                <p>
                  This page is a pre-marketing communication within the meaning of Article 4a of
                  Regulation (EU) No 345/2013 (EuVECA). The fund is not yet established and no units may
                  be subscribed at this stage. For professional and eligible investors only.
                </p>
              </div>
              <div className="pv-card pv-lp-flow">
                <p className="pv-kick"><span className="pv-dot" />Live deal flow</p>
                <h3 className="pv-h3">Follow our deal flow live.</h3>
                <p>Every evening, the companies we reviewed.</p>
                <button type="button" className="pv-btn" onClick={follow}>Follow our deal flow live <Icon name="arrow" /></button>
              </div>
              <p className="pv-contact">Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
            </div>
            <LeadForm subject="LP access request" fields={FIELDS} submit="Request LP access" />
          </div>
        </div>
      </section>
      <DealFlowModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
