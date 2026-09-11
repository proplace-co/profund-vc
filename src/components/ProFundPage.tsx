const LOGO_URL = '/logo.png';
const GP_PHOTO_URL = '/gp-photo.jpg';

function HeroSection() {
  return (
    <div id="hero" style={{ padding: '52px 0 56px', borderBottom: '1px solid var(--line)' }}>
      <div className="pf-wrap" style={{ textAlign: 'center' }}>
        <img src={LOGO_URL} className="hero-logo" alt="ProFund" style={{ display: 'block', margin: '0 auto 20px' }} />
        <div style={{ display: 'inline-block', border: '1px solid var(--line)', color: 'var(--mid)', fontSize: '10px', fontWeight: 600, letterSpacing: '.22em', textTransform: 'uppercase', padding: '8px 24px', marginBottom: '18px' }}>Pre-Marketing Phase</div>
        <span className="hero-tagline" style={{ display: 'block' }}>AI-Native Venture Platform</span>
        <h1 className="hero-title">We find Europe's next<br /><em>category winners.</em></h1>
        <p className="hero-sub" style={{ maxWidth: '640px', margin: '0 auto 18px' }}>Before the category is obvious. An AI-native venture platform that reads every weak signal in an emerging category — automatically, at a depth no human team can match.</p>
        <p className="hero-note">€35M Target · 21 Deals · Paris first, then Europe</p>
        <div style={{ marginBottom: '40px' }}>
          <a href="#contact" className="btn">Request LP Access</a>
        </div>
        <div className="hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--line)' }}>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">€35M</span><span className="sg-l">Target fund size · High-conviction reserves</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">21</span><span className="sg-l">Deals · 12 Scout (€150K) + 9 Core (€1.1M)</span></div>
          <div className="sg" style={{ textAlign: 'left' }}><span className="sg-n">Weekly</span><span className="sg-l">Thesis calibration — detection parameters updated every Monday</span></div>
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
              <div className="sg"><span className="sg-n">26%</span><span className="sg-l">Target net IRR — top decile performance via disciplined construction</span></div>
              <div className="sg"><span className="sg-n">~2.8×</span><span className="sg-l">Target net DPI · €98.6M gross exit value on €35M deployed</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThePlatform() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">The Platform</span>
        <h2 className="h2">Every weak signal in an emerging category.<br /><em>Automatically. Before anyone else sees it.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '620px', marginBottom: '36px' }}>Traditional funds spend the majority of their time on tasks a machine can do — sourcing, screening, memo writing, portfolio reporting. We built a system that does all of it automatically, so we spend our time on the one thing a machine cannot do: building the relationships that win deals.</p>
        <div className="mods">
          <div className="mod">
            <div className="mod-num">① WHAT IT READS</div>
            <div className="mod-title">Fifteen Engines. Parallel. Every Morning.</div>
            <div className="mod-sub">The platform runs at 8:30 UTC across Paris and European startup hubs.</div>
            <div className="mod-desc">SSL certificate registrations · Pappers legal filings · GitHub repositories · LinkedIn job posts · Crunchbase API · Semantic search · Google Alerts · VC portfolio additions · Grandes écoles alumni networks. Every signal matched against our active themes. Every match qualified automatically against dozens of green flags and red flags, weighted by their historical predictive accuracy.<br /><br /><strong>A full investment memo and financial model generated automatically for every high-conviction match. Only the top 1% surfaces as a CALL — the only verdict that requires human attention.</strong> The same engine operates outbound for Proplace, Maximum Insurance, ProFund and portfolio startups — and books meetings with AI-native founders (Seed with traction, every Series A) and international VCs for allocation.</div>
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
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
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
    <div className="pf-section">
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

function WinningFounder() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
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
          <div className="sc"><div className="sc-h">Full Alignment</div><p className="sc-p">5% GP commitment on management fees. No investment committee on Scout decisions. One person accountable — fully committed. When we back a founder, the GP is on the line.</p></div>
        </div>
      </div>
    </div>
  );
}

function PortfolioArch() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Portfolio Architecture</span>
        <h2 className="h2">The Conviction Funnel.<br /><em>Balancing Alpha with Capacity.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '32px' }}>Two-tier construction: Scout deals for asymmetric alpha at pre-seed, Core deals for validated conviction at Seed+ / Series A. The best Scout deals graduate to Core.</p>
        <div className="funnel-grid">
          <div>
            <div className="tier scout">
              <div className="tier-tag">Tier 1 — Alpha Layer</div>
              <div className="tier-h">Scout Portfolio · 12 Deals</div>
              <div className="tier-row"><span className="tier-label">Ticket</span>€150K initial · follow-on reserved</div>
              <div className="tier-row"><span className="tier-label">Stage</span>Pre-Seed / Stealth</div>
              <div className="tier-row"><span className="tier-label">Team profile</span>Top-tier engineering (X, Centrale, EPFL…)</div>
              <div className="tier-row"><span className="tier-label">Entry valuation</span>€4M – €6M Post</div>
              <div className="tier-row"><span className="tier-label">Role</span>High risk, massive multiple potential</div>
              <div className="tier-row"><span className="tier-label">Graduation</span>3 of 12 graduate to Core</div>
            </div>
            <div className="tier">
              <div className="tier-tag">Tier 2 — Conviction Layer</div>
              <div className="tier-h">Core Portfolio · 9 Direct + 3 Graduates</div>
              <div className="tier-row"><span className="tier-label">Ticket</span>€1.1M · co-investing with Tier 1 leads</div>
              <div className="tier-row"><span className="tier-label">Stage</span>Seed+ / Series A</div>
              <div className="tier-row"><span className="tier-label">Entry valuation</span>€25M – €35M Pre (€30M – €40M Post)</div>
              <div className="tier-row"><span className="tier-label">Role</span>Validated breakout winners</div>
              <div className="tier-row"><span className="tier-label">Risk profile</span>Lower risk, massive multiple potential</div>
            </div>
          </div>
          <div>
            <div className="fw-stats">
              <div className="fw-s"><span className="fw-big">€35M</span><div className="fw-det"><strong>Total fund.</strong> €1.8M Scout + €9.9M Core + €7.5M Scout follow-on + €14M Core follow-on + fees &amp; reserves.</div></div>
              <div className="fw-s hl"><span className="fw-big">21</span><div className="fw-det"><strong>Total deals.</strong> 12 Scout for asymmetric alpha · 9 Core for institutional-grade returns.</div></div>
              <div className="fw-s"><span className="fw-big">€98.6M</span><div className="fw-det"><strong>Target gross exit value.</strong> €23.7M from Scout portfolio · €74.9M from Core portfolio.</div></div>
              <div className="fw-s"><span className="fw-big">3 of 12</span><div className="fw-det"><strong>Scout-to-Core graduation rate.</strong> Best pre-seed bets receive Core follow-on at Seed+ validation.</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FundSimScout() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Fund Simulation</span>
        <h2 className="h2">The Scout Portfolio · 12 Deals.<br /><em>Line-by-line Entry, Dilution &amp; Exit Scenarios.</em></h2>
        <div className="table-scroll"><table className="fund-table">
          <thead>
            <tr>
              <th>Deal ID</th><th>Status</th><th>Initial Tkt</th><th>Entry Val (Post)</th><th>Entry %</th><th>Follow-On</th><th>Exit % (Diluted)</th><th>Exit Val</th><th>Fund Return</th><th>MOIC</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>S-01</td><td><span className="tag green">Graduated (Dragon)</span></td><td>€150K</td><td>€5.0M</td><td>3.0%</td><td>€4.0M</td><td>2.0%</td><td>€800M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€16.0M</td><td className="moic">3.9×</td></tr>
            <tr><td>S-02</td><td><span className="tag green">Graduated (Win)</span></td><td>€150K</td><td>€5.0M</td><td>3.0%</td><td>€2.0M</td><td>2.5%</td><td>€150M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€3.8M</td><td className="moic">1.8×</td></tr>
            <tr><td>S-03</td><td><span className="tag green">Graduated (Win)</span></td><td>€150K</td><td>€5.0M</td><td>3.0%</td><td>€1.5M</td><td>2.5%</td><td>€100M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€2.5M</td><td className="moic">1.5×</td></tr>
            <tr><td>S-04</td><td><span className="tag blue">Early Exit (M&amp;A)</span></td><td>€150K</td><td>€4.0M</td><td>3.8%</td><td>€0</td><td>3.0%</td><td>€30M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€0.9M</td><td className="moic">6.0×</td></tr>
            <tr><td>S-05</td><td><span className="tag blue">Early Exit (M&amp;A)</span></td><td>€150K</td><td>€6.0M</td><td>2.5%</td><td>€0</td><td>2.0%</td><td>€20M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€0.4M</td><td className="moic">2.7×</td></tr>
            <tr><td>S-06</td><td><span className="tag grey">Zombie</span></td><td>€150K</td><td>€5.0M</td><td>3.0%</td><td>€0</td><td>1.5%</td><td>€5M</td><td style={{ color: 'var(--mid)' }}>€0.1M</td><td className="moic" style={{ color: 'var(--mid)' }}>0.5×</td></tr>
            <tr><td>S-07–12</td><td><span className="tag red">Losses (×6)</span></td><td>€900K</td><td>€5.0M</td><td>3.0%</td><td>€0</td><td>—</td><td>€0</td><td style={{ color: 'var(--red)' }}>€0</td><td className="moic" style={{ color: 'var(--red)' }}>0.0×</td></tr>
            <tr><td><strong>SUB</strong></td><td><strong>(Scouts)</strong></td><td><strong>€1.8M</strong></td><td>—</td><td>—</td><td><strong>€7.5M</strong></td><td>—</td><td>—</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€23.7M</td><td className="moic">2.5×</td></tr>
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function FundSimCore() {
  return (
    <div className="pf-section">
      <div className="pf-wrap-wide">
        <span className="eyebrow">Fund Simulation</span>
        <h2 className="h2">The Core Portfolio · 9 Direct Deals.<br /><em>Line-by-line Entry, Dilution &amp; Exit Scenarios.</em></h2>
        <div className="table-scroll"><table className="fund-table">
          <thead>
            <tr>
              <th>Deal ID</th><th>Status</th><th>Initial Tkt</th><th>Entry Val (Post)</th><th>Entry %</th><th>Follow-On</th><th>Exit % (Diluted)</th><th>Exit Val</th><th>Fund Return</th><th>MOIC</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>C-01</td><td><span className="tag green">Anchor (Unicorn)</span></td><td>€1.1M</td><td>€30M</td><td>3.7%</td><td>€5.0M</td><td>3.5%</td><td>€1.0B</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€35.0M</td><td className="moic">5.7×</td></tr>
            <tr><td>C-02</td><td><span className="tag blue">Strat. Win (Tier 1)</span></td><td>€1.1M</td><td>€35M</td><td>3.1%</td><td>€3.5M</td><td>3.0%</td><td>€500M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€15.0M</td><td className="moic">3.3×</td></tr>
            <tr><td>C-03</td><td><span className="tag blue">Strat. Win (Tier 1)</span></td><td>€1.1M</td><td>€28M</td><td>3.9%</td><td>€3.0M</td><td>3.5%</td><td>€350M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€12.3M</td><td className="moic">3.0×</td></tr>
            <tr><td>C-04</td><td><span className="tag blue">Strat. Win (Tier 2)</span></td><td>€1.1M</td><td>€30M</td><td>3.7%</td><td>€1.5M</td><td>3.0%</td><td>€200M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€6.0M</td><td className="moic">2.3×</td></tr>
            <tr><td>C-05</td><td><span className="tag blue">Strat. Win (Tier 2)</span></td><td>€1.1M</td><td>€32M</td><td>3.4%</td><td>€1.0M</td><td>2.5%</td><td>€150M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€3.8M</td><td className="moic">1.8×</td></tr>
            <tr><td>C-06</td><td><span className="tag grey">Base Hit</span></td><td>€1.1M</td><td>€30M</td><td>3.7%</td><td>€0</td><td>2.0%</td><td>€80M</td><td style={{ color: 'var(--mid)' }}>€1.6M</td><td className="moic" style={{ color: 'var(--mid)' }}>1.5×</td></tr>
            <tr><td>C-07</td><td><span className="tag grey">Base Hit</span></td><td>€1.1M</td><td>€30M</td><td>3.7%</td><td>€0</td><td>2.0%</td><td>€60M</td><td style={{ color: 'var(--mid)' }}>€1.2M</td><td className="moic" style={{ color: 'var(--mid)' }}>1.1×</td></tr>
            <tr><td>C-08/09</td><td><span className="tag red">Losses (×2)</span></td><td>€2.2M</td><td>€30M</td><td>3.7%</td><td>€0</td><td>—</td><td>€0</td><td style={{ color: 'var(--red)' }}>€0</td><td className="moic" style={{ color: 'var(--red)' }}>0.0×</td></tr>
            <tr><td><strong>SUB</strong></td><td><strong>(Core)</strong></td><td><strong>€9.9M</strong></td><td>—</td><td>—</td><td><strong>€14.0M</strong></td><td>—</td><td>—</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€74.9M</td><td className="moic">3.1×</td></tr>
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function FundPerformance() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Fund Performance</span>
        <h2 className="h2">Institutional-Grade Return.<br /><em>Top Decile via Disciplined Construction.</em></h2>
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>
          <div>
            <div className="table-scroll"><table className="perf-table">
              <thead>
                <tr><th>Metric</th><th>Target (Combined)</th><th>Base Case (No Unicorn)</th><th>Benchmark</th></tr>
              </thead>
              <tbody>
                <tr><td>Total Capital</td><td className="hl">€35M</td><td>€35M</td><td>—</td></tr>
                <tr><td>Gross Exit Value</td><td className="hl">€98.6M</td><td>€65M – €75M</td><td>—</td></tr>
                <tr><td>Net Multiple (DPI)</td><td className="hl">~2.8×</td><td>1.9× – 2.1×</td><td>1.8× – 2.5×</td></tr>
                <tr><td>Net IRR</td><td className="hl">26%</td><td>15%</td><td>12% – 18%</td></tr>
              </tbody>
            </table></div>
          </div>
          <div className="fw-stats">
            <div className="fw-s hl"><span className="fw-big">26%</span><div className="fw-det"><strong>Target Net IRR.</strong> Top decile European VC performance. Base case 15% — above benchmark without a unicorn.</div></div>
            <div className="fw-s"><span className="fw-big">~2.8×</span><div className="fw-det"><strong>Target Net DPI.</strong> €98.6M gross exit on €35M deployed. Base case 1.9× – 2.1× — above benchmark.</div></div>
            <div className="fw-s"><span className="fw-big">€74.9M</span><div className="fw-det"><strong>Core portfolio exit value.</strong> 3.1× MOIC across 12 deals (9 direct + 3 Scout graduates).</div></div>
            <div className="fw-s"><span className="fw-big">€23.7M</span><div className="fw-det"><strong>Scout portfolio exit value.</strong> 2.5× MOIC across 12 early-stage bets. 3 Dragon candidates.</div></div>
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
            <div className="gp-role">Founding Partner &amp; GP · ProFund · ESSEC · Ardian · Partech · Leboncoin</div>
            <div className="f-rows">
              <div className="f-row"><span className="f-co">Ardian — LBO Analyst</span><span className="f-desc">Financial analysis, due diligence and portfolio monitoring across European mid-market companies. The work these products automate — done manually, at institutional standard.</span></div>
              <div className="f-row"><span className="f-co">Partech Ventures — Senior Associate</span><span className="f-desc">Sourcing and qualification of European pre-seed to Series B startups. Hundreds of founding teams evaluated. The conviction the platform encodes today was built here — manually, before it was an algorithm.</span></div>
              <div className="f-row"><span className="f-co">Leboncoin — M&amp;A Director</span><span className="f-desc">End-to-end acquisitions across Europe. The only GP who has sat on the acquirer's side of the table — and knows what makes a company unmissable at the LOI stage.</span></div>
              <div className="f-row"><span className="f-co">Network</span><span className="f-desc">ESSEC graduate. Active across Station F, the incubateur de l'X, and HEC's entrepreneurship program. Direct relationships with founding teams before they are visible.</span></div>
              <div className="f-row"><span className="f-co">Deal-03 · 19×</span><span className="f-desc">Seed ticket €200K at €5.3M. LBO exit at €100M. Sourced 14 months before public announcement — via the same weak signal methodology the platform now runs at scale every morning. <span className="f-kpi">19× return.</span></span></div>
              <div className="f-row"><span className="f-co">Deal-04 · 2.5× CoC ongoing</span><span className="f-desc">Buyout €45M. €25M revenue / €10M EBITDA 2024. Current estimated value €112.5M. <span className="f-kpi">2.5× CoC.</span></span></div>
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
            <tr><td>Deal-04</td><td><span className="tag grey">Core Growth (Ongoing)</span></td><td>2016</td><td>Ongoing</td><td>€45M</td><td>€45M</td><td>100%</td><td>€112.5M</td><td style={{ color: 'var(--blue-dk)', fontWeight: 700 }}>€67.5M</td><td className="moic">2.5×</td></tr>
          </tbody>
        </table></div>
        <p style={{ fontSize: '11px', color: 'var(--lite)', marginTop: '12px', lineHeight: 1.6 }}>* Deal-03: Entry seed €5.3M · Follow-on at €15M round · Exit LBO/MBO Feb 2025 at €100M · 12.5× EBITDA on €8M EBITDA · Estimated 19× on seed ticket.<br />** Deal-04: Buyout €45M · €10M EBITDA 2024 — €25M revenue · Current estimated value €112.5M at 11.25× EBITDA · 2.5× CoC.</p>
      </div>
    </div>
  );
}

function GovernanceSection() {
  return (
    <div className="pf-section" style={{ background: 'var(--bg)' }}>
      <div className="pf-wrap-wide">
        <span className="eyebrow">Governance &amp; Terms</span>
        <h2 className="h2">Institutional-Grade Safeguards.<br /><em>Aligned for the Long Term.</em></h2>
        <p style={{ fontSize: '14px', color: 'var(--sub)', lineHeight: 1.75, maxWidth: '600px', marginBottom: '32px' }}>Structured with external oversight on Core decisions, 100% externalized administration, and significant GP alignment on management fees.</p>
        <div className="gov-grid">
          <div className="gov">
            <div className="gov-h">3-Person External IC</div>
            <p className="gov-p">External Investment Committee with veto power over all Core checks.<br /><br />· IC Member A: Ex-Partner at Tier 1 Fund<br />· IC Member B: Currently operating Decacorn Founder &amp; CEO</p>
          </div>
          <div className="gov">
            <div className="gov-h">Fund Terms</div>
            <p className="gov-p">2% Management Fee<br />20% Carry<br />8% Hurdle Rate<br /><br />Significant GP Commitment: 5% of management fees. Full alignment between LP returns and GP incentives.</p>
          </div>
          <div className="gov">
            <div className="gov-h">Service Providers</div>
            <p className="gov-p">100% externalized Tier-1 Fund Administration and Legal Counsel.<br /><br />Back-office fully automated. Daily &amp; weekly LP reporting generated autonomously. Zero manual overhead on administration.</p>
          </div>
        </div>
        <div style={{ marginTop: '32px' }}>
          <div className="impact-grid">
            <div className="imp"><span className="imp-n">€35M</span><span className="imp-h">Target Fund Size</span><p className="imp-p">High-conviction reserves · Quarterly deployment</p></div>
            <div className="imp"><span className="imp-n">2/20</span><span className="imp-h">Fee Structure</span><p className="imp-p">Management fee / Carry · 8% hurdle · 5% GP commitment on fees</p></div>
            <div className="imp"><span className="imp-n">100%</span><span className="imp-h">Admin Externalized</span><p className="imp-p">Tier-1 fund admin · Automated reporting · Zero back-office overhead</p></div>
            <div className="imp"><span className="imp-n">3-person</span><span className="imp-h">External IC</span><p className="imp-p">Veto on Core checks · Ex-Tier 1 Partner + Decacorn CEO</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CTASection() {
  return (
    <div id="contact" className="pf-section" style={{ textAlign: 'center', paddingBottom: '0' }}>
      <div className="pf-wrap">
        <span className="eyebrow" style={{ textAlign: 'center' }}>Get in Touch</span>
        <h2 className="cta-h">Invest in the future<br />of <em>European AI.</em></h2>
        <p className="cta-p">We are selectively building our LP base. If you are interested in co-investing alongside a fund built around a proprietary AI-native venture platform — designed to find Europe's next category winners before the market does — let's talk.</p>
        <p className="cta-note" style={{ fontSize: '15px', marginTop: '12px' }}>Contact: <a href="mailto:alexandre@profund.vc">alexandre@profund.vc</a></p>
        <div style={{ marginTop: '40px', background: '#fff' }}>
          <iframe
            width="540"
            height="700"
            src="https://77f02b89.sibforms.com/serve/MUIFALUiZIPfuoaTzppPYzP7z6tpgQFfbhCHQuX8eO58o9PB8ue7e3ED7js4wkM1mNJErqEK2YtgwSU2koncoKMtNmozRmy55vEGK6wgnJk0AwqAxzWcwM67GiIBHz1XgOlkmNF00qqP7cGXUx69taacMVNXnPaZ3F9jnvVMDP-DFnCpN2SWKX10fWKRxNSpSxIZUKeJV4KlahCGNw=="
            frameBorder={0}
            scrolling="auto"
            allowFullScreen
            style={{ display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '100%', maxWidth: '540px', marginBottom: '-6px' }}
            title="Newsletter Signup"
          />
        </div>
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
      <FundSimScout />
      <hr className="pf-div" />
      <FundSimCore />
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
