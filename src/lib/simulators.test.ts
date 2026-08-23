import { describe, expect, it } from "vitest";
import {
  calculateMacro,
  calculatePersonal,
  DEFAULT_MACRO_INPUTS,
  PAYOUT_HORIZON_YEARS,
} from "./simulators";
import type { MacroInputs, PersonalInputs } from "./types";

const personalFixture: PersonalInputs = {
  age: 32,
  grossSalaryAnnualReal: 32_000,
  careerStartAge: 23,
  contributionYearsToDate: 9,
  salaryGrowthReal: 0.01,
  retirementAge: 67,
  contributionRate: 0.33,
  publicBenefitFactor: 0.9,
  fundedShare: 0,
};

describe("personal simulator", () => {
  it("keeps a public-only scenario on the documented annuity horizon", () => {
    const result = calculatePersonal(personalFixture);
    expect(result.fundedBalance).toBe(0);
    expect(result.fundedContributions).toBe(0);
    expect(result.annualPublicPension).toBeCloseTo(
      result.publicBalance * personalFixture.publicBenefitFactor / PAYOUT_HORIZON_YEARS,
      6,
    );
    expect(result.annualPension).toBeGreaterThan(0);
    expect(result.retirementYear).toBe(2060);
  });

  it("adds a funded account without changing total contributions", () => {
    const funded = calculatePersonal({ ...personalFixture, fundedShare: 0.2 });
    const publicOnly = calculatePersonal(personalFixture);
    expect(funded.totalContributions).toBeCloseTo(publicOnly.totalContributions, 6);
    expect(funded.fundedBalance).toBeGreaterThan(0);
    expect(funded.annualFundedPension).toBeGreaterThan(0);
  });

  it("responds to a higher real salary path", () => {
    const low = calculatePersonal({ ...personalFixture, salaryGrowthReal: 0 });
    const high = calculatePersonal({ ...personalFixture, salaryGrowthReal: 0.02 });
    expect(high.finalSalary).toBeGreaterThan(low.finalSalary);
    expect(high.annualPension).toBeGreaterThan(low.annualPension);
  });
});

describe("macro simulator", () => {
  it("starts at pressure index 1.00 and returns requested checkpoints", () => {
    const points = calculateMacro(DEFAULT_MACRO_INPUTS);
    expect(points[0]?.year).toBe(2025);
    expect(points[0]?.pressureIndex).toBeCloseTo(1, 10);
    expect(points.some((point) => point.year === 2050)).toBe(true);
  });

  it("makes a higher funded share visible in the PAYG flow", () => {
    const baseline = calculateMacro(DEFAULT_MACRO_INPUTS).find((point) => point.year === 2050);
    const fundedInputs: MacroInputs = { ...DEFAULT_MACRO_INPUTS, fundedShare: 0.2 };
    const funded = calculateMacro(fundedInputs).find((point) => point.year === 2050);
    expect(funded?.requiredPaygRate).toBeGreaterThan(baseline?.requiredPaygRate ?? 0);
    expect(funded?.balanceProxy).toBeLessThan(baseline?.balanceProxy ?? 0);
  });

  it("moves the demographic proxy when retirement age changes", () => {
    const later = calculateMacro({ ...DEFAULT_MACRO_INPUTS, retirementAge: 70 }).find((point) => point.year === 2050);
    const baseline = calculateMacro(DEFAULT_MACRO_INPUTS).find((point) => point.year === 2050);
    expect(later?.pressureIndex).toBeLessThan(baseline?.pressureIndex ?? 0);
  });
});
