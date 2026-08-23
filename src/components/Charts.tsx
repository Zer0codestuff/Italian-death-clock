import type { MacroPoint, TruthLabel } from "../lib/types";
import { chartXForYear } from "../lib/chartGeometry";
import { useLocalizedFormat } from "../lib/format";
import { getAppCopy, getChartCopy } from "../lib/copy";
import { useLanguage } from "../lib/language";
import type { Language } from "../lib/language";

type SpendingRow = {
  year: number;
  grossPublicPensionExpenditure: number;
  publicPensionContributions: number;
  pensionersToWorkers: number;
};

type CashRow = {
  year: number;
  contributionRevenue: number;
  currentTransfers: number;
  currentRevenueTotal: number;
};

type SourceNoteProps = {
  label: string;
  detail?: string;
};

export const ChartNote = ({ label, detail }: SourceNoteProps) => (
  <p className="chart-note">
    <span className="chart-note__dot" aria-hidden="true" />
    <span>{label}</span>
    {detail ? <span className="chart-note__detail">{detail}</span> : null}
  </p>
);

type TableRow = Record<string, number | string>;

type DataTableMetadata = {
  truth: TruthLabel;
  source: string;
  sourceUrl: string;
  year: string;
  unit: string;
  perimeter: string;
};

const DataTable = ({
  label,
  columns,
  rows,
  metadata,
}: {
  label: string;
  columns: Array<{ key: string; label: string }>;
  rows: TableRow[];
  metadata: DataTableMetadata;
}) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language);
  const appCopy = getAppCopy(language);
  return (
    <details className="chart-data-table">
      <summary>{label}</summary>
      <div className="chart-data-table__meta">
        <span className="chart-data-table__truth">{appCopy.truth[metadata.truth]}</span>
        <a href={metadata.sourceUrl} target={metadata.sourceUrl.startsWith("#") ? undefined : "_blank"} rel={metadata.sourceUrl.startsWith("#") ? undefined : "noreferrer"}>{metadata.source}</a>
        <span>{copy.common.year}: {metadata.year}</span>
        <span>{copy.common.unit}: {metadata.unit}</span>
        <span>{copy.common.scope}: {metadata.perimeter}</span>
      </div>
      <div className="chart-data-table__scroll" role="region" aria-label={`${copy.common.table}: ${label}`} tabIndex={0}>
        <table>
          <thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={`${String(row[columns[0]?.key ?? "row"])}-${rowIndex}`}>{columns.map((column, columnIndex) => columnIndex === 0 ? <th scope="row" key={column.key}>{String(row[column.key] ?? copy.common.unavailable)}</th> : <td key={column.key}>{String(row[column.key] ?? copy.common.unavailable)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
};

const truthClass: Record<TruthLabel, string> = {
  FATTO: "truth-badge--fact",
  "PROIEZIONE UFFICIALE": "truth-badge--official",
  "STIMA DEL MODELLO": "truth-badge--model",
  SCENARIO: "truth-badge--scenario",
  "ANALOGIA RETORICA": "truth-badge--rhetorical",
};

const ChartTruthBadge = ({ label }: { label: TruthLabel }) => {
  const { language } = useLanguage();
  return <span className={`truth-badge ${truthClass[label]}`}>{getAppCopy(language).truth[label]}</span>;
};

const translateBand = (band: string, language: Language): string => language === "it"
  ? band.replace(/^up to /, "fino a ").replace(" to ", " - ").replace("and over", "e oltre")
  : band;

const chartWidth = 720;
const chartHeight = 260;
const pad = { top: 24, right: 24, bottom: 42, left: 50 };

const scaleX = (index: number, length: number): number =>
  pad.left + (index / Math.max(length - 1, 1)) * (chartWidth - pad.left - pad.right);

const linePath = (values: number[], min: number, max: number): string => {
  const range = Math.max(max - min, 0.000001);
  return values
    .map((value, index) => {
      const x = scaleX(index, values.length);
      const y = pad.top + (1 - (value - min) / range) * (chartHeight - pad.top - pad.bottom);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const bandPath = (lowValues: number[], highValues: number[], min: number, max: number): string => {
  if (lowValues.length === 0 || highValues.length === 0) return "";
  const upper = highValues.map((value, index) => {
    const x = scaleX(index, highValues.length);
    const y = yFor(value, min, max);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const lower = lowValues.map((value, index) => {
    const reverseIndex = lowValues.length - 1 - index;
    const x = scaleX(reverseIndex, lowValues.length);
    const y = yFor(value, min, max);
    return `L${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${upper.join(" ")} ${lower.join(" ")} Z`;
};

const yFor = (value: number, min: number, max: number): number => {
  const range = Math.max(max - min, 0.000001);
  return pad.top + (1 - (value - min) / range) * (chartHeight - pad.top - pad.bottom);
};

const GridLines = ({ min, max, format }: { min: number; max: number; format: (value: number) => string }) => (
  <g className="chart-grid" aria-hidden="true">
    {[0, 0.5, 1].map((ratio) => {
      const value = min + (max - min) * ratio;
      const y = yFor(value, min, max);
      return (
        <g key={ratio}>
          <line x1={pad.left} x2={chartWidth - pad.right} y1={y} y2={y} />
          <text x={pad.left - 10} y={y + 4} textAnchor="end">{format(value)}</text>
        </g>
      );
    })}
  </g>
);

export const TimelineChart = ({
  age,
  careerStartAge,
  retirementAge,
  yearsContributed,
}: {
  age: number;
  careerStartAge: number;
  retirementAge: number;
  yearsContributed: number;
}) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).timeline;
  const minAge = Math.max(16, Math.min(careerStartAge, age) - 2);
  const maxAge = Math.max(retirementAge + 2, 70);
  const xForAge = (value: number) => 44 + ((value - minAge) / (maxAge - minAge)) * 632;
  return (
    <div className="chart-shell chart-shell--timeline">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="SCENARIO" />
      </div>
      <svg className="chart-svg" viewBox="0 0 720 178" role="img" aria-label={`${copy.aria} ${copy.from} ${careerStartAge} ${copy.to} ${retirementAge} ${copy.years}`}>
        <rect className="timeline-track" x="44" y="78" width="632" height="12" rx="6" />
        <rect className="timeline-paid" x="44" y="78" width={Math.max(0, xForAge(age) - 44)} height="12" rx="6" />
        <rect className="timeline-future" x={xForAge(age)} y="78" width={Math.max(0, xForAge(retirementAge) - xForAge(age))} height="12" rx="6" />
        <line className="timeline-marker timeline-marker--start" x1={xForAge(careerStartAge)} x2={xForAge(careerStartAge)} y1="50" y2="108" />
        <line className="timeline-marker timeline-marker--now" x1={xForAge(age)} x2={xForAge(age)} y1="42" y2="116" />
        <line className="timeline-marker timeline-marker--retire" x1={xForAge(retirementAge)} x2={xForAge(retirementAge)} y1="42" y2="116" />
        <text className="timeline-label" x={xForAge(careerStartAge)} y="34" textAnchor="middle">{copy.start}</text>
        <text className="timeline-label timeline-label--now" x={xForAge(age)} y="136" textAnchor="middle">{copy.today}, {age}</text>
        <text className="timeline-label" x={xForAge(retirementAge)} y="34" textAnchor="middle">{copy.selected}, {retirementAge}</text>
        <text className="timeline-small" x="44" y="164">{minAge} {copy.years}</text>
        <text className="timeline-small" x="676" y="164" textAnchor="end">{maxAge} {copy.years}</text>
      </svg>
      <div className="timeline-caption">
        <span><i className="legend-swatch legend-swatch--paid" /> {yearsContributed} {copy.entered}</span>
        <span><i className="legend-swatch legend-swatch--future" /> {copy.future}</span>
      </div>
      <DataTable
        label={copy.open}
        columns={[{ key: "event", label: copy.columns.event }, { key: "age", label: copy.columns.age }, { key: "meaning", label: copy.columns.meaning }]}
        rows={[
          { event: copy.rows.start, age: careerStartAge, meaning: copy.rows.first },
          { event: copy.rows.today, age, meaning: `${yearsContributed} ${copy.entered}` },
          { event: copy.rows.pension, age: retirementAge, meaning: copy.rows.scenario },
        ]}
        metadata={{ truth: "SCENARIO", source: copy.source, sourceUrl: "#fonti", year: "2026", unit: copy.unit, perimeter: copy.scope }}
      />
    </div>
  );
};

export const CashFlowChart = ({ rows }: { rows: CashRow[] }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).cash;
  const format = useLocalizedFormat();
  const visible = rows.filter((row) => row.year >= 2015);
  const max = Math.max(...visible.map((row) => row.currentRevenueTotal), ...visible.map((row) => row.contributionRevenue)) * 1.08;
  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="FATTO" />
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={copy.aria}>
        <GridLines min={0} max={max} format={(value) => `${format.number(Math.round(value / 1000), 0)} ${copy.billion}`} />
        {visible.map((row, index) => {
          const x = scaleX(index, visible.length);
          const barWidth = Math.min(54, (chartWidth - pad.left - pad.right) / visible.length - 14);
          const revenueHeight = chartHeight - pad.bottom - yFor(row.currentRevenueTotal, 0, max);
          const contributionHeight = chartHeight - pad.bottom - yFor(row.contributionRevenue, 0, max);
          return (
            <g key={row.year}>
              <rect className="bar bar--light" x={x - barWidth / 2} y={yFor(row.currentRevenueTotal, 0, max)} width={barWidth} height={revenueHeight} rx="3" />
              <rect className="bar bar--accent" x={x - barWidth / 2} y={yFor(row.contributionRevenue, 0, max)} width={barWidth} height={contributionHeight} rx="3" />
              <text className="chart-x-label" x={x} y={chartHeight - 14} textAnchor="middle">{row.year}</text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        <span><i className="legend-swatch legend-swatch--accent" /> {copy.contributions}</span>
        <span><i className="legend-swatch legend-swatch--light" /> {copy.total}</span>
      </div>
      <DataTable
        label={copy.open}
        columns={[{ key: "year", label: copy.columns.year }, { key: "contributionRevenue", label: copy.columns.contributions }, { key: "currentRevenueTotal", label: copy.columns.revenue }]}
        rows={visible.map((row) => ({ year: row.year, contributionRevenue: format.number(row.contributionRevenue, 0), currentRevenueTotal: format.number(row.currentRevenueTotal, 0) }))}
        metadata={{ truth: "FATTO", source: copy.source, sourceUrl: "https://www.inps.it/content/dam/inps-site/pdf/allegatinews/Relazione_rendiconto_generale_2025.pdf", year: "2015-2025", unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const SpendingChart = ({ rows }: { rows: SpendingRow[] }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).spending;
  const format = useLocalizedFormat();
  const values = rows.map((row) => row.grossPublicPensionExpenditure);
  const max = Math.max(...values) + 1;
  const min = Math.min(...values) - 1;
  const firstYear = rows[0]?.year ?? 2022;
  const lastYear = rows.at(-1)?.year ?? 2070;
  const peakX = chartXForYear(2036, firstYear, lastYear);
  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="PROIEZIONE UFFICIALE" />
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={copy.aria}>
        <GridLines min={min} max={max} format={(value) => `${format.number(value, 1)}%`} />
        <path className="line line--red" d={linePath(values, min, max)} />
        {rows.map((row) => {
          const x = chartXForYear(row.year, firstYear, lastYear);
          const y = yFor(row.grossPublicPensionExpenditure, min, max);
          return (
            <g key={row.year}>
              <circle className="line-dot line-dot--red" cx={x} cy={y} r="5" />
              <text className="chart-x-label" x={x} y={chartHeight - 14} textAnchor="middle">{row.year}</text>
            </g>
          );
        })}
        <line className="peak-marker" x1={peakX} x2={peakX} y1={pad.top} y2={chartHeight - pad.bottom} />
        <text className="peak-label" x={peakX + 8} y={pad.top + 13}>{copy.peak}</text>
      </svg>
      <DataTable
        label={copy.open}
        columns={[{ key: "year", label: copy.columns.year }, { key: "expenditure", label: copy.columns.expenditure }, { key: "pensionersToWorkers", label: copy.columns.ratio }]}
        rows={rows.map((row) => ({ year: row.year, expenditure: format.number(row.grossPublicPensionExpenditure, 1), pensionersToWorkers: format.number(row.pensionersToWorkers, 1) }))}
        metadata={{ truth: "PROIEZIONE UFFICIALE", source: copy.source, sourceUrl: "https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf", year: "2022-2070", unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const DemographyChart = ({ ageShares, averageAge }: { ageShares: Array<Record<string, number>>; averageAge: Array<Record<string, number>> }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).demography;
  const format = useLocalizedFormat();
  const groups = ageShares.slice(0, 2);
  const colors = ["#f2c94c", "#db4a35", "#172d3b"];
  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="PROIEZIONE UFFICIALE" />
      </div>
      <div className="demography-layout">
        <svg className="chart-svg chart-svg--demography" viewBox="0 0 390 260" role="img" aria-label={copy.aria}>
          {groups.map((group, groupIndex) => {
            const x = 60 + groupIndex * 150;
            const values = [group.age0to14, group.age15to64, group.age65Plus];
            let y = 42;
            return (
              <g key={group.year}>
                <text className="demography-year" x={x + 54} y="24" textAnchor="middle">{group.year}</text>
                {values.map((value, valueIndex) => {
                  const height = value * 1.55;
                  const rect = <rect key={valueIndex} x={x} y={y} width="108" height={height} fill={colors[valueIndex]} rx="3" />;
                  y += height + 2;
                  return rect;
                })}
                <text className="demography-total" x={x + 54} y="250" textAnchor="middle">100% {copy.residents}</text>
              </g>
            );
          })}
        </svg>
        <div className="demography-side">
          <div className="demography-key">
            <span><i className="legend-swatch" style={{ background: colors[0] }} /> 0-14</span>
            <span><i className="legend-swatch" style={{ background: colors[1] }} /> 15-64</span>
            <span><i className="legend-swatch" style={{ background: colors[2] }} /> 65+</span>
          </div>
          <div className="age-progression">
            <span>{copy.averageAge}</span>
            <strong>{format.number(averageAge[0]?.averageAge ?? 0, 1)} → {format.number(averageAge.at(-1)?.averageAge ?? 0, 1)} {copy.years}</strong>
            <small>{copy.median}</small>
          </div>
        </div>
      </div>
      <DataTable
        label={copy.open}
        columns={[{ key: "year", label: copy.columns.year }, { key: "age0to14", label: "0-14, %" }, { key: "age15to64", label: "15-64, %" }, { key: "age65Plus", label: "65+, %" }]}
        rows={groups.map((group) => ({ year: group.year, age0to14: format.number(group.age0to14, 1), age15to64: format.number(group.age15to64, 1), age65Plus: format.number(group.age65Plus, 1) }))}
        metadata={{ truth: "PROIEZIONE UFFICIALE", source: copy.source, sourceUrl: "https://www.istat.it/wp-content/uploads/2025/07/Report_Previsioni-della-popolazione-residente-e-delle-famiglie_Base-Base-112024.pdf", year: copy.yearsShown, unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const DistributionChart = ({ rows }: { rows: Array<Record<string, number | string>> }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).distribution;
  const format = useLocalizedFormat();
  const visible = rows.filter((row) => row.band !== "total");
  return (
    <div className="chart-shell chart-shell--distribution">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="FATTO" />
      </div>
      <div className="distribution-list" role="img" aria-label={copy.aria}>
        {visible.map((row) => (
          <div className="distribution-row" key={String(row.band)}>
            <div className="distribution-label">€ {translateBand(String(row.band), language)}</div>
            <div className="distribution-bars">
              <div className="distribution-track"><span className="distribution-fill distribution-fill--red" style={{ width: `${Number(row.shareOfBenefits) * 2.5}%` }} /></div>
              <div className="distribution-track"><span className="distribution-fill distribution-fill--blue" style={{ width: `${Number(row.shareOfAmount) * 2.5}%` }} /></div>
            </div>
            <div className="distribution-values"><span>{format.percentPoints(Number(row.shareOfBenefits))} {copy.benefits}</span><span>{format.percentPoints(Number(row.shareOfAmount))} {copy.amounts}</span></div>
          </div>
        ))}
      </div>
      <div className="chart-legend"><span><i className="legend-swatch legend-swatch--red" /> {copy.benefitsShare}</span><span><i className="legend-swatch legend-swatch--blue" /> {copy.amountsShare}</span></div>
      <DataTable
        label={copy.open}
        columns={[{ key: "band", label: copy.columns.band }, { key: "shareOfBenefits", label: copy.columns.benefits }, { key: "shareOfAmount", label: copy.columns.amounts }]}
        rows={visible.map((row) => ({ band: `€ ${translateBand(String(row.band), language)}`, shareOfBenefits: format.percentPoints(Number(row.shareOfBenefits)), shareOfAmount: format.percentPoints(Number(row.shareOfAmount)) }))}
        metadata={{ truth: "FATTO", source: copy.source, sourceUrl: "https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007", year: "2024", unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const MultipleBenefitsChart = ({ rows }: { rows: Array<Record<string, number | string>> }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).multiple;
  const format = useLocalizedFormat();
  const categories = copy.categories as Record<string, string>;
  return (
    <div className="chart-shell chart-shell--multiple">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="FATTO" />
      </div>
      <div className="multiple-list" role="img" aria-label={copy.aria}>
        {rows.map((row) => (
          <div className="multiple-row" key={String(row.category)}>
            <div className="multiple-label">{categories[String(row.category)] ?? String(row.category)}</div>
            <div className="multiple-bar"><span className="multiple-bar__single" style={{ width: `${Number(row.sameTypeOnlyShare)}%` }} /><span className="multiple-bar__combined" style={{ width: `${Number(row.cumulatedShare)}%` }} /></div>
            <div className="multiple-number">{format.percentPoints(Number(row.cumulatedShare))} {copy.combined}</div>
          </div>
        ))}
      </div>
      <div className="chart-legend"><span><i className="legend-swatch legend-swatch--yellow" /> {copy.single}</span><span><i className="legend-swatch legend-swatch--navy" /> {copy.withOther}</span></div>
      <DataTable
        label={copy.open}
        columns={[{ key: "category", label: copy.columns.category }, { key: "sameTypeOnlyShare", label: copy.columns.single }, { key: "cumulatedShare", label: copy.columns.combined }]}
        rows={rows.map((row) => ({ category: categories[String(row.category)] ?? String(row.category), sameTypeOnlyShare: format.percentPoints(Number(row.sameTypeOnlyShare)), cumulatedShare: format.percentPoints(Number(row.cumulatedShare)) }))}
        metadata={{ truth: "FATTO", source: copy.source, sourceUrl: "https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007", year: "2024", unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const MacroChart = ({
  points,
  baseline,
  scenarioBands,
}: {
  points: MacroPoint[];
  baseline: MacroPoint[];
  scenarioBands: { low: MacroPoint[]; central: MacroPoint[]; high: MacroPoint[] };
}) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).macro;
  const format = useLocalizedFormat();
  const visible = points.filter((point) => point.year >= 2025 && point.year <= 2050);
  const base = baseline.filter((point) => point.year >= 2025 && point.year <= 2050);
  const low = scenarioBands.low.filter((point) => point.year >= 2025 && point.year <= 2050);
  const high = scenarioBands.high.filter((point) => point.year >= 2025 && point.year <= 2050);
  const pressureValues = visible.map((point) => point.pressureIndex);
  const rateValues = visible.map((point) => point.requiredPaygRate * 100);
  const replacementValues = visible.map((point) => point.benefitReplacementProxy);
  const lowPressureValues = low.map((point) => point.pressureIndex);
  const highPressureValues = high.map((point) => point.pressureIndex);
  const allValues = [...pressureValues, ...rateValues.map((value) => value / 20), ...replacementValues, ...lowPressureValues, ...highPressureValues];
  const min = Math.min(...allValues) * 0.92;
  const max = Math.max(...allValues) * 1.08;
  const pressurePath = linePath(pressureValues, min, max);
  const ratePath = linePath(rateValues.map((value) => value / 20), min, max);
  const replacementPath = linePath(replacementValues, min, max);
  const basePath = linePath(base.map((point) => point.pressureIndex), min, max);
  const scenarioBandPath = bandPath(lowPressureValues, highPressureValues, min, max);
  const selectedYears = [2025, 2030, 2040, 2050];
  return (
    <div className="chart-shell chart-shell--macro">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        <ChartTruthBadge label="STIMA DEL MODELLO" />
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={copy.aria}>
        <GridLines min={min} max={max} format={(value) => format.number(value, 1)} />
        <path className="scenario-band" d={scenarioBandPath} />
        <path className="line line--muted" d={basePath} />
        <path className="line line--red" d={pressurePath} />
        <path className="line line--yellow" d={ratePath} />
        <path className="line line--blue" d={replacementPath} />
        {visible.map((point, index) => selectedYears.includes(point.year) ? (
          <g key={point.year}>
            <circle className="line-dot line-dot--red" cx={scaleX(index, visible.length)} cy={yFor(point.pressureIndex, min, max)} r="4" />
            <text className="chart-x-label" x={scaleX(index, visible.length)} y={chartHeight - 14} textAnchor="middle">{point.year}</text>
          </g>
        ) : null)}
      </svg>
      <div className="chart-legend"><span><i className="legend-swatch legend-swatch--band" /> {copy.low}</span><span><i className="legend-swatch legend-swatch--red" /> {copy.central}</span><span><i className="legend-swatch legend-swatch--band" /> {copy.high}</span><span><i className="legend-swatch legend-swatch--yellow" /> {copy.rate}</span><span><i className="legend-swatch legend-swatch--blue" /> {copy.replacement}</span></div>
      <DataTable
        label={copy.open}
        columns={[{ key: "year", label: copy.columns.year }, { key: "pressure", label: copy.columns.pressure }, { key: "workers", label: copy.columns.workers }, { key: "rate", label: copy.columns.rate }, { key: "balance", label: copy.columns.balance }, { key: "replacement", label: copy.columns.replacement }]}
        rows={visible.filter((point) => selectedYears.includes(point.year)).map((point) => ({ year: point.year, pressure: format.number(point.pressureIndex, 2), workers: format.number(point.workersPerBeneficiary, 2), rate: format.percentPoints(point.requiredPaygRate * 100), balance: format.number(point.balanceProxy, 2), replacement: format.percentPoints(point.benefitReplacementProxy * 100) }))}
        metadata={{ truth: "STIMA DEL MODELLO", source: copy.source, sourceUrl: "#fonti", year: "2025-2050", unit: copy.unit, perimeter: copy.scope }}
      />
      <ChartNote label={copy.note} detail={copy.detail} />
    </div>
  );
};

export const InternationalBarChart = ({ metric }: { metric: Record<string, any> }) => {
  const { language } = useLanguage();
  const copy = getChartCopy(language).international;
  const format = useLocalizedFormat();
  const countryNames = copy.countries as Record<string, string>;
  const metricLabels = copy.metricLabels as Record<string, string>;
  const metricNotes = copy.metricNotes as Record<string, string>;
  const countries = [
    ["IT", countryNames.IT],
    ["CH", countryNames.CH],
    ["SE", countryNames.SE],
    ["NL", countryNames.NL],
  ] as const;
  const values = countries.map(([code]) => Number(metric.values?.[code] ?? 0));
  const max = Math.max(...values) * 1.12;
  const metricId = String(metric.id ?? "");
  const oecdSource = language === "it" ? "OECD, Panorama delle pensioni 2025" : "OECD, Pensions at a Glance 2025";
  const internationalMetadata: Record<string, DataTableMetadata> = {
    public_pension_expenditure_gdp: { truth: "FATTO", source: oecdSource, sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/public-expenditure-on-pensions_ddc9a2dd.html", year: "2021", unit: language === "it" ? "% del PIL" : "% of GDP", perimeter: language === "it" ? "prestazioni pubbliche in denaro per vecchiaia e superstiti" : "public cash benefits for old age and survivors" },
    pension_provider_assets_gdp: { truth: "FATTO", source: oecdSource, sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/assets-earmarked-for-retirement_089c3f13.html", year: "2024", unit: language === "it" ? "% del PIL" : "% of GDP", perimeter: language === "it" ? "attività di gestori pensionistici in schemi finanziati" : "pension provider assets in funded arrangements" },
    mandatory_effective_contribution_rate: { truth: "FATTO", source: oecdSource, sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/mandatory-pension-contributions_3aa18139.html", year: "2024", unit: language === "it" ? "% della retribuzione lorda media" : "% of average gross earnings", perimeter: language === "it" ? "aliquota effettiva obbligatoria o quasi obbligatoria" : "effective mandatory or quasi-mandatory rate" },
    old_age_dependency_ratio: { truth: "FATTO", source: language === "it" ? "Eurostat, indicatore OLDDEP1" : "Eurostat, OLDDEP1 indicator", sourceUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjanind?format=JSON&lang=en&indic_de=OLDDEP1&geo=IT&geo=NL&geo=SE&geo=CH", year: "2025", unit: "%", perimeter: language === "it" ? "residenti di almeno 65 anni rispetto ai residenti tra 15 e 64 anni" : "residents aged 65 or over relative to residents aged 15 to 64" },
  };
  return (
    <div className="chart-shell chart-shell--international">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h3>{metricLabels[metricId] ?? String(metric.label)}</h3>
        </div>
        <ChartTruthBadge label="FATTO" />
      </div>
      <div className="international-bars" role="img" aria-label={`${metricLabels[metricId] ?? String(metric.label)}, ${copy.aria}`}>
        {countries.map(([code, name], index) => (
          <div className={`international-row ${code === "IT" ? "international-row--italy" : ""}`} key={code}>
            <div className="international-name"><strong>{code}</strong><span>{name}</span></div>
            <div className="international-track"><span style={{ width: `${(values[index] / max) * 100}%` }} /></div>
            <strong className="international-value">{format.number(values[index], 1)}%</strong>
          </div>
        ))}
      </div>
      <DataTable
        label={copy.open}
        columns={[{ key: "country", label: copy.columns.country }, { key: "value", label: copy.columns.value }]}
        rows={countries.map(([, name], index) => ({ country: name, value: `${format.number(values[index] ?? 0, 1)}%` }))}
        metadata={internationalMetadata[metricId] ?? { truth: "FATTO", source: copy.fallbackSource, sourceUrl: "#fonti", year: String(metric.observedYear ?? copy.missingYear), unit: String(metric.unit ?? copy.missingUnit), perimeter: copy.fallbackScope }}
      />
      <ChartNote label={`OECD, ${String(metric.observedYear)}, ${copy.comparability} ${String(metric.comparability) === "high" ? copy.high : String(metric.comparability) === "medium" ? copy.medium : copy.low}.`} detail={metricNotes[metricId] ?? copy.fallbackNote} />
    </div>
  );
};
