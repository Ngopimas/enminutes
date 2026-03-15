// ============================================================
// Pure calculation helpers: interpolate & computeMinutes
// ============================================================

import { smicRates } from "./salary-rates";

// ── Helper: linear interpolation ───────────────────────────
export function interpolate(
  rawPoints: Record<number, number>,
): Record<number, number> {
  const years = Object.keys(rawPoints)
    .map(Number)
    .sort((a, b) => a - b);
  const result: Record<number, number> = {};
  for (let y = years[0]; y <= years[years.length - 1]; y++) {
    if (rawPoints[y] !== undefined) {
      result[y] = rawPoints[y];
    } else {
      let lo = years[0],
        hi = years[years.length - 1];
      for (const yr of years) {
        if (yr <= y) lo = yr;
      }
      for (let i = years.length - 1; i >= 0; i--) {
        if (years[i] >= y) hi = years[i];
      }
      if (lo === hi) {
        result[y] = rawPoints[lo];
      } else {
        const t = (y - lo) / (hi - lo);
        result[y] = +(
          rawPoints[lo] +
          t * (rawPoints[hi] - rawPoints[lo])
        ).toFixed(4);
      }
    }
  }
  return result;
}

// ── Helper: compute minutes of work ────────────────────────
export function computeMinutes(
  pricesInterp: Record<number, number>,
  rates: Record<number, number> = smicRates,
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [y, price] of Object.entries(pricesInterp)) {
    const yr = Number(y);
    const rate = rates[yr];
    if (rate) {
      result[yr] = +((price / rate) * 60).toFixed(1);
    }
  }
  return result;
}
