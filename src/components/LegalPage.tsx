const CLAUSES = [
  {
    n: '1', title: 'Nature',
    body: `This page and any related materials (decks, memos, models, calls — the "Materials") constitute a pre-marketing communication within the meaning of Articles 4(1)(aea) and 30a of Directive 2011/61/EU (AIFMD), as amended by Directive (EU) 2019/1160, and Articles L. 214-24-1 and R. 214-208-1 of the French Monetary and Financial Code.\n\nThey are not an offer, solicitation, prospectus, PPM, KID, or marketing within the meaning of AIFMD Art. 4(1)(x). No binding subscription can arise from them. The contemplated fund (the "Fund") is not constituted, registered, passported, or authorised by the AMF, ESMA, or any other authority.`
  },
  {
    n: '2', title: 'Recipients',
    body: `Addressed exclusively on a one-to-one, named basis to persons qualifying as Professional Investors (MiFID II, Annex II) or Eligible Counterparties (MiFID II, Art. 30). No public distribution, advertising, or mass communication. Non-qualifying recipients must cease consulting, delete all copies, and notify the sender.`
  },
  {
    n: '3', title: 'No advice, no reliance',
    body: `Nothing herein is investment, legal, tax, or accounting advice or a personal recommendation. Recipients must form their own view with their own advisers.`
  },
  {
    n: '4', title: 'Projections & past performance',
    body: `All projections, targets, simulated portfolios, and return figures (IRR/DPI/MOIC) are indicative, hypothetical, and illustrative; actual results may differ materially. Past performance is not indicative of future results and may rely on estimates or unaudited data. No representation or warranty is made as to accuracy, completeness, or achievability, and no liability is accepted for reliance thereon.`
  },
  {
    n: '5', title: 'Risk',
    body: `Investment involves risk of total loss of capital, multi-year illiquidity, concentration, valuation uncertainty, regulatory change, key-person dependency, and AI/model risks. Suitable only for sophisticated investors able to bear total loss.`
  },
  {
    n: '6', title: 'Territorial restrictions',
    body: `Not intended for, and not to be accessed from, the United States, Canada, Japan, Australia, or any jurisdiction where distribution would be unlawful. Nothing herein is an offer of securities in the U.S. within the meaning of the Securities Act of 1933.`
  },
  {
    n: '7', title: 'Reverse solicitation',
    body: `Any contact initiated by a prospective investor without prior solicitation by the publisher constitutes reverse solicitation.`
  },
  {
    n: '8', title: 'Confidentiality',
    body: `Materials are confidential and proprietary. Recipient may not copy, forward, quote, or disclose them in whole or in part without prior written consent. Breach may give rise to damages and injunctive relief.`
  },
  {
    n: '9', title: 'AIFMD 18-month rule',
    body: `Pursuant to AIFMD Art. 30a, any subscription by a recipient within 18 months of initial pre-marketing contact is deemed the result of marketing and subject to applicable notification requirements. Internal records are kept as required.`
  },
  {
    n: '10', title: 'Subject to change — No reliance on terms',
    body: `Structure, economics, team, strategy, construction, timing, and governance are subject to change without notice and will be superseded in full by the Fund's definitive constitutive documents, if any.`
  },
  {
    n: '11', title: 'Liability',
    body: `To the maximum extent permitted by law, the publisher and its affiliates disclaim all liability — direct, indirect, incidental, consequential, or punitive — arising from use of or reliance on the Materials.`
  },
  {
    n: '12', title: 'Governing law',
    body: `French law. Exclusive jurisdiction: competent courts of Paris, France.`
  },
];

export default function LegalPage() {
  return (
    <div className="pf-section" style={{ minHeight: '100vh' }}>
      <div className="pf-wrap">
        <span className="eyebrow">Legal Notice</span>
        <h1 className="h2" style={{ fontSize: '22px', marginBottom: '6px' }}>
          Pre-Marketing Communication
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--lite)', marginBottom: '40px', lineHeight: 1.6 }}>
          Professional Investors and Eligible Counterparties only. Strictly confidential. Not an offer.<br />
          Last updated: May 2025
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {CLAUSES.map(({ n, title, body }) => (
            <div key={n} style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', color: 'var(--blue)', textTransform: 'uppercase', flexShrink: 0, marginTop: '2px' }}>{n}.</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>{title}</div>
                  {body.split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: '12px', color: 'var(--sub)', lineHeight: 1.75, marginBottom: '8px' }}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Contact */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.14em', color: 'var(--blue)', textTransform: 'uppercase', flexShrink: 0 }}>13.</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>Contact</div>
                <p style={{ fontSize: '12px', color: 'var(--sub)', lineHeight: 1.75 }}>
                  <a href="mailto:alexandre@profund.vc" style={{ color: 'var(--blue)', textDecoration: 'none' }}>alexandre@profund.vc</a>
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgement box */}
          <div style={{ background: 'var(--gp)', border: '1px solid var(--line)', borderLeft: '3px solid var(--blue)', padding: '20px 24px', marginTop: '8px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '10px' }}>Acknowledgement</div>
            <p style={{ fontSize: '12px', color: 'var(--sub)', lineHeight: 1.75 }}>
              By continuing, the recipient confirms it (i) qualifies as a Professional Investor or Eligible Counterparty, (ii) was not reached by general solicitation, (iii) has read and accepts this notice, and (iv) is bound by its confidentiality and use restrictions.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '48px', borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
          <a href="/" style={{ fontSize: '12px', color: 'var(--blue)', textDecoration: 'none', letterSpacing: '.04em' }}>← Back to ProFund</a>
        </div>
      </div>
    </div>
  );
}
