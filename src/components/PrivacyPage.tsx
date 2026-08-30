import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    n: '1',
    title: 'Overview',
    body: `We operate this site as both controller (for data you submit directly) and, where applicable, processor (for data processed on behalf of users). This policy explains how personal data is collected, used, and protected in accordance with Regulation (EU) 2016/679 (GDPR).`,
  },
  {
    n: '2',
    title: 'Data we collect',
    body: `Account: name, email address, organisation, and credentials provided at registration.\n\nUsage: server logs, IP addresses, browser type, pages visited, timestamps — retained automatically by hosting infrastructure.\n\nContent: any text, files, or prompts you submit through the Service.\n\nCommunications: emails and messages sent to us, including support and investor enquiries.\n\nBilling: payment method details handled directly by our payment processor; we do not store card data.`,
  },
  {
    n: '3',
    title: 'Purposes & legal bases',
    body: `Contract (Art. 6(1)(b)): providing, maintaining, and improving the Service; responding to your requests.\n\nLegitimate interest (Art. 6(1)(f)): security monitoring, fraud prevention, service analytics, and internal research — subject to your right to object.\n\nLegal obligation (Art. 6(1)(c)): compliance with applicable French and EU law, including tax and accounting requirements.\n\nConsent (Art. 6(1)(a)): where we request it explicitly (e.g. marketing communications). You may withdraw consent at any time without affecting prior processing.`,
  },
  {
    n: '4',
    title: 'Sub-processors',
    body: `We engage the following categories of sub-processors, each under data processing agreements and, where relevant, under no-training terms with respect to your content:\n\n· Hosting & compute infrastructure (US-based cloud provider)\n· Database & backend storage (US-based SaaS, SOC 2 Type II)\n· Large language model providers (used under no-training contractual terms — your data is not used to train models)\n\nA current list of sub-processors is available on written request at alexandre@profund.vc.`,
  },
  {
    n: '5',
    title: 'International transfers',
    body: `Some sub-processors are located outside the European Economic Area (EEA), including in the United States. Transfers are safeguarded by Standard Contractual Clauses (SCCs) adopted by the European Commission, supplementary technical measures, and — where applicable — adequacy decisions. You may request a copy of the relevant transfer mechanism by writing to us.`,
  },
  {
    n: '6',
    title: 'Retention',
    body: `Account and contract data: duration of the contract plus 12 months, unless a longer period is required by law.\n\nServer and access logs: 12 months.\n\nBilling and invoicing records: 10 years (French commercial and tax law).\n\nProspect and pre-marketing contact data: 3 years from last contact.\n\nData is securely deleted or anonymised at the end of the applicable retention period.`,
  },
  {
    n: '7',
    title: 'Your rights',
    body: `Under GDPR Articles 15–22, you have the right to: access your personal data; rectification; erasure ("right to be forgotten"); restriction of processing; data portability; and to object to processing based on legitimate interest or direct marketing.\n\nTo exercise any right, contact alexandre@profund.vc. We will respond within one month of receipt. If you are unsatisfied with our response, you have the right to lodge a complaint with the competent supervisory authority in your EU member state.`,
  },
  {
    n: '8',
    title: 'Security',
    body: `We implement appropriate technical and organisational measures, including: TLS 1.3 encryption in transit; AES-256 encryption at rest; role-based access control; least-privilege principles; and periodic security reviews. No transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    n: '9',
    title: 'Cookies',
    body: `We use strictly necessary cookies only — those required for the operation of the site (session management, security tokens). We do not use analytics, advertising, tracking, or third-party cookies. No consent is required for strictly necessary cookies under ePrivacy Directive Art. 5(3). You may disable cookies in your browser settings, which may affect site functionality.`,
  },
  {
    n: '10',
    title: 'AI processing',
    body: `Where the Service uses large language models, content you submit may be sent to a third-party AI provider for processing. All such providers are engaged under contractual terms that prohibit using your data to train or improve their models. No personal data is knowingly included in training datasets.`,
  },
  {
    n: '11',
    title: 'Children',
    body: `The Service is not directed at persons under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    n: '12',
    title: 'Changes',
    body: `We may update this policy from time to time. Material changes will be notified via the Service or by email to registered users at least 14 days before taking effect. The "Last updated" date above reflects the most recent revision. Continued use of the Service after the effective date constitutes acceptance.`,
  },
  {
    n: '13',
    title: 'Contact',
    body: `For any privacy-related question, request, or complaint:\nalexandre@profund.vc`,
    email: true,
  },
];

export default function PrivacyPage() {
  return (
    <div className="pf-section" style={{ minHeight: '100vh' }}>
      <div className="pf-wrap">
        <span className="eyebrow">Legal</span>
        <h1 className="h2" style={{ fontSize: '22px', marginBottom: '6px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '12px', color: 'var(--lite)', marginBottom: '40px', lineHeight: 1.6 }}>
          Last updated: 2025
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {SECTIONS.map(({ n, title, body, email }) => (
            <div key={n} style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', color: 'var(--blue)', textTransform: 'uppercase', flexShrink: 0 }}>
                  {n}.
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>{title}</div>
                  {body.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: '12px', color: 'var(--sub)', lineHeight: 1.75, marginBottom: '8px' }}>
                      {email && para.includes('alexandre@profund.vc')
                        ? <><a href="mailto:alexandre@profund.vc" style={{ color: 'var(--blue)', textDecoration: 'none' }}>alexandre@profund.vc</a></>
                        : para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '24px', display: 'flex', gap: '24px' }}>
          <Link to="/" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none' }}>← Back to ProFund</Link>
          <Link to="/legal" style={{ fontSize: '12px', color: 'var(--mid)', textDecoration: 'none' }}>Legal Notice →</Link>
        </div>
      </div>
    </div>
  );
}
