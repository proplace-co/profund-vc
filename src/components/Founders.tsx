import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Thesis';
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
    d: 'A reserved loan line covers what comes next: hiring, go-to-market, working capital, acquisitions.' },
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

export function HowWeBack({ forFounders = true }: { forFounders?: boolean }) {
  return (
    <section className="pv-sec" id="how">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">{forFounders ? 'For founders · How we back them' : 'How we back them'}</p>
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
        {/* v3.7 : au-delà de la dette, de l'equity aux mêmes conditions, et des SPV */}
        <div className="pv-callout pv-pact-row">
          <span className="pv-tick soft"><Icon name="banknote" /></span>
          <p>Need more than debt, or lenders can’t take the full line? Your call: we lead the extra equity ourselves, on the same pact terms, with SPVs alongside the fund, at the level of the largest funds.</p>
        </div>
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
          <p className="pv-kick">For founders · The math</p>
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

export function EveryStage({ forFounders = true }: { forFounders?: boolean }) {
  return (
    <section className="pv-sec" id="stages">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick">{forFounders ? 'For founders · Every stage' : 'Every stage'}</p>
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
          <p className="pv-kick">Founding Partner</p>
          <h2 className="pv-h2">Alexandre Busson</h2>
          <p className="pv-team-txt">
            M&amp;A Director at Leboncoin, LBO at Ardian (ex-AXA PE),
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

// Les deux portes, sous le héros : fondateurs d'un côté, LPs de l'autre (v3.7).
export function Doors({ onFollow }: { onFollow: () => void }) {
  return (
    <section className="pv-doors-sec" aria-label="Founders and LPs">
      <div className="pv-wrap pv-doors">
        <div className="pv-door">
          <p className="pv-kick">For founders</p>
          <h2>One equity round. Then never diluted again.</h2>
          <p>Loans and buybacks instead of new rounds. Your control, by contract. We back a handful of teams a year.</p>
          <div className="pv-door-act">
            <Link to="/calculator" className="pv-btn">Run your numbers <Icon name="arrow" /></Link>
            <Link to="/terms" className="pv-link">Read the pact <Icon name="arrow" /></Link>
          </div>
        </div>
        <div className="pv-door dark">
          <p className="pv-kick">For LPs</p>
          <h2>ProFund Fund I. {eur(F.commitments, 'tile')}, EuVECA, Luxembourg.</h2>
          <p>Fact sheet, fund model and data room on request, for professional and eligible investors only.</p>
          <div className="pv-door-act">
            <Link to="/lp" className="pv-btn light">Request LP access <Icon name="arrow" /></Link>
            <button type="button" className="pv-link" onClick={onFollow}>Follow our deal flow live <Icon name="arrow" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

// La fin de l'accueil : pas de formulaire. Peu d'élus ; on commence par les chiffres.
export function FinalCall() {
  return (
    <section className="pv-sec pv-reserve-sec" id="final">
      <div className="pv-wrap">
        <div className="pv-band">
          <div>
            <p className="pv-kick">By introduction</p>
            <h2>A handful of founders a year.</h2>
            <p>We say yes to very few teams, then we stay with them from pre-seed to growth, on the same terms. Start with your numbers.</p>
          </div>
          <div className="pv-band-ctas">
            <Link to="/calculator" className="pv-btn light">Run your numbers <Icon name="arrow" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
