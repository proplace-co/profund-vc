import SubPage from './SubPage';
import LeadForm, { CONTACT, type Field } from './LeadForm';
import { eur, fund } from '../lib/fund';

// /lp — l'accès LP. Frais, carry et rendements cibles ne sont PAS ici : la fiche,
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
  return (
    <SubPage
      kick="LP access"
      title="LP access."
      intro={<>ProFund Fund I, {FUND_SIZE}, closed-ended EuVECA fund, Luxembourg. Fact sheet, fund model (Excel) and data room on request, for professional and eligible investors.</>}
    >
      <section className="pv-sec pv-sec-tight">
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
            <p className="pv-contact">Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
          </div>
          <LeadForm subject="LP access request" fields={FIELDS} submit="Request LP access" />
        </div>
      </section>
    </SubPage>
  );
}
