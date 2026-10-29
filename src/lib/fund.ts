// Chiffres du fonds : générés par scripts/fund_model.py dans src/data/fund.json.
// Aucun chiffre du fonds ne s'écrit à la main dans un composant : on le change
// dans le modèle, on relance, on commite le JSON (et la fiche PDF régénérée).
//
// Le modèle exporte chaque valeur à sa précision d'affichage : ces formateurs
// mettent en forme, ils n'arrondissent pas (sinon un sous-total ne tomberait
// plus juste, ou le site et la fiche PDF divergeraient).
import raw from '../data/fund.json';

export type CaseId = 'target' | 'base' | 'stress';
export type LayerId = 'seed' | 'venture' | 'growth';
export type Outcome =
  | 'fund_returner' | 'breakout' | 'strategic_exit' | 'early_exit' | 'zombie' | 'loss'
  | 'anchor' | 'strategic_win' | 'base_hit'
  | 'breakout_follow_on' | 'pro_rata' | 'external_growth' | 'downside_protected';

export interface FundLine {
  id: string;
  company: string;
  n: number;
  outcome: Outcome;
  kind: 'new' | 'follow_on';
  initial: number;          // total de ligne
  entry_post: number;       // par société
  entry_pct: number;
  follow_on: number;        // total de ligne
  exit_pct: number | null;
  exit_value: number | null;
  recovery: number | null;
  proceeds: number;         // cas cible, à la sortie
  moic: number;
  invest_year: number;
  follow_on_year: number | null;
  exit_year: number;
}

export interface FundLayer {
  ticket_min: number;
  ticket_max: number;
  entry_post_min: number;
  entry_post_max: number;
  ownership_min: number;
  ownership_max: number;
  companies: number;
  positions: number;
  initial: number;
  follow_on: number;
  invested: number;
  proceeds: Record<CaseId, number>;
  moic: Record<CaseId, number>;
  lines: FundLine[];
  internal?: number;
  external?: number;
  internal_pct?: number;
  internal_min_pct?: number;
  direct_pct?: number;
  direct_min_pct?: number;
}

export interface FundCase {
  exit_cap: number | null;
  gross_exits: number;
  secondary_discount: number;
  realised: number;
  paid_in: number;
  mgmt_fees: number;
  fund_expenses: number;
  lp_distributions: number;
  carry: number;
  net_tvpi: number;
  net_irr: number;
  gross_irr: number;
  dpi_year6: number;
  horizon_years: number;
  cashflows: { calls: number[]; distributions: number[]; lp: number[]; gp: number[] };
}

export interface FundData {
  schema: number;
  version: string;
  model_date: string;
  fund: {
    commitments: number;
    term_years: number;
    investment_period_years: number;
    closing_months: number;
    company_cap_pct: number;
    company_cap: number;
    company_max_with_spv: number;
    europe_min_pct: number;
    euveca_qualifying_min_pct: number;
    companies: number;
  };
  terms: {
    fee_ip_pct: number;
    fee_post_pct: number;
    fee_first_close_pct: number;
    setup_cost: number;
    running_cost: number;
    carry_pct: number;
    hurdle_pct: number;
    catch_up_pct: number;
    gp_commit_min_pct: number;
    gp_commit_min: number;
  };
  secondary: { share: number; year: number; price_pct: number; companies: string[] };
  reserve_policy: {
    seed: ReservePolicy;
    venture: ReservePolicy;
    growth: { internal: number };
  };
  layers: Record<LayerId, FundLayer>;
  allocation: {
    seed: number;
    venture: number;
    growth: number;
    invested: number;
    initial: number;
    follow_on: number;
    follow_on_pct: number;
    mgmt_fees: number;
    fund_expenses: number;
    contingency: number;
    total: number;
  };
  exposure_top: { company: string; total: number }[];
  spv: { company: string; fund: number; spv: number }[];
  spv_total: number;
  fund_returner: { company: string; proceeds: number; multiple_of_fund: number };
  cases: Record<CaseId, FundCase>;
  benchmark: { net_tvpi: number | null; net_irr: number | null; source: string | null };
}

export interface ReservePolicy {
  graduation_pct: number;
  next_round: number;
  pro_rata_pct: number;
  bridges: number;
  companies: number;
  expected: number;
}

export const fund = raw as unknown as FundData;

export const LAYER_IDS: LayerId[] = ['seed', 'venture', 'growth'];

/** Montant en euros. table : €750K / €27.6M ; val (valorisations) : €8.0M / €45M / €1.5B ;
 *  tile (grands chiffres, fourchettes) : millions ronds sans décimale (€15M, €326M). */
export function eur(v: number, mode: 'table' | 'val' | 'tile' = 'table'): string {
  if (v === 0) return '€0';
  if (mode === 'val') {
    if (v >= 1e9) return `€${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e7) return `€${(v / 1e6).toFixed(0)}M`;
  }
  if (mode === 'tile' && v >= 1e6 && v % 1e6 === 0) return `€${v / 1e6}M`;
  if (v < 1e6) return `€${(v / 1e3).toFixed(0)}K`;
  return `€${(v / 1e6).toFixed(1)}M`;
}

/** €150K – €1.5M */
export function eurRange(a: number, b: number, mode: 'table' | 'val' | 'tile' = 'tile'): string {
  return `${eur(a, mode)} – ${eur(b, mode)}`;
}

/** 2.7× */
export function mult(x: number): string {
  return `${x.toFixed(1)}×`;
}

/** 27% (dp = 0), 12.5% (dp = 1) */
export function pct(x: number, dp = 0): string {
  return `${(x * 100).toFixed(dp)}%`;
}

/** S-01 ; S-07–09 pour trois sociétés ; V-05/06 pour deux. */
export function rowId(line: FundLine): string {
  if (line.n === 1) return line.id;
  const [prefix, num] = line.id.split('-');
  const last = String(Number(num) + line.n - 1).padStart(num.length, '0');
  return line.n === 2 ? `${line.id}/${last}` : `${prefix}-${num}–${last}`;
}

export type Tone = 'green' | 'blue' | 'grey' | 'red';

/** Libellé et couleur du statut d'une ligne de simulation. */
export function outcomeTag(line: FundLine): { label: string; tone: Tone } {
  switch (line.outcome) {
    case 'fund_returner': return { label: 'Fund returner', tone: 'green' };
    case 'breakout': return { label: 'Breakout', tone: 'green' };
    case 'strategic_exit': return { label: 'Strategic exit', tone: 'blue' };
    case 'early_exit': return { label: 'Early exit (M&A)', tone: 'blue' };
    case 'zombie': return { label: `Zombies (×${line.n})`, tone: 'grey' };
    case 'loss': return { label: `Losses (×${line.n})`, tone: 'red' };
    case 'anchor': return { label: 'Anchor', tone: 'green' };
    case 'strategic_win': return { label: 'Strategic win', tone: 'blue' };
    case 'base_hit': return { label: 'Base hit', tone: 'grey' };
    case 'breakout_follow_on': return { label: `Breakout (${line.company})`, tone: 'green' };
    case 'pro_rata': return { label: `Pro-rata (${line.company})`, tone: 'blue' };
    case 'external_growth': return { label: 'Direct growth entry', tone: 'blue' };
    case 'downside_protected': return { label: 'Downside, preference', tone: 'grey' };
  }
}
