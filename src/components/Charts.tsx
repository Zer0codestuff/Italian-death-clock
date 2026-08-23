import type { MacroPoint } from "../lib/types";
import { chartXForYear } from "../lib/chartGeometry";
import { numberIt, percentPoints } from "../lib/format";

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
  truth: string;
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
}) => (
  <details className="chart-data-table">
    <summary>{label}</summary>
    <div className="chart-data-table__meta">
      <span className="chart-data-table__truth">{metadata.truth}</span>
      <a href={metadata.sourceUrl} target={metadata.sourceUrl.startsWith("#") ? undefined : "_blank"} rel={metadata.sourceUrl.startsWith("#") ? undefined : "noreferrer"}>{metadata.source}</a>
      <span>anno: {metadata.year}</span>
      <span>unità: {metadata.unit}</span>
      <span>perimetro: {metadata.perimeter}</span>
    </div>
    <div className="chart-data-table__scroll" role="region" aria-label={`Tabella: ${label}`} tabIndex={0}>
      <table>
        <thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, rowIndex) => <tr key={`${String(row[columns[0]?.key ?? "row"])}-${rowIndex}`}>{columns.map((column, columnIndex) => columnIndex === 0 ? <th scope="row" key={column.key}>{String(row[column.key] ?? "n.d.")}</th> : <td key={column.key}>{String(row[column.key] ?? "n.d.")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </details>
);

const categoryLabels: Record<string, string> = {
  "old-age": "vecchiaia",
  "contributory invalidity": "invalidità contributiva",
  survivor: "superstiti",
  indennitarie: "indennitarie",
  assistenziale: "assistenziale",
};

const translateBand = (band: string): string => band
  .replace(/^up to /, "fino a ")
  .replace(" to ", " - ")
  .replace("and over", "e oltre");

const internationalMetricLabels: Record<string, string> = {
  public_pension_expenditure_gdp: "Spesa pubblica per pensioni sul PIL",
  pension_provider_assets_gdp: "Attività dei gestori pensionistici sul PIL",
  mandatory_effective_contribution_rate: "Aliquota contributiva obbligatoria effettiva",
  old_age_dependency_ratio: "Indice di dipendenza degli anziani",
};

const internationalMetricNotes: Record<string, string> = {
  public_pension_expenditure_gdp: "La definizione OECD copre le prestazioni pubbliche in denaro per vecchiaia e superstiti.",
  pension_provider_assets_gdp: "Sono attività di schemi finanziati. Non rappresentano il valore delle promesse PAYG.",
  mandatory_effective_contribution_rate: "Le aliquote sono armonizzate da OECD, ma i perimetri dei sistemi restano diversi.",
  old_age_dependency_ratio: "È il rapporto tra popolazione di 65 anni e oltre e popolazione tra 15 e 64 anni.",
};

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
  const minAge = Math.max(16, Math.min(careerStartAge, age) - 2);
  const maxAge = Math.max(retirementAge + 2, 70);
  const xForAge = (value: number) => 44 + ((value - minAge) / (maxAge - minAge)) * 632;
  return (
    <div className="chart-shell chart-shell--timeline">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Il tuo asse temporale</span>
          <h3>Dal primo versamento al giorno scelto</h3>
        </div>
        <span className="truth-badge truth-badge--scenario">SCENARIO</span>
      </div>
      <svg className="chart-svg" viewBox="0 0 720 178" role="img" aria-label={`Linea temporale da ${careerStartAge} a ${retirementAge} anni`}>
        <rect className="timeline-track" x="44" y="78" width="632" height="12" rx="6" />
        <rect className="timeline-paid" x="44" y="78" width={Math.max(0, xForAge(age) - 44)} height="12" rx="6" />
        <rect className="timeline-future" x={xForAge(age)} y="78" width={Math.max(0, xForAge(retirementAge) - xForAge(age))} height="12" rx="6" />
        <line className="timeline-marker timeline-marker--start" x1={xForAge(careerStartAge)} x2={xForAge(careerStartAge)} y1="50" y2="108" />
        <line className="timeline-marker timeline-marker--now" x1={xForAge(age)} x2={xForAge(age)} y1="42" y2="116" />
        <line className="timeline-marker timeline-marker--retire" x1={xForAge(retirementAge)} x2={xForAge(retirementAge)} y1="42" y2="116" />
        <text className="timeline-label" x={xForAge(careerStartAge)} y="34" textAnchor="middle">inizio</text>
        <text className="timeline-label timeline-label--now" x={xForAge(age)} y="136" textAnchor="middle">oggi, {age}</text>
        <text className="timeline-label" x={xForAge(retirementAge)} y="34" textAnchor="middle">scelta, {retirementAge}</text>
        <text className="timeline-small" x="44" y="164">{minAge} anni</text>
        <text className="timeline-small" x="676" y="164" textAnchor="end">{maxAge} anni</text>
      </svg>
      <div className="timeline-caption">
        <span><i className="legend-swatch legend-swatch--paid" /> {yearsContributed} anni già indicati</span>
        <span><i className="legend-swatch legend-swatch--future" /> anni ancora nel modello</span>
      </div>
      <DataTable
        label="Apri i dati della linea temporale"
        columns={[{ key: "event", label: "Evento" }, { key: "age", label: "Età" }, { key: "meaning", label: "Lettura" }]}
        rows={[
          { event: "Inizio", age: careerStartAge, meaning: "Primo versamento indicato" },
          { event: "Oggi", age, meaning: `${yearsContributed} anni già indicati` },
          { event: "Pensione simulata", age: retirementAge, meaning: "Scenario didattico" },
        ]}
        metadata={{ truth: "SCENARIO", source: "Modello personale locale", sourceUrl: "#fonti", year: "2026", unit: "anni", perimeter: "input controllati, non estratto conto INPS" }}
      />
    </div>
  );
};

export const CashFlowChart = ({ rows }: { rows: CashRow[] }) => {
  const visible = rows.filter((row) => row.year >= 2015);
  const max = Math.max(...visible.map((row) => row.currentRevenueTotal), ...visible.map((row) => row.contributionRevenue)) * 1.08;
  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Conto osservato</span>
          <h3>Entrate correnti INPS, senza trucco</h3>
        </div>
        <span className="truth-badge truth-badge--fact">FATTO</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Entrate contributive e trasferimenti correnti INPS dal 2015 al 2025">
        <GridLines min={0} max={max} format={(value) => `${Math.round(value / 1000)} mld`} />
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
        <span><i className="legend-swatch legend-swatch--accent" /> Contributi</span>
        <span><i className="legend-swatch legend-swatch--light" /> Entrate correnti totali</span>
      </div>
      <DataTable
        label="Apri i dati osservati"
        columns={[{ key: "year", label: "Anno" }, { key: "contributionRevenue", label: "Contributi, € mln" }, { key: "currentRevenueTotal", label: "Entrate correnti, € mln" }]}
        rows={visible.map((row) => ({ year: row.year, contributionRevenue: numberIt(row.contributionRevenue, 0), currentRevenueTotal: numberIt(row.currentRevenueTotal, 0) }))}
        metadata={{ truth: "FATTO", source: "INPS, rendiconto generale 2025", sourceUrl: "https://www.inps.it/content/dam/inps-site/pdf/allegatinews/Relazione_rendiconto_generale_2025.pdf", year: "2015-2025", unit: "milioni di euro", perimeter: "entrate correnti, contributi e trasferimenti INPS" }}
      />
      <ChartNote label="Dati amministrativi osservati, milioni di euro, 2015-2025." detail="Le entrate correnti includono trasferimenti e altre voci. Non sono un bilancio dello Stato." />
    </div>
  );
};

export const SpendingChart = ({ rows }: { rows: SpendingRow[] }) => {
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
          <span className="eyebrow">La traiettoria pubblicata</span>
          <h3>Spesa pensionistica lorda sul PIL</h3>
        </div>
        <span className="truth-badge truth-badge--official">PROIEZIONE UFFICIALE</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Proiezione ufficiale della spesa pensionistica lorda italiana sul PIL fino al 2070">
        <GridLines min={min} max={max} format={(value) => `${numberIt(value, 1)}%`} />
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
        <text className="peak-label" x={peakX + 8} y={pad.top + 13}>picco 17,3% nel 2036</text>
      </svg>
      <DataTable
        label="Apri i dati della proiezione"
        columns={[{ key: "year", label: "Anno" }, { key: "expenditure", label: "Spesa lorda, % PIL" }, { key: "pensionersToWorkers", label: "Pensionati / occupati" }]}
        rows={rows.map((row) => ({ year: row.year, expenditure: numberIt(row.grossPublicPensionExpenditure, 1), pensionersToWorkers: numberIt(row.pensionersToWorkers, 1) }))}
        metadata={{ truth: "PROIEZIONE UFFICIALE", source: "Commissione europea, Ageing Report 2024", sourceUrl: "https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf", year: "2022-2070", unit: "% del PIL", perimeter: "spesa pubblica lorda italiana nel baseline Ageing Report" }}
      />
      <ChartNote label="Baseline Ageing Report, perimetro pubblico, 2022-2070." detail="Il picco è una condizione del modello, non una data di collasso." />
    </div>
  );
};

export const DemographyChart = ({ ageShares, averageAge }: { ageShares: Array<Record<string, number>>; averageAge: Array<Record<string, number>> }) => {
  const groups = ageShares.slice(0, 2);
  const colors = ["#f2c94c", "#db4a35", "#172d3b"];
  return (
    <div className="chart-shell">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Peso demografico</span>
          <h3>La stessa popolazione, due fotografie</h3>
        </div>
        <span className="truth-badge truth-badge--official">PROIEZIONE UFFICIALE</span>
      </div>
      <div className="demography-layout">
        <svg className="chart-svg chart-svg--demography" viewBox="0 0 390 260" role="img" aria-label="Composizione della popolazione italiana per fasce di età nel 2024 e nel 2050">
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
                <text className="demography-total" x={x + 54} y="250" textAnchor="middle">100% residenti</text>
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
            <span>Età media</span>
            <strong>{numberIt(averageAge[0]?.averageAge ?? 0, 1)} → {numberIt(averageAge.at(-1)?.averageAge ?? 0, 1)} anni</strong>
            <small>2024 → 2080, scenario mediano Istat</small>
          </div>
        </div>
      </div>
      <DataTable
        label="Apri i dati demografici"
        columns={[{ key: "year", label: "Anno" }, { key: "age0to14", label: "0-14, %" }, { key: "age15to64", label: "15-64, %" }, { key: "age65Plus", label: "65+, %" }]}
        rows={groups.map((group) => ({ year: group.year, age0to14: numberIt(group.age0to14, 1), age15to64: numberIt(group.age15to64, 1), age65Plus: numberIt(group.age65Plus, 1) }))}
        metadata={{ truth: "PROIEZIONE UFFICIALE", source: "Istat, previsioni della popolazione", sourceUrl: "https://www.istat.it/wp-content/uploads/2025/07/Report_Previsioni-della-popolazione-residente-e-delle-famiglie_Base-Base-112024.pdf", year: "2024 e 2050", unit: "% dei residenti", perimeter: "popolazione residente per fascia d'età, scenario mediano" }}
      />
      <ChartNote label="Istat, scenario mediano, quote ufficiali 2024 e 2050." detail="La fascia 15-64 è un indicatore demografico, non il numero degli occupati." />
    </div>
  );
};

export const DistributionChart = ({ rows }: { rows: Array<Record<string, number | string>> }) => {
  const visible = rows.filter((row) => row.band !== "total");
  return (
    <div className="chart-shell chart-shell--distribution">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Distribuzione osservata</span>
          <h3>Importo basso non significa stessa storia</h3>
        </div>
        <span className="truth-badge truth-badge--fact">FATTO</span>
      </div>
      <div className="distribution-list" role="img" aria-label="Distribuzione delle prestazioni pensionistiche per importo mensile nel 2024">
        {visible.map((row) => (
          <div className="distribution-row" key={String(row.band)}>
            <div className="distribution-label">€ {translateBand(String(row.band))}</div>
            <div className="distribution-bars">
              <div className="distribution-track"><span className="distribution-fill distribution-fill--red" style={{ width: `${Number(row.shareOfBenefits) * 2.5}%` }} /></div>
              <div className="distribution-track"><span className="distribution-fill distribution-fill--blue" style={{ width: `${Number(row.shareOfAmount) * 2.5}%` }} /></div>
            </div>
            <div className="distribution-values"><span>{percentPoints(Number(row.shareOfBenefits))} prestazioni</span><span>{percentPoints(Number(row.shareOfAmount))} importi</span></div>
          </div>
        ))}
      </div>
      <div className="chart-legend"><span><i className="legend-swatch legend-swatch--red" /> Quota prestazioni</span><span><i className="legend-swatch legend-swatch--blue" /> Quota importi</span></div>
      <DataTable
        label="Apri la distribuzione in tabella"
        columns={[{ key: "band", label: "Fascia mensile" }, { key: "shareOfBenefits", label: "Quota prestazioni" }, { key: "shareOfAmount", label: "Quota importi" }]}
        rows={visible.map((row) => ({ band: `€ ${translateBand(String(row.band))}`, shareOfBenefits: `${percentPoints(Number(row.shareOfBenefits))}`, shareOfAmount: `${percentPoints(Number(row.shareOfAmount))}` }))}
        metadata={{ truth: "FATTO", source: "INPS, osservatorio beneficiari 2024", sourceUrl: "https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007", year: "2024", unit: "% di prestazioni e importi annualizzati", perimeter: "prestazioni pensionistiche per fascia mensile, non persone uniche" }}
      />
      <ChartNote label="INPS, beneficiari 2024, importi annualizzati in milioni di euro." detail="Una prestazione non è una persona. Le bande non provano né povertà né abuso." />
    </div>
  );
};

export const MultipleBenefitsChart = ({ rows }: { rows: Array<Record<string, number | string>> }) => (
  <div className="chart-shell chart-shell--multiple">
    <div className="chart-heading">
      <div>
        <span className="eyebrow">Combinazioni</span>
        <h3>Più prestazioni, non automaticamente un abuso</h3>
      </div>
      <span className="truth-badge truth-badge--fact">FATTO</span>
    </div>
    <div className="multiple-list" role="img" aria-label="Quota di pensionati con una sola categoria o con più categorie di prestazione">
      {rows.map((row) => (
        <div className="multiple-row" key={String(row.category)}>
          <div className="multiple-label">{categoryLabels[String(row.category)] ?? String(row.category)}</div>
          <div className="multiple-bar"><span className="multiple-bar__single" style={{ width: `${Number(row.sameTypeOnlyShare)}%` }} /><span className="multiple-bar__combined" style={{ width: `${Number(row.cumulatedShare)}%` }} /></div>
          <div className="multiple-number">{percentPoints(Number(row.cumulatedShare))} cumulano</div>
        </div>
      ))}
    </div>
    <div className="chart-legend"><span><i className="legend-swatch legend-swatch--yellow" /> Solo tipo</span><span><i className="legend-swatch legend-swatch--navy" /> Con almeno un altro tipo</span></div>
    <DataTable
      label="Apri le combinazioni in tabella"
      columns={[{ key: "category", label: "Categoria" }, { key: "sameTypeOnlyShare", label: "Solo tipo" }, { key: "cumulatedShare", label: "Con altri tipi" }]}
      rows={rows.map((row) => ({ category: categoryLabels[String(row.category)] ?? String(row.category), sameTypeOnlyShare: `${percentPoints(Number(row.sameTypeOnlyShare))}`, cumulatedShare: `${percentPoints(Number(row.cumulatedShare))}` }))}
      metadata={{ truth: "FATTO", source: "INPS, osservatorio beneficiari 2024", sourceUrl: "https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007", year: "2024", unit: "% di categorie di beneficiari", perimeter: "categorie sovrapposte, una persona può comparire più volte" }}
    />
    <ChartNote label="INPS, osservatorio beneficiari al 31 dicembre 2024." detail="Le righe si sovrappongono: una persona può comparire in più categorie." />
  </div>
);

export const MacroChart = ({
  points,
  baseline,
  scenarioBands,
}: {
  points: MacroPoint[];
  baseline: MacroPoint[];
  scenarioBands: { low: MacroPoint[]; central: MacroPoint[]; high: MacroPoint[] };
}) => {
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
          <span className="eyebrow">La leva che scegli</span>
          <h3>Pressione, aliquota e prestazione nello stesso foglio</h3>
        </div>
        <span className="truth-badge truth-badge--model">STIMA DEL MODELLO</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Grafico del modello macro con pressione, aliquota PAYG necessaria e sostituzione media proxy">
        <GridLines min={min} max={max} format={(value) => numberIt(value, 1)} />
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
      <div className="chart-legend"><span><i className="legend-swatch legend-swatch--band" /> Scenario basso</span><span><i className="legend-swatch legend-swatch--red" /> Scenario centrale</span><span><i className="legend-swatch legend-swatch--band" /> Scenario alto</span><span><i className="legend-swatch legend-swatch--yellow" /> Aliquota necessaria / 20</span><span><i className="legend-swatch legend-swatch--blue" /> Sostituzione media proxy</span></div>
      <DataTable
        label="Apri i risultati macro in tabella"
        columns={[{ key: "year", label: "Anno" }, { key: "pressure", label: "Pressione" }, { key: "workers", label: "Occupati / beneficiario" }, { key: "rate", label: "Aliquota necessaria" }, { key: "balance", label: "Bilancio proxy" }, { key: "replacement", label: "Sostituzione proxy" }]}
        rows={visible.filter((point) => selectedYears.includes(point.year)).map((point) => ({ year: point.year, pressure: numberIt(point.pressureIndex, 2), workers: numberIt(point.workersPerBeneficiary, 2), rate: percentPoints(point.requiredPaygRate * 100), balance: numberIt(point.balanceProxy, 2), replacement: percentPoints(point.benefitReplacementProxy * 100) }))}
        metadata={{ truth: "STIMA DEL MODELLO", source: "Modello macro locale", sourceUrl: "#fonti", year: "2025-2050", unit: "indici, percentuali e rapporti", perimeter: "proxy di flusso, non bilancio pubblico" }}
      />
      <ChartNote label="Stima del modello, base 2025, valori indicizzati." detail="La linea gialla è divisa per 20 per stare nello stesso riquadro. Non è un bilancio INPS, né una previsione di contabilità pubblica." />
    </div>
  );
};

export const InternationalBarChart = ({ metric }: { metric: Record<string, any> }) => {
  const countries = [
    ["IT", "Italia"],
    ["CH", "Svizzera"],
    ["SE", "Svezia"],
    ["NL", "Paesi Bassi"],
  ] as const;
  const values = countries.map(([code]) => Number(metric.values?.[code] ?? 0));
  const max = Math.max(...values) * 1.12;
  const metricId = String(metric.id ?? "");
  const internationalMetadata: Record<string, DataTableMetadata> = {
    public_pension_expenditure_gdp: { truth: "FATTO", source: "OECD, Panorama delle pensioni 2025", sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/public-expenditure-on-pensions_ddc9a2dd.html", year: "2021", unit: "% del PIL", perimeter: "prestazioni pubbliche in denaro per vecchiaia e superstiti" },
    pension_provider_assets_gdp: { truth: "FATTO", source: "OECD, Panorama delle pensioni 2025", sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/assets-earmarked-for-retirement_089c3f13.html", year: "2024", unit: "% del PIL", perimeter: "attività di gestori pensionistici in schemi finanziati" },
    mandatory_effective_contribution_rate: { truth: "FATTO", source: "OECD, Panorama delle pensioni 2025", sourceUrl: "https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/mandatory-pension-contributions_3aa18139.html", year: "2024", unit: "% della retribuzione lorda media", perimeter: "aliquota effettiva obbligatoria o quasi obbligatoria" },
    old_age_dependency_ratio: { truth: "FATTO", source: "Eurostat, indicatore OLDDEP1", sourceUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjanind?format=JSON&lang=en&indic_de=OLDDEP1&geo=IT&geo=NL&geo=SE&geo=CH", year: "2025", unit: "%", perimeter: "residenti di almeno 65 anni rispetto ai residenti tra 15 e 64 anni" },
  };
  return (
    <div className="chart-shell chart-shell--international">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Confronto armonizzato</span>
          <h3>{internationalMetricLabels[metricId] ?? String(metric.label)}</h3>
        </div>
        <span className="truth-badge truth-badge--fact">FATTO</span>
      </div>
      <div className="international-bars" role="img" aria-label={`${internationalMetricLabels[metricId] ?? String(metric.label)}, confronto tra Italia, Svizzera, Svezia e Paesi Bassi`}>
        {countries.map(([code, name], index) => (
          <div className={`international-row ${code === "IT" ? "international-row--italy" : ""}`} key={code}>
            <div className="international-name"><strong>{code}</strong><span>{name}</span></div>
            <div className="international-track"><span style={{ width: `${(values[index] / max) * 100}%` }} /></div>
            <strong className="international-value">{numberIt(values[index], 1)}%</strong>
          </div>
        ))}
      </div>
      <DataTable
        label="Apri il confronto in tabella"
        columns={[{ key: "country", label: "Paese" }, { key: "value", label: "Valore" }]}
        rows={countries.map(([, name], index) => ({ country: name, value: `${numberIt(values[index] ?? 0, 1)}%` }))}
        metadata={internationalMetadata[metricId] ?? { truth: "FATTO", source: "Fonte comparativa", sourceUrl: "#fonti", year: String(metric.observedYear ?? "non indicato"), unit: String(metric.unit ?? "non indicata"), perimeter: "quattro paesi, definizione indicata dalla fonte" }}
      />
      <ChartNote label={`OECD, ${String(metric.observedYear)}, comparabilità ${String(metric.comparability) === "high" ? "alta" : String(metric.comparability) === "medium" ? "media" : "bassa"}.`} detail={internationalMetricNotes[metricId] ?? "La definizione è quella indicata dalla fonte."} />
    </div>
  );
};
