import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  CashFlowChart,
  DemographyChart,
  DistributionChart,
  InternationalBarChart,
  MacroChart,
  MultipleBenefitsChart,
  SpendingChart,
  TimelineChart,
} from "./components/Charts";
import { useLocalizedFormat } from "./lib/format";
import { deriveEmploymentContext, type EmploymentContext } from "./lib/employmentContext";
import { FUNDING_LABELS, getAppCopy, MANDATE_LABELS } from "./lib/copy";
import { useLanguage } from "./lib/language";
import type { Language } from "./lib/language";
import {
  calculateMacro,
  calculatePersonal,
  DEFAULT_MACRO_INPUTS,
  interpolateMacroPoint,
  MODEL_BASE_YEAR,
} from "./lib/simulators";
import { sourceCardNote, sourceCardTitle, sourceMetadataLabel } from "./lib/sourceMetadata";
import { useDebouncedValue } from "./lib/useDebouncedValue";
import type {
  InternationalData,
  ItalyData,
  MacroInputs,
  PersonalInputs,
  Source,
  TruthLabel,
} from "./lib/types";
import "./styles.css";

const defaultPersonal: PersonalInputs = {
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

const truthClass: Record<TruthLabel, string> = {
  FATTO: "truth-badge--fact",
  "PROIEZIONE UFFICIALE": "truth-badge--official",
  "STIMA DEL MODELLO": "truth-badge--model",
  SCENARIO: "truth-badge--scenario",
  "ANALOGIA RETORICA": "truth-badge--rhetorical",
};

const translateFunding = (value: string, language: Language): string => FUNDING_LABELS[language][value] ?? value;
const translateMandate = (value: string, language: Language): string => MANDATE_LABELS[language][value] ?? value;

const formatMetric = (metric: Record<string, unknown>, format: ReturnType<typeof useLocalizedFormat>): string => {
  const unit = String(metric.unit ?? "");
  const value = Number(metric.value);
  if (unit.includes("million")) return format.millions(value, 1);
  if (unit.includes("percent")) return format.percentPoints(value, 1);
  if (unit === "benefits") return format.millions(value / 1_000_000, 1);
  return format.number(value, 1);
};

const sourceMap = (italy: ItalyData, international: InternationalData): Record<string, Source> => ({
  ...Object.fromEntries(italy.sourceCatalog.map((source) => [source.id, source])),
  ...Object.fromEntries(Object.entries(international.sourceCatalog).map(([id, source]) => [id, { ...source, id }])),
});

const SourceChip = ({ id, sources }: { id: string; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const source = sources[id];
  if (!source) return null;
  const year = sourceMetadataLabel(source, language);
  return (
    <a className="source-chip" href={source.url} target="_blank" rel="noreferrer" title={`${sourceCardTitle(source, language)}, ${year}`}>
      <span className="source-chip__mark" aria-hidden="true">↗</span>
      <span>{source.publisher}</span>
      <span className="source-chip__year">{year}</span>
    </a>
  );
};

const TruthBadge = ({ label }: { label: TruthLabel }) => {
  const { language } = useLanguage();
  return <span className={`truth-badge ${truthClass[label]}`}>{getAppCopy(language).truth[label]}</span>;
};

const SectionKicker = ({ number, label }: { number: string; label: string }) => (
  <div className="section-kicker"><span>{number}</span><strong>{label}</strong></div>
);

const MetricCard = ({
  value,
  label,
  note,
  truth,
  sourceId,
  sources,
}: {
  value: string;
  label: string;
  note: string;
  truth: TruthLabel;
  sourceId?: string;
  sources: Record<string, Source>;
}) => (
  <article className="metric-card">
    <div className="metric-card__top"><TruthBadge label={truth} />{sourceId ? <SourceChip id={sourceId} sources={sources} /> : null}</div>
    <strong className="metric-card__value">{value}</strong>
    <span className="metric-card__label">{label}</span>
    <p>{note}</p>
  </article>
);

const SourceLine = ({ sourceIds, sources }: { sourceIds: string[]; sources: Record<string, Source> }) => (
  <div className="source-line">{sourceIds.map((id) => <SourceChip id={id} sources={sources} key={id} />)}</div>
);

const Control = ({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  help,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  help?: string;
}) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const [draft, setDraft] = useState(() => String(value));
  const [isEditing, setIsEditing] = useState(false);
  const helpId = help ? `${id}-help` : undefined;
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const rangeStyle = { "--range-progress": `${Math.min(100, Math.max(0, progress))}%` } as CSSProperties;

  useEffect(() => {
    if (!isEditing) setDraft(String(value));
  }, [isEditing, value]);

  const commitDraft = () => {
    const parsed = draft.trim() === "" ? Number.NaN : Number(draft);
    if (Number.isFinite(parsed)) {
      const nextValue = Math.min(max, Math.max(min, parsed));
      onChange(nextValue);
      setDraft(String(nextValue));
    } else {
      setDraft(String(value));
    }
    setIsEditing(false);
  };

  return (
    <div className="control">
      <span className="control__head"><label htmlFor={id}>{label}</label><output htmlFor={id}>{display}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} style={rangeStyle} aria-describedby={helpId} aria-label={label} aria-valuetext={display} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="control__precise">
        <label htmlFor={`${id}-precise`}>{copy.common.preciseValue}</label>
        <input
          id={`${id}-precise`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-describedby={helpId}
          aria-label={`${label}, ${copy.common.numericEntry}`}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setIsEditing(true)}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
        />
      </div>
      {help ? <small id={helpId}>{help}</small> : null}
    </div>
  );
};

const StatCard = ({ label, value, note, accent = "red" }: { label: string; value: string; note: string; accent?: "red" | "navy" | "yellow" }) => (
  <article className={`stat-card stat-card--${accent}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>
);

const MethodDetails = ({ title, children }: { title: string; children: ReactNode }) => {
  const { language } = useLanguage();
  return (
    <details className="method-details">
      <summary><span>{title}</span><span className="method-details__toggle">{getAppCopy(language).common.openMethod}</span></summary>
      <div className="method-details__body">{children}</div>
    </details>
  );
};

const LoadingShell = ({ error, retry }: { error: boolean; retry: () => void }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  return (
    <main className="loading-shell" id="contenuto">
      <div className="brand-line"><span className="brand-mark">/</span><span>{copy.loading.brand}</span></div>
      <div className="loading-card">
        <TruthBadge label={error ? "STIMA DEL MODELLO" : "FATTO"} />
        <h1>{error ? copy.loading.errorTitle : copy.loading.title}</h1>
        <p>{error ? copy.loading.failed : copy.loading.body}</p>
        {error ? <button className="button button--red" type="button" onClick={retry}>{copy.loading.retry}</button> : <div className="loading-bar" role="progressbar" aria-label={copy.loading.progress} />}
      </div>
    </main>
  );
};

const Header = ({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) => {
  const { language, setLanguage } = useLanguage();
  const copy = getAppCopy(language);
  return (
    <header className="site-header">
      <a className="site-logo" href="#alert" aria-label={copy.header.home}><span className="site-logo__mark">/</span><span>{copy.header.brandTop}<br />{copy.header.brandBottom}</span></a>
      <nav className="desktop-nav" aria-label={copy.header.navigation}>
        {copy.nav.map(({ id, label, number }) => <a className={activeId === id ? "is-active" : ""} href={`#${id}`} aria-current={activeId === id ? "location" : undefined} key={id}><span>{number}</span>{label}</a>)}
      </nav>
      <label className="mobile-nav-label" htmlFor="mobile-nav">{copy.header.mobileLabel}</label>
      <select id="mobile-nav" className="mobile-nav" value={activeId} aria-label={copy.header.mobileLabel} onChange={(event) => onNavigate(event.target.value)}>
        {copy.nav.map(({ id, mobileLabel }) => <option value={id} key={id}>{mobileLabel}</option>)}
      </select>
      <div className="language-switch" role="group" aria-label={copy.header.language}>
        <button type="button" lang="it" aria-label={copy.header.italian} aria-pressed={language === "it"} onClick={() => setLanguage("it")}>IT</button>
        <button type="button" lang="en" aria-label={copy.header.english} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
      </div>
    </header>
  );
};

const Hero = ({ italy, sources }: { italy: ItalyData; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const findMetric = (id: string) => italy.headlineMetrics.find((metric) => metric.id === id);
  const currentBenefits = findMetric("inps_current_benefits");
  const peak = findMetric("public_pension_expenditure_peak");
  const population = findMetric("istat_population_2050");
  return (
    <section className="hero scene" id="alert" aria-labelledby="hero-title">
      <div className="hero__content">
        <div className="alert-strip"><span className="alert-strip__signal" /> {copy.hero.alert}</div>
        <div className="hero__eyebrow"><span className="hero__slash">/</span> {copy.hero.eyebrow} <span className="hero__date">{copy.hero.updated}</span></div>
        <h1 id="hero-title">{copy.hero.titleStart}<br /><em>{copy.hero.titleEmphasis}</em> {copy.hero.titleEnd}</h1>
        <div className="hero__bottom">
          <div>
            <p className="hero__lead">{copy.hero.lead}</p>
            <div className="truth-line"><TruthBadge label="ANALOGIA RETORICA" /><span>{copy.hero.rhetorical}</span></div>
            <a className="button button--cream" href="#anni">{copy.hero.cta} <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero__facts" role="group" aria-label={copy.hero.factsAria}>
            <MetricCard value={currentBenefits ? formatMetric(currentBenefits, format) : copy.common.notAvailable} label={copy.hero.benefitsLabel} note={copy.hero.benefitsNote} truth="FATTO" sourceId="inps_observatory_2026" sources={sources} />
            <MetricCard value={peak ? formatMetric(peak, format) : copy.common.notAvailable} label={copy.hero.peakLabel} note={copy.hero.peakNote} truth="PROIEZIONE UFFICIALE" sourceId="ec_ageing_2024_italy" sources={sources} />
            <MetricCard value={population ? formatMetric(population, format) : copy.common.notAvailable} label={copy.hero.populationLabel} note={copy.hero.populationNote} truth="PROIEZIONE UFFICIALE" sourceId="istat_population_2025" sources={sources} />
          </div>
        </div>
      </div>
    </section>
  );
};

const PersonalScene = ({
  personal,
  setPersonal,
  result,
  announcedResult,
  sources,
}: {
  personal: PersonalInputs;
  setPersonal: (updater: (previous: PersonalInputs) => PersonalInputs) => void;
  result: ReturnType<typeof calculatePersonal>;
  announcedResult: ReturnType<typeof calculatePersonal>;
  sources: Record<string, Source>;
}) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const change = (key: keyof PersonalInputs, value: number) => {
    setPersonal((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "age") {
        next.careerStartAge = Math.min(next.careerStartAge, value);
        next.contributionYearsToDate = Math.min(next.contributionYearsToDate, Math.max(0, value - next.careerStartAge));
        next.retirementAge = Math.max(next.retirementAge, value + 1);
      }
      if (key === "careerStartAge") {
        next.contributionYearsToDate = Math.min(next.contributionYearsToDate, Math.max(0, next.age - value));
      }
      return next;
    });
  };
  return (
    <section className="scene section section--cream" id="anni" aria-labelledby="anni-title">
      <div className="section-inner">
        <SectionKicker number="01" label={copy.personal.kicker} />
        <div className="section-heading section-heading--split">
          <div><h2 id="anni-title">{copy.personal.titleStart}<br /><em>{copy.personal.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="SCENARIO" /><p className="section-intro">{copy.personal.intro}</p></div>
        </div>
        <div className="personal-grid">
          <div className="panel panel--dark personal-controls">
            <div className="panel-heading"><span className="eyebrow eyebrow--light">{copy.personal.inputs}</span><div className="panel-heading__actions"><span className="panel-status">{copy.personal.local}</span><button className="reset-button reset-button--light" type="button" onClick={() => setPersonal(() => ({ ...defaultPersonal }))}>{copy.common.reset}</button></div></div>
            <Control id="personal-age" label={copy.personal.age} value={personal.age} min={18} max={64} step={1} display={`${personal.age} ${copy.common.years}`} onChange={(value) => change("age", value)} />
            <Control id="personal-salary" label={copy.personal.salary} value={personal.grossSalaryAnnualReal} min={12_000} max={100_000} step={500} display={format.euro(personal.grossSalaryAnnualReal)} onChange={(value) => change("grossSalaryAnnualReal", value)} help={copy.personal.salaryHelp} />
            <Control id="personal-career" label={copy.personal.career} value={personal.careerStartAge} min={16} max={personal.age} step={1} display={`${personal.careerStartAge} ${copy.common.years}`} onChange={(value) => change("careerStartAge", value)} />
            <Control id="personal-years" label={copy.personal.contributed} value={personal.contributionYearsToDate} min={0} max={Math.max(0, personal.age - personal.careerStartAge)} step={1} display={`${personal.contributionYearsToDate} ${copy.common.years}`} onChange={(value) => change("contributionYearsToDate", value)} />
            <Control id="personal-growth" label={copy.personal.growth} value={personal.salaryGrowthReal} min={-0.02} max={0.04} step={0.001} display={format.percent(personal.salaryGrowthReal, 1)} onChange={(value) => change("salaryGrowthReal", value)} help={copy.personal.growthHelp} />
            <details className="advanced-controls"><summary>{copy.personal.advanced}</summary>
              <Control id="personal-retirement" label={copy.personal.retirement} value={personal.retirementAge} min={personal.age + 1} max={75} step={1} display={`${personal.retirementAge} ${copy.common.years}`} onChange={(value) => change("retirementAge", value)} help={copy.personal.retirementHelp} />
              <Control id="personal-rate" label={copy.personal.rate} value={personal.contributionRate} min={0.2} max={0.45} step={0.005} display={format.percent(personal.contributionRate, 1)} onChange={(value) => change("contributionRate", value)} />
              <Control id="personal-benefit" label={copy.personal.benefit} value={personal.publicBenefitFactor} min={0.6} max={1.2} step={0.01} display={format.number(personal.publicBenefitFactor, 2)} onChange={(value) => change("publicBenefitFactor", value)} />
              <Control id="personal-funded" label={copy.personal.funded} value={personal.fundedShare} min={0} max={0.4} step={0.01} display={format.percent(personal.fundedShare, 0)} onChange={(value) => change("fundedShare", value)} />
            </details>
          </div>
          <div className="personal-output">
            <TimelineChart age={personal.age} careerStartAge={personal.careerStartAge} retirementAge={personal.retirementAge} yearsContributed={personal.contributionYearsToDate} />
            <div className="result-lead">
              <div aria-hidden="true"><span className="eyebrow">{copy.personal.output}</span><p>{copy.personal.outputLead}</p><strong>{format.euro(result.monthlyPension)} <small>{copy.personal.perMonth}</small></strong><span className="result-lead__annual">{format.euro(result.annualPension)} {copy.personal.grossAnnual}</span></div>
              <span className="sr-only" aria-live="polite" aria-atomic="true">{copy.personal.liveStart} {format.euro(announcedResult.monthlyPension)} {copy.personal.liveMiddle}, {format.euro(announcedResult.annualPension)} {copy.personal.liveEnd}</span>
            </div>
            <SourceLine sourceIds={["inps_retirement_age", "ec_ageing_2024_italy"]} sources={sources} />
          </div>
        </div>
        <MethodDetails title={copy.personal.methodTitle}>
          <p><TruthBadge label="STIMA DEL MODELLO" /> {copy.personal.methodOne}</p>
          <p>{copy.personal.methodTwo}</p>
          <code>{copy.personal.formula}</code>
        </MethodDetails>
      </div>
    </section>
  );
};

const PactScene = ({ italy, employmentContext, sources }: { italy: ItalyData; employmentContext: EmploymentContext | null; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const cashRows = italy.cashFlow.annualCurrentRevenueHistory as Array<Record<string, number>>;
  const latest = italy.cashFlow.latest2025 as Record<string, number>;
  const employmentUnit = language === "it" ? employmentContext?.unit : "million people, source value in thousands";
  const employmentScope = language === "it" ? employmentContext?.perimeter : "employment in the Ageing Report baseline, not INPS contributors";
  return (
    <section className="scene section section--ink" id="patto" aria-labelledby="patto-title">
      <div className="section-inner">
        <SectionKicker number="02" label={copy.pact.kicker} />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="patto-title">{copy.pact.titleStart} <em>{copy.pact.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="STIMA DEL MODELLO" /><p className="section-intro">{copy.pact.intro}</p></div>
        </div>
        <div className="pact-grid">
          <CashFlowChart rows={cashRows as any} />
          <div className="pact-side">
            <div className="flow-card">
              <div className="flow-card__from"><span className="flow-number">{employmentContext ? format.number(employmentContext.valueMillions, 3) : copy.common.notAvailable}</span><span>{copy.pact.workers}<br /><small>{employmentContext ? `${copy.pact.baseline}, ${employmentContext.year}` : copy.pact.noData}</small></span></div>
              {employmentContext ? <div className="employment-source-meta"><span>{copy.pact.sourceId}: {employmentContext.sourceId}</span><span>{copy.pact.unit}: {employmentUnit}</span><span>{copy.pact.scope}: {employmentScope}</span><SourceChip id={employmentContext.sourceId} sources={sources} /></div> : null}
              <div className="flow-arrow" aria-hidden="true">↓</div>
              <div className="flow-card__to"><span className="flow-number">{format.number(16.3, 1)}</span><span>{copy.pact.pensioners}<br /><small>{copy.pact.unique}</small></span></div>
              <div className="flow-warning"><TruthBadge label="STIMA DEL MODELLO" /><p>{copy.pact.ratioNote}</p></div>
            </div>
            <div className="fact-note"><TruthBadge label="FATTO" /><strong>{format.euro(latest.contributionRevenue * 1_000_000, true)} {copy.pact.contributions}</strong><p>{copy.pact.outlaysStart} {format.euro(latest.pensionOutlays * 1_000_000, true)}. {copy.pact.outlaysEnd}</p><SourceLine sourceIds={["inps_budget_2025"]} sources={sources} /></div>
          </div>
        </div>
        <div className="rule-strip"><div><span className="eyebrow eyebrow--light">{copy.pact.observedRule}</span><strong>{copy.pact.observedRuleText}</strong></div><div><span className="eyebrow eyebrow--light">{copy.pact.nextSteps}</span><strong>{copy.pact.nextStepsText}</strong></div><SourceChip id="inps_requirements_2026" sources={sources} /></div>
        <MethodDetails title={copy.pact.methodTitle}>
          <p>{copy.pact.methodOne}</p>
          <p>{copy.pact.methodTwo}</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "inps_budget_2025"]} sources={sources} />
          <p className="method-footnote">{copy.pact.footnote}</p>
        </MethodDetails>
      </div>
    </section>
  );
};

const PressureScene = ({ italy, sources }: { italy: ItalyData; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const spendingRows = italy.spendingProjection.baselineByYear as Array<Record<string, number>>;
  const ageShares = italy.demography.istatAgeShares as Array<Record<string, number>>;
  const averageAge = italy.demography.istatAverageAge as Array<Record<string, number>>;
  const peak = italy.spendingProjection.officialPeak as Record<string, number>;
  return (
    <section className="scene section section--sand" id="pressione" aria-labelledby="pressione-title">
      <div className="section-inner">
        <SectionKicker number="03" label={copy.pressure.kicker} />
        <div className="section-heading section-heading--split">
          <div><h2 id="pressione-title">{copy.pressure.titleStart}<br /><em>{copy.pressure.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="PROIEZIONE UFFICIALE" /><p className="section-intro">{copy.pressure.intro}</p></div>
        </div>
        <div className="pressure-grid">
          <DemographyChart ageShares={ageShares} averageAge={averageAge} />
          <SpendingChart rows={spendingRows as any} />
        </div>
        <div className="pressure-band">
          <div><span className="eyebrow">{copy.pressure.peak}</span><strong>{format.number(peak.grossPublicPensionExpenditure, 1)}% {copy.pressure.gdp}</strong><span>{language === "it" ? "anno" : "year"} {peak.year}, {copy.pressure.peakNote}</span></div>
          <div><span className="eyebrow">{copy.pressure.omission}</span><strong>{copy.pressure.noDate}</strong><span>{copy.pressure.noCountdown}</span></div>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "istat_population_2025"]} sources={sources} />
        </div>
        <MethodDetails title={copy.pressure.methodTitle}>
          <p>{copy.pressure.methodOne}</p>
          <p>{copy.pressure.methodTwo}</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "istat_population_2025"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const ResultScene = ({ personal, result, macroPoint, italy, sources }: { personal: PersonalInputs; result: ReturnType<typeof calculatePersonal>; macroPoint: ReturnType<typeof interpolateMacroPoint>; italy: ItalyData; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const distribution = italy.amountDistribution.benefitsByMonthlyAmount2024 as Array<Record<string, number | string>>;
  const multiple = italy.multipleBenefits.categories as Array<Record<string, number | string>>;
  const comparisonAges = [25, 35, 45];
  const comparison = comparisonAges.map((age) => {
    const yearsToRetirement = Math.max(0, personal.retirementAge - personal.age);
    const careerStartAge = Math.min(personal.careerStartAge, age);
    const contributionYearsToDate = Math.min(personal.contributionYearsToDate, Math.max(0, age - careerStartAge));
    const candidate = calculatePersonal({ ...personal, age, careerStartAge, contributionYearsToDate, retirementAge: age + yearsToRetirement });
    return { age, result: candidate };
  });
  return (
    <section className="scene section section--cream" id="risultato" aria-labelledby="risultato-title">
      <div className="section-inner">
        <SectionKicker number="04" label={copy.result.kicker} />
        <div className="section-heading section-heading--split">
          <div><h2 id="risultato-title">{copy.result.titleStart}<br /><em>{copy.result.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="STIMA DEL MODELLO" /><p className="section-intro">{copy.result.intro}</p></div>
        </div>
        <div className="result-grid">
          <StatCard label={copy.result.annualPension} value={format.euro(result.annualPension)} note={`${format.euro(result.monthlyPension)} ${copy.result.monthConversion}`} accent="red" />
          <StatCard label={copy.result.replacement} value={format.percent(result.replacementRatio, 1)} note={`${copy.result.finalSalary} ${format.euro(result.finalSalary)}`} accent="navy" />
          <StatCard label={copy.result.annualContribution} value={format.euro(result.annualContributionToday)} note={`${format.percent(personal.contributionRate, 1)} ${copy.result.grossSalary}`} accent="yellow" />
          <StatCard label={copy.result.simulatedPayments} value={format.euro(result.totalContributions)} note={`${format.euro(result.publicContributions)} ${copy.result.public}, ${format.euro(result.fundedContributions)} ${copy.result.funded}`} accent="navy" />
          <StatCard label={`${copy.result.pressureAtYear}, ${result.retirementYear}`} value={format.number(macroPoint.pressureIndex, 2)} note={copy.result.pressureNote} accent="red" />
        </div>
        <div className="generation-compare">
          <div className="compare-title"><span className="eyebrow">{copy.result.controlled}</span><h3>{copy.result.sameInputs}</h3><p>{copy.result.comparisonNote}</p></div>
          {comparison.map(({ age, result: ageResult }) => <div className={`compare-cell ${age === personal.age ? "compare-cell--active" : ""}`} key={age}><span>{age} {copy.common.years}</span><strong>{format.euro(ageResult.monthlyPension)}</strong><small>{copy.result.simulatedMonthly}<br />{copy.result.retirement} {ageResult.retirementYear}</small></div>)}
        </div>
        <div className="distribution-grid">
          <DistributionChart rows={distribution} />
          <MultipleBenefitsChart rows={multiple} />
        </div>
        <div className="callout callout--yellow"><strong>{copy.result.calloutTitle}</strong><span>{copy.result.calloutBody}</span><SourceLine sourceIds={["inps_beneficiaries_2024", "inps_observatory_2026"]} sources={sources} /></div>
        <MethodDetails title={copy.result.methodTitle}>
          <p>{copy.result.methodOne}</p>
          <p>{copy.result.methodTwo}</p>
          <SourceLine sourceIds={["inps_beneficiaries_2024"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const MacroScene = ({ macro, setMacro, points, baseline, announcedPoints, employmentContext, sources }: { macro: MacroInputs; setMacro: (updater: (previous: MacroInputs) => MacroInputs) => void; points: ReturnType<typeof calculateMacro>; baseline: ReturnType<typeof calculateMacro>; announcedPoints: ReturnType<typeof calculateMacro>; employmentContext: EmploymentContext | null; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const format = useLocalizedFormat();
  const update = (key: keyof MacroInputs, value: number) => setMacro((previous) => ({ ...previous, [key]: value }));
  const reset = () => setMacro(() => ({ ...DEFAULT_MACRO_INPUTS }));
  const preset = (name: string) => {
    if (name === "workers") setMacro((previous) => ({ ...previous, employmentGrowth: 0.005, netMigration: 250_000 }));
    if (name === "output") setMacro((previous) => ({ ...previous, productivityGrowthReal: 0.02 }));
    if (name === "later") setMacro((previous) => ({ ...previous, retirementAge: 70 }));
    if (name === "funded") setMacro((previous) => ({ ...previous, fundedShare: 0.2 }));
    if (name === "protection") setMacro((previous) => ({ ...previous, benefitFactor: 1.1, indexationPassThrough: 1 }));
  };
  const matches = (values: Partial<MacroInputs>) => Object.entries(values).every(([key, expected]) => macro[key as keyof MacroInputs] === expected);
  const isDefaultScenario = matches(DEFAULT_MACRO_INPUTS);
  const checkpoint = [2030, 2040, 2050].map((year) => interpolateMacroPoint(points, year));
  const at2050 = checkpoint.at(-1);
  const announcedAt2050 = interpolateMacroPoint(announcedPoints, 2050);
  const lowScenario = calculateMacro({
    ...macro,
    employmentGrowth: Math.min(0.02, macro.employmentGrowth + 0.005),
    netMigration: Math.min(400_000, macro.netMigration + 50_000),
    beneficiaryGrowth: Math.max(-0.01, macro.beneficiaryGrowth - 0.002),
    productivityGrowthReal: Math.min(0.03, macro.productivityGrowthReal + 0.005),
  });
  const highScenario = calculateMacro({
    ...macro,
    employmentGrowth: Math.max(-0.02, macro.employmentGrowth - 0.005),
    netMigration: Math.max(-200_000, macro.netMigration - 50_000),
    beneficiaryGrowth: Math.min(0.025, macro.beneficiaryGrowth + 0.002),
    productivityGrowthReal: Math.max(-0.01, macro.productivityGrowthReal - 0.005),
  });
  const scenario2050 = {
    low: interpolateMacroPoint(lowScenario, 2050),
    central: at2050,
    high: interpolateMacroPoint(highScenario, 2050),
  };
  const cohortRows = [25, 35, 45].map((age) => {
    const retirementYear = MODEL_BASE_YEAR + Math.max(0, macro.retirementAge - age);
    return { age, retirementYear, point: interpolateMacroPoint(points, retirementYear) };
  });
  const employmentUnit = language === "it" ? employmentContext?.unit : "million people, source value in thousands";
  const employmentScope = language === "it" ? employmentContext?.perimeter : "employment in the Ageing Report baseline, not INPS contributors";
  return (
    <section className="scene section section--red" id="leve" aria-labelledby="leve-title">
      <div className="section-inner">
        <SectionKicker number="05" label={copy.macro.kicker} />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="leve-title">{copy.macro.titleStart}<br /><em>{copy.macro.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="ANALOGIA RETORICA" /><p className="section-intro">{copy.macro.intro}</p></div>
        </div>
        <div className="macro-presets" role="group" aria-label={copy.macro.presetsAria}><span>{copy.macro.shortcuts}</span><button type="button" aria-pressed={isDefaultScenario} onClick={() => reset()}>{copy.macro.start}</button><button type="button" aria-pressed={matches({ employmentGrowth: 0.005, netMigration: 250_000 })} onClick={() => preset("workers")}>{copy.macro.workers}</button><button type="button" aria-pressed={matches({ productivityGrowthReal: 0.02 })} onClick={() => preset("output")}>{copy.macro.output}</button><button type="button" aria-pressed={matches({ retirementAge: 70 })} onClick={() => preset("later")}>{copy.macro.later}</button><button type="button" aria-pressed={matches({ fundedShare: 0.2 })} onClick={() => preset("funded")}>{copy.macro.funded}</button></div>
        <div className="macro-grid">
          <div className="panel panel--cream macro-controls">
            <div className="panel-heading"><span className="eyebrow">{copy.macro.visible}</span><button className="reset-button" type="button" onClick={reset}>{copy.common.reset}</button></div>
            <Control id="macro-employment" label={copy.macro.employment} value={macro.employmentGrowth} min={-0.02} max={0.02} step={0.001} display={format.percent(macro.employmentGrowth, 1)} onChange={(value) => update("employmentGrowth", value)} />
            <Control id="macro-migration" label={copy.macro.migration} value={macro.netMigration} min={-200_000} max={400_000} step={10_000} display={`${format.number(macro.netMigration / 1_000, 0)} ${copy.macro.thousandYear}`} onChange={(value) => update("netMigration", value)} />
            <Control id="macro-productivity" label={copy.macro.productivity} value={macro.productivityGrowthReal} min={-0.01} max={0.03} step={0.001} display={format.percent(macro.productivityGrowthReal, 1)} onChange={(value) => update("productivityGrowthReal", value)} />
            <Control id="macro-retirement" label={copy.macro.retirement} value={macro.retirementAge} min={60} max={75} step={1} display={`${macro.retirementAge} ${copy.common.years}`} onChange={(value) => update("retirementAge", value)} help={copy.macro.retirementHelp} />
            <Control id="macro-rate" label={copy.macro.rate} value={macro.contributionRate} min={0.2} max={0.45} step={0.005} display={format.percent(macro.contributionRate, 1)} onChange={(value) => update("contributionRate", value)} />
            <Control id="macro-benefit" label={copy.macro.benefit} value={macro.benefitFactor} min={0.7} max={1.2} step={0.01} display={format.number(macro.benefitFactor, 2)} onChange={(value) => update("benefitFactor", value)} />
            <Control id="macro-indexation" label={copy.macro.indexation} value={macro.indexationPassThrough} min={0} max={1.25} step={0.05} display={format.number(macro.indexationPassThrough, 2)} onChange={(value) => update("indexationPassThrough", value)} />
            <Control id="macro-funded" label={copy.macro.fundedShare} value={macro.fundedShare} min={0} max={0.4} step={0.01} display={format.percent(macro.fundedShare, 0)} onChange={(value) => update("fundedShare", value)} help={copy.macro.fundedHelp} />
          </div>
          <div className="macro-output">
            <MacroChart points={points} baseline={baseline} scenarioBands={{ low: lowScenario, central: points, high: highScenario }} />
            <div className="macro-checkpoints">{checkpoint.map((point) => <div className="macro-checkpoint" key={point.year}><span>{point.year}</span><strong>{format.number(point.pressureIndex, 2)}</strong><small>{copy.macro.pressure}<br />{copy.macro.base}</small><b>{format.percent(point.requiredPaygRate, 1)}</b><small>{copy.macro.requiredRate}</small></div>)}</div>
            <div className="macro-output-grid">
              <div className="macro-output-card"><span>{copy.macro.systemPressure}</span><strong>{format.number(at2050?.pressureIndex ?? 0, 2)}</strong><small>{copy.macro.systemPressureNote}</small></div>
              <div className="macro-output-card"><span>{copy.macro.workersPerBeneficiary}</span><strong>{format.number(at2050?.workersPerBeneficiary ?? 0, 2)}</strong><small>{copy.macro.proxy2050}</small></div>
              <div className="macro-output-card"><span>{copy.macro.paygRate}</span><strong>{format.percent(at2050?.requiredPaygRate ?? 0, 1)}</strong><small>{copy.macro.wageBill}</small></div>
              <div className="macro-output-card"><span>{copy.macro.flowBalance}</span><strong>{format.number(at2050?.balanceProxy ?? 0, 2)}</strong><small>{copy.macro.equalFlows}</small></div>
              <div className="macro-output-card"><span>{copy.macro.averageReplacement}</span><strong>{format.percent(at2050?.benefitReplacementProxy ?? 0, 1)}</strong><small>{copy.macro.benefitWage}</small></div>
              <div className="macro-output-card"><span>{copy.macro.fundedFlow}</span><strong>{format.euro(at2050?.fundedContributionFlow ?? 0, true)}</strong><small>{format.percent(macro.fundedShare, 0)} {copy.macro.ofContributions}</small></div>
            </div>
            <div className="macro-bands"><span className="eyebrow">{copy.macro.band}</span><div><span><i className="legend-swatch legend-swatch--band" /> {copy.macro.low} <strong>{format.number(scenario2050.low?.pressureIndex ?? 0, 2)}</strong></span><span><i className="legend-swatch legend-swatch--red" /> {copy.macro.central} <strong>{format.number(scenario2050.central?.pressureIndex ?? 0, 2)}</strong></span><span><i className="legend-swatch legend-swatch--blue" /> {copy.macro.high} <strong>{format.number(scenario2050.high?.pressureIndex ?? 0, 2)}</strong></span></div><small>{copy.macro.bandNote}</small></div>
            <div className="macro-generational"><div className="macro-generational__heading"><span className="eyebrow">{copy.macro.generational}</span><span>{copy.macro.samePolicy}</span></div>{cohortRows.map(({ age, retirementYear, point }) => <div className="macro-generational__row" key={age}><strong>{age} {copy.common.years}</strong><span>{copy.macro.retirementShort} {retirementYear}</span><span>{format.number(point.pressureIndex, 2)} {copy.macro.pressure}</span><span>{format.number(point.workersPerBeneficiary, 2)} {copy.macro.workerShort}</span><span>{format.percent(point.benefitReplacementProxy, 1)} {copy.macro.replacementShort}</span></div>)}</div>
            <div className="macro-readout"><TruthBadge label="STIMA DEL MODELLO" /><strong>{copy.macro.readoutStart} {format.percent(at2050?.balanceProxy ?? 0, 0)} {copy.macro.readoutEnd}</strong><p>{copy.macro.readoutNote}</p></div>
            <span className="sr-only" aria-live="polite" aria-atomic="true">{copy.macro.liveStart} {format.number(announcedAt2050.pressureIndex, 2)}, {copy.macro.liveRate} {format.percent(announcedAt2050.requiredPaygRate, 1)}, {copy.macro.liveReplacement} {format.percent(announcedAt2050.benefitReplacementProxy, 1)} 2050.</span>
          </div>
        </div>
        <div className="transition-note"><span className="transition-note__mark">!</span><div><strong>{copy.macro.transitionTitle}</strong><p>{copy.macro.transitionBody}</p><SourceLine sourceIds={["oecd_pensions_outlook_2022_transition", "world_bank_transition_costs"]} sources={sources} /></div></div>
        <MethodDetails title={copy.macro.methodTitle}>
          <p><TruthBadge label="STIMA DEL MODELLO" /> {copy.macro.methodStart} {employmentContext ? `${format.number(employmentContext.valueMillions, 3)} ${copy.common.million} ${language === "it" ? "nel" : "in"} ${employmentContext.year}` : copy.macro.unavailable}, {copy.macro.inUnit} {employmentUnit ?? copy.macro.unitMissing}, {copy.macro.forScope} {employmentScope ?? copy.macro.scopeMissing}. {copy.macro.methodEnd}</p>
          <code>{copy.macro.formula.split("\n").map((line, index, lines) => <span key={line}>{line}{index < lines.length - 1 ? <br /> : null}</span>)}</code>
          <p>{copy.macro.elasticity}</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "inps_beneficiaries_2024", "inps_budget_2025"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const ComparisonScene = ({ international, sources }: { international: InternationalData; sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const publicExpenditure = international.comparableMetrics.find((metric) => metric.id === "public_pension_expenditure_gdp") as Record<string, any>;
  const fundedAssets = international.comparableMetrics.find((metric) => metric.id === "pension_provider_assets_gdp") as Record<string, any>;
  const contributionRates = international.comparableMetrics.find((metric) => metric.id === "mandatory_effective_contribution_rate") as Record<string, any>;
  const dependency = international.comparableMetrics.find((metric) => metric.id === "old_age_dependency_ratio") as Record<string, any>;
  const pillarRows = international.pillarMatrix.rows;
  const countryOrder = ["IT", "CH", "SE", "NL"];
  const countryNames = copy.comparison.countryNames as Record<string, string>;
  const countryDescriptions = copy.comparison.countryDescriptions as Record<string, string>;
  const countryLines = copy.comparison.countryLines as Record<string, { title: string; body: string }>;
  const pillarLabels = copy.comparison.pillarLabels as Record<string, string>;
  return (
    <section className="scene section section--ink" id="confronto" aria-labelledby="confronto-title">
      <div className="section-inner">
        <SectionKicker number="06" label={copy.comparison.kicker} />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="confronto-title">{copy.comparison.titleStart}<br /><em>{copy.comparison.titleEmphasis}</em></h2></div>
          <div><TruthBadge label="ANALOGIA RETORICA" /><p className="section-intro">{copy.comparison.intro}</p></div>
        </div>
        <div className="comparison-charts">
          <InternationalBarChart metric={publicExpenditure} />
          <InternationalBarChart metric={fundedAssets} />
          <InternationalBarChart metric={contributionRates} />
          <InternationalBarChart metric={dependency} />
        </div>
        <div className="pillar-matrix-wrap">
          <div className="matrix-heading"><span className="eyebrow eyebrow--light">{copy.comparison.architectures}</span><h3>{copy.comparison.whoPays}</h3><p>{copy.comparison.matrixIntro}</p></div>
          <p className="scroll-hint" id="pillar-scroll-hint">{copy.comparison.scroll}</p>
          <div className="pillar-matrix" role="table" aria-label={copy.comparison.tableAria} aria-describedby="pillar-scroll-hint" tabIndex={0}>
            <div className="pillar-matrix__row pillar-matrix__row--head" role="row"><div role="columnheader">{copy.comparison.pillar}</div>{countryOrder.map((code) => <div role="columnheader" key={code}>{countryNames[code]}</div>)}</div>
            {pillarRows.slice(0, 3).map((row) => <div className="pillar-matrix__row" role="row" key={String(row.id)}><div role="rowheader"><strong>{pillarLabels[String(row.id)] ?? String(row.label)}</strong></div>{countryOrder.map((code) => { const value = row.values?.[code]; const funding = String(value?.funding ?? ""); return <div role="cell" key={code}><span className={`funding-pill funding-pill--${funding.includes("funded") ? "funded" : "payg"}`}>{translateFunding(funding, language)}</span><small>{translateMandate(String(value?.mandate ?? ""), language)}</small><SourceChip id={String(value?.sourceIds?.[0] ?? "")} sources={sources} /></div>; })}</div>)}
          </div>
        </div>
        <div className="country-cards">{["CH", "SE", "NL"].map((code) => { const country = international.countries[code]; return <article className="country-card" key={code}><div className="country-card__code">{code}</div><h3>{countryNames[code]}</h3><p>{countryDescriptions[code]}</p><div className="country-card__line"><strong>{countryLines[code]?.title}</strong><span>{countryLines[code]?.body}</span></div><SourceLine sourceIds={country.sourceIds?.slice(0, 2) ?? []} sources={sources} /></article>; })}</div>
        <div className="transition-note transition-note--dark"><span className="transition-note__mark">+</span><div><strong>{copy.comparison.swissTitle}</strong><p>{copy.comparison.swissBody}</p><SourceLine sourceIds={["bsv_ch_oasi_payg", "bsv_ch_occupational_funding", "oecd_pensions_outlook_2022_transition"]} sources={sources} /></div></div>
        <div className="final-checkpoint"><div><SectionKicker number="07" label={copy.comparison.closing} /><h2>{copy.comparison.closingTitle}<br /><em>{copy.comparison.closingEmphasis}</em></h2></div><div><p>{copy.comparison.closingBody}</p><a className="button button--cream" href="#fonti">{copy.comparison.sourcesCta} <span aria-hidden="true">↓</span></a></div></div>
      </div>
    </section>
  );
};

const SourcesSection = ({ sources }: { sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  return (
    <section className="scene sources-section" id="fonti" aria-labelledby="fonti-title">
      <div className="section-inner">
        <SectionKicker number="∞" label={copy.sources.kicker} />
        <div className="sources-heading"><h2 id="fonti-title">{copy.sources.title}</h2><p>{copy.sources.intro}</p></div>
        <div className="sources-grid">{Object.values(sources).map((source) => <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.id}><span className="source-card__top">{source.publisher} · {sourceMetadataLabel(source, language)}</span><strong>{sourceCardTitle(source, language)}</strong><span>{sourceCardNote(source, language)}</span><span className="source-card__arrow" aria-hidden="true">↗</span></a>)}</div>
        <div className="methodology-grid"><div><span className="eyebrow">{copy.sources.vocabulary}</span><h3>{copy.sources.labelsTitle}</h3><p>{copy.sources.labelsBody}</p></div><div><span className="eyebrow">{copy.sources.scopes}</span><h3>{copy.sources.scopesTitle}</h3><p>{copy.sources.scopesBody}</p></div><div><span className="eyebrow">{copy.sources.privacy}</span><h3>{copy.sources.privacyTitle}</h3><p>{copy.sources.privacyBody}</p></div></div>
        <p className="footer-note">{copy.sources.footerStart} <code>public/data/italy.json</code> {copy.sources.footerMiddle} <code>public/data/international.json</code>. {copy.sources.footerEnd}</p>
      </div>
    </section>
  );
};

export default function App() {
  const { language } = useLanguage();
  const copy = getAppCopy(language);
  const [italy, setItaly] = useState<ItalyData | null>(null);
  const [international, setInternational] = useState<InternationalData | null>(null);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState("alert");
  const [personal, setPersonal] = useState<PersonalInputs>(defaultPersonal);
  const [macro, setMacro] = useState<MacroInputs>({ ...DEFAULT_MACRO_INPUTS });
  const [reducedMotion, setReducedMotion] = useState(false);

  const loadData = useCallback(() => {
    setError(false);
    Promise.all([fetch("/data/italy.json"), fetch("/data/international.json")])
      .then(async ([italyResponse, internationalResponse]) => {
        if (!italyResponse.ok || !internationalResponse.ok) throw new Error("Data packs unavailable");
        return Promise.all([italyResponse.json() as Promise<ItalyData>, internationalResponse.json() as Promise<InternationalData>]);
      })
      .then(([italyData, internationalData]) => { setItaly(italyData); setInternational(internationalData); })
      .catch(() => setError(true));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.("change", updateMotion);
    return () => media.removeEventListener?.("change", updateMotion);
  }, []);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    copy.nav.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (!element) return;
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveId(id); }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, [copy.nav, italy]);

  const sources = useMemo(() => italy && international ? sourceMap(italy, international) : {}, [italy, international]);
  const personalResult = useMemo(() => calculatePersonal(personal), [personal]);
  const announcedPersonalResult = useDebouncedValue(personalResult);
  const macroPoints = useMemo(() => calculateMacro(macro), [macro]);
  const announcedMacro = useDebouncedValue(macro);
  const announcedMacroPoints = useMemo(() => calculateMacro(announcedMacro), [announcedMacro]);
  const baselinePoints = useMemo(() => calculateMacro(DEFAULT_MACRO_INPUTS), []);
  const pressurePoint = useMemo(() => interpolateMacroPoint(macroPoints, personalResult.retirementYear), [macroPoints, personalResult.retirementYear]);
  const employmentContext = useMemo(() => italy ? deriveEmploymentContext(italy) : null, [italy]);

  if (!italy || !international) return <><a className="skip-link" href="#contenuto">{copy.common.skip}</a><LoadingShell error={error} retry={loadData} /></>;
  return (
    <>
      <a className="skip-link" href="#contenuto">{copy.common.skip}</a>
      <div className={`app ${reducedMotion ? "prefers-reduced-motion" : ""}`}>
        <Header activeId={activeId} onNavigate={(id) => { setActiveId(id); document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }); window.history.replaceState(null, "", `#${id}`); }} />
        <main id="contenuto">
          <Hero italy={italy} sources={sources} />
          <PersonalScene personal={personal} setPersonal={setPersonal} result={personalResult} announcedResult={announcedPersonalResult} sources={sources} />
          <PactScene italy={italy} employmentContext={employmentContext} sources={sources} />
          <PressureScene italy={italy} sources={sources} />
          <ResultScene personal={personal} result={personalResult} macroPoint={pressurePoint} italy={italy} sources={sources} />
          <MacroScene macro={macro} setMacro={setMacro} points={macroPoints} baseline={baselinePoints} announcedPoints={announcedMacroPoints} employmentContext={employmentContext} sources={sources} />
          <ComparisonScene international={international} sources={sources} />
          <SourcesSection sources={sources} />
        </main>
      </div>
    </>
  );
}
