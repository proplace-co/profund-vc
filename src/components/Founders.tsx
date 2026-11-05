import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
import LeadForm, { type Field } from './LeadForm';
import { eur, eurRange, fund, mult } from '../lib/fund';

// LA PROPOSITION FONDATEURS (v3, Antoine, 05/11) : un seul tour en actions, puis des
// prêts et des rachats. Sections communes à l'accueil, /terms, /calculator et /pitch.
// Tous les montants viennent de src/data/fund.json : tickets des étages
// (layers.*) et tableau des fondateurs (founder_math, même calcul que
// src/lib/founderMath.js). Pas de frais, de carry ni de rendement cible ici :
// ils restent derrière /lp (fiche, Excel, /pitch).
const F = fund.fund;
const L = fund.layers;
const FM = fund.founder_math;
const SEED = FM.holders.find((h) => h.id === 'seed')!;
const SERIES_A = FM.holders.find((h) => h.id === 'series_a')!;

const BLOCKS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'target', t: 'One round. That’s it.',
    d: 'We invest once in new shares. After that, we never create a new share while you grow with us.' },
  { icon: 'banknote', t: 'No more fundraising.',
    d: 'A reserved loan line covers what comes next: hiring, go-to-market, working capital, acquisitions. Only compute-heavy model training is out: raise for it wherever you want.' },
  // 05/11 : « Every cancellation lifts your stake » (la copie disait « buyback ») :
  // quand ProFund rachète un angel, la part du fondateur ne bouge pas ; c'est
  // l'annulation par la société qui la relève.
  { icon: 'trend', t: 'Your stake goes up.',
    d: 'We buy back your angels, leavers and early funds, only with your agreement, and the company cancels shares every year. Every cancellation lifts your stake.' },
  { icon: 'shield', t: 'You keep control.',
    d: 'No board seat. No veto. Our shares vote with you.' },
  { icon: 'door', t: 'You choose your exit.',
    d: 'No veto on a sale. Ever.' },
];

export function HowWeBack() {
  return (
    <section className="pv-sec" id="how">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">How we back them</p>
          <h2 className="pv-h2">Built for founders who own what they build.</h2>
          <p className="sub">Same terms for every founder. In public.</p>
        </div>
        <ol className="pv-blocks">
          {BLOCKS.map((b) => (
            <li key={b.t} className="pv-block">
              <span className="pv-ic"><Icon name={b.icon} /></span>
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </li>
          ))}
        </ol>
        {/* 05/11 (v3.6) : « The pact » fusionnée ici, la promesse ne se répète plus */}
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="scale" /></span>
          <p>If you raise elsewhere, we can follow or lead the round. Fair both ways.</p>
          <Link to="/terms" className="pv-link">Read the 10 clauses <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

/** La note sous le tableau : chaque montant lu dans fund.json. */
export function founderNote() {
  return `Typical European path: ${eur(SEED.pref, 'tile')} seed, ${eur(SERIES_A.pref, 'tile')} Series A, then ${eur(FM.vc_equity, 'tile')} of equity across Series B to D, with 1× non-participating preferences. ProFund path: same seed and Series A, then ${eur(FM.loans, 'tile')} of loans, for a company that needs far less capital. Illustrative, not a forecast.`;
}

/** Le tableau « Same company. Same exit. » ; `investor` ajoute la colonne Series A (deck). */
export function FounderTable({ investor = false }: { investor?: boolean }) {
  const top = Math.max(...FM.rows.map((r) => r.founders_profund));
  const bar = (v: number) => ({ width: `${Math.max(1.5, (v / top) * 100)}%` });
  return (
    <div className="pv-math">
      <div className="pv-math-head" aria-hidden="true">
        <span>Exit</span><span>Founders, VC path</span><span>Founders, ProFund path</span>
        {investor && <span>Series A investor, VC path</span>}
        {investor && <span>ProFund, equity</span>}
      </div>
      {FM.rows.map((r) => (
        <div key={r.exit} className={`pv-math-row${investor ? ' wide' : ''}`}>
          <span className="pv-math-exit"><small>Exit</small>{eur(r.exit, 'val')}</span>
          <span className="pv-math-v vc">
            <small>VC path</small>
            <b>{eur(r.founders_vc, 'tile')}</b>
            <i style={bar(r.founders_vc)} />
          </span>
          <span className="pv-math-v pf">
            <small>ProFund path</small>
            <b>{eur(r.founders_profund, 'tile')}</b>
            <i style={bar(r.founders_profund)} />
          </span>
          {investor && <span className="pv-math-m"><small>Series A, VC path</small>{mult(r.series_a_vc)}</span>}
          {investor && <span className="pv-math-m pf"><small>ProFund, equity</small>{mult(r.series_a_profund)}</span>}
        </div>
      ))}
    </div>
  );
}

export function TheMath() {
  return (
    <section className="pv-sec tint" id="math">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">The math</p>
          <h2 className="pv-h2">Same company. Same exit. Twice the payout.</h2>
        </div>
        <FounderTable />
        <p className="pv-fine">{founderNote()}</p>
        <div className="pv-ctas">
          <Link to="/calculator" className="pv-btn">Run your numbers <Icon name="arrow" /></Link>
        </div>
      </div>
    </section>
  );
}

// Les tickets sont ceux des bornes du modèle (fund_model.BOUNDS). Les SPV (au-delà
// du plafond par société) sont hors du fonds : documents LP seulement.
const STAGES = [
  { layer: 'Seed', stage: 'Pre-seed, seed', ticket: eurRange(L.seed.ticket_min, L.seed.ticket_max),
    what: 'Your first and only equity round, as lead or radar ticket' },
  { layer: 'Venture', stage: 'Seed+, Series A', ticket: eurRange(L.venture.ticket_min, L.venture.ticket_max),
    what: 'First cheque at the inflection, or a buyback of your angels and leavers' },
  { layer: 'Growth', stage: 'Series B and beyond',
    ticket: eurRange(L.growth.ticket_min, F.company_cap),
    what: 'Fresh growth rounds, buybacks of early funds, growth loans, acquisition financing' },
];

export function EveryStage() {
  return (
    <section className="pv-sec" id="stages">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">Every stage</p>
          <h2 className="pv-h2">Pre-seed to growth. One equity round, wherever you are.</h2>
          <p className="sub">Two ways in at every layer: a first equity cheque, or a buyback of existing shares. Then loans, never new shares.</p>
        </div>
        <div className="pv-stages">
          {STAGES.map((s, i) => (
            <div key={s.layer} className="pv-stage">
              <span className="pv-stage-n">Layer {i + 1}</span>
              <h3>{s.layer}</h3>
              <dl>
                <div><dt>Stage</dt><dd>{s.stage}</dd></div>
                <div><dt>Ticket</dt><dd className="tk">{s.ticket}</dd></div>
                <div><dt>What we do</dt><dd>{s.what}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Parcours du GP, en logos (tirés de public/track-record.png ; Google et Mirakl retirés le 31/10).
export const CV_LOGOS = [
  { name: 'Partech', src: '/cv-partech.png', h: 24 },
  { name: 'Ardian', src: '/cv-ardian.png', h: 20 },
  { name: 'leboncoin', src: '/cv-leboncoin.png', h: 20 },
];

export function TheTeam({ lp = false, tint = true }: { lp?: boolean; tint?: boolean }) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}`} id="team">
      <div className="pv-wrap pv-team">
        <img className="pv-team-photo" src="/gp-photo.jpg" alt="Alexandre Busson" width={240} height={300} />
        <div>
          <p className="pv-kick">The team</p>
          <h2 className="pv-h2">Built for this model: M&amp;A, LBO, VC.</h2>
          <p className="pv-team-txt">
            <b>Alexandre Busson, Founding Partner.</b> M&amp;A Director at Leboncoin, LBO at Ardian (ex-AXA PE),
            Senior Associate at Partech Ventures, Google. Founder of Dreamzer Games, owner and CEO of
            Fadparis.com. Three exits at 10×, 20× and 19× before the fund.
          </p>
          {lp && (
            <ul className="pv-checks sm">
              {/* 05/11 : « [to recruit] » de la copie, rendu explicite : le poste n'est pas pourvu. */}
              <li><span className="pv-tick"><Icon name="check" /></span>A partner from venture debt will run the loan book (to be recruited).</li>
              <li><span className="pv-tick"><Icon name="check" /></span>Investment committee and key-person clause.</li>
            </ul>
          )}
          <div className="gp-logos" aria-label="Partech · Ardian · leboncoin">
            {CV_LOGOS.map((l) => <img key={l.name} src={l.src} alt={l.name} style={{ height: l.h }} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// Le formulaire « Reserve your round » : les champs de la copie, plus l'email (sans
// lui, on ne peut pas répondre sous 24 heures).
const RESERVE_FIELDS: Field[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'company', label: 'Company', required: true },
  { name: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
  { name: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/' },
  { name: 'stage', label: 'Stage', type: 'select', options: ['Pre-seed', 'Seed', 'Seed+', 'Series A', 'Series B and beyond'] },
  { name: 'revenue', label: 'Annual revenue', placeholder: '€' },
  { name: 'growth', label: 'Growth over 12 months', placeholder: '%' },
  { name: 'raised', label: 'Amount raised and investors', full: true },
  { name: 'stake', label: 'Founders’ stake', placeholder: '%' },
  { name: 'angels', label: 'Angels or former employees on the cap table', type: 'select',
    options: ['Yes', 'No'] },
  { name: 'needs', label: 'Funding needs over 12 months', type: 'textarea', full: true },
];

export function ReserveForm({ extra }: { extra?: string }) {
  return <LeadForm subject="Reserve your round" fields={RESERVE_FIELDS} submit="Reserve your round" extra={extra} />;
}

export function ReserveSection({ onFollow }: { onFollow: () => void }) {
  return (
    <section className="pv-sec pv-reserve-sec" id="reserve">
      <div className="pv-wrap">
        <div className="pv-reserve">
          <div className="pv-reserve-copy">
            <p className="pv-kick">Final call</p>
            <h2>Reserve your round.</h2>
            <p>We lead a handful of rounds a year. Tell us where you are, we answer within 24 hours.</p>
            <ul className="pv-reserve-links">
              <li><Link to="/sell">Selling shares in an AI company? <Icon name="arrow" /></Link></li>
              <li><button type="button" onClick={onFollow}>Follow our deal flow live <Icon name="arrow" /></button></li>
              <li><Link to="/lp">LP access on request <Icon name="arrow" /></Link></li>
            </ul>
          </div>
          <ReserveForm />
        </div>
      </div>
    </section>
  );
}
