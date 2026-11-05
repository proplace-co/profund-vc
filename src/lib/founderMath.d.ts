// Types du moteur JS (founderMath.js est en JS pur pour être importé par scripts/prerender.mjs).
export interface Holder { id: string; stake: number; pref: number }

export function payout(value: number, holders: Holder[]): Record<string, number>;

export function founderPaths(input: {
  founders: number;
  holders: Holder[];
  rounds: { amount: number; post: number }[];
  loans: number;
  loanMultiple: number;
  exit: number;
}): {
  vc: { founders: number; stakeAtExit: number; stakes: number[]; equityRaised: number };
  profund: { founders: number; stakeAtExit: number; debt: number };
  payouts: { vc: Record<string, number>; profund: Record<string, number> };
};

export function millions(v: number): number;
