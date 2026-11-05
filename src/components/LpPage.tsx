import { useEffect, useState } from 'react';
import { SubHeader } from './SubPage';
import DealFlowModal from './DealFlowModal';
import LeadForm, { CONTACT, type Field } from './LeadForm';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork } from './Thesis';
import { EveryStage, HowWeBack, TheRules, TheTeam } from './Founders';
import { savedAccess } from '../lib/access';
import { eur, fund } from '../lib/fund';

// /lp — LA PAGE DES LPs (v3.9) : la thèse et la vision de ProFund (le héros
// « Where pure vision directs recursive AI. », le deal flow, le manifeste, les lois,
// les règles, les étages, les moteurs, proof of work, Founding Partner), la demande
// d'accès et le deal flow live. Frais, carry et rendements cibles ne sont PAS ici :
// la fiche, le modèle Excel et /pitch s'envoient sur demande. La mention de
// pré-commercialisation est celle de /legal, de la fiche et du popup : les changer ensemble.
const FUND_SIZE = eur(fund.fund.commitments, 'tile');

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
  { href: '#manifesto', label: 'Manifesto' },
  { href: '#thesis', label: 'What we back' },
  { href: '#edge', label: 'Our edge' },
  { href: '#team', label: 'Founding Partner' },
];

export default function LpPage() {
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
            <p className="pv-strong">
              One round. Then never diluted again. As long as you grow with us, your stake never goes
              down. You keep control. By contract.
            </p>
            <div className="pv-ctas">
              <a href="#request" className="pv-btn">Request LP access <Icon name="arrow" /></a>
              <button type="button" className="pv-btn line" onClick={follow}><span className="pv-dot" />Follow our deal flow live</button>
            </div>
          </div>
          <HeroVisual />
        </div>
      </header>

      <Manifesto />
      <FourLaws />
      <TheRules />
      <HowWeBack />
      <EveryStage tint />
      <OurEdge onFollow={follow} />
      <ProofOfWork />
      <TheTeam lp />

      <section className="pv-sec" id="request">
        <div className="pv-wrap">
          <div className="pv-head">
            <p className="pv-kick">LP access</p>
            <h2 className="pv-h2">ProFund Fund I. {FUND_SIZE}, EuVECA, Luxembourg.</h2>
            <p className="sub">Closed-ended fund. Fact sheet, fund model (Excel) and data room on request, for professional and eligible investors.</p>
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
