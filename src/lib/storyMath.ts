export type ReplacementProjection = {
  year: number;
  oldAgeEarningsRelatedReplacementRate: number;
};

export const STORY_BASE_YEAR = 2026;
export const ILLUSTRATIVE_RETIREMENT_AGE = 67;
export const PENSION_PAYMENTS_PER_YEAR = 13;
export const ILLUSTRATIVE_INFLATION_RATE = 0.02;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const retirementYearForAge = (
  age: number,
  baseYear = STORY_BASE_YEAR,
  retirementAge = ILLUSTRATIVE_RETIREMENT_AGE,
): number => baseYear + Math.max(0, retirementAge - age);

export const interpolateReplacementRate = (
  projections: ReplacementProjection[],
  year: number,
): number => {
  if (projections.length === 0) return 0;
  const sorted = [...projections].sort((a, b) => a.year - b.year);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last) return 0;
  if (year <= first.year) return first.oldAgeEarningsRelatedReplacementRate;
  if (year >= last.year) return last.oldAgeEarningsRelatedReplacementRate;

  const upperIndex = sorted.findIndex((point) => point.year >= year);
  const upper = sorted[upperIndex];
  const lower = sorted[upperIndex - 1];
  if (!lower || !upper) return first.oldAgeEarningsRelatedReplacementRate;
  const progress = (year - lower.year) / (upper.year - lower.year);
  return lower.oldAgeEarningsRelatedReplacementRate +
    (upper.oldAgeEarningsRelatedReplacementRate - lower.oldAgeEarningsRelatedReplacementRate) * progress;
};

export const futureNominalValue = (
  realValue: number,
  years: number,
  inflationRate = ILLUSTRATIVE_INFLATION_RATE,
): number => realValue * Math.pow(1 + inflationRate, Math.max(0, years));

export const currentRealValue = (
  nominalValue: number,
  years: number,
  inflationRate = ILLUSTRATIVE_INFLATION_RATE,
): number => nominalValue / Math.pow(1 + inflationRate, Math.max(0, years));

export const grossPaymentFromAnnual = (
  annualAmount: number,
  payments = PENSION_PAYMENTS_PER_YEAR,
): number => payments > 0 ? annualAmount / payments : 0;

export const projectedPaymentExample = ({
  age,
  grossAnnualPay,
  projections,
}: {
  age: number;
  grossAnnualPay: number;
  projections: ReplacementProjection[];
}) => {
  const safeAge = clamp(age, 18, ILLUSTRATIVE_RETIREMENT_AGE);
  const safePay = Math.max(0, grossAnnualPay);
  const retirementYear = retirementYearForAge(safeAge);
  const years = Math.max(0, retirementYear - STORY_BASE_YEAR);
  const replacementRatePercent = interpolateReplacementRate(projections, retirementYear);
  const annualRealPension = safePay * replacementRatePercent / 100;
  const realPayment = grossPaymentFromAnnual(annualRealPension);
  const nominalPayment = futureNominalValue(realPayment, years);

  return {
    retirementYear,
    years,
    replacementRatePercent,
    annualRealPension,
    realPayment,
    nominalPayment,
  };
};

export const countdownToPeakYear = (now: Date, peakYear = 2036) => {
  const target = new Date(peakYear, 0, 1, 0, 0, 0, 0);
  const totalMilliseconds = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMilliseconds / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};
