// Types du moteur JS (founderMath.js est en JS pur pour être importé par scripts/prerender.mjs).
export interface Holder { id: string; stake: number; pref: number }

export function payout(value: number, holders: Holder[]): Record<string, number>;

export function founderPaths(input: {
  founders: number;
  holders: Holder[];
  rounds: { amount: number; post: number; pool?: number }[];
  loans: number;
  loanMultiple: number;
  extra?: { amount: number; post: number }[];
  exit: number;
}): {
  vc: { founders: number; stakeAtExit: number; stakes: number[]; equityRaised: number };
  profund: { founders: number; stakeAtExit: number; debt: number; equityRaised: number };
  payouts: { vc: Record<string, number>; profund: Record<string, number> };
};

export function millions(v: number): number;

export function vcCapTable(input: {
  founders: number;
  holders: Holder[];
  rounds: { amount: number; post: number; pool?: number }[];
}): Holder[];

export function atFounderStake(cap: Holder[], stake: number): Holder[];
