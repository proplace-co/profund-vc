// Types du moteur JS (founderMath.js est en JS pur pour être importé par scripts/prerender.mjs).
export interface Holder { id: string; stake: number; pref: number }
export interface PlanStep { loan?: number; skip?: boolean }

export function payout(value: number, holders: Holder[]): Record<string, number>;

export function sameCapitalPlan(rounds: { loan?: number }[]): PlanStep[];
export function halfCapitalPlan(rounds: { bridge?: boolean }[]): PlanStep[];
export function creditPlan(rounds: unknown[]): PlanStep[];

export function founderPaths(input: {
  founders: number;
  holders: Holder[];
  rounds: { amount: number; post: number; pool?: number }[];
  loans: number;
  loanMultiple: number;
  plan?: PlanStep[];
  poolBuyback?: boolean;
  exit: number;
}): {
  vc: { founders: number; stakeAtExit: number; stakes: number[]; equityRaised: number };
  profund: { founders: number; stakeAtExit: number; stakes: number[]; debt: number; lent: number; poolCost: number; equityRaised: number };
  payouts: { vc: Record<string, number>; profund: Record<string, number> };
};

export function millions(v: number): number;
