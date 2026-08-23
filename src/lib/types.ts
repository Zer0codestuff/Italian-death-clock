export type TruthLabel =
  | "FATTO"
  | "PROIEZIONE UFFICIALE"
  | "STIMA DEL MODELLO"
  | "SCENARIO"
  | "ANALOGIA RETORICA";

export type PersonalInputs = {
  age: number;
  grossSalaryAnnualReal: number;
  careerStartAge: number;
  contributionYearsToDate: number;
  salaryGrowthReal: number;
  retirementAge: number;
  contributionRate: number;
  publicBenefitFactor: number;
  fundedShare: number;
};

export type PersonalResult = {
  retirementYear: number;
  yearsToRetirement: number;
  totalContributionYears: number;
  finalSalary: number;
  publicContributions: number;
  fundedContributions: number;
  totalContributions: number;
  annualContributionToday: number;
  publicBalance: number;
  fundedBalance: number;
  annualPublicPension: number;
  annualFundedPension: number;
  annualPension: number;
  monthlyPension: number;
  replacementRatio: number;
};

export type MacroInputs = {
  employmentBase: number;
  employmentGrowth: number;
  netMigration: number;
  beneficiariesBase: number;
  beneficiaryGrowth: number;
  productivityGrowthReal: number;
  averageGrossWageReal: number;
  retirementAge: number;
  contributionRate: number;
  benefitFactor: number;
  indexationPassThrough: number;
  fundedShare: number;
};

export type MacroPoint = {
  year: number;
  employment: number;
  beneficiaries: number;
  wage: number;
  pressureIndex: number;
  workersPerBeneficiary: number;
  requiredPaygRate: number;
  balanceProxy: number;
  benefitReplacementProxy: number;
  fundedContributionFlow: number;
};

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publicationDate?: string | null;
  updatedDate?: string | null;
  observedYear?: number | string | null;
  accessed?: string;
  notes?: string;
};

export type ItalyData = {
  metadata: Record<string, unknown>;
  headlineMetrics: Array<Record<string, unknown>>;
  cashFlow: Record<string, any>;
  beneficiaries: Record<string, any>;
  multipleBenefits: Record<string, any>;
  amountDistribution: Record<string, any>;
  demography: Record<string, any>;
  spendingProjection: Record<string, any>;
  systemMechanics: Record<string, any>;
  methodologyNotes: Array<{ id: string; text: string }>;
  sourceCatalog: Source[];
};

export type InternationalData = {
  metadata: Record<string, unknown>;
  pillarMatrix: { rows: Array<Record<string, any>>; columnOrder: string[] };
  keyContrasts: Array<Record<string, any>>;
  comparableMetrics: Array<Record<string, any>>;
  countries: Record<string, any>;
  methodologyNotes: Array<{ id: string; text: string }>;
  sourceCatalog: Record<string, Source>;
};
