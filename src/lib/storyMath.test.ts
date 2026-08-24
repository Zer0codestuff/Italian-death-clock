import { describe, expect, it } from "vitest";
import {
  countdownToPeakYear,
  currentRealValue,
  estimatePensionPayment,
  futureNominalValue,
  grossPaymentFromAnnual,
  interpolateAverageContributionYears,
  interpolateReplacementRate,
  retirementYearForAge,
} from "./storyMath";

const projections = [
  { year: 2050, oldAgeEarningsRelatedReplacementRate: 46 },
  { year: 2060, oldAgeEarningsRelatedReplacementRate: 50 },
  { year: 2070, oldAgeEarningsRelatedReplacementRate: 52 },
];

describe("story pension example", () => {
  it("uses 2026 as the base year", () => {
    expect(retirementYearForAge(32)).toBe(2061);
  });

  it("interpolates the official projection without extrapolating it", () => {
    expect(interpolateReplacementRate(projections, 2055)).toBe(48);
    expect(interpolateReplacementRate(projections, 2040)).toBe(46);
    expect(interpolateReplacementRate(projections, 2080)).toBe(52);
  });

  it("converts annual amounts into thirteen gross payments", () => {
    expect(grossPaymentFromAnnual(26_000)).toBe(2_000);
  });

  it("converts between real and nominal values without a double discount", () => {
    const nominal = futureNominalValue(2_000, 35, 0.02);
    expect(nominal).toBeCloseTo(3_999.78, 2);
    expect(currentRealValue(nominal, 35, 0.02)).toBeCloseTo(2_000, 6);
  });

  it("shows what a future amount is worth in 2026 euros", () => {
    expect(currentRealValue(1_000, 60, 0.02)).toBeCloseTo(304.78, 2);
  });

  it("keeps zero-inflation nominal and real values equal", () => {
    expect(futureNominalValue(2_000, 35, 0)).toBe(2_000);
  });

  it("interpolates the official average contribution period", () => {
    expect(interpolateAverageContributionYears(2061)).toBeCloseTo(36.17, 6);
  });

  it("uses accrued and future contribution years in the estimate", () => {
    const example = estimatePensionPayment({
      age: 32,
      grossAnnualPay: 32_000,
      contributionYearsToday: 10,
      projections,
    });
    expect(example.retirementYear).toBe(2061);
    expect(example.projectedContributionYears).toBe(45);
    expect(example.officialReplacementRatePercent).toBeCloseTo(50.2, 6);
    expect(example.estimatedReplacementRatePercent).toBeCloseTo(62.455, 3);
    expect(example.realPayment).toBeCloseTo(1_537.36, 2);
    expect(example.nominalPayment).toBeCloseTo(3_074.54, 2);
  });

  it("does not show an amount below the current ordinary contribution requirement", () => {
    const example = estimatePensionPayment({
      age: 55,
      grossAnnualPay: 32_000,
      contributionYearsToday: 0,
      projections,
    });
    expect(example.projectedContributionYears).toBe(12);
    expect(example.meetsOrdinaryContributionRequirement).toBe(false);
    expect(example.realPayment).toBe(0);
    expect(example.nominalPayment).toBe(0);
  });

  it("uses the selected inflation rate", () => {
    const example = estimatePensionPayment({
      age: 32,
      grossAnnualPay: 32_000,
      contributionYearsToday: 10,
      inflationRate: 0,
      projections,
    });
    expect(example.nominalPayment).toBeCloseTo(example.realPayment, 6);
  });
});

describe("peak-year countdown", () => {
  it("uses the start of 2036 as an explicit visual anchor", () => {
    const countdown = countdownToPeakYear(new Date(2035, 11, 31, 23, 59, 59));
    expect(countdown).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });
});
