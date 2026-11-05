import SubPage from './SubPage';
import LeadForm, { type Field } from './LeadForm';
import { Icon } from './Thesis';

// /sell — les vendeurs de titres (angels, anciens salariés, fonds early) : la
// moitié « rachats » du modèle v3 (Lines, colonnes rachats).
const STEPS = [
  'Tell us the company and the size of your stake.',
  'We get the founder’s agreement.',
  'A firm price and a 90-day sale agreement.',
  'Paid at closing.',
];

const FIELDS: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'company', label: 'Company', required: true },
  { name: 'held', label: 'Shares or % held', required: true },
  { name: 'year', label: 'Entry year', placeholder: 'YYYY' },
  { name: 'contact', label: 'Contact (email)', type: 'email', required: true, full: true },
];

export default function SellPage() {
  return (
    <SubPage
      kick="Sell your shares"
      title={<>Selling shares in an AI company? <span>We buy.</span></>}
      intro="Angels, former employees, early funds: we buy all or part of your stake, in one go, with the founder’s agreement."
    >
      <section className="pv-sec pv-sec-tight">
        <div className="pv-wrap pv-split">
          <div>
            <h2 className="pv-h3">How it works</h2>
            <ol className="pv-steps">
              {STEPS.map((s, i) => <li key={s}><span>{i + 1}</span><p>{s}</p></li>)}
            </ol>
            <div className="pv-callout">
              <span className="pv-tick soft"><Icon name="handshake" /></span>
              <p><b>Why founders say yes:</b> the votes on your shares stay with them.</p>
            </div>
          </div>
          <div>
            <LeadForm subject="Selling shares" fields={FIELDS} submit="Tell us about your stake" />
            <p className="pv-fine">We only buy in companies we back, or want to back.</p>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
