import { useState } from 'react';
import SubPage from './SubPage';
import DealFlowModal from './DealFlowModal';
import { FourLaws, Icon, Manifesto, OurEdge, ProofOfWork } from './Thesis';
import { EveryStage, HowWeBack, TheRules, TheTeam } from './Founders';
import { savedAccess } from '../lib/access';
import LeadForm, { CONTACT, type Field } from './LeadForm';
import { eur, fund } from '../lib/fund';

// /lp — l'accès LP. v3.8 : la porte des LPs ; elle reprend toute la thèse de l'accueil
// (manifeste, lois, règles, étages, moteurs, proof of work, Founding Partner). Frais, carry et rendements cibles ne sont PAS ici : la fiche,
// le modèle Excel et /pitch s'envoient sur demande. La mention de
// pré-commercialisation est celle de /legal, de la fiche et du popup : les
// changer ensemble.
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

export default function LpPage() {
  // Le deal flow live : directement si ce navigateur en a l'accès, sinon la candidature.
  const [open, setOpen] = useState(false);
  const follow = () => { if (savedAccess()) window.location.href = '/dealflow/'; else setOpen(true); };
  return (<>
    <SubPage
      kick="LP access"
      title="LP access."
      action={<a href="#request" className="pv-btn">Request LP access</a>}
      intro={<>ProFund Fund I, {FUND_SIZE}, closed-ended EuVECA fund, Luxembourg. Fact sheet, fund model (Excel) and data room on request, for professional and eligible investors.</>}
    >
      <section className="pv-sec pv-sec-tight" id="request">
        <div className="pv-wrap pv-split">
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
              <h2 className="pv-h3">Follow our deal flow live.</h2>
              <p>Every evening, the companies we reviewed.</p>
              <button type="button" className="pv-btn" onClick={follow}>Follow our deal flow live <Icon name="arrow" /></button>
            </div>
            <p className="pv-contact">Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
          </div>
          <LeadForm subject="LP access request" fields={FIELDS} submit="Request LP access" />
        </div>
      </section>
      <Manifesto tint />
      <FourLaws tint={false} />
      <TheRules />
      <HowWeBack />
      <EveryStage tint />
      <OurEdge onFollow={follow} />
      <ProofOfWork />
      <TheTeam lp />
      <section className="pv-sec pv-reserve-sec">
        <div className="pv-wrap">
          <div className="pv-band pv-final">
            <div>
              <h2>ProFund Fund I. {FUND_SIZE}, EuVECA, Luxembourg.</h2>
              <p>Fact sheet, fund model and data room on request, for professional and eligible investors only.</p>
            </div>
            <div className="pv-band-ctas">
              <a href="#request" className="pv-btn light">Request LP access <Icon name="arrow" /></a>
            </div>
          </div>
        </div>
      </section>
    </SubPage>
    <DealFlowModal open={open} onClose={() => setOpen(false)} />
  </>);
}
