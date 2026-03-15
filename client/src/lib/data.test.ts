import { describe, it, expect } from "vitest";
import {
  interpolate,
  computeMinutes,
  computeBasketMinutes,
  computePurchasingPowerForRef,
  products,
  basketWeights,
  smicRates,
  DATA_END_YEAR,
} from "@/lib/data";

// ── interpolate ────────────────────────────────────────────
describe("interpolate", () => {
  it("returns the original point when only one point", () => {
    const result = interpolate({ 2000: 5.0 });
    expect(result).toEqual({ 2000: 5.0 });
  });

  it("linearly interpolates between two points (check midpoint)", () => {
    const result = interpolate({ 2000: 0, 2002: 2 });
    expect(result[2001]).toBeCloseTo(1, 4);
  });

  it("fills every year from min to max, no gaps", () => {
    const result = interpolate({ 1990: 1, 1995: 2 });
    for (let y = 1990; y <= 1995; y++) {
      expect(result[y]).toBeDefined();
    }
    expect(Object.keys(result).length).toBe(6);
  });

  it("preserves exact values at known years", () => {
    const raw = { 1960: 3.5, 1970: 7.0, 1980: 14.0 };
    const result = interpolate(raw);
    expect(result[1960]).toBe(3.5);
    expect(result[1970]).toBe(7.0);
    expect(result[1980]).toBe(14.0);
  });
});

// ── computeMinutes ─────────────────────────────────────────
describe("computeMinutes", () => {
  it("basic: price=1, rate=0.5/hr → 120 min", () => {
    const result = computeMinutes({ 2000: 1 }, { 2000: 0.5 });
    expect(result[2000]).toBeCloseTo(120, 1);
  });

  it("price=6.5 (baguette ~2007), rate=6.5 → 60 min", () => {
    const result = computeMinutes({ 2007: 6.5 }, { 2007: 6.5 });
    expect(result[2007]).toBeCloseTo(60, 1);
  });

  it("years with no rate entry are excluded from result", () => {
    const result = computeMinutes({ 2000: 1, 2001: 1 }, { 2000: 1 });
    expect(result[2000]).toBeDefined();
    expect(result[2001]).toBeUndefined();
  });
});

// ── computeBasketMinutes / computePurchasingPowerForRef ────
describe("computeBasketMinutes (via computePurchasingPowerForRef)", () => {
  it("the purchasing power index at base year equals 100", () => {
    const pp = computePurchasingPowerForRef("smic");
    const baseYear = pp.indexBaseYear;
    expect(pp.purchasingPowerIndex[baseYear]).toBeCloseTo(100, 0);
  });

  it("the multiplier for smic is a string that parses as a finite number > 0", () => {
    const pp = computePurchasingPowerForRef("smic");
    const num = parseFloat(pp.multiplier);
    expect(isFinite(num)).toBe(true);
    expect(num).toBeGreaterThan(0);
  });
});

// ── data integrity ─────────────────────────────────────────
describe("data integrity", () => {
  it("products has at least 20 entries", () => {
    expect(Object.keys(products).length).toBeGreaterThanOrEqual(20);
  });

  it("every product has id, nameFr, nameEn, emoji, category", () => {
    for (const [key, product] of Object.entries(products)) {
      expect(product.id, `${key}.id`).toBeTruthy();
      expect(product.nameFr, `${key}.nameFr`).toBeTruthy();
      expect(product.nameEn, `${key}.nameEn`).toBeTruthy();
      expect(product.emoji, `${key}.emoji`).toBeTruthy();
      expect(product.category, `${key}.category`).toBeTruthy();
    }
  });

  it("every product with weight > 0 in basketWeights exists in products", () => {
    for (const [pid, weight] of Object.entries(basketWeights)) {
      if (weight > 0) {
        expect(products[pid], `products["${pid}"] should exist`).toBeDefined();
      }
    }
  });

  it("smicRates[1960] equals 0.22", () => {
    expect(smicRates[1960]).toBe(0.22);
  });

  it("DATA_END_YEAR >= 2024", () => {
    expect(DATA_END_YEAR).toBeGreaterThanOrEqual(2024);
  });
});
