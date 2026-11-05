import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import DealFlowModal from './DealFlowModal';
import { FourLaws, HeroVisual, Icon, Manifesto, OurEdge, ProofOfWork, SiteHeader } from './Thesis';
import { CV_LOGOS, EveryStage, FounderTable, HowWeBack, founderNote } from './Founders';
import { CASE_IDS, LAYER_IDS, eur, eurRange, fund, mult, pct, rowId, type FundLayer, type LayerId } from '../lib/fund';
import pipeline from '../data/pipeline.json';
import { FACTSHEET_URL, MODEL_XLSX_URL } from '../lib/links';

// /pitch — LE DECK LP v3 (Antoine, 05/11), une section par slide, puis l'annexe
// (construction, simulation ligne à ligne, performance). Réservé aux LPs : la page
// n'est liée nulle part sur le site ; /lp la remet sur demande.
// Chiffres du fonds : src/data/fund.json, généré par scripts/fund_model.py.
// Ne jamais taper un montant, un multiple ou un TRI du fonds dans ce fichier.
// Cas Datadog : retiré (05/11), ne pas le réintroduire.
const F = fund.fund;
const T = fund.terms;
const L = fund.layers;
const A = fund.allocation;
const C = fund.cases;
const TARGET = C.target;
const FM = fund.founder_math;
const SEC = fund.secondary;
const FUND_SIZE = eur(F.commitments, 'tile');
const LAYER_NAME: Record<LayerId, string> = { seed: 'Seed', venture: 'Venture', growth: 'Growth' };
const ALL_LINES = LAYER_IDS.flatMap((id) => L[id].lines);
const EXIT_YEARS = [Math.min(...ALL_LINES.map((l) => l.exit_year)), Math.max(...ALL_LINES.map((l) => l.exit_year))];
const GROWTH_HOLDS = L.growth.lines.map((l) => l.exit_year - l.entry_year);
const AT_250 = FM.rows.find((r) => r.exit === 250e6) ?? FM.rows[1];
const RAISED_VC = FM.raised_before + FM.vc_equity;
const DELAY_1 = fund.stress_tests.find((s) => s.id === 'exits_plus_1')!;
const WITH_PARTIAL = fund.stress_tests.find((s) => s.id === 'with_partial')!;
const V2 = fund.reference_v2;
const FR = fund.fund_returner;   // la loi 04 chiffrée : la sortie qui rend tout le fonds
const loanLoss = (id: 'target' | 'base' | 'stress') => pct(1 - C[id].loan_repaid);
// Décotes des rachats, lues sur les lignes : gagnants et angels (Seed, Venture),
// vendeurs structurels (Growth, fonds en fin de vie).
const discounts = (ids: LayerId[]) => ids.flatMap((id) => L[id].lines).filter((l) => l.buyback && l.discount !== null).map((l) => l.discount!);
const WINNER_DISC = discounts(['seed', 'venture']);
const STRUCT_DISC = Math.max(...discounts(['growth']));
const LOANS_FROM = Math.min(...ALL_LINES.filter((l) => l.loan_repay_year !== null).map((l) => l.loan_repay_year!));

function Slide({ id, n, kick, title, tint, night, children }: {
  id: string; n: number; kick: string; title: ReactNode; tint?: boolean; night?: boolean; children?: ReactNode;
}) {
  return (
    <section className={`pv-sec${tint ? ' tint' : ''}${night ? ' night' : ''}`} id={id}>
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick"><span className="pv-slide-n">{String(n).padStart(2, '0')}</span>{kick}</p>
          <h2 className="pv-h2">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

// 1 · Title
function TitleSlide() {
  return (
    <header className="pv-hero pv-hero-pitch" id="hero">
      <div className="pv-wrap pv-hero-grid">
        <div className="pv-hero-copy">
          <span className="pv-eyebrow"><b />Pre-marketing phase · EuVECA</span>
          <h1 className="pv-h1 pv-h1-one">ProFund. One round. Then never diluted again.</h1>
          <p className="pv-lead pv-lead-k">{FUND_SIZE} · EuVECA, Luxembourg · Pre-seed to growth · Europe</p>
          <p className="pv-lead">
            We don’t fund headcount. We back tight-knit, AI-native teams building <span className="nw">self-improving</span> systems
            across the world’s largest markets.
          </p>
          <div className="pv-ctas">
            <Link to="/lp" className="pv-btn">Request LP access <Icon name="arrow" /></Link>
            <a href={MODEL_XLSX_URL} className="pv-btn line" download><Icon name="sheet" />Fund model (Excel)</a>
          </div>
        </div>
        <HeroVisual />
      </div>
    </header>
  );
}

// 2 · The shift. Chiffres de tiers (Lovable, Stripe) sourcés en note : ne pas les
// arrondir ni les reformuler sans relire la source.
function TheShift() {
  return (
    <Slide id="shift" n={2} kick="The shift" title="AI collapsed the cost of building.">
      <div className="pv-duo">
        <div className="pv-duo-txt">
          <p className="big">The best AI companies no longer need €50M.</p>
          <p><b>The capital that wins the next decade buys ownership, not dilution.</b></p>
        </div>
        <div>
          <div className="fw-stats">
            <div className="fw-s hl"><span className="fw-big">8 mo</span><div className="fw-det"><strong>Lovable (Stockholm)</strong> went from launch to $100M ARR in eight months, with 45 employees.¹</div></div>
            <div className="fw-s"><span className="fw-big">24 mo</span><div className="fw-det"><strong>To $5M ARR</strong> for the top 100 AI companies on Stripe (2024), against 37 months for SaaS companies (2018).²</div></div>
          </div>
          <p className="pf-fine">¹ TechCrunch, 23 July 2025 (company-reported figures). ² Stripe 2025 annual letter, reported by TechCrunch on 27 February 2025.</p>
        </div>
      </div>
    </Slide>
  );
}

// 3 · The problem
function TheProblem() {
  const first = FM.rows[0];
  return (
    <Slide id="problem" n={3} kick="The problem" tint
      title="VCs sell cash to founders who need ownership, control and liquidity.">
      <div className="pv-tiles3">
        <div className="pv-tile"><b>{eur(RAISED_VC, 'tile')}</b><span>raised from seed to Series D, every euro with a 1× preference</span></div>
        <div className="pv-tile"><b>{eur(first.exit, 'val')}</b><span>exit, a good outcome for most companies</span></div>
        <div className="pv-tile dark"><b>{eur(first.founders_vc, 'tile')}</b><span>left for the founders</span></div>
      </div>
      <p className="pv-fine">{founderNote()}</p>
    </Slide>
  );
}

// 4 · The inversion
function TheInversion() {
  return (
    <Slide id="inversion" n={4} kick="The inversion" title="One equity round, then loans and buybacks.">
      <div className="pv-flow">
        <div className="pv-flow-s"><span className="pv-ic"><Icon name="target" /></span><h3>One equity round</h3><p>A first cheque in new shares, from seed to Series A, or a buyback of existing shares.</p></div>
        <div className="pv-flow-s"><span className="pv-ic"><Icon name="banknote" /></span><h3>A reserved loan line</h3><p>Hiring, go-to-market, working capital, acquisitions. Need more? Equity on the same terms, with SPVs alongside the fund.</p></div>
        <div className="pv-flow-s"><span className="pv-ic"><Icon name="trend" /></span><h3>Buybacks and cancellations</h3><p>Angels, leavers and early funds bought out; the company cancels shares every year.</p></div>
      </div>
      <div className="pv-callout">
        <span className="pv-tick soft"><Icon name="scale" /></span>
        <p>If the founder grows with us, we never create a new share. If he raises elsewhere, we follow, or lead the round, in new shares. At growth stage we also write fresh cheques in new shares.</p>
      </div>
    </Slide>
  );
}

// 5 · Founder math
function FounderMathSlide() {
  const rows = FM.rows;
  const list = (k: 'founders_vc' | 'founders_profund') => rows.map((r) => eur(r[k], 'tile')).join(', ');
  return (
    <Slide id="math" n={5} kick="Founder math" tint title="Same company. Same exit. Twice the payout.">
      <p className="pv-lead pv-slide-lead">
        Exits at {rows.map((r) => eur(r.exit, 'val')).join(', ')}: founders take home {list('founders_vc')} on the VC path,
        against {list('founders_profund')} with ProFund, for a company that needs {eur(FM.loans, 'tile')} of loans
        instead of {eur(FM.vc_equity, 'tile')} of equity.
      </p>
      <FounderTable investor />
      <p className="pv-fine">{founderNote()}</p>
    </Slide>
  );
}

// 6 · Everyone wins
function EveryoneWins() {
  return (
    <Slide id="wins" n={6} kick="Everyone wins" title={`At a ${eur(AT_250.exit, 'val')} exit, everyone wins.`}>
      <div className="table-scroll pv-ts"><table className="fund-table pv-wins">
        <thead><tr><th>At a {eur(AT_250.exit, 'val')} exit</th><th>VC path</th><th>ProFund path</th></tr></thead>
        <tbody>
          <tr><td>Founders</td><td>{eur(AT_250.founders_vc, 'tile')}</td><td className="pf">{eur(AT_250.founders_profund, 'tile')}</td></tr>
          <tr><td>Series A investor, equity multiple</td><td>{mult(AT_250.series_a_vc)}</td><td className="pf">{mult(AT_250.series_a_profund)} (ProFund)</td></tr>
          <tr><td>Angels</td><td>Wait for the exit</td><td className="pf">Liquidity at year 2</td></tr>
          <tr><td>LPs</td><td>Need a unicorn</td><td className="pf">{mult(TARGET.net_tvpi)} net and {pct(TARGET.net_irr)} IRR target, no exit above {eur(TARGET.largest_exit, 'val')}</td></tr>
        </tbody>
      </table></div>
      <p className="pv-punch">The only one who loses is the VC who would have sold rounds B, C and D.</p>
    </Slide>
  );
}

// 7 · Perfect alignment
function Alignment() {
  return (
    <Slide id="alignment" n={7} kick="Perfect alignment" tint title="Our stake rises with the founder’s.">
      <div className="pv-trio">
        <div className="pv-card">
          <h3>Aligned</h3>
          <p>Every buyback and cancellation lifts both stakes. We never need the founder to dilute, to raise or to chase a unicorn, and he never needs to fight us on an exit.</p>
        </div>
        <div className="pv-card">
          <h3>Downside</h3>
          <p>Loans are repaid before equity, and our first cheque carries a 1× preference.</p>
        </div>
        <div className="pv-card">
          <h3>Conflicts policy</h3>
          <p>Buybacks priced by an independent valuer, our votes excluded from decisions involving ProFund, LP advisory committee approval.</p>
        </div>
      </div>
      <div className="pv-ctas"><Link to="/terms" className="pv-link">Read the founders’ pact, 10 clauses <Icon name="arrow" /></Link></div>
    </Slide>
  );
}

// 9 · Signed pipeline : les chiffres vivent dans src/data/pipeline.json (données
// commerciales, pas le modèle). La slide reste cachée tant qu'un chiffre manque :
// jamais de « [X] » en ligne.
type Pipeline = { as_of: string | null; founders_signed: number | null; first_cheques_reserved: number | null;
  buyback_options: number | null; loan_lines_requested: number | null };
const PIPE = pipeline as Pipeline;
const PIPE_READY = [PIPE.founders_signed, PIPE.first_cheques_reserved, PIPE.buyback_options, PIPE.loan_lines_requested]
  .every((v) => typeof v === 'number');

function SignedPipeline() {
  if (!PIPE_READY) return null;
  return (
    <Slide id="pipeline" n={9} kick="Signed pipeline" title="Founders who already chose the inversion.">
      <div className="impact-grid">
        <div className="imp"><span className="imp-n">{PIPE.founders_signed}</span><span className="imp-h">Founders signed</span></div>
        <div className="imp"><span className="imp-n">{eur(PIPE.first_cheques_reserved!, 'tile')}</span><span className="imp-h">Of first cheques reserved</span></div>
        <div className="imp"><span className="imp-n">{eur(PIPE.buyback_options!, 'tile')}</span><span className="imp-h">Of buyback options</span></div>
        <div className="imp"><span className="imp-n">{eur(PIPE.loan_lines_requested!, 'tile')}</span><span className="imp-h">Of loan lines requested</span></div>
      </div>
      {PIPE.as_of && <p className="pf-fine">As of {PIPE.as_of}.</p>}
    </Slide>
  );
}

// 10 · The team (le détail du parcours et le track record sont du texte vérifié :
// ne pas reformuler les chiffres).
function Team() {
  return (
    <section className="pv-sec" id="team">
      <div className="pv-wrap">
        <div className="pv-head">
          <p className="pv-kick"><span className="pv-slide-n">10</span>Founding Partner</p>
        </div>
        <div className="gp-grid">
          <div><img src="/gp-photo.jpg" alt="Alexandre Busson" style={{ width: '160px', height: '200px', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} /></div>
          <div>
            <div className="gp-name">Alexandre Busson</div>
            <div className="gp-role">Founding Partner · M&amp;A Director at Leboncoin, LBO at Ardian, Partech Ventures, Google. Three exits at 10×, 20×, 19×, prior to the fund.</div>
            <div className="gp-logos" aria-label="Partech · Ardian · leboncoin">
              {CV_LOGOS.map((l) => <img key={l.name} src={l.src} alt={l.name} style={{ height: l.h }} />)}
            </div>
            <div className="f-rows">
              <div className="f-row"><span className="f-co">Ardian · LBO analyst</span><span className="f-desc">Financial analysis, due diligence and portfolio monitoring across European mid-market companies. The work these products automate, done manually, at institutional standard.</span></div>
              <div className="f-row"><span className="f-co">Partech Ventures · Senior associate</span><span className="f-desc">Sourcing and qualification of European pre-seed to Series B startups. Hundreds of founding teams evaluated. The conviction the platform encodes today was built here, manually, before it was an algorithm.</span></div>
              <div className="f-row"><span className="f-co">Leboncoin · M&amp;A director</span><span className="f-desc">End-to-end acquisitions across Europe. The only GP who has sat on the acquirer's side of the table, and knows what makes a company unmissable at the LOI stage.</span></div>
              <div className="f-row"><span className="f-co">Google · Key account manager assistant</span><span className="f-desc">Key account management at Google.</span></div>
              <div className="f-row"><span className="f-co">Founder &amp; operator</span><span className="f-desc">Owner and CEO of Fadparis.com. Founder and investor of Dreamzer Games.</span></div>
              {/* 05/11 : « [to recruit] » de la copie rendu explicite, le poste n'est pas pourvu */}
              <div className="f-row"><span className="f-co">Loan book</span><span className="f-desc">A partner from venture debt will run the loan book (to be recruited).</span></div>
              <div className="f-row"><span className="f-co">Governance</span><span className="f-desc">Investment committee and key-person clause.</span></div>
            </div>
          </div>
        </div>
        <TrackRecord />
      </div>
    </section>
  );
}

function TrackRecord() {
  return (
    <div className="pv-sub-block">
      <span className="eyebrow">Track record, prior to the fund</span>
      <p className="pf-fine" style={{ marginTop: 0 }}><em>Methodology: Public figures. Exit valuations and transaction metrics may contain assumptions &amp; estimations.</em></p>
      <div className="table-scroll"><table className="fund-table">
        <thead>
          <tr><th>Deal ID</th><th>Status</th><th>Entry Date</th><th>Exit Date</th><th>Initial Tkt</th><th>Entry Val (Post)</th><th>Entry %</th><th>Exit Val (Total)</th><th>Return</th><th>CoC</th></tr>
        </thead>
        <tbody>
          <tr><td>Deal-01</td><td><span className="tag green">Exited (Full)</span></td><td>2006</td><td>2007</td><td>n.c.</td><td>n.c.</td><td>100%</td><td>n.c.</td><td>n.c.</td><td className="moic">10.0×</td></tr>
          <tr><td>Deal-02</td><td><span className="tag green">Exited (Full)</span></td><td>2008</td><td>2014</td><td>n.c.</td><td>n.c.*</td><td>100%→40%→0%</td><td>n.c.**</td><td>n.c.</td><td className="moic">20.0×</td></tr>
          <tr><td>Deal-03</td><td><span className="tag blue">Graduated (Seed → LBO)</span></td><td>2014</td><td>Feb 2025</td><td>€200K</td><td>€5.26M</td><td>3.8%</td><td>€100M***</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€3.8M</td><td className="moic">19.0×</td></tr>
          <tr><td>Deal-04</td><td><span className="tag grey">Ongoing (100% held)</span></td><td>2016</td><td>Ongoing</td><td>€45M</td><td>€45M</td><td>100%</td><td>–</td><td>–</td><td className="moic" style={{ color: 'var(--mid)' }}>–</td></tr>
        </tbody>
      </table></div>
      <p className="pf-fine">* Deal-03: Entry seed €5.3M · Follow-on at €15M round · Exit LBO/MBO Feb 2025 at €100M · 12.5× EBITDA on €8M EBITDA · Estimated 19× on seed ticket.<br />** Deal-04: 100% acquisition, €45M buyout in 2016 · Revenue growing ~20% YoY since acquisition · No multiple shown for a position still fully held.<br />Companies anonymised. Names and references on request.</p>
    </div>
  );
}

// 11 · Terms and targets
function TermsAndTargets() {
  const sd = L.seed;
  const vt = L.venture;
  const gr = L.growth;
  return (
    <Slide id="terms" n={11} kick="Terms and targets" tint title={`${FUND_SIZE} target. One equity round per company.`}>
      <div className="impact-grid">
        <div className="imp"><span className="imp-n">{pct(TARGET.net_irr)}</span><span className="imp-h">Target net IRR</span><p className="imp-p">Base case {pct(C.base.net_irr)}, stress case {pct(C.stress.net_irr)}</p></div>
        <div className="imp"><span className="imp-n">{mult(TARGET.net_tvpi)}</span><span className="imp-h">Target net TVPI</span><p className="imp-p">Base case {mult(C.base.net_tvpi)}, stress case {mult(C.stress.net_tvpi)}</p></div>
        <div className="imp"><span className="imp-n">{mult(TARGET.dpi_year7)}</span><span className="imp-h">Net DPI by year 7</span><p className="imp-p">LPs get their capital back by year 7, with loan losses in every case</p></div>
        <div className="imp"><span className="imp-n">{eur(TARGET.largest_exit, 'val')}</span><span className="imp-h">Largest exit</span><p className="imp-p">No unicorn needed: {FR.company} returns the whole fund at {eur(FR.fund_returning_exit, 'val')}</p></div>
      </div>
      <div className="pv-terms-grid">
        <div className="table-scroll"><table className="fund-table">
          <thead><tr><th>Term</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Target fund size</td><td>{FUND_SIZE}, first close {eurRange(F.first_close_min, F.first_close_max, 'tile', '–')}</td></tr>
            <tr><td>Closed-ended EuVECA fund (Lux.)</td><td>{F.term_years} years, successive closings over {F.closing_months} months</td></tr>
            <tr><td>Management fee, years 1–{F.investment_period_years}</td><td>{pct(T.fee_ip_pct)} ({pct(T.fee_loan_pct)} on the loan sleeve)</td></tr>
            <tr><td>Then, on invested capital incl. loans until repaid</td><td>{pct(T.fee_post_pct, 1)}</td></tr>
            <tr><td>Carried interest, European</td><td>{pct(T.carry_pct)} over an {pct(T.hurdle_pct)} hurdle, with GP catch-up</td></tr>
            <tr><td>Per company: fund / with SPVs</td><td>{eur(F.company_cap, 'tile')} / {eur(F.company_max_with_spv, 'tile')}</td></tr>
            <tr><td>Loans</td><td>Up to {pct(F.loan_cap_pct)} of commitments (EuVECA)</td></tr>
            <tr><td>Tickets</td><td>Up to {eur(sd.ticket_max, 'tile')} at seed, {eurRange(vt.first_cheque_range[0], vt.first_cheque_range[1], 'table', '–')} at Series A, {eurRange(gr.position_range[0], gr.position_range[1], 'tile', '–')} at growth ({eur(F.company_max_with_spv, 'tile')} with SPVs)</td></tr>
          </tbody>
        </table></div>
        <div className="table-scroll"><table className="fund-table">
          <thead><tr><th>Capital allocation</th><th>Amount</th></tr></thead>
          <tbody>
            <tr><td>First cheques, incl. fresh growth rounds</td><td>{eur(A.first)}</td></tr>
            <tr><td>Buybacks and follow-ons</td><td>{eur(A.buyback_follow)}</td></tr>
            <tr><td>Loans</td><td>{eur(A.loans)}</td></tr>
            <tr className="sub"><td>Invested ({pct(A.after_first_pct)} after the first cheque)</td><td>{eur(A.invested)}</td></tr>
            <tr><td>Management fees</td><td>{eur(A.mgmt_fees)}</td></tr>
            <tr><td>Fund expenses, incl. set-up</td><td>{eur(A.fund_expenses)}</td></tr>
            <tr><td>Contingency</td><td>{eur(A.contingency)}</td></tr>
            <tr className="sub"><td>Total commitments</td><td>{eur(A.total)}</td></tr>
          </tbody>
        </table></div>
      </div>
      <div className="pf-callout pv-why">
        <p>
          <strong>Why {pct(TARGET.net_irr)} holds without fast exits.</strong> Exits are spread from year {EXIT_YEARS[0]} to
          year {EXIT_YEARS[1]}. The IRR rests on large stakes in the winners and cash that comes back early: loans
          at {pct(fund.loan_rate)} a year, repaid from year {LOANS_FROM},
          growth positions bought at a {pct(STRUCT_DISC)} discount and sold
          after {Math.min(...GROWTH_HOLDS)}–{Math.max(...GROWTH_HOLDS)} years. Pact clause 9 (partial liquidity from year {SEC.year}) is left
          out: with it, {pct(WITH_PARTIAL.net_irr)} and {mult(WITH_PARTIAL.dpi_year7)} DPI by year 7.
          One year of delay on every exit: {pct(DELAY_1.net_irr)}. No exit above {eur(TARGET.largest_exit, 'val')}; with the same
          exits, the v2 model would make {mult(V2.capped_net_tvpi)}. Law 04 in numbers: with {pct(FR.stake_at_exit, 1)} of {FR.company} at
          exit, a {eur(FR.fund_returning_exit, 'val')} sale returns the entire fund on its own.
        </p>
      </div>
    </Slide>
  );
}

// ── Annexe : construction, simulation, performance ─────────────────────────
const TIER_TAG: Record<LayerId, string> = { seed: 'Layer 1 · Seed', venture: 'Layer 2 · Venture', growth: 'Layer 3 · Growth' };

function tierRows(id: LayerId): [string, string][] {
  const x = L[id];
  const leads = x.tracks?.lead;
  const radar = x.tracks?.radar;
  if (id === 'seed') return [
    ['Ticket', `${eurRange(x.ticket_min, x.ticket_max)}, the only equity round, loan line reserved`],
    ['Stage', x.stage],
    ['Role', 'Lead + radar tickets'],
    ['Entry post', eurRange(x.entry_post_min, x.entry_post_max)],
    ['Companies', `${leads!.companies} leads + ${radar!.companies} radar`],
    ['Invested, loans included', eur(x.invested)],
    ['Target gross', `${mult(x.moic.target)} MOIC`],
  ];
  if (id === 'venture') return [
    ['Ticket', `${eurRange(x.ticket_min, x.ticket_max)}, first cheque or buyback, loan line reserved`],
    ['Stage', x.stage],
    ['Role', 'Direct at the inflection, or buyback of angels and leavers'],
    ['Entry post', eurRange(x.entry_post_min, x.entry_post_max)],
    ['Companies', `${x.companies} direct entries, ${eurRange(x.first_cheque_range[0], x.first_cheque_range[1], 'table', '–')} first cheques`],
    ['Invested, loans included', eur(x.invested)],
    ['Target gross', `${mult(x.moic.target)} MOIC`],
  ];
  return [
    ['Ticket', `${eurRange(x.ticket_min, F.company_cap)} from the fund, up to ${eur(F.company_max_with_spv, 'tile')} with SPVs`],
    ['Stage', x.stage],
    ['Role', 'Direct: blocks from end-of-life funds and fresh growth rounds. Our breakouts: blocks bought in our winners'],
    ['Entry post', eurRange(x.entry_post_min, x.entry_post_max, 'val')],
    ['Companies', `${x.companies} direct entries + ${x.breakouts} of our breakouts, ${eurRange(x.position_range[0], x.position_range[1], 'tile', '–')} each`],
    ['Invested, loans included', eur(x.invested)],
    ['Target gross', `${mult(x.moic.target)} MOIC, ${pct(x.gross_irr.target)} gross IRR over ${Math.min(...GROWTH_HOLDS)}–${Math.max(...GROWTH_HOLDS)} year holds`],
  ];
}

function Construction() {
  return (
    <div className="pf-section" id="construction">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Appendix · Fund construction</span>
        <h2 className="h2">Fund construction.<br /><em>Two ways in at every layer.</em></h2>
        <p className="pf-intro">A first equity cheque, or a buyback of existing shares. Then loans, never new shares.</p>
        <div className="pv-tiers">
          {LAYER_IDS.map((id) => (
            <div key={id} className={`tier ${id}`}>
              <div className="tier-tag">{TIER_TAG[id]}</div>
              <div className="tier-h">{LAYER_NAME[id]} · {L[id].positions} positions</div>
              {tierRows(id).map(([label, value]) => (
                <div key={label} className="tier-row"><span className="tier-label">{label}</span>{value}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TONE_COLOR = { green: 'var(--blue-dk)', blue: 'var(--blue-dk)', grey: 'var(--mid)', red: 'var(--red)' } as const;

function layerIntro(id: LayerId, x: FundLayer): string {
  const [y0, y1] = x.entry_years;
  if (id === 'seed') {
    const l = x.tracks!.lead;
    const r = x.tracks!.radar;
    return `${x.companies} companies: ${l.companies} leads (${l.first} to ${l.last}) + ${r.companies} radar tickets (${r.first} to ${r.last}), entries years ${y0}–${y1}`;
  }
  if (id === 'venture') {
    return `${x.companies} companies, first cheques of ${eurRange(x.first_cheque_range[0], x.first_cheque_range[1], 'table', '–')} at seed+ or Series A, entries years ${y0}–${y1}`;
  }
  return `${eurRange(x.position_range[0], x.position_range[1], 'tile', '–')} per position: blocks bought from end-of-life funds at a ${pct(STRUCT_DISC)} discount, fresh growth rounds, and a block in our own breakout; entries years ${y0}–${y1}, exits ${Math.min(...GROWTH_HOLDS)}–${Math.max(...GROWTH_HOLDS)} years later`;
}

// Une table par étage. Mêmes colonnes en page 4 de la fiche (scripts/factsheet.py)
// et dans l'onglet Lines du modèle Excel. La ligne de sous-total porte la classe `sub`.
function SimTable({ id }: { id: LayerId }) {
  const x = L[id];
  const dash = '–';
  // un montant de ligne groupée hors maille de 100 K (S-08–10 : 3 × €750K) s'affiche
  // à €10K près, comme dans la fiche : €2.25M, pas €2.3M
  const m = (v: number) => (!v ? dash : v >= 1e6 && v % 1e5 ? `€${(v / 1e6).toFixed(2)}M` : eur(v));
  return (
    <div className="pv-sim">
      <h3 className="pv-sim-h">{TIER_TAG[id]}<small>{layerIntro(id, x)}</small></h3>
      <div className="table-scroll"><table className="fund-table sim">
        <thead>
          <tr><th>Deal ID</th><th>Status</th><th>First cheque</th><th>Buybacks</th><th>Follow-on</th><th>Loan</th><th>Entry stake</th><th>Stake at exit</th><th>Exit value</th><th>Fund return</th><th>MOIC</th></tr>
        </thead>
        <tbody>
          {x.lines.map((l, i) => {
            const next = x.lines[i + 1];
            const trackEnd = next !== undefined && l.track !== null && next.track !== l.track;
            const color = TONE_COLOR[l.tone];
            const strong = l.tone === 'green' || l.tone === 'blue';
            return (
              <tr key={l.id} className={trackEnd ? 'track-end' : undefined}>
                <td>{rowId(l)}</td>
                <td><span className={`tag ${l.tone}`}>{l.status}{l.partial ? '*' : ''}</span></td>
                <td>{m(l.first)}</td>
                <td>{m(l.buyback)}</td>
                <td>{m(l.follow)}</td>
                <td>{m(l.loan)}</td>
                <td>{l.n === 1 ? pct(l.entry_pct, 1) : dash}</td>
                <td>{l.exit_pct === null ? dash : pct(l.exit_pct, 1)}</td>
                <td>{l.exit_value === null ? dash : eur(l.exit_value, 'val')}</td>
                <td style={strong ? { color, fontWeight: 700 } : { color }}>{eur(l.proceeds)}</td>
                <td className="moic" style={strong ? undefined : { color }}>{mult(l.moic)}</td>
              </tr>
            );
          })}
          <tr className="sub"><td>Subtotal</td><td>{LAYER_NAME[id]}</td><td>{eur(x.first)}</td><td>{m(x.buyback)}</td><td>{m(x.follow)}</td><td>{m(x.loans)}</td><td>{dash}</td><td>{dash}</td><td>{dash}</td><td>{eur(x.proceeds.target)}</td><td className="moic">{mult(x.moic.target)}</td></tr>
        </tbody>
      </table></div>
    </div>
  );
}

function Simulation() {
  return (
    <div className="pf-section" id="simulation" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Appendix · Fund simulation</span>
        <h2 className="h2">Line-by-line entry, buybacks, loans &amp; exit.<br /><em>Target case, every position of the three layers.</em></h2>
        <p className="pf-intro">Ownership at exit is higher than at entry on every line where the founder grows with us: buybacks and cancellations lift our stake with his.</p>
        {LAYER_IDS.map((id) => <SimTable key={id} id={id} />)}
        <div className="table-scroll pv-total"><table className="fund-table">
          <tbody>
            <tr className="sub"><td>Total</td><td>First cheques {eur(A.first)}</td><td>Buybacks {eur(LAYER_IDS.reduce((s, id) => s + L[id].buyback, 0))}</td><td>Follow-on {eur(LAYER_IDS.reduce((s, id) => s + L[id].follow, 0))}</td><td>Loans {eur(A.loans)}</td><td>Fund return {eur(TARGET.gross_proceeds)}</td><td className="moic">{mult(TARGET.gross_moic)}</td></tr>
          </tbody>
        </table></div>
        <p className="pf-fine">
          Fund return at exit value, equity plus loan repayment. Pact clause 9 (from year {SEC.year}, the company can buy back up to a quarter of
          our stake, at a discount) is the company’s option: it is not used in the target case; the stress test shows it.
        </p>
      </div>
    </div>
  );
}

function Performance() {
  const cell = (i: number) => (i === 0 ? 'hl' : undefined);
  const rows: [string, (id: 'target' | 'base' | 'stress') => string][] = [
    ['Fund size', () => FUND_SIZE],
    ['Gross proceeds, exits and loans', (id) => eur(C[id].gross_proceeds)],
    ['Net TVPI', (id) => mult(C[id].net_tvpi)],
    ['Net IRR', (id) => pct(C[id].net_irr)],
    ['Net DPI by year 6', (id) => mult(C[id].dpi_year6)],
    ['Net DPI by year 7', (id) => mult(C[id].dpi_year7)],
    ['Loans: repaid ÷ lent', (id) => mult(C[id].loans_multiple, 2)],
    ['Largest exit', (id) => eur(C[id].largest_exit, 'val')],
  ];
  return (
    <div className="pf-section" id="performance">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Appendix · Fund performance</span>
        <h2 className="h2">Target returns, built line by line.<br /><em>Net of fees, expenses and carry.</em></h2>
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          <div className="table-scroll" style={{ marginTop: 0 }}><table className="perf-table">
            <thead><tr><th>Metric</th><th className="hl">Target</th><th>Base</th><th>Stress</th></tr></thead>
            <tbody>
              {rows.map(([label, fn]) => (
                <tr key={label}><td>{label}</td>{CASE_IDS.map((id, i) => <td key={id} className={cell(i)}>{fn(id)}</td>)}</tr>
              ))}
            </tbody>
          </table></div>
          <div className="table-scroll" style={{ marginTop: 0 }}><table className="perf-table">
            <thead><tr><th>Stress test, Target case</th><th>Net TVPI</th><th>Net IRR</th></tr></thead>
            <tbody>
              {fund.stress_tests.map((s) => (
                <tr key={s.id}><td>{s.label}</td><td>{mult(s.net_tvpi)}</td><td>{pct(s.net_irr)}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <p className="pf-fine">
          Net = after management fees ({pct(T.fee_ip_pct)} on commitments for {F.investment_period_years} years, {pct(T.fee_loan_pct)} on the loan sleeve, then {pct(T.fee_post_pct, 1)} on invested capital, loans included until repaid), fund expenses
          and carried interest ({pct(T.carry_pct)} over an {pct(T.hurdle_pct)} hurdle, European whole-of-fund waterfall with GP catch-up), before tax. Investments over {F.investment_period_years} years, exits from year {EXIT_YEARS[0]} to year {EXIT_YEARS[1]}.
          Base: every exit value ×{pct(C.base.exit_mult)}. Stress: every exit value ×{pct(C.stress.exit_mult)}. Loans priced at {pct(fund.loan_rate)} a year on healthy companies ({mult(fund.loan_multiples.performing_min, 2)} to {mult(fund.loan_multiples.performing_max, 2)} by tenor, no warrants), drawn in tranches;
          zombies repay {mult(fund.loan_multiples.zombie)}, plus {loanLoss('target')}, {loanLoss('base')} and {loanLoss('stress')} further losses on every loan by case. Buybacks priced {pct(Math.min(...WINNER_DISC))}–{pct(Math.max(...WINNER_DISC))} below the valuation of the time on winners
          and angels, {pct(STRUCT_DISC)} below from structural sellers (end-of-life funds). When a founder raises elsewhere, ProFund follows in new shares ({ALL_LINES.filter((l) => l.follow).map((l) => l.id).join(', ')}). G-02 and G-04 are fresh growth rounds in new shares;
          every first cheque carries a 1× non-participating preference. G-06 is a block bought in S-01, counted as one company with it. Zombies return 0.5× of the equity invested. Any growth position can be
          topped up to {eur(F.company_max_with_spv, 'tile')} with SPVs, outside the fund. Net TVPI on paid-in capital. Loan recycling not included. Targets are model outputs, not a forecast or a guarantee.
        </p>
        <Downloads />
      </div>
    </div>
  );
}

// Le modèle Excel (scripts/fund_xlsx.py) et la fiche PDF (scripts/factsheet.py),
// régénérés depuis fund.json ; leurs ?v= vivent dans src/lib/links.ts.
function Downloads() {
  return (
    <div className="pv-dls">
      <a className="pv-dl" href={MODEL_XLSX_URL} download>
        <span className="pv-dl-ic"><Icon name="sheet" /></span>
        <span><b>Fund model (Excel)</b><small>Every line, cash flow and the waterfall, in live formulas</small></span>
      </a>
      <a className="pv-dl" href={FACTSHEET_URL} download>
        <span className="pv-dl-ic"><Icon name="file" /></span>
        <span><b>Fact sheet (PDF)</b><small>Four pages, fund simulation included</small></span>
      </a>
    </div>
  );
}

function Contact({ onFollow }: { onFollow: () => void }) {
  return (
    <section className="pv-sec pv-sec-end" id="contact">
      <div className="pv-wrap">
        <div className="pv-band">
          <div>
            <h2>Request LP access</h2>
            <p>Fact sheet, fund model (Excel) and data room, for professional and eligible investors. Contact: <a className="pv-band-a" href="mailto:alexandre@profund.vc">alexandre@profund.vc</a></p>
          </div>
          <div className="pv-band-ctas">
            <Link to="/lp" className="pv-btn light">Request LP access <Icon name="arrow" /></Link>
            <button type="button" className="pv-btn ghost-light" onClick={onFollow}>Follow our deal flow live</button>
          </div>
        </div>
        {/* La mention de pré-commercialisation, inchangée (même texte que /lp, la fiche et /legal). */}
        <p className="pv-note">
          This document is a pre-marketing communication within the meaning of Article 4a of Regulation (EU) No 345/2013 (EuVECA).
          The fund is not yet established and no units may be subscribed at this stage. For professional and eligible investors only.
        </p>
      </div>
    </section>
  );
}

const PITCH_LINKS = [
  { href: '#shift', label: 'Thesis' },
  { href: '#math', label: 'Founder math' },
  { href: '#alignment', label: 'Alignment' },
  { href: '#team', label: 'Team' },
  { href: '#terms', label: 'Terms' },
  { href: '#simulation', label: 'Simulation' },
];

export default function ProFundPage() {
  // Un seul popup pour la page : le moteur de deal flow (OurEdge) et le bloc contact l'ouvrent.
  const [open, setOpen] = useState(false);
  const follow = () => setOpen(true);
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  return (
    <>
      <SiteHeader links={PITCH_LINKS}>
        <a href={MODEL_XLSX_URL} className="pv-btn line pv-hide-sm" download><Icon name="sheet" />Excel model</a>
        <Link to="/lp" className="pv-btn">Request LP access</Link>
      </SiteHeader>
      <TitleSlide />
      <TheShift />
      <Manifesto tint />
      <FourLaws tint={false} />
      <TheProblem />
      <TheInversion />
      <HowWeBack />
      <EveryStage />
      <FounderMathSlide />
      <EveryoneWins />
      <Alignment />
      <OurEdge onFollow={follow} />
      <ProofOfWork />
      <SignedPipeline />
      <Team />
      <TermsAndTargets />
      <Construction />
      <hr className="pf-div" />
      <Simulation />
      <Performance />
      <Contact onFollow={follow} />
      <DealFlowModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
