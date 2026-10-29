import { useState } from 'react';
import DealFlowModal from './DealFlowModal';
import { fund, eur, eurRange, mult, pct, rowId, outcomeTag, type CaseId, type LayerId } from '../lib/fund';

const LOGO_URL = '/logo.png';
const GP_PHOTO_URL = '/gp-photo.jpg';

// Chiffres du fonds : src/data/fund.json, généré par scripts/fund_model.py.
// Ne jamais taper un montant, un multiple ou un TRI du fonds dans ce fichier.
const F = fund.fund;
const T = fund.terms;
const L = fund.layers;
const A = fund.allocation;
const R = fund.reserve_policy;
const TARGET = fund.cases.target;
const BASE = fund.cases.base;
const STRESS = fund.cases.stress;
const BASE_CAP = eur(BASE.exit_cap ?? 0, 'val');
const STRESS_CAP = eur(STRESS.exit_cap ?? 0, 'val');

function HeroSection() {
  return (
    <div id="hero" style={{ padding: '52px 0 56px', borderBottom: '1px solid var(--line)' }}>
      <div className="pf-wrap" style={{ textAlign: 'center' }}>
        <img src={LOGO_URL} className="hero-logo" alt="ProFund" style={{ display: 'block', margin: '0 auto 20px' }} />
        <div style={{ display: 'inline-block', border: '1px solid var(--line)', color: 'var(--mid)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', padding: '8px 24px', marginBottom: '18px' }}>Pre-Marketing Phase</div>
        <span className="hero-tagline" style={{ display: 'block' }}>AI-Native Venture Platform</span>
        <h1 className="hero-title">We find Europe's next<br /><em>category winners.</em></h1>
        <p className="hero-sub" style={{ maxWidth: '720px', margin: '0 auto 18px' }}>A {eur(F.commitments, 'tile')} European venture fund, seed to growth. We lead at seed, enter at the inflection point in Series A and double down on our breakouts, up to {eur(F.company_max_with_spv, 'tile')} per company with co-investment SPVs.<br /><br />Targeting domain-specific AI harness with self-improving loops built by highly technical AI-native teams.<br /><br />Powered by an in-house AI platform that tracks every European seed round and reads 24/7 weak signals in emerging categories. Our objective: never miss a European company entering exponential growth.</p>
        <p className="hero-note">{eur(F.commitments, 'tile')} Target · Seed to Growth · Europe · Up to {eur(F.company_max_with_spv, 'tile')} per company</p>
        <div style={{ marginBottom: '40px' }}>
          <a href="#contact" className="btn">Request LP Access</a>
        </div>
        <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">{eur(F.commitments, 'tile')}</span><span className="sg-l">Target Fund I · closed-ended · closings over {F.closing_months} months</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">3 layers</span><span className="sg-l">{L.seed.companies} Seed · {L.venture.companies} Venture · Growth for our breakouts</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">Weekly</span><span className="sg-l">Seed Radar — every European seed round re-scored on growth signals</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">6–18mo</span><span className="sg-l">Average detection lead before public announcement</span></div>
        </div>
      </div>
    </div>
  );
}

function TheOpportunity() {
  return (
    <div id="thesis" className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">The Opportunity</span>
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>
          <div>
            <h2 className="h2">Every great company was<br /><em>invisible before it was obvious.</em></h2>
            <p style={{ fontSize: '13px', color: 'var(--sub)', lineHeight: 1.8, marginBottom: '12px' }}>When a new category emerges, there is a window — twelve to eighteen months — where the future winner is already visible in the weak signals, but invisible to the market. The founding team is there. The architecture is taking shape. The data loop is being designed.</p>
            <p style={{ fontSize: '13px', color: 'var(--sub)', lineHeight: 1.8, marginBottom: '12px' }}>Whoever enters that window invests at the right valuation, builds the relationship before anyone else, and backs the right founder before the category is decided. Missing that window means paying three to five times more for the same company once TechCrunch writes about it.</p>
            <p style={{ fontSize: '13px', color: 'var(--sub)', lineHeight: 1.8 }}>The challenge is not judgment. Every good VC has judgment. <strong style={{ color: 'var(--ink)' }}>The challenge is seeing the signal before it becomes noise</strong> — systematically, on every emerging category, every day. That requires a system. Not a bigger team.</p>
          </div>
          <div>
            <div className="stat-grid" style={{ marginBottom: '16px' }}>
              <div className="sg"><span className="sg-n">3–5×</span><span className="sg-l">Higher entry valuation once TechCrunch writes about it — vs. the same company detected 12 months earlier</span></div>
              <div className="sg"><span className="sg-n">6–18mo</span><span className="sg-l">Average detection lead before any public announcement in our current pipeline</span></div>
              <div className="sg"><span className="sg-n">{pct(TARGET.net_irr)}</span><span className="sg-l">Target net IRR, after fees, expenses and carry · base case {pct(BASE.net_irr)} with no exit above {BASE_CAP}</span></div>
              <div className="sg"><span className="sg-n">{mult(TARGET.net_tvpi)}</span><span className="sg-l">Target net TVPI · {eur(TARGET.gross_exits, 'tile')} gross exit value on a {eur(F.commitments, 'tile')} fund</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// La thèse v2 : un seul fonds du seed à la growth. Les chiffres de tiers
// (Lovable, Stripe) sont sourcés en note : ne pas les arrondir ni les
// reformuler sans relire la source.
function WhyOneFund() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Why One Fund, Seed to Growth</span>
        <div className="fw-grid">
          <div>
            <h2 className="h2">The stage ladder has collapsed.<br /><em>We position just before the exponential.</em></h2>
            <p className="fw-body">AI-native companies no longer climb one stage every eighteen months. The best of them go from first revenue to growth-stage metrics in a few months, with a fraction of the team a SaaS company needed. A fund split by stage arrives either too early or too late.</p>
            <p className="fw-body">The value created by AI growth has nothing in common with classic software growth: it compounds faster, with far fewer resources. What these companies still need capital for is people — a small number of exceptional profiles, with a culture of excellence and radical execution, the Revolut standard. <strong>Our tickets fund that talent density.</strong></p>
            <p className="fw-body">So ProFund is one fund, organised in three layers. We lead at seed when we detect the team before the round, we enter at the inflection point when the curve bends, and we double down at growth — from {eur(L.seed.ticket_min, 'tile')} to {eur(F.company_max_with_spv, 'tile')} in the same company, without changing vehicle.</p>
            <p className="fw-body"><strong>The Seed Radar.</strong> Every European seed round is tracked, company by company, and re-scored every week on growth signals: exceptional hires, hiring velocity, traffic, product releases, revenue proxies, back-to-back rounds. Our objective: never miss a European company entering exponential growth.</p>
          </div>
          <div>
            <div className="fw-stats">
              <div className="fw-s hl"><span className="fw-big">8 mo</span><div className="fw-det"><strong>Lovable (Stockholm)</strong> went from launch to $100M ARR in eight months, with 45 employees.¹</div></div>
              <div className="fw-s"><span className="fw-big">24 mo</span><div className="fw-det"><strong>To $5M ARR</strong> for the top 100 AI companies on Stripe (2024), against 37 months for SaaS companies (2018).²</div></div>
              <div className="fw-s"><span className="fw-big">Every</span><div className="fw-det"><strong>European seed round</strong> tracked by the Seed Radar and re-scored weekly, so the fund can move the moment the curve bends.</div></div>
              <div className="fw-s"><span className="fw-big">{eur(F.company_max_with_spv, 'tile')}</span><div className="fw-det"><strong>Per company, in one fund.</strong> Up to {eur(F.company_cap, 'tile')} from the fund across the three layers, the rest through co-investment SPVs.</div></div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--lite)', marginTop: '12px', lineHeight: 1.6 }}>¹ TechCrunch, 23 July 2025 (company-reported figures). ² Stripe 2025 annual letter, reported by TechCrunch on 27 February 2025.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThePlatform() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">The Platform</span>
        <h2 className="h2">Every weak signal in an emerging category.<br /><em>Automatically. Before anyone else sees it.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '620px', marginBottom: '36px' }}>Physical network and human interactions with top founders. Digitally, the latest AI tools sit on top of our in-house sourcing platform — more than 25 custom engines reading 24/7 weak signals in emerging categories, detecting founders matching our thesis before they become obvious to the category.</p>
        <div className="mods">
          <div className="mod">
            <div className="mod-num">① WHAT IT READS</div>
            <div className="mod-title">25+ custom engines. Parallel. Every morning.</div>
            <div className="mod-sub">The latest AI tools, added to our in-house sourcing platform.</div>
            <div className="mod-desc">SSL certificate registrations · Pappers legal filings · GitHub repositories · leadership at Tier 1 startups changing jobs · LinkedIn job posts · semantic search · grandes écoles alumni networks. Every signal matched against our active themes. Every match qualified automatically against dozens of green flags and red flags, weighted by their historical predictive accuracy.<br /><br /><strong>A full investment memo and financial model generated automatically for every high-conviction match. Only the top 1% surfaces as a CALL — the only verdict that requires human attention.</strong> The same engine operates outbound for Proplace, Maximum Insurance, ProFund and portfolio startups — and books meetings with AI-native founders (seed, where we lead; Series A and growth, where we invest alongside Tier 1 funds) and international VCs for allocation.</div>
            <div className="mod-out">
              <span className="mod-out-title">Output</span>
              <div className="mod-out-row"><strong>Daily curated pipeline</strong> — off-market opportunities matching active themes, pre-ranked by conviction score.</div>
              <div className="mod-out-row"><strong>Detects teams 6–18 months</strong> before they appear on TechCrunch or Crunchbase.</div>
            </div>
          </div>
          <div className="mod">
            <div className="mod-num">② WHAT IT FINDS</div>
            <div className="mod-title">Representative signals from the platform.</div>
            <div className="mod-sub">These are examples of what the system detects — the type of early signal that precedes every category winner.</div>
            <div className="mod-desc">
              <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '2px solid var(--line)' }}>
                <strong style={{ color: 'var(--ink)', fontSize: '12px' }}>→ SSL certificate registered.</strong><span style={{ color: 'var(--sub)', fontSize: '12px' }}> No LinkedIn, no press, no Crunchbase entry. Detected 3 weeks before first public mention.</span>
              </div>
              <div style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '2px solid var(--line)' }}>
                <strong style={{ color: 'var(--ink)', fontSize: '12px' }}>→ New SARL registered, NAF 6201Z — founder ex-Doctolib.</strong><span style={{ color: 'var(--sub)', fontSize: '12px' }}> Detected via Pappers, 6 weeks before Crunchbase listing.</span>
              </div>
              <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--line)' }}>
                <strong style={{ color: 'var(--ink)', fontSize: '12px' }}>→ GitHub repo created, 2 contributors, ex-Alan engineering team.</strong><span style={{ color: 'var(--sub)', fontSize: '12px' }}> Detected 11 months before Series A announcement.</span>
              </div>
            </div>
          </div>
          <div className="mod">
            <div className="mod-num">③ WHAT MAKES IT COMPOUND</div>
            <div className="mod-title">The Platform Learns From Every Decision.</div>
            <div className="mod-sub">Every GO and NO-GO updates the detection parameters every Monday.</div>
            <div className="mod-desc">Sourcing queries sharpen. Qualification flags are reweighted. Founder profiles evolve toward recent winners. After six months, the system reflects the GP's actual conviction with a precision no competitor can reverse-engineer.<br /><br /><strong>The gap with a manual fund widens every week. Indefinitely.</strong> No competitor can reverse-engineer the accumulated pattern of decisions.</div>
            <div className="mod-out">
              <span className="mod-out-title">The compounding advantage</span>
              <div className="mod-out-row"><strong>Weekly thesis calibration</strong> — decision patterns automatically update scoring weights every Monday.</div>
              <div className="mod-out-row">After 12 months, our deal flow is structurally irreplicable.</div>
            </div>
          </div>
          <div className="mod">
            <div className="mod-num">④ WHAT IT NEVER DOES</div>
            <div className="mod-title">The Judgment Remains Human.</div>
            <div className="mod-sub">The platform creates the conditions. The GP makes the call.</div>
            <div className="mod-desc">The platform never replaces the judgment that decides whether a founder is exceptional, whether a data moat is real, whether the timing is right. That judgment is ours.<br /><br />The platform creates the conditions for that judgment to be applied at the right moment — on the right deals, with full information, without the noise. <strong>The system finds the signal. The GP decides.</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowThemesWork() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">How Themes Work</span>
        <h2 className="h2">The themes are the parameters.<br /><em>The system is the edge.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '620px', marginBottom: '36px' }}>A theme is an emerging category where the future winner is not yet decided — where there is still alpha for an early investor who can identify the right founding team before the market does. We start with two themes. We add new ones as new categories emerge. We retire themes when a category matures — when the winner is obvious, when valuations reflect the opportunity, when the alpha is gone.</p>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '20px 24px', marginBottom: '36px', fontSize: '12px', lineHeight: 1.8 }}>
          <p style={{ color: 'var(--sub)', margin: 0 }}>This is not a fixed mandate. It is a living system that covers the most promising emerging categories in European software at any given moment — with the same depth, the same speed, the same precision, regardless of which themes are active. The GP's job is to decide when a new category deserves focus — and when it no longer does.</p>
        </div>
        <div className="mods">
          <div className="mod">
            <div className="mod-num">① AI WORKFLOW EXECUTOR</div>
            <div className="mod-title">Professional work executed by AI, charged per outcome.</div>
            <div className="mod-sub">The category being created.</div>
            <div className="mod-desc">Today, every professional service firm charges per hour or per seat. The transition to charging per outcome — per audit completed, per contract reviewed, per filing submitted — is just beginning. The companies that own this transition in European regulated verticals will be among the most valuable software businesses of this decade.<br /><br />The future winner is being built right now. Probably in Paris, London, or Stockholm. Probably by a former senior professional in a regulated vertical paired with a strong ML engineer. Probably with a private GitHub repo that shows a fine-tuning pipeline nobody has noticed yet.<br /><br /><strong>Our platform finds that team before they have a website.</strong> The GP judges whether the data architecture is real — because he has done the work these products automate, manually, at Ardian and Partech.</div>
            <div className="mod-out">
              <span className="mod-out-title">Current proof points</span>
              <div className="mod-out-row">Leya · Robin AI · Legartis</div>
            </div>
          </div>
          <div className="mod">
            <div className="mod-num">② REGULATED INTERMEDIARY OS</div>
            <div className="mod-title">The operating system for European regulated intermediaries.</div>
            <div className="mod-sub">The category being created.</div>
            <div className="mod-desc">Expert-comptables, insurance brokers, HR consultants — every one of them manages a portfolio of SMB clients with tools built in the 1990s. The platform that becomes their operating system wins distribution, data, and switching cost simultaneously. The SMB clients follow the intermediary. The category leader becomes indispensable without ever running a direct sales cycle.<br /><br />This category has already produced Pennylane, Alan, and PayFit — some of the best seed returns in France of the past decade. It is not finished. The next wave — AI-native, broader in scope, faster to deploy — is starting now. No other fund is scanning for it systematically.<br /><br /><strong>Our platform detects it via NAF code filings and intermediary network job posts</strong> — weeks before any Crunchbase entry. The GP judges whether the distribution mechanic is real — because sourcing through a network rather than a direct target is exactly how M&A works, and he ran that process at Leboncoin.</div>
            <div className="mod-out">
              <span className="mod-out-title">Current proof points</span>
              <div className="mod-out-row">Pennylane · Alan · PayFit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TheConversion() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">The Conversion</span>
        <div className="fw-grid">
          <div>
            <h2 className="h2">The platform finds the signal.<br /><em>The relationship wins the deal.</em></h2>
            <p className="fw-body">Detection is the beginning, not the end. When the platform surfaces a founding team — via a GitHub repo, a Pappers filing, a LinkedIn job post — we reach out immediately. Before they are fundraising. Before they have a deck. Before any other VC has noticed them.</p>
            <p className="fw-body">The first message is specific enough to show we read their code, understood their architecture, and have a view on why their data moat is defensible. That precision — delivered before the founder has a public profile — is not forgotten. By the time they open a round, we are already a partner in their thinking, not an evaluator arriving late.</p>
            <p className="fw-body">We track grandes écoles networks — X, Centrale, HEC, ESSEC, EPFL — as primary signal sources. A founding team from the incubateur de l'X or Station F is in our system before they register their SARL. <strong>The digital connection always precedes the human one.</strong> But it makes the human one possible — and warmer — than any cold introduction could.</p>
            <p className="fw-body">Domain expertise closes the final gap. A founder automating M&A due diligence knows immediately that the GP has done that work manually for years. That credibility cannot be faked — and it turns a first conversation into a term sheet faster than any brand name.</p>
          </div>
          <div className="fw-stats">
            <div className="fw-s"><span className="fw-big">Before</span><div className="fw-det"><strong>We reach founders before the round opens.</strong> Before the deck exists. The founder who receives a message showing we understood their architecture before anyone else noticed them remembers that.</div></div>
            <div className="fw-s hl"><span className="fw-big">1%</span><div className="fw-det"><strong>Human time reserved exclusively</strong> for founding teams that clear the algorithmic threshold. Every other signal is processed automatically.</div></div>
            <div className="fw-s"><span className="fw-big" style={{ fontSize: '28px', letterSpacing: '0' }}>X · HEC</span><div className="fw-det"><strong>Grandes écoles networks.</strong> X · Centrale · HEC · ESSEC · EPFL. Primary signal sources. Teams in our system before they register their SARL.</div></div>
            <div className="fw-s"><span className="fw-big">0</span><div className="fw-det"><strong>Cold introductions.</strong> Every outreach is specific, informed, and timed to the moment the signal appears — not when the founder is already meeting 20 other funds.</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 29/10 (Alexandre) — la vision et les critères : la thèse du fonds (theses/profund_vc/v2.json
// du monorepo) en clair pour un LP, et la preuve que le GP l'applique à lui-même.
const OPERATED = [
  { name: 'Proplace', what: 'AI harness for corporate development' },
  { name: 'Maximum Insurance', what: 'Swiss travel insurtech & travel risk management platform' },
  { name: 'Sosuites', what: 'AI-assisted personalised art prints' },
];

function WhatWeBack() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">What We Back</span>
        <h2 className="h2">An age of abundance is starting.<br /><em>We back the people who will build it.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.8, maxWidth: '760px', marginBottom: '12px' }}>With AI, a handful of people can now build what once took thousands. Founders who direct AI agents will turn their ambitions into companies in record time. We believe AI will first free humanity from material constraints, then give people the time and freedom to pursue what matters most.</p>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.8, maxWidth: '760px', marginBottom: '28px' }}>Our fund is built for that world: it uses AI everywhere it can, and its capital goes first to the best people — those who get the most leverage out of AI. <strong style={{ color: 'var(--ink)' }}>These five criteria are our fund thesis. They drive the Deal Engine every morning.</strong></p>
        <div className="serve-grid">
          <div className="sc"><div className="sc-h">01 · Founders, From Day One</div><p className="sc-p">Exceptional, highly technical founders, detected before their first round through alumni networks, tier-1 departures, GitHub and job posts. At seed, we lead or co-lead with {eur(L.seed.ticket_min, 'tile')} to {eur(L.seed.ticket_max, 'tile')}.</p></div>
          <div className="sc"><div className="sc-h">02 · Every Seed Round</div><p className="sc-p">The Seed Radar follows every European pre-seed and seed round of the last 24 months and re-scores each company on dated, sourced growth signals. A round proves that someone else underwrote the founders.</p></div>
          <div className="sc"><div className="sc-h">03 · The Inflection</div><p className="sc-p">We double down when the curve bends: ARR tripling in 12 months, EUR 1M ARR within 18 months of launch, record revenue per employee. Venture and Growth layers, up to {eur(F.company_max_with_spv, 'tile')} per company with SPVs.</p></div>
          <div className="sc"><div className="sc-h">04 · Fund Returners</div><p className="sc-p">Category leaders in Europe with global ambition, a TAM above EUR 10B and winner-take-most dynamics. Each position must be able to return a meaningful part of the fund at its layer.</p></div>
          <div className="sc"><div className="sc-h">05 · Autonomy by Design</div><p className="sc-p">Companies that run as autonomously as possible: self-improving AI loops at the core, and small teams that pilot AI agents with maximum leverage to build the most ambitious things.</p></div>
          <div className="sc" style={{ background: 'var(--ink)' }}><div className="sc-h" style={{ color: '#fff' }}>We Live It</div><p className="sc-p" style={{ color: 'rgba(255,255,255,.78)' }}>One GP and a team of AI agents run the fund — and operate three companies almost autonomously: {OPERATED.map((o) => o.name).join(', ')}. They are 100% owned by the GP and sit outside the fund. We apply to ourselves what we look for in founders.</p></div>
        </div>
      </div>
    </div>
  );
}

function WinningFounder() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Why the Best Founders Choose ProFund</span>
        <h2 className="h2">We were there first.<br /><em>And we can prove it.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '28px' }}>Why the best founders choose ProFund over generalist VCs.</p>
        <div className="serve-grid">
          <div className="sc"><div className="sc-h">We Were There First</div><p className="sc-p">We reach out before the round opens, before the deck exists. The founder who receives a message showing we understood their architecture before anyone else noticed them remembers that. The relationship starts months before any process.</p></div>
          <div className="sc"><div className="sc-h">A GP Who Built What We Use</div><p className="sc-p">The AI-native venture platform powering ProFund's deal flow was built and is operated by the GP. We understand data moat architecture and agent design at a level most VCs cannot — because we made those decisions ourselves.</p></div>
          <div className="sc"><div className="sc-h">Hands-On AI Support</div><p className="sc-p">Expert in AI-powered tools (n8n, Make, Airtable, any API, MCP servers, Cursor). We help founders stress-test their architecture and design autonomous workflows — ensuring they build defensible data moats, not LLM wrappers.</p></div>
          <div className="sc"><div className="sc-h">M&A Wargaming From Day One</div><p className="sc-p">Algorithms that detect acquisition races before the market. We know who will want to buy your company before you do — and we structure the exit path from the first term sheet.</p></div>
          <div className="sc"><div className="sc-h">Automated Elite Governance</div><p className="sc-p">Fund administration 100% externalized. Daily &amp; weekly reporting fully automated. Our platform parses founders' reports instantly, updates evergreen investment memos, and flags risks in real-time.</p></div>
          <div className="sc"><div className="sc-h">Full Alignment</div><p className="sc-p">GP commitment of at least {pct(T.gp_commit_min_pct)} of the fund, in cash. When we back a founder, the GP is on the line.</p></div>
        </div>
      </div>
    </div>
  );
}

const LAYER_NAME: Record<LayerId, string> = { seed: 'Seed', venture: 'Venture', growth: 'Growth' };
const CASE_IDS: CaseId[] = ['target', 'base', 'stress'];
const TIER_TAG: Record<LayerId, string> = {
  seed: 'Layer 1 — Seed',
  venture: 'Layer 2 — Venture',
  growth: 'Layer 3 — Growth',
};

// Lignes des cartes d'étage : le texte est ici, tous les chiffres viennent de fund.json.
function tierRows(id: LayerId): [string, string][] {
  const x = L[id];
  const entry = `${eurRange(x.entry_post_min, x.entry_post_max)} post`;
  const invested = `${eur(x.invested)} · ${eur(x.initial)} initial + ${eur(x.follow_on)} follow-on`;
  if (id === 'seed') return [
    ['Ticket', `${eurRange(x.ticket_min, x.ticket_max)} initial · pro-rata reserved`],
    ['Stage', 'Pre-seed / seed · we lead or co-lead'],
    ['Entry valuation', entry],
    ['Ownership', `${pct(x.ownership_min)} – ${pct(x.ownership_max, 1)} at entry`],
    ['Edge', 'Team detected before the round'],
    ['Invested', invested],
  ];
  if (id === 'venture') return [
    ['Ticket', `${eurRange(x.ticket_min, x.ticket_max)} initial · pro-rata reserved`],
    ['Stage', 'Seed+ / Series A · at the inflection point'],
    ['Entry valuation', entry],
    ['Ownership', `${pct(x.ownership_min)} – ${pct(x.ownership_max)} at entry`],
    ['Edge', 'Entry triggered by the Seed Radar · next to a Tier 1 lead'],
    ['Invested', invested],
  ];
  return [
    ['Ticket', `${eurRange(x.ticket_min, F.company_cap)} from the fund · up to ${eur(F.company_max_with_spv, 'tile')} with SPVs`],
    ['Stage', 'Series B and beyond'],
    ['Entry valuation', entry],
    ['Priority', `At least ${pct(x.internal_min_pct ?? 0)} for our own breakouts · external deals alongside leading growth funds`],
    ['Invested', `${eur(x.invested)} · ${pct(x.internal_pct ?? 0)} in our own breakouts`],
  ];
}

function TierCard({ id }: { id: LayerId }) {
  const x = L[id];
  const head = id === 'growth' ? `Growth · ${x.positions} Positions` : `${LAYER_NAME[id]} · ${x.companies} Companies`;
  return (
    <div className={`tier ${id}`}>
      <div className="tier-tag">{TIER_TAG[id]}</div>
      <div className="tier-h">{head}</div>
      {tierRows(id).map(([label, value]) => (
        <div key={label} className="tier-row"><span className="tier-label">{label}</span>{value}</div>
      ))}
    </div>
  );
}

function PortfolioArch() {
  const g = L.growth;
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Portfolio Architecture</span>
        <h2 className="h2">The Conviction Funnel.<br /><em>One Fund, From Seed to Growth.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '32px' }}>A {eur(F.commitments, 'tile')} European venture fund in three layers. Seed is {L.seed.companies} companies where we lead or co-lead before the round. Venture is {L.venture.companies} entries at the inflection point, next to a Tier 1 lead. Growth doubles down on our breakouts, alongside leading growth funds. The best Seed companies graduate to Venture, the best Venture companies to Growth.</p>
        <div className="funnel-grid">
          <div>
            {(['seed', 'venture', 'growth'] as LayerId[]).map((id) => <TierCard key={id} id={id} />)}
          </div>
          <div>
            <div className="fw-stats">
              <div className="fw-s"><span className="fw-big">{eur(F.commitments, 'tile')}</span><div className="fw-det"><strong>Total fund.</strong> {eur(A.invested)} invested · {eur(A.mgmt_fees)} management fees · {eur(A.fund_expenses)} fund expenses · {eur(A.contingency)} contingency.</div></div>
              <div className="fw-s hl"><span className="fw-big">{F.companies}</span><div className="fw-det"><strong>Companies.</strong> {L.seed.companies} Seed · {L.venture.companies} Venture · {g.companies} external Growth, plus {g.positions - g.companies} Growth follow-ons in our own breakouts.</div></div>
              <div className="fw-s"><span className="fw-big">{pct(A.follow_on_pct)}</span><div className="fw-det"><strong>Reserved for follow-ons.</strong> Pro-rata and super pro-rata in the companies that go exponential.</div></div>
              <div className="fw-s"><span className="fw-big">{eur(F.company_cap, 'tile')}</span><div className="fw-det"><strong>Maximum per company from the fund</strong> ({pct(F.company_cap_pct)} of commitments). Up to {eur(F.company_max_with_spv, 'tile')} with one or several co-investment SPVs.</div></div>
              <div className="fw-s"><span className="fw-big">{eur(TARGET.gross_exits, 'tile')}</span><div className="fw-det"><strong>Target gross exit value.</strong> Seed {eur(L.seed.proceeds.target)} · Venture {eur(L.venture.proceeds.target)} · Growth {eur(g.proceeds.target)}.</div></div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '40px' }}>
          <span className="eyebrow">Follow-on Reserves</span>
          <div className="table-scroll"><table className="fund-table">
            <thead>
              <tr><th>Layer</th><th>Initial Tickets</th><th>Reserve Assumption</th><th>Follow-On Reserved</th></tr>
            </thead>
            <tbody>
              <tr><td>Seed</td><td>{eur(L.seed.initial)}</td><td>{pct(R.seed.graduation_pct)} raise a Series A of ~{eur(R.seed.next_round, 'tile')}, pro-rata ~{pct(R.seed.pro_rata_pct, 1)} · plus {eur(R.seed.bridges, 'tile')} of bridges</td><td>{eur(L.seed.follow_on)}</td></tr>
              <tr><td>Venture</td><td>{eur(L.venture.initial)}</td><td>{pct(R.venture.graduation_pct)} raise a Series B of ~{eur(R.venture.next_round, 'tile')}, pro-rata ~{pct(R.venture.pro_rata_pct, 1)}</td><td>{eur(L.venture.follow_on)}</td></tr>
              <tr><td>Growth</td><td>{eur(g.external ?? 0)}</td><td>Pro-rata and super pro-rata in our breakouts, Series B and beyond</td><td>{eur(g.internal ?? 0)}</td></tr>
              <tr><td>Total</td><td>{eur(A.initial)}</td><td>{pct(A.follow_on_pct)} of invested capital goes to follow-ons</td><td>{eur(A.follow_on)}</td></tr>
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}

const TONE_COLOR = { green: 'var(--blue-dk)', blue: 'var(--blue-dk)', grey: 'var(--mid)', red: 'var(--red)' } as const;
const SIM_TITLE: Record<LayerId, string> = {
  seed: `The Seed Layer · ${L.seed.companies} Companies.`,
  venture: `The Venture Layer · ${L.venture.companies} Companies.`,
  growth: `The Growth Layer · ${L.growth.positions} Positions.`,
};

// Une table de simulation par étage, même markup que les tables V1 : la ligne
// SUB doit rester la dernière (.fund-table met la dernière ligne en gras).
function FundSimTable({ id, bg }: { id: LayerId; bg?: boolean }) {
  const x = L[id];
  const secondary = new Set(fund.secondary.companies);
  const marked = x.lines.some((l) => secondary.has(l.company));
  return (
    <div className="pf-section" style={bg ? { background: 'var(--bg)' } : undefined}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Fund Simulation</span>
        <h2 className="h2">{SIM_TITLE[id]}<br /><em>Line-by-line Entry, Follow-on &amp; Exit.</em></h2>
        <div className="table-scroll"><table className="fund-table">
          <thead>
            <tr>
              <th>Deal ID</th><th>Status</th><th>Initial Tkt</th><th>Entry Val (Post)</th><th>Entry %</th><th>Follow-On</th><th>Exit % (Diluted)</th><th>Exit Val</th><th>Fund Return</th><th>MOIC</th>
            </tr>
          </thead>
          <tbody>
            {x.lines.map((l) => {
              const tag = outcomeTag(l);
              const color = TONE_COLOR[tag.tone];
              const strong = tag.tone === 'green' || tag.tone === 'blue';
              return (
                <tr key={l.id}>
                  <td>{rowId(l)}{secondary.has(l.company) ? '*' : ''}</td>
                  <td><span className={`tag ${tag.tone}`}>{tag.label}</span></td>
                  <td>{eur(l.initial)}</td>
                  <td>{eur(l.entry_post, 'val')}</td>
                  <td>{pct(l.entry_pct, 1)}</td>
                  <td>{eur(l.follow_on)}</td>
                  <td>{l.exit_pct === null ? '—' : pct(l.exit_pct, 1)}</td>
                  <td>{l.exit_value === null ? '—' : eur(l.exit_value, 'val')}</td>
                  <td style={strong ? { color, fontWeight: 700 } : { color }}>{eur(l.proceeds)}</td>
                  <td className="moic" style={strong ? undefined : { color }}>{mult(l.moic)}</td>
                </tr>
              );
            })}
            <tr><td><strong>SUB</strong></td><td><strong>({LAYER_NAME[id]})</strong></td><td><strong>{eur(x.initial)}</strong></td><td>—</td><td>—</td><td><strong>{eur(x.follow_on)}</strong></td><td>—</td><td>—</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>{eur(x.proceeds.target)}</td><td className="moic">{mult(x.moic.target)}</td></tr>
          </tbody>
        </table></div>
        {(marked || id === 'growth') && (
          <p style={{ fontSize: '11px', color: 'var(--lite)', marginTop: '12px', lineHeight: 1.6 }}>
            {id === 'growth' && <>Positions with a company in brackets are follow-ons in our own breakouts; the external growth deal is made alongside a leading growth fund.<br /></>}
            {marked && <>* Fund Return shown at exit value. In the fund model, {pct(fund.secondary.share)} of this position is sold in a year-{fund.secondary.year} secondary at {pct(fund.secondary.price_pct)} of its exit value (see Fund Performance).</>}
          </p>
        )}
      </div>
    </div>
  );
}

function FundPerformance() {
  const cases = CASE_IDS.map((id) => fund.cases[id]);
  const cell = (i: number) => (i === 0 ? 'hl' : undefined);
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Fund Performance</span>
        <h2 className="h2">Target Returns, Built Line by Line.<br /><em>Net of Fees, Expenses and Carry.</em></h2>
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>
          <div>
            <div className="table-scroll"><table className="perf-table">
              <thead>
                <tr><th>Metric</th><th>Target</th><th>Base</th><th>Stress</th></tr>
              </thead>
              <tbody>
                <tr><td>Fund Size</td>{cases.map((_, i) => <td key={i} className={cell(i)}>{eur(F.commitments, 'tile')}</td>)}</tr>
                <tr><td>Gross Exit Value</td>{cases.map((c, i) => <td key={i} className={cell(i)}>{eur(c.gross_exits, 'tile')}</td>)}</tr>
                <tr><td>Year-{fund.secondary.year} Secondary Discount</td>{cases.map((c, i) => <td key={i} className={cell(i)}>−{eur(c.secondary_discount)}</td>)}</tr>
                <tr><td>Net TVPI</td>{cases.map((c, i) => <td key={i} className={cell(i)}>{mult(c.net_tvpi)}</td>)}</tr>
                <tr><td>Net IRR</td>{cases.map((c, i) => <td key={i} className={cell(i)}>{pct(c.net_irr)}</td>)}</tr>
                <tr><td>Net DPI by Year {fund.secondary.year}</td>{cases.map((c, i) => <td key={i} className={cell(i)}>{mult(c.dpi_year6)}</td>)}</tr>
                {(['seed', 'venture', 'growth'] as LayerId[]).map((layer) => (
                  <tr key={layer}><td>Gross MOIC · {LAYER_NAME[layer]}</td>{CASE_IDS.map((id, i) => <td key={id} className={cell(i)}>{mult(L[layer].moic[id])}</td>)}</tr>
                ))}
              </tbody>
            </table></div>
            <p style={{ fontSize: '11px', color: 'var(--lite)', marginTop: '12px', lineHeight: 1.6 }}>Net = after management fees ({pct(T.fee_ip_pct)} on commitments for {F.investment_period_years} years, then {pct(T.fee_post_pct, 1)} on invested capital), fund expenses and carried interest ({pct(T.carry_pct)} over an {pct(T.hurdle_pct)} hurdle, European whole-of-fund waterfall with GP catch-up), before tax. The target assumes one fund returner ({fund.fund_returner.company}, returning {mult(fund.fund_returner.multiple_of_fund)} the fund across its Seed and Growth lines) and a year-{fund.secondary.year} secondary sale of {pct(fund.secondary.share)} of the two largest winners at {pct(fund.secondary.price_pct)} of their exit value. Base caps every exit value at {BASE_CAP}, Stress at {STRESS_CAP}; everything else is unchanged. Targets are model outputs, not a forecast or a guarantee.</p>
          </div>
          <div className="fw-stats">
            <div className="fw-s hl"><span className="fw-big">{pct(TARGET.net_irr)}</span><div className="fw-det"><strong>Target net IRR.</strong> Base case {pct(BASE.net_irr)} with no exit above {BASE_CAP}.</div></div>
            <div className="fw-s"><span className="fw-big">{mult(TARGET.net_tvpi)}</span><div className="fw-det"><strong>Target net TVPI.</strong> Base case {mult(BASE.net_tvpi)}, stress case {mult(STRESS.net_tvpi)}.</div></div>
            <div className="fw-s"><span className="fw-big">{mult(TARGET.dpi_year6)}</span><div className="fw-det"><strong>Net DPI by year {fund.secondary.year}.</strong> Partial secondaries on our winners return capital early.</div></div>
            <div className="fw-s"><span className="fw-big">{mult(fund.fund_returner.multiple_of_fund)}</span><div className="fw-det"><strong>One fund returner.</strong> {fund.fund_returner.company} returns the fund across its Seed and Growth lines.</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExitStrategy() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Exit Strategy</span>
        <h2 className="h2">Reverse-Engineering the Exit.<br /><em>AI-Powered Wargaming &amp; Kingmaker Assets.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '32px' }}>We only invest if we can identify the exit at entry. Every position is underwritten against two scenarios: standalone giant (IPO) or strategic acquisition by a legacy incumbent who must buy to survive.</p>
        <div className="mods">
          <div className="mod">
            <div className="mod-num">① COLLISION ALGORITHMS</div>
            <div className="mod-title">Detecting M&amp;A Races</div>
            <div className="mod-sub">Finding strategic gaps before the market does.</div>
            <div className="mod-desc">We run algorithms to detect forming M&amp;A races and structural gaps in competitive landscapes. Our wargaming engine maps acquisition posture vs. acquisition capacity across all relevant incumbents in a sector.<br /><br /><strong>We identify who will buy a company 18–24 months before the LOI is signed</strong> — and build our entry thesis around that exit thesis.</div>
          </div>
          <div className="mod">
            <div className="mod-num">② THE KINGMAKER ASSET</div>
            <div className="mod-title">Must-Buy or Must-Build</div>
            <div className="mod-sub">Two acceptable exit paths. No third option.</div>
            <div className="mod-desc">We invest only if the asset can become a <strong>Stand-Alone Giant</strong> capable of IPO — or a <strong>Kingmaker</strong> that legacy incumbents must acquire to defend their market cap.<br /><br />The question at entry: if this company owns the category in Europe by 2028, what does the dominant incumbent in that space pay to own it?</div>
          </div>
          <div className="mod">
            <div className="mod-num">③ THE BUYERS</div>
            <div className="mod-title">Category Ownership as the Exit Thesis</div>
            <div className="mod-sub">We invest in companies that will own their category in Europe. The rest follows.</div>
            <div className="mod-desc">Legacy incumbents cannot build category-defining AI products at speed — their organizational structure, data governance and talent base make organic transformation impossible. They must acquire.<br /><br />We invest in companies that will own their category in Europe. The rest follows.</div>
          </div>
          <div className="mod">
            <div className="mod-num">④ PORTFOLIO WARGAMING</div>
            <div className="mod-title">Exit Timing &amp; Scenario Modeling</div>
            <div className="mod-sub">6, 12, 18-month exit scenarios, continuously updated.</div>
            <div className="mod-desc">Our platform runs continuous 6, 12 and 18-month exit scenarios for every portfolio company. It detects if a company is becoming an acquisition target, if an M&amp;A race is forming, or if a strategic gap is opening that accelerates exit timing.<br /><br /><strong>Portfolio Health Scores</strong> flag deterioration before it becomes irreversible. We help founders course-correct as fast as possible.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FoundingPartner() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Founding Partner</span>
        <div className="gp-grid" style={{ marginTop: '28px' }}>
          <div><img src={GP_PHOTO_URL} alt="Alexandre Busson" style={{ width: '160px', height: '200px', objectFit: 'cover', objectPosition: 'center top', border: '1px solid var(--line)', display: 'block' }} /></div>
          <div>
            <div className="gp-name">Alexandre Busson</div>
            <div className="gp-role">Founding Partner &amp; GP · ProFund · ESSEC · Ardian · Partech · Leboncoin · Google</div>
            <div className="f-rows">
              <div className="f-row"><span className="f-co">Ardian — LBO Analyst</span><span className="f-desc">Financial analysis, due diligence and portfolio monitoring across European mid-market companies. The work these products automate — done manually, at institutional standard.</span></div>
              <div className="f-row"><span className="f-co">Partech Ventures — Senior Associate</span><span className="f-desc">Sourcing and qualification of European pre-seed to Series B startups. Hundreds of founding teams evaluated. The conviction the platform encodes today was built here — manually, before it was an algorithm.</span></div>
              <div className="f-row"><span className="f-co">Leboncoin — M&amp;A Director</span><span className="f-desc">End-to-end acquisitions across Europe. The only GP who has sat on the acquirer's side of the table — and knows what makes a company unmissable at the LOI stage.</span></div>
              <div className="f-row"><span className="f-co">Google — Key Account Manager assistant</span><span className="f-desc">Key account management at Google.</span></div>
              <div className="f-row"><span className="f-co">Founder &amp; operator</span><span className="f-desc">Owner and CEO of Fadparis.com. Founder and investor of Dreamzer Games.</span></div>
              <div className="f-row"><span className="f-co">Network</span><span className="f-desc">ESSEC graduate. Active across Station F, the incubateur de l'X, and HEC's entrepreneurship program. Direct relationships with founding teams before they are visible.</span></div>
              <div className="f-row"><span className="f-co">Deal-03 · 19×</span><span className="f-desc">Seed ticket €200K at €5.3M. LBO exit at €100M. Sourced 14 months before public announcement — via the same weak signal methodology the platform now runs at scale every morning. <span className="f-kpi">19× return.</span></span></div>
              <div className="f-row"><span className="f-co">Deal-04 · Acquired 2016</span><span className="f-desc">100% acquisition, €45M buyout. Revenue growing ~20% YoY since acquisition.</span></div>
            </div>
            <div className="gp-quote">"Our investment thesis isn't a PDF — it's an algorithm. Every deal we make, every rejection we issue, every founder we back makes the platform more precise."</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackRecord() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Track Record</span>
        <h2 className="h2">Generating tens of millions in value<br /><em>at every stage, every employer.</em></h2>
        <p style={{ fontSize: '12px', color: 'var(--lite)', marginBottom: '20px', lineHeight: 1.6 }}><em>Methodology: Public figures. Exit valuations and transaction metrics may contain assumptions &amp; estimations.</em></p>
        <div className="table-scroll"><table className="fund-table">
          <thead>
            <tr><th>Deal ID</th><th>Status</th><th>Entry Date</th><th>Exit Date</th><th>Initial Tkt</th><th>Entry Val (Post)</th><th>Entry %</th><th>Exit Val (Total)</th><th>Return</th><th>CoC</th></tr>
          </thead>
          <tbody>
            <tr><td>Deal-01</td><td><span className="tag green">Exited (Full)</span></td><td>2006</td><td>2007</td><td>n.c.</td><td>n.c.</td><td>100%</td><td>n.c.</td><td>n.c.</td><td className="moic">10.0×</td></tr>
            <tr><td>Deal-02</td><td><span className="tag green">Exited (Full)</span></td><td>2008</td><td>2014</td><td>n.c.</td><td>n.c.*</td><td>100%→40%→0%</td><td>n.c.**</td><td>n.c.</td><td className="moic">20.0×</td></tr>
            <tr><td>Deal-03</td><td><span className="tag blue">Graduated (Seed → LBO)</span></td><td>2014</td><td>Feb 2025</td><td>€200K</td><td>€5.26M</td><td>3.8%</td><td>€100M***</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€3.8M</td><td className="moic">19.0×</td></tr>
            <tr><td>Deal-04</td><td><span className="tag grey">Ongoing (100% held)</span></td><td>2016</td><td>Ongoing</td><td>€45M</td><td>€45M</td><td>100%</td><td>—</td><td>—</td><td className="moic" style={{ color: 'var(--mid)' }}>—</td></tr>
          </tbody>
        </table></div>
        <p style={{ fontSize: '11px', color: 'var(--lite)', marginTop: '12px', lineHeight: 1.6 }}>* Deal-03: Entry seed €5.3M · Follow-on at €15M round · Exit LBO/MBO Feb 2025 at €100M · 12.5× EBITDA on €8M EBITDA · Estimated 19× on seed ticket.<br />** Deal-04: 100% acquisition, €45M buyout in 2016 · Revenue growing ~20% YoY since acquisition · No multiple shown for a position still fully held.</p>
      </div>
    </div>
  );
}

function GovernanceSection() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Governance &amp; Terms</span>
        <h2 className="h2">One Fund. One GP. No Back Office.<br /><em>Standard Terms, Outsourced Operations.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '32px' }}>A single fund run by a solo GP on an AI platform. Administration, audit, reporting and investor onboarding are outsourced to a regulated third-party EuVECA manager, so the GP's time goes to founders.</p>
        <div className="gov-grid">
          <div className="gov">
            <div className="gov-h">Fund Structure</div>
            <p className="gov-p">EuVECA fund (Luxembourg) managed by a third-party EuVECA manager: administration, audit, reporting and investor onboarding.<br /><br />Closed-ended Fund I · {F.term_years} years · successive closings over {F.closing_months} months. Marketed across the EU under the EuVECA passport.</p>
          </div>
          <div className="gov">
            <div className="gov-h">Fund Terms</div>
            <p className="gov-p">{pct(T.fee_ip_pct)} management fee on commitments for {F.investment_period_years} years, then {pct(T.fee_post_pct, 1)} on invested capital ({pct(T.fee_first_close_pct, 2)} for first-close investors)<br />{pct(T.carry_pct)} carried interest · {pct(T.hurdle_pct)} hurdle · European whole-of-fund waterfall with GP catch-up and clawback<br /><br />GP commitment of at least {pct(T.gp_commit_min_pct)} of the fund, in cash.</p>
          </div>
          <div className="gov">
            <div className="gov-h">3-Person Advisory Committee</div>
            <p className="gov-p">Independent experts consulted on every Growth-layer investment. The investment decision stays with the manager.<br /><br />· Member A: Ex-Partner at Tier 1 Fund<br />· Member B: Currently operating Decacorn Founder &amp; CEO</p>
          </div>
        </div>
        <div style={{ marginTop: '32px' }}>
          <div className="impact-grid">
            <div className="imp"><span className="imp-n">{eur(F.commitments, 'tile')}</span><span className="imp-h">Target Fund I</span><p className="imp-p">Closed-ended · {F.term_years} years · closings over {F.closing_months} months</p></div>
            <div className="imp"><span className="imp-n">{(T.fee_ip_pct * 100).toFixed(0)}/{(T.carry_pct * 100).toFixed(0)}</span><span className="imp-h">Fee Structure</span><p className="imp-p">Then {pct(T.fee_post_pct, 1)} on invested capital · {pct(T.hurdle_pct)} hurdle · ≥{pct(T.gp_commit_min_pct)} GP commitment</p></div>
            <div className="imp"><span className="imp-n">{eur(F.company_max_with_spv, 'tile')}</span><span className="imp-h">Max per Company</span><p className="imp-p">Up to {eur(F.company_cap, 'tile')} from the fund, the rest through co-investment SPVs offered to our investors</p></div>
            <div className="imp"><span className="imp-n">1 GP</span><span className="imp-h">Solo GP + AI Platform</span><p className="imp-p">Back office outsourced · automated monitoring and LP reporting</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CTASection() {
  const [open, setOpen] = useState(false);
  return (
    <div id="contact" className="pf-section" style={{ textAlign: 'center', paddingBottom: '0' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Get in Touch</span>
        <h2 className="cta-h">Invest in the future<br />of <em>European AI.</em></h2>
        <p className="cta-p">We are selectively building our LP base. A {eur(F.commitments, 'tile')} European venture fund, seed to growth: one fund that follows AI-native companies from {eur(L.seed.ticket_min, 'tile')} to {eur(F.company_max_with_spv, 'tile')} — powered by an in-house AI platform that tracks every European seed round and reads 24/7 weak signals before they become obvious to the category.</p>
        <p className="cta-note" style={{ fontSize: '15px', marginTop: '12px' }}>Contact: <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a></p>
        {/* 29/10 — le même formulaire que l'accueil (DealFlowModal), plus l'ancien iframe Brevo */}
        <div style={{ margin: '36px 0 56px' }}>
          <button className="pfh-btn" onClick={() => setOpen(true)}>Follow our deal flow live</button>
          <p style={{ fontSize: '12px', color: 'var(--lite)', marginTop: '14px' }}>Every evening, the companies we reviewed that day, the ones we kept, and why.</p>
        </div>
        <DealFlowModal open={open} onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}

export default function ProFundPage() {
  return (
    <>
      <HeroSection />
      <hr className="pf-div" />
      <TheOpportunity />
      <hr className="pf-div" />
      <WhyOneFund />
      <hr className="pf-div" />
      <WhatWeBack />
      <hr className="pf-div" />
      <ThePlatform />
      <hr className="pf-div" />
      <HowThemesWork />
      <hr className="pf-div" />
      <TheConversion />
      <hr className="pf-div" />
      <WinningFounder />
      <hr className="pf-div" />
      <PortfolioArch />
      <hr className="pf-div" />
      <FundSimTable id="seed" />
      <hr className="pf-div" />
      <FundSimTable id="venture" bg />
      <hr className="pf-div" />
      <FundSimTable id="growth" />
      <hr className="pf-div" />
      <FundPerformance />
      <hr className="pf-div" />
      <ExitStrategy />
      <hr className="pf-div" />
      <FoundingPartner />
      <hr className="pf-div" />
      <TrackRecord />
      <hr className="pf-div" />
      <GovernanceSection />
      <hr className="pf-div" />
      <CTASection />
    </>
  );
}
