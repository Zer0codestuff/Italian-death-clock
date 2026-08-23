import type {
  MacroInputs,
  MacroPoint,
  PersonalInputs,
  PersonalResult,
} from "./types";

export const FUNDED_REAL_RETURN = 0.03;
export const PAYOUT_HORIZON_YEARS = 22;
export const MODEL_BASE_YEAR = 2025;
export const BASE_ANNUAL_PENSION_OUTLAY = 364_132_000_000;

const annuityFactor = (rate: number, horizon: number): number => {
  if (rate === 0) return 1 / horizon;
  return rate / (1 - Math.pow(1 + rate, -horizon));
};

export const calculatePersonal = (inputs: PersonalInputs): PersonalResult => {
  const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.age);
  const totalContributionYears = Math.max(
    0,
    inputs.contributionYearsToDate + yearsToRetirement,
  );
  const salaryGrowth = inputs.salaryGrowthReal;
  const publicShare = Math.max(0, 1 - inputs.fundedShare);
  const publicRate = inputs.contributionRate * publicShare;
  const fundedRate = inputs.contributionRate * inputs.fundedShare;
  let publicBalance = 0;
  let fundedBalance = 0;
  let publicContributions = 0;
  let fundedContributions = 0;

  for (let yearIndex = 0; yearIndex < totalContributionYears; yearIndex += 1) {
    const salary =
      inputs.grossSalaryAnnualReal *
      Math.pow(1 + salaryGrowth, yearIndex - inputs.contributionYearsToDate);
    const publicContribution = publicRate * salary;
    const fundedContribution = fundedRate * salary;
    const yearsUntilRetirement = totalContributionYears - 1 - yearIndex;
    publicContributions += publicContribution;
    fundedContributions += fundedContribution;
    publicBalance += publicContribution * Math.pow(1 + salaryGrowth, yearsUntilRetirement);
    fundedBalance += fundedContribution * Math.pow(1 + FUNDED_REAL_RETURN, yearsUntilRetirement);
  }

  const annualPublicPension =
    inputs.publicBenefitFactor * publicBalance * annuityFactor(0, PAYOUT_HORIZON_YEARS);
  const annualFundedPension = fundedBalance * annuityFactor(FUNDED_REAL_RETURN, PAYOUT_HORIZON_YEARS);
  const annualPension = annualPublicPension + annualFundedPension;
  const finalSalary =
    inputs.grossSalaryAnnualReal * Math.pow(1 + salaryGrowth, yearsToRetirement);

  return {
    retirementYear: MODEL_BASE_YEAR + yearsToRetirement,
    yearsToRetirement,
    totalContributionYears,
    finalSalary,
    publicContributions,
    fundedContributions,
    totalContributions: publicContributions + fundedContributions,
    annualContributionToday: inputs.grossSalaryAnnualReal * inputs.contributionRate,
    publicBalance,
    fundedBalance,
    annualPublicPension,
    annualFundedPension,
    annualPension,
    monthlyPension: annualPension / 12,
    replacementRatio: finalSalary > 0 ? annualPension / finalSalary : 0,
  };
};

export const DEFAULT_MACRO_INPUTS: MacroInputs = {
  employmentBase: 24.142,
  employmentGrowth: -0.002,
  netMigration: 150_000,
  beneficiariesBase: 16.306,
  beneficiaryGrowth: 0.0065,
  productivityGrowthReal: 0.01,
  averageGrossWageReal: 32_000,
  retirementAge: 67,
  contributionRate: 0.33,
  benefitFactor: 1,
  indexationPassThrough: 0.75,
  fundedShare: 0,
};

export const calculateMacro = (
  inputs: MacroInputs,
  endYear = 2075,
): MacroPoint[] => {
  const averageBenefitBase = BASE_ANNUAL_PENSION_OUTLAY / (inputs.beneficiariesBase * 1_000_000);
  const points: MacroPoint[] = [];
  let employment = inputs.employmentBase;
  let beneficiaries = inputs.beneficiariesBase;
  const baseRatio = inputs.beneficiariesBase / Math.max(inputs.employmentBase, 0.000001);

  for (let year = MODEL_BASE_YEAR; year <= endYear; year += 1) {
    const t = year - MODEL_BASE_YEAR;
    const wage = inputs.averageGrossWageReal * Math.pow(1 + inputs.productivityGrowthReal, t);
    const ageShift = inputs.retirementAge - 67;
    const employmentAdjusted = employment * (1 + 0.01 * ageShift);
    const beneficiaryAdjusted = beneficiaries * Math.max(0.75, 1 - ageShift / PAYOUT_HORIZON_YEARS);
    const wageBill = employmentAdjusted * 1_000_000 * wage;
    const benefitPerPerson =
      averageBenefitBase * inputs.benefitFactor *
      Math.pow(1 + inputs.indexationPassThrough * inputs.productivityGrowthReal, t);
    const benefitOutlay = beneficiaryAdjusted * 1_000_000 * benefitPerPerson;
    const publicRevenue = inputs.contributionRate * (1 - inputs.fundedShare) * wageBill;
    const pressureIndex = (beneficiaryAdjusted / Math.max(employmentAdjusted, 0.000001)) / baseRatio;
    const requiredPaygRate = benefitOutlay / Math.max((1 - inputs.fundedShare) * wageBill, 1);
    const balanceProxy = publicRevenue / Math.max(benefitOutlay, 1);

    points.push({
      year,
      employment: employmentAdjusted,
      beneficiaries: beneficiaryAdjusted,
      wage,
      pressureIndex,
      workersPerBeneficiary: employmentAdjusted / Math.max(beneficiaryAdjusted, 0.000001),
      requiredPaygRate,
      balanceProxy,
      benefitReplacementProxy: benefitPerPerson / Math.max(wage, 1),
      fundedContributionFlow: inputs.contributionRate * inputs.fundedShare * wageBill,
    });

    employment = Math.max(0, employment * (1 + inputs.employmentGrowth) + inputs.netMigration / 1_000_000);
    beneficiaries = Math.max(0, beneficiaries * (1 + inputs.beneficiaryGrowth));
  }

  return points;
};

export const interpolateMacroPoint = (points: MacroPoint[], year: number): MacroPoint => {
  if (points.length === 0) {
    throw new Error("Macro model returned no points");
  }
  const closest = points.reduce((best, point) =>
    Math.abs(point.year - year) < Math.abs(best.year - year) ? point : best,
  );
  return closest;
};

