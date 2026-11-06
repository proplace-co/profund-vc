// Chiffres du fonds : générés par scripts/fund_model.py (v3.3) dans src/data/fund.json.
// Aucun chiffre du fonds ne s'écrit à la main dans un composant : on le change
// dans le modèle, on relance, on commite le JSON (et la fiche PDF, le xlsx régénérés).
//
// Le modèle exporte chaque valeur à sa précision d'affichage : ces formateurs
// mettent en forme, ils n'arrondissent pas (sinon un sous-total ne tomberait
// plus juste, ou le site et la fiche PDF divergeraient).
import raw from '../data/fund.json';

export type CaseId = 'target' | 'base' | 'stress';
export type LayerId = 'seed' | 'venture' | 'growth';
export type SeedTrackId = 'lead' | 'radar';
export type Tone = 'green' | 'blue' | 'grey' | 'red';

/** Une ligne de simulation (une société, ou n sociétés regroupées : montants = totaux de ligne). */
export interface FundLine {
  id: string;
  last: string;             // dernière société de la ligne (S-19 + 12 → S-30)
  company: string;          // clé d'exposition et de sortie (G-06 → S-01)
  n: number;
  status: string;           // libellé affiché (site, fiche, Excel)
  tone: Tone;
  kind: 'new' | 'breakout';
  track: SeedTrackId | null;
  first: number;            // premier chèque, actions nouvelles
  buyback: number;          // rachats de titres existants
  follow: number;           // suivi en actions nouvelles (le fondateur a levé ailleurs)
  loan: number;
  invested: number;
  entry_post: number;
  entry_pct: number;        // premier chèque, ou bloc racheté en Growth
  exit_pct: number | null;
  exit_value: number | null;
  recovery: number | null;
  partial: boolean;         // vente secondaire partielle en année 6 (hors pacte depuis la v3.12 ; toujours false)
  proceeds: number;         // cas cible, fonds propres + prêt, à la valeur de sortie
  moic: number;
  entry_year: number;
  exit_year: number;
  buyback_year: number | null;
  buyback_value: number | null;
  discount: number | null;
  cancel: number;
  dilution: number;
  follow_year: number | null;
  follow_post: number | null;
  loan_year: number | null;
  loan_repay_year: number | null;
  loan_mult: number | null;
}

/** Une voie du Seed : leads de conviction ou tickets radar. */
export interface SeedTrack {
  companies: number;
  ticket_min: number;
  ticket_max: number;
  first: string;
  last: string;
  invested: number;
  proceeds: number;
  moic: number;
}

export interface FundLayer {
  model_name: string;       // Seed / Venture / Growth, aussi dans le classeur
  stage: string;
  ticket_min: number;
  ticket_max: number;
  entry_post_min: number;
  entry_post_max: number;
  ownership_min: number;
  ownership_max: number;
  companies: number;
  breakouts: number;
  positions: number;
  first: number;
  buyback: number;
  follow: number;
  loans: number;
  invested: number;
  loans_pct: number;
  first_cheque_range: [number, number];
  position_range: [number, number];
  entry_years: [number, number];
  proceeds: Record<CaseId, number>;
  moic: Record<CaseId, number>;
  gross_irr: Record<CaseId, number>;
  lines: FundLine[];
  tracks?: Record<SeedTrackId, SeedTrack>;
}

export interface FundCase {
  exit_mult: number;
  exit_cap: number | null;
  loan_repaid: number;
  gross_proceeds: number;
  gross_moic: number;
  realised: number;
  secondary_discount: number;
  paid_in: number;
  mgmt_fees: number;
  fund_expenses: number;
  lp_distributions: number;
  carry: number;
  net_tvpi: number;
  net_irr: number;
  gross_irr: number;
  dpi_year6: number;
  dpi_year7: number;
  loans_repaid: number;
  loans_multiple: number;
  largest_exit: number;
  horizon_years: number;
}

export interface FounderRow {
  exit: number;
  founders_vc: number;
  founders_profund: number;
  series_a_vc: number;
  series_a_profund: number;
}

export interface FounderMath {
  exits: number[];
  founders: number;
  holders: { id: string; label: string; stake: number; pref: number }[];
  vc_rounds: { id: string; label: string; bridge?: boolean; amount: number; post: number; pool: number }[];
  loans: number;
  loan_rate: number;
  loan_life: number;
  loan_multiple: number;
  vc_equity: number;
  raised_before: number;
  founders_after_vc: number;
  vc_stakes: { round: string; label: string; bridge: boolean; founders: number }[];
  rows: FounderRow[];
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
    loan_cap_pct: number;
    loan_cap: number;
    first_close_min: number;
    first_close_max: number;
    companies: number;
    positions: number;
  };
  terms: {
    fee_ip_pct: number;
    fee_loan_pct: number;
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
  secondary: { share: number; year: number; price_pct: number; lines: string[] };
  buyback_discount: number;
  loan_rate: number;
  loan_multiples: { zombie: number; loss: number; performing_min: number; performing_max: number };
  layers: Record<LayerId, FundLayer>;
  allocation: {
    seed: number;
    venture: number;
    growth: number;
    invested: number;
    first: number;
    buyback_follow: number;
    loans: number;
    after_first_pct: number;
    loans_pct: number;
    mgmt_fees: number;
    fund_expenses: number;
    contingency: number;
    total: number;
  };
  spv: { company: string; fund: number; spv: number }[];
  spv_total: number;
  fund_returner: {
    company: string; proceeds: number; multiple_of_fund: number;
    stake_at_exit: number;          // toutes ses lignes
    fund_returning_exit: number;    // la sortie à laquelle elle rend tout le fonds (loi 04)
  };
  cases: Record<CaseId, FundCase>;
  stress_tests: { id: string; label: string; net_tvpi: number; net_irr: number; dpi_year7: number }[];
  founder_math: FounderMath;
  reference_v2: { commit: string; net_tvpi: number; capped_exit: number; capped_net_tvpi: number };
}

export const fund = raw as unknown as FundData;

export const LAYER_IDS: LayerId[] = ['seed', 'venture', 'growth'];
export const CASE_IDS: CaseId[] = ['target', 'base', 'stress'];

/** Montant en euros. table : €750K / €27.6M ; val (valorisations) : €8.0M / €45M / €1.5B ;
 *  tile (grands chiffres, fourchettes) : millions ronds sans décimale (€15M, €326M). */
export function eur(v: number, mode: 'table' | 'val' | 'tile' = 'table'): string {
  if (v === 0) return '€0';
  if (mode === 'val') {
    if (v >= 1e9) return v % 1e9 === 0 ? `€${v / 1e9}B` : `€${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e7) return `€${(v / 1e6).toFixed(0)}M`;
  }
  if (mode === 'tile' && v >= 1e6 && v % 1e6 === 0) return `€${v / 1e6}M`;
  if (v < 1e6) return `€${(v / 1e3).toFixed(0)}K`;
  return `€${(v / 1e6).toFixed(1)}M`;
}

/** €150K – €1.5M */
export function eurRange(a: number, b: number, mode: 'table' | 'val' | 'tile' = 'tile', sep = ' – '): string {
  return `${eur(a, mode)}${sep}${eur(b, mode)}`;
}

/** 2.7× */
export function mult(x: number, dp = 1): string {
  return `${x.toFixed(dp)}×`;
}

/** 27% (dp = 0), 12.5% (dp = 1) */
export function pct(x: number, dp = 0): string {
  return `${(x * 100).toFixed(dp)}%`;
}

/** S-01 ; S-06/07 pour deux sociétés ; S-08–10 pour trois et plus. */
export function rowId(line: FundLine): string {
  if (line.n === 1) return line.id;
  const tail = line.last.split('-')[1];
  return line.n === 2 ? `${line.id}/${tail}` : `${line.id}–${tail}`;
}
