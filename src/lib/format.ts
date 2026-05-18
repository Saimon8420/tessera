export const round = (n: number, dp = 6): number =>
  Number.isFinite(n) ? Number(n.toFixed(dp)) : n;
export const ok = <T>(data: T, inputs?: unknown) =>
  inputs === undefined ? { data } : { data, inputs };
