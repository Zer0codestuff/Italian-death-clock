export const chartXForYear = (
  year: number,
  firstYear: number,
  lastYear: number,
  width = 720,
  left = 50,
  right = 24,
): number => {
  const span = Math.max(lastYear - firstYear, 1);
  return left + ((year - firstYear) / span) * (width - left - right);
};
