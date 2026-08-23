import { useEffect, useMemo, useState } from "react";
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
import { euro, millions, numberIt, percent, percentPoints } from "./lib/format";
import { deriveEmploymentContext, type EmploymentContext } from "./lib/employmentContext";
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

const navItems = [
  ["alert", "L'allarme", "1"],
  ["anni", "I tuoi anni", "2"],
  ["patto", "Il patto", "3"],
  ["pressione", "La pressione", "4"],
  ["risultato", "Il risultato", "5"],
  ["leve", "Le leve", "6"],
  ["confronto", "Il confronto", "7"],
  ["fonti", "Fonti", "∞"],
] as const;

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

const truthText = (label: TruthLabel): string => label;

const getYear = sourceMetadataLabel;

const pillarLabels: Record<string, string> = {
  first_pillar: "Primo pilastro pubblico",
  second_pillar: "Pilastro occupazionale",
  third_pillar: "Pilastro personale volontario",
};

const fundingLabels: Record<string, string> = {
  PAYG: "a ripartizione",
  "PAYG mixed with NDC transition": "a ripartizione, transizione NDC",
  "PAYG NDC plus funded premium account": "NDC a ripartizione, conto finanziato",
  "funded": "finanziato",
  "funded capitalisation": "capitalizzazione finanziata",
  "funded, transitioning to defined contribution": "finanziato, verso contributi definiti",
};

const mandateLabels: Record<string, string> = {
  mandatory: "obbligatorio",
  "mandatory public pension": "pensione pubblica obbligatoria",
  "mandatory above statutory threshold": "obbligatorio sopra la soglia prevista",
  "broad collective-agreement or employer coverage": "copertura ampia da contratto o datore",
  "quasi-mandatory where sector or employer arrangement applies": "quasi obbligatorio dove vale un accordo",
  "compulsory social insurance for insured residents and workers": "assicurazione sociale obbligatoria per residenti e lavoratori assicurati",
  "generally voluntary": "generalmente volontario",
  voluntary: "volontario",
};

const countryNamesItalian: Record<string, string> = { CH: "Svizzera", SE: "Svezia", NL: "Paesi Bassi" };
const countryDescriptionsItalian: Record<string, string> = {
  CH: "Tre pilastri: AVS/OASI pubblico a ripartizione, previdenza professionale finanziata sopra la soglia prevista e risparmio individuale volontario.",
  SE: "Pensione pubblica NDC a ripartizione, premio finanziato, garanzia pubblica e una previdenza occupazionale molto diffusa.",
  NL: "AOW pubblico a ripartizione, previdenza occupazionale finanziata e prodotti individuali. Il pilastro occupazionale passa verso contributi definiti.",
};

const translateFunding = (value: string): string => fundingLabels[value] ?? value.replace("funded", "finanziato").replace("PAYG", "a ripartizione");
const translateMandate = (value: string): string => mandateLabels[value] ?? value;

const formatMetric = (metric: Record<string, unknown>): string => {
  const unit = String(metric.unit ?? "");
  const value = Number(metric.value);
  if (unit.includes("million")) return millions(value, 1);
  if (unit.includes("percent")) return percentPoints(value, 1);
  if (unit === "benefits") return millions(value / 1_000_000, 1);
  return numberIt(value, 1);
};

const sourceMap = (italy: ItalyData, international: InternationalData): Record<string, Source> => ({
  ...Object.fromEntries(italy.sourceCatalog.map((source) => [source.id, source])),
  ...Object.fromEntries(Object.entries(international.sourceCatalog).map(([id, source]) => [id, { ...source, id }])),
});

const SourceChip = ({ id, sources }: { id: string; sources: Record<string, Source> }) => {
  const source = sources[id];
  if (!source) return null;
  return (
    <a className="source-chip" href={source.url} target="_blank" rel="noreferrer" title={`${sourceCardTitle(source)}, ${getYear(source)}`}>
      <span className="source-chip__mark" aria-hidden="true">↗</span>
      <span>{source.publisher}</span>
      <span className="source-chip__year">{getYear(source)}</span>
    </a>
  );
};

const TruthBadge = ({ label }: { label: TruthLabel }) => (
  <span className={`truth-badge ${truthClass[label]}`}>{truthText(label)}</span>
);

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
        <label htmlFor={`${id}-precise`}>Valore preciso</label>
        <input
          id={`${id}-precise`}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-describedby={helpId}
          aria-label={`${label}, inserimento numerico`}
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

const MethodDetails = ({ title, children }: { title: string; children: ReactNode }) => (
  <details className="method-details">
    <summary><span>{title}</span><span className="method-details__toggle">Apri il metodo</span></summary>
    <div className="method-details__body">{children}</div>
  </details>
);

const LoadingShell = ({ error, retry }: { error: string | null; retry: () => void }) => (
  <main className="loading-shell" id="contenuto">
    <div className="brand-line"><span className="brand-mark">/</span><span>IL CONTO DELLA PENSIONE</span></div>
    <div className="loading-card">
      <TruthBadge label={error ? "STIMA DEL MODELLO" : "FATTO"} />
      <h1>{error ? "Il dato non arriva. Il conto resta leggibile." : "Stiamo aprendo i registri."}</h1>
      <p>{error ?? "Carichiamo i pack pubblici, poi puoi cambiare le leve. Nessun dato personale esce dal tuo browser."}</p>
      {error ? <button className="button button--red" type="button" onClick={retry}>Riprova</button> : <div className="loading-bar" role="progressbar" aria-label="Caricamento dati" />}
    </div>
  </main>
);

const Header = ({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) => (
  <header className="site-header">
    <a className="site-logo" href="#alert" aria-label="Torna all'inizio"><span className="site-logo__mark">/</span><span>IL CONTO<br />DELLA PENSIONE</span></a>
    <nav className="desktop-nav" aria-label="Navigazione narrativa">
      {navItems.map(([id, label, number]) => <a className={activeId === id ? "is-active" : ""} href={`#${id}`} aria-current={activeId === id ? "location" : undefined} key={id}><span>{number}</span>{label}</a>)}
    </nav>
    <label className="mobile-nav-label" htmlFor="mobile-nav">Vai a una sezione</label>
    <select id="mobile-nav" className="mobile-nav" value={activeId} aria-label="Vai a una sezione" onChange={(event) => onNavigate(event.target.value)}>
      {navItems.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
    </select>
  </header>
);

const Hero = ({ italy, sources }: { italy: ItalyData; sources: Record<string, Source> }) => {
  const findMetric = (id: string) => italy.headlineMetrics.find((metric) => metric.id === id);
  const currentBenefits = findMetric("inps_current_benefits");
  const peak = findMetric("public_pension_expenditure_peak");
  const population = findMetric("istat_population_2050");
  return (
    <section className="hero scene" id="alert" aria-labelledby="hero-title">
      <div className="hero__content">
        <div className="alert-strip"><span className="alert-strip__signal" /> Nessun conto alla rovescia. Il problema è già nel flusso.</div>
        <div className="hero__eyebrow"><span className="hero__slash">/</span> DATI, SCENARI, COMPROMESSI <span className="hero__date">aggiornato al 23 agosto 2026</span></div>
        <h1 id="hero-title">La pensione non esplode.<br /><em>Si restringe,</em> busta paga dopo busta paga.</h1>
        <div className="hero__bottom">
          <div>
            <p className="hero__lead">Non serve indovinare il giorno del disastro. Serve capire chi versa, chi riceve e quali regole spostano il conto.</p>
            <div className="truth-line"><TruthBadge label="ANALOGIA RETORICA" /><span>La frase è una provocazione editoriale, non una previsione.</span></div>
            <a className="button button--cream" href="#anni">Scorri il conto <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero__facts" role="group" aria-label="Tre fatti di contesto">
            <MetricCard value={currentBenefits ? formatMetric(currentBenefits) : "n.d."} label="prestazioni INPS in vigore" note="Contate come prestazioni, non come persone." truth="FATTO" sourceId="inps_observatory_2026" sources={sources} />
            <MetricCard value={peak ? formatMetric(peak) : "n.d."} label="picco spesa pubblica sul PIL" note="Baseline Ageing Report, anno 2036." truth="PROIEZIONE UFFICIALE" sourceId="ec_ageing_2024_italy" sources={sources} />
            <MetricCard value={population ? formatMetric(population) : "n.d."} label="residenti nello scenario Istat 2050" note="Scenario mediano, milioni di persone." truth="PROIEZIONE UFFICIALE" sourceId="istat_population_2025" sources={sources} />
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
        <SectionKicker number="01" label="I tuoi anni" />
        <div className="section-heading section-heading--split">
          <div><h2 id="anni-title">Il tuo futuro non arriva a 67 anni.<br /><em>Comincia dal primo versamento.</em></h2></div>
          <div><TruthBadge label="SCENARIO" /><p className="section-intro">Metti cinque numeri nel conto. Il risultato è un assegno simulato in euro costanti 2026, non il tuo estratto conto INPS.</p></div>
        </div>
        <div className="personal-grid">
          <div className="panel panel--dark personal-controls">
            <div className="panel-heading"><span className="eyebrow eyebrow--light">Input personali</span><div className="panel-heading__actions"><span className="panel-status">calcolo locale</span><button className="reset-button reset-button--light" type="button" onClick={() => setPersonal(() => ({ ...defaultPersonal }))}>reset</button></div></div>
            <Control id="personal-age" label="Quanti anni hai?" value={personal.age} min={18} max={64} step={1} display={`${personal.age} anni`} onChange={(value) => change("age", value)} />
            <Control id="personal-salary" label="Quanto guadagni lordi?" value={personal.grossSalaryAnnualReal} min={12_000} max={100_000} step={500} display={euro(personal.grossSalaryAnnualReal)} onChange={(value) => change("grossSalaryAnnualReal", value)} help="Euro costanti 2026, prima di imposte e contributi." />
            <Control id="personal-career" label="A che età hai iniziato a versare?" value={personal.careerStartAge} min={16} max={personal.age} step={1} display={`${personal.careerStartAge} anni`} onChange={(value) => change("careerStartAge", value)} />
            <Control id="personal-years" label="Anni di contributi già indicati" value={personal.contributionYearsToDate} min={0} max={Math.max(0, personal.age - personal.careerStartAge)} step={1} display={`${personal.contributionYearsToDate} anni`} onChange={(value) => change("contributionYearsToDate", value)} />
            <Control id="personal-growth" label="Crescita reale annua dello stipendio" value={personal.salaryGrowthReal} min={-0.02} max={0.04} step={0.001} display={percent(personal.salaryGrowthReal, 1)} onChange={(value) => change("salaryGrowthReal", value)} help="È una scelta di scenario, non una promessa di carriera." />
            <details className="advanced-controls"><summary>Ipotesi avanzate</summary>
              <Control id="personal-retirement" label="Età di pensionamento simulata" value={personal.retirementAge} min={personal.age + 1} max={75} step={1} display={`${personal.retirementAge} anni`} onChange={(value) => change("retirementAge", value)} help="La regola ordinaria INPS è 67 anni nel 2026. Il futuro può cambiare." />
              <Control id="personal-rate" label="Aliquota contributiva" value={personal.contributionRate} min={0.2} max={0.45} step={0.005} display={percent(personal.contributionRate, 1)} onChange={(value) => change("contributionRate", value)} />
              <Control id="personal-benefit" label="Fattore della prestazione pubblica" value={personal.publicBenefitFactor} min={0.6} max={1.2} step={0.01} display={numberIt(personal.publicBenefitFactor, 2)} onChange={(value) => change("publicBenefitFactor", value)} />
              <Control id="personal-funded" label="Quota di contribuzione finanziata" value={personal.fundedShare} min={0} max={0.4} step={0.01} display={percent(personal.fundedShare, 0)} onChange={(value) => change("fundedShare", value)} />
            </details>
          </div>
          <div className="personal-output">
            <TimelineChart age={personal.age} careerStartAge={personal.careerStartAge} retirementAge={personal.retirementAge} yearsContributed={personal.contributionYearsToDate} />
            <div className="result-lead">
              <div aria-hidden="true"><span className="eyebrow">Output locale, aggiornato ora</span><p>Con queste ipotesi, l'assegno simulato sarebbe</p><strong>{euro(result.monthlyPension)} <small>al mese</small></strong><span className="result-lead__annual">{euro(result.annualPension)} lordi all'anno, in euro costanti 2026</span></div>
              <span className="sr-only" aria-live="polite" aria-atomic="true">Output aggiornato: assegno simulato di {euro(announcedResult.monthlyPension)} al mese, {euro(announcedResult.annualPension)} lordi all'anno.</span>
            </div>
            <SourceLine sourceIds={["inps_retirement_age", "ec_ageing_2024_italy"]} sources={sources} />
          </div>
        </div>
        <MethodDetails title="Le ipotesi del calcolo personale">
          <p><TruthBadge label="STIMA DEL MODELLO" /> Il modello somma i versamenti pubblici e una quota finanziata separata. Trasforma il saldo in una rendita reale su 22 anni. Il rendimento finanziato ipotizzato è del 3% reale annuo.</p>
          <p>Non calcola tasse, commissioni, reversibilità, invalidità, minimi, carriere discontinue o coefficienti INPS. La crescita prima dell'anno corrente è ricostruita a ritroso dal tuo stipendio dichiarato. È un dispositivo didattico.</p>
          <code>pensione = fattore pubblico × saldo pubblico / 22 + saldo finanziato × rendita al 3%</code>
        </MethodDetails>
      </div>
    </section>
  );
};

const PactScene = ({ italy, employmentContext, sources }: { italy: ItalyData; employmentContext: EmploymentContext | null; sources: Record<string, Source> }) => {
  const cashRows = italy.cashFlow.annualCurrentRevenueHistory as Array<Record<string, number>>;
  const latest = italy.cashFlow.latest2025 as Record<string, number>;
  return (
    <section className="scene section section--ink" id="patto" aria-labelledby="patto-title">
      <div className="section-inner">
        <SectionKicker number="02" label="Il patto" />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="patto-title">Ogni pensione futura dipende da redditi, lavoro e regole che ancora <em>non conosciamo.</em></h2></div>
          <div><TruthBadge label="STIMA DEL MODELLO" /><p className="section-intro">Il PAYG non è un salvadanaio personale. I contributi di oggi finanziano le prestazioni di oggi, dentro conti pubblici più ampi.</p></div>
        </div>
        <div className="pact-grid">
          <CashFlowChart rows={cashRows as any} />
          <div className="pact-side">
            <div className="flow-card">
              <div className="flow-card__from"><span className="flow-number">{employmentContext ? numberIt(employmentContext.valueMillions, 3) : "n.d."}</span><span>milioni di occupati<br /><small>{employmentContext ? `baseline Ageing Report, ${employmentContext.year}` : "dato non disponibile nel pack"}</small></span></div>
              {employmentContext ? <div className="employment-source-meta"><span>sourceId: {employmentContext.sourceId}</span><span>unità: {employmentContext.unit}</span><span>perimetro: {employmentContext.perimeter}</span><SourceChip id={employmentContext.sourceId} sources={sources} /></div> : null}
              <div className="flow-arrow" aria-hidden="true">↓</div>
              <div className="flow-card__to"><span className="flow-number">16,3</span><span>milioni di pensionati<br /><small>beneficiari unici, 2024</small></span></div>
              <div className="flow-warning"><TruthBadge label="STIMA DEL MODELLO" /><p>È un rapporto orientativo. Le due serie non hanno la stessa definizione statistica.</p></div>
            </div>
            <div className="fact-note"><TruthBadge label="FATTO" /><strong>{euro(latest.contributionRevenue * 1_000_000, true)} di contributi nel 2025</strong><p>Le prestazioni pensionistiche INPS registrate nel bilancio sono {euro(latest.pensionOutlays * 1_000_000, true)}. Confrontare due righe non equivale a calcolare un disavanzo.</p><SourceLine sourceIds={["inps_budget_2025"]} sources={sources} /></div>
          </div>
        </div>
        <div className="rule-strip"><div><span className="eyebrow eyebrow--light">Regola osservata</span><strong>Vecchiaia ordinaria: 67 anni e 20 di contributi nel 2026</strong></div><div><span className="eyebrow eyebrow--light">Prossimi scatti</span><strong>67 anni e 1 mese nel 2027, 67 anni e 3 mesi nel 2028</strong></div><SourceChip id="inps_requirements_2026" sources={sources} /></div>
        <MethodDetails title="Perché il patto è più grande del grafico">
          <p>Il bilancio INPS usa conti di competenza. Dentro ci sono trasferimenti statali, assistenza e più gestioni. La storia sopra serve a leggere il flusso, non a sostituire i conti nazionali.</p>
          <p>La formula contributiva italiana capitalizza i contributi a un tasso legato alla crescita nominale del PIL e applica coefficienti legati a mortalità e speranza di vita. Le regole miste dipendono dalla storia contributiva.</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "inps_budget_2025"]} sources={sources} />
          <p className="method-footnote">Nel grafico: entrate correnti totali, contributi e trasferimenti. Anni e unità restano visibili nelle etichette della fonte.</p>
        </MethodDetails>
      </div>
    </section>
  );
};

const PressureScene = ({ italy, sources }: { italy: ItalyData; sources: Record<string, Source> }) => {
  const spendingRows = italy.spendingProjection.baselineByYear as Array<Record<string, number>>;
  const ageShares = italy.demography.istatAgeShares as Array<Record<string, number>>;
  const averageAge = italy.demography.istatAverageAge as Array<Record<string, number>>;
  const peak = italy.spendingProjection.officialPeak as Record<string, number>;
  return (
    <section className="scene section section--sand" id="pressione" aria-labelledby="pressione-title">
      <div className="section-inner">
        <SectionKicker number="03" label="La pressione" />
        <div className="section-heading section-heading--split">
          <div><h2 id="pressione-title">Meno persone in età lavorativa.<br /><em>Più persone fuori dal lavoro.</em></h2></div>
          <div><TruthBadge label="PROIEZIONE UFFICIALE" /><p className="section-intro">È una traiettoria pubblicata, non una profezia. Cambia se cambiano nascite, migrazioni, occupazione, produttività e regole.</p></div>
        </div>
        <div className="pressure-grid">
          <DemographyChart ageShares={ageShares} averageAge={averageAge} />
          <SpendingChart rows={spendingRows as any} />
        </div>
        <div className="pressure-band">
          <div><span className="eyebrow">Il punto più alto nel baseline</span><strong>{numberIt(peak.grossPublicPensionExpenditure, 1)}% del PIL</strong><span>anno {peak.year}, spesa pubblica lorda</span></div>
          <div><span className="eyebrow">Quello che il grafico non dice</span><strong>non c'è una data magica</strong><span>un modello condizionale non è un conto alla rovescia</span></div>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "istat_population_2025"]} sources={sources} />
        </div>
        <MethodDetails title="Leggere una proiezione senza trasformarla in profezia">
          <p>Il baseline Ageing Report raggiunge il picco di spesa lorda nel 2036 e poi scende nel suo percorso di policy. Istat, con un'altra popolazione di base e un altro modello, porta i residenti a 54,7 milioni nel 2050 nello scenario mediano.</p>
          <p>Le bande di incertezza Istat per il 2050 vanno da 52,5 a 56,8 milioni. Sono scenari ufficiali, non probabilità su cui puntare una data.</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "istat_population_2025"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const ResultScene = ({ personal, result, macroPoint, italy, sources }: { personal: PersonalInputs; result: ReturnType<typeof calculatePersonal>; macroPoint: ReturnType<typeof interpolateMacroPoint>; italy: ItalyData; sources: Record<string, Source> }) => {
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
        <SectionKicker number="04" label="Il risultato" />
        <div className="section-heading section-heading--split">
          <div><h2 id="risultato-title">Adesso metti il tuo numero<br /><em>nel conto.</em></h2></div>
          <div><TruthBadge label="STIMA DEL MODELLO" /><p className="section-intro">Un output leggibile vale più di un numero urlato. Qui vedi anche cosa resta fuori.</p></div>
        </div>
        <div className="result-grid">
          <StatCard label="Pensione annua simulata" value={euro(result.annualPension)} note={`${euro(result.monthlyPension)} al mese, conversione su 12 mesi`} accent="red" />
          <StatCard label="Tasso di sostituzione lordo" value={percent(result.replacementRatio, 1)} note={`su uno stipendio finale di ${euro(result.finalSalary)}`} accent="navy" />
          <StatCard label="Contributo annuo oggi" value={euro(result.annualContributionToday)} note={`${percent(personal.contributionRate, 1)} dello stipendio lordo`} accent="yellow" />
          <StatCard label="Versamenti simulati" value={euro(result.totalContributions)} note={`${euro(result.publicContributions)} pubblici, ${euro(result.fundedContributions)} finanziati`} accent="navy" />
          <StatCard label={`Pressione al tuo anno, ${result.retirementYear}`} value={numberIt(macroPoint.pressureIndex, 2)} note="Indice del modello macro, base 2025 = 1,00" accent="red" />
        </div>
        <div className="generation-compare">
          <div className="compare-title"><span className="eyebrow">Confronto controllato</span><h3>Stesse ipotesi, età diverse</h3><p>Non sono tre persone reali. Cambia solo l'età e il tempo residuo, mentre stipendio, carriera e leve restano leggibili.</p></div>
          {comparison.map(({ age, result: ageResult }) => <div className={`compare-cell ${age === personal.age ? "compare-cell--active" : ""}`} key={age}><span>{age} anni</span><strong>{euro(ageResult.monthlyPension)}</strong><small>al mese simulati<br />ritiro a {ageResult.retirementYear}</small></div>)}
        </div>
        <div className="distribution-grid">
          <DistributionChart rows={distribution} />
          <MultipleBenefitsChart rows={multiple} />
        </div>
        <div className="callout callout--yellow"><strong>Un importo alto è una distribuzione, non una sentenza.</strong><span>Le combinazioni tra vecchiaia, reversibilità, invalidità e assistenza possono essere previste dalle regole. I dati non dimostrano da soli un abuso.</span><SourceLine sourceIds={["inps_beneficiaries_2024", "inps_observatory_2026"]} sources={sources} /></div>
        <MethodDetails title="I limiti da tenere accanto al risultato">
          <p>Il risultato non si chiama pensione INPS perché non ricostruisce la tua posizione, la tua gestione, la fiscalità o la storia dei contributi. È un scenario didattico in euro costanti 2026.</p>
          <p>Il dato INPS 2024 distingue 16,306 milioni di beneficiari unici da 23,015 milioni di prestazioni. Le bande di importo descrivono unità diverse e non si possono sommare senza controllare l'overlap.</p>
          <SourceLine sourceIds={["inps_beneficiaries_2024"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const MacroScene = ({ macro, setMacro, points, baseline, announcedPoints, employmentContext, sources }: { macro: MacroInputs; setMacro: (updater: (previous: MacroInputs) => MacroInputs) => void; points: ReturnType<typeof calculateMacro>; baseline: ReturnType<typeof calculateMacro>; announcedPoints: ReturnType<typeof calculateMacro>; employmentContext: EmploymentContext | null; sources: Record<string, Source> }) => {
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
  return (
    <section className="scene section section--red" id="leve" aria-labelledby="leve-title">
      <div className="section-inner">
        <SectionKicker number="05" label="Le leve" />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="leve-title">Sposta una leva.<br /><em>Guarda quale prezzo compare.</em></h2></div>
          <div><TruthBadge label="ANALOGIA RETORICA" /><p className="section-intro">Questo simulatore non predice. Tiene ferme le altre variabili e mostra la direzione di un compromesso.</p></div>
        </div>
        <div className="macro-presets" role="group" aria-label="Scenari preimpostati"><span>Scorciatoie:</span><button type="button" aria-pressed={isDefaultScenario} onClick={() => reset()}>Scenario di partenza</button><button type="button" aria-pressed={matches({ employmentGrowth: 0.005, netMigration: 250_000 })} onClick={() => preset("workers")}>Più persone al lavoro</button><button type="button" aria-pressed={matches({ productivityGrowthReal: 0.02 })} onClick={() => preset("output")}>Più valore per ora</button><button type="button" aria-pressed={matches({ retirementAge: 70 })} onClick={() => preset("later")}>Tre anni in più</button><button type="button" aria-pressed={matches({ fundedShare: 0.2 })} onClick={() => preset("funded")}>Più capitale, più transizione</button></div>
        <div className="macro-grid">
          <div className="panel panel--cream macro-controls">
            <div className="panel-heading"><span className="eyebrow">Leve visibili</span><button className="reset-button" type="button" onClick={reset}>reset</button></div>
            <Control id="macro-employment" label="Crescita annua dell'occupazione" value={macro.employmentGrowth} min={-0.02} max={0.02} step={0.001} display={percent(macro.employmentGrowth, 1)} onChange={(value) => update("employmentGrowth", value)} />
            <Control id="macro-migration" label="Migrazione netta nel bacino di lavoro" value={macro.netMigration} min={-200_000} max={400_000} step={10_000} display={`${numberIt(macro.netMigration / 1_000, 0)} mila/anno`} onChange={(value) => update("netMigration", value)} />
            <Control id="macro-productivity" label="Crescita reale della produttività" value={macro.productivityGrowthReal} min={-0.01} max={0.03} step={0.001} display={percent(macro.productivityGrowthReal, 1)} onChange={(value) => update("productivityGrowthReal", value)} />
            <Control id="macro-retirement" label="Età media di pensionamento simulata" value={macro.retirementAge} min={60} max={75} step={1} display={`${macro.retirementAge} anni`} onChange={(value) => update("retirementAge", value)} help="La sensibilità dell'occupazione è una scelta del modello." />
            <Control id="macro-rate" label="Aliquota contributiva" value={macro.contributionRate} min={0.2} max={0.45} step={0.005} display={percent(macro.contributionRate, 1)} onChange={(value) => update("contributionRate", value)} />
            <Control id="macro-benefit" label="Fattore della prestazione" value={macro.benefitFactor} min={0.7} max={1.2} step={0.01} display={numberIt(macro.benefitFactor, 2)} onChange={(value) => update("benefitFactor", value)} />
            <Control id="macro-indexation" label="Quota crescita trasferita alle prestazioni" value={macro.indexationPassThrough} min={0} max={1.25} step={0.05} display={numberIt(macro.indexationPassThrough, 2)} onChange={(value) => update("indexationPassThrough", value)} />
            <Control id="macro-funded" label="Quota finanziata" value={macro.fundedShare} min={0} max={0.4} step={0.01} display={percent(macro.fundedShare, 0)} onChange={(value) => update("fundedShare", value)} help="Devia il flusso corrente nel modello. Non sostituisce subito le prestazioni PAYG." />
          </div>
          <div className="macro-output">
            <MacroChart points={points} baseline={baseline} scenarioBands={{ low: lowScenario, central: points, high: highScenario }} />
            <div className="macro-checkpoints">{checkpoint.map((point) => <div className="macro-checkpoint" key={point.year}><span>{point.year}</span><strong>{numberIt(point.pressureIndex, 2)}</strong><small>pressione<br />base = 1,00</small><b>{percent(point.requiredPaygRate, 1)}</b><small>aliquota necessaria</small></div>)}</div>
            <div className="macro-output-grid">
              <div className="macro-output-card"><span>Pressione del sistema</span><strong>{numberIt(at2050?.pressureIndex ?? 0, 2)}</strong><small>2050, indice base 2025 = 1,00</small></div>
              <div className="macro-output-card"><span>Occupati per beneficiario</span><strong>{numberIt(at2050?.workersPerBeneficiary ?? 0, 2)}</strong><small>proxy nel 2050</small></div>
              <div className="macro-output-card"><span>Aliquota PAYG necessaria</span><strong>{percent(at2050?.requiredPaygRate ?? 0, 1)}</strong><small>monte salari modellato</small></div>
              <div className="macro-output-card"><span>Bilancio di flusso proxy</span><strong>{numberIt(at2050?.balanceProxy ?? 0, 2)}</strong><small>1,00 significa flussi uguali</small></div>
              <div className="macro-output-card"><span>Sostituzione media proxy</span><strong>{percent(at2050?.benefitReplacementProxy ?? 0, 1)}</strong><small>prestazione / salario</small></div>
              <div className="macro-output-card"><span>Flusso finanziato</span><strong>{euro(at2050?.fundedContributionFlow ?? 0, true)}</strong><small>{percent(macro.fundedShare, 0)} dei contributi</small></div>
            </div>
            <div className="macro-bands"><span className="eyebrow">Banda di scenario al 2050</span><div><span><i className="legend-swatch legend-swatch--band" /> Basso <strong>{numberIt(scenario2050.low?.pressureIndex ?? 0, 2)}</strong></span><span><i className="legend-swatch legend-swatch--red" /> Centrale <strong>{numberIt(scenario2050.central?.pressureIndex ?? 0, 2)}</strong></span><span><i className="legend-swatch legend-swatch--blue" /> Alto <strong>{numberIt(scenario2050.high?.pressureIndex ?? 0, 2)}</strong></span></div><small>La banda varia occupazione di ±0,5 punti, migrazione di ±50 mila persone, crescita dei beneficiari di ±0,2 punti e produttività di ±0,5 punti. Non è una distribuzione di probabilità.</small></div>
            <div className="macro-generational"><div className="macro-generational__heading"><span className="eyebrow">Confronto generazionale</span><span>stessa politica, anni di ritiro diversi</span></div>{cohortRows.map(({ age, retirementYear, point }) => <div className="macro-generational__row" key={age}><strong>{age} anni</strong><span>ritiro {retirementYear}</span><span>{numberIt(point.pressureIndex, 2)} pressione</span><span>{numberIt(point.workersPerBeneficiary, 2)} occupati / beneficiario</span><span>{percent(point.benefitReplacementProxy, 1)} sostituzione</span></div>)}</div>
            <div className="macro-readout"><TruthBadge label="STIMA DEL MODELLO" /><strong>Nel 2050, con queste leve, il flusso copre {percent(at2050?.balanceProxy ?? 0, 0)} della spesa modellata.</strong><p>Pressione, aliquota, sostituzione e bilancio sono proxy. Non sono la contabilità dello Stato.</p></div>
            <span className="sr-only" aria-live="polite" aria-atomic="true">Simulatore macro aggiornato: pressione {numberIt(announcedAt2050.pressureIndex, 2)}, aliquota PAYG necessaria {percent(announcedAt2050.requiredPaygRate, 1)}, sostituzione media {percent(announcedAt2050.benefitReplacementProxy, 1)} nel 2050.</span>
          </div>
        </div>
        <div className="transition-note"><span className="transition-note__mark">!</span><div><strong>La quota finanziata non cancella il PAYG domani mattina.</strong><p>Se una parte dei contributi correnti va in un conto finanziato, le promesse PAYG già maturate restano da pagare. Per la transizione serve un'altra fonte di finanziamento: più imposte, più debito, più spesa pubblica o un passaggio graduale.</p><SourceLine sourceIds={["oecd_pensions_outlook_2022_transition", "world_bank_transition_costs"]} sources={sources} /></div></div>
        <MethodDetails title="Formula e limiti del modello macro">
          <p><TruthBadge label="STIMA DEL MODELLO" /> La calibrazione usa una base occupazionale come proxy. Il riferimento ufficiale disponibile nel pack è {employmentContext ? `${numberIt(employmentContext.valueMillions, 3)} milioni nel ${employmentContext.year}` : "non disponibile"}, in {employmentContext?.unit ?? "unità non indicata"}, per il perimetro {employmentContext?.perimeter ?? "non indicato"}. Beneficiari e reddito pensionistico annualizzato hanno serie e definizioni diverse.</p>
          <code>E(t+1) = E(t) × (1 + crescita occupazione) + migrazione<br />pressione = (beneficiari / occupati) / rapporto di base<br />aliquota PAYG necessaria = uscite modellate / monte salari</code>
          <p>L'età di pensionamento modifica occupati e beneficiari con elasticità didattiche fissate dal modello. Non sono elasticità ufficiali. Gli scenari non hanno probabilità.</p>
          <SourceLine sourceIds={["ec_ageing_2024_italy", "inps_beneficiaries_2024", "inps_budget_2025"]} sources={sources} />
        </MethodDetails>
      </div>
    </section>
  );
};

const ComparisonScene = ({ international, sources }: { international: InternationalData; sources: Record<string, Source> }) => {
  const publicExpenditure = international.comparableMetrics.find((metric) => metric.id === "public_pension_expenditure_gdp") as Record<string, any>;
  const fundedAssets = international.comparableMetrics.find((metric) => metric.id === "pension_provider_assets_gdp") as Record<string, any>;
  const contributionRates = international.comparableMetrics.find((metric) => metric.id === "mandatory_effective_contribution_rate") as Record<string, any>;
  const dependency = international.comparableMetrics.find((metric) => metric.id === "old_age_dependency_ratio") as Record<string, any>;
  const pillarRows = international.pillarMatrix.rows;
  const countryOrder = ["IT", "CH", "SE", "NL"];
  const countryNames: Record<string, string> = { IT: "Italia", CH: "Svizzera", SE: "Svezia", NL: "Paesi Bassi" };
  return (
    <section className="scene section section--ink" id="confronto" aria-labelledby="confronto-title">
      <div className="section-inner">
        <SectionKicker number="06" label="Il confronto" />
        <div className="section-heading section-heading--split section-heading--light">
          <div><h2 id="confronto-title">Tre paesi.<br /><em>Tre modi di distribuire il rischio.</em></h2></div>
          <div><TruthBadge label="ANALOGIA RETORICA" /><p className="section-intro">Non c'è un paese con il pulsante "risolto". Ci sono pilastri diversi, regole diverse e rischi spostati in posti diversi.</p></div>
        </div>
        <div className="comparison-charts">
          <InternationalBarChart metric={publicExpenditure} />
          <InternationalBarChart metric={fundedAssets} />
          <InternationalBarChart metric={contributionRates} />
          <InternationalBarChart metric={dependency} />
        </div>
        <div className="pillar-matrix-wrap">
          <div className="matrix-heading"><span className="eyebrow eyebrow--light">Architetture, non classifiche</span><h3>Chi paga cosa</h3><p>Il primo pilastro svizzero è PAYG. Gli asset enormi appartengono soprattutto al secondo pilastro finanziato.</p></div>
          <p className="scroll-hint" id="pillar-scroll-hint">Su schermi stretti, scorri orizzontalmente per confrontare tutti i paesi.</p>
          <div className="pillar-matrix" role="table" aria-label="Confronto dei pilastri pensionistici" aria-describedby="pillar-scroll-hint" tabIndex={0}>
            <div className="pillar-matrix__row pillar-matrix__row--head" role="row"><div role="columnheader">Pilastro</div>{countryOrder.map((code) => <div role="columnheader" key={code}>{countryNames[code]}</div>)}</div>
            {pillarRows.slice(0, 3).map((row) => <div className="pillar-matrix__row" role="row" key={String(row.id)}><div role="rowheader"><strong>{pillarLabels[String(row.id)] ?? String(row.label)}</strong></div>{countryOrder.map((code) => { const value = row.values?.[code]; const funding = String(value?.funding ?? ""); return <div role="cell" key={code}><span className={`funding-pill funding-pill--${funding.includes("funded") ? "funded" : "payg"}`}>{translateFunding(funding)}</span><small>{translateMandate(String(value?.mandate ?? ""))}</small><SourceChip id={String(value?.sourceIds?.[0] ?? "")} sources={sources} /></div>; })}</div>)}
          </div>
        </div>
        <div className="country-cards">{["CH", "SE", "NL"].map((code) => { const country = international.countries[code]; return <article className="country-card" key={code}><div className="country-card__code">{code}</div><h3>{countryNamesItalian[code]}</h3><p>{countryDescriptionsItalian[code]}</p><div className="country-card__line"><strong>{code === "CH" ? "Primo pilastro a ripartizione" : code === "SE" ? "Bilanciamento automatico" : "AOW separata dal pilastro finanziato"}</strong><span>{code === "CH" ? "Le contribuzioni correnti vanno ai pensionati correnti." : code === "SE" ? "L'indice di equilibrio riduce l'indicizzazione se passività e attività divergono." : "La legge del 2023 porta i fondi verso contributi definiti entro il 2028."}</span></div><SourceLine sourceIds={country.sourceIds?.slice(0, 2) ?? []} sources={sources} /></article>; })}</div>
        <div className="transition-note transition-note--dark"><span className="transition-note__mark">+</span><div><strong>Il caso svizzero corregge un equivoco comune.</strong><p>Un sistema può avere grandi asset finanziati e mantenere un primo pilastro pubblico a ripartizione. Passare da PAYG a finanziato può aumentare il capitale nel tempo, ma nel passaggio crea un buco da finanziare. Non è magia contabile.</p><SourceLine sourceIds={["bsv_ch_oasi_payg", "bsv_ch_occupational_funding", "oecd_pensions_outlook_2022_transition"]} sources={sources} /></div></div>
        <div className="final-checkpoint"><div><SectionKicker number="07" label="La chiusura" /><h2>Nessuna data magica.<br /><em>Solo pressione misurabile.</em></h2></div><div><p>Puoi cambiare il modello. Non puoi farlo diventare una profezia. Il punto della pensione è distribuire un rischio lungo decenni, non indovinare un giorno sul calendario.</p><a className="button button--cream" href="#fonti">Vedi fonti e metodo <span aria-hidden="true">↓</span></a></div></div>
      </div>
    </section>
  );
};

const SourcesSection = ({ sources }: { sources: Record<string, Source> }) => (
  <section className="scene sources-section" id="fonti" aria-labelledby="fonti-title">
    <div className="section-inner">
      <SectionKicker number="∞" label="Fonti e metodo" />
      <div className="sources-heading"><h2 id="fonti-title">Il conto è aperto.</h2><p>Ogni numero qui sopra rimanda a una fonte. Gli anni e i perimetri restano visibili perché il contesto fa parte del dato.</p></div>
      <div className="sources-grid">{Object.values(sources).map((source) => <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={source.id}><span className="source-card__top">{source.publisher} · {getYear(source)}</span><strong>{sourceCardTitle(source)}</strong><span>{sourceCardNote(source)}</span><span className="source-card__arrow" aria-hidden="true">↗</span></a>)}</div>
      <div className="methodology-grid"><div><span className="eyebrow">Vocabolario</span><h3>Come leggere le etichette</h3><p><strong>FATTO</strong> è osservato. <strong>PROIEZIONE UFFICIALE</strong> viene da un modello istituzionale. <strong>STIMA DEL MODELLO</strong> è calcolata qui. <strong>SCENARIO</strong> è una scelta controllabile. <strong>ANALOGIA RETORICA</strong> è linguaggio, non statistica.</p></div><div><span className="eyebrow">Perimetri</span><h3>Non sommare mele e persone</h3><p>Prestazioni, pensionati unici, beneficiari di categoria, conti INPS, ESSPROS e Ageing Report hanno definizioni diverse. Un valore non diventa falso perché un'altra fonte misura un perimetro diverso.</p></div><div><span className="eyebrow">Privacy</span><h3>Nessun dato esce dal browser</h3><p>Età, stipendio e leve restano nella sessione locale. Il progetto non raccoglie nomi, email, codici fiscali o eventi analitici.</p></div></div>
      <p className="footer-note">Progetto editoriale locale, versione 0.1. Dati caricati da <code>public/data/italy.json</code> e <code>public/data/international.json</code>. Il modello non calcola una data di collasso.</p>
    </div>
  </section>
);

export default function App() {
  const [italy, setItaly] = useState<ItalyData | null>(null);
  const [international, setInternational] = useState<InternationalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState("alert");
  const [personal, setPersonal] = useState<PersonalInputs>(defaultPersonal);
  const [macro, setMacro] = useState<MacroInputs>({ ...DEFAULT_MACRO_INPUTS });
  const [reducedMotion, setReducedMotion] = useState(false);

  const loadData = () => {
    setError(null);
    Promise.all([fetch("/data/italy.json"), fetch("/data/international.json")])
      .then(async ([italyResponse, internationalResponse]) => {
        if (!italyResponse.ok || !internationalResponse.ok) throw new Error("I pack dati non sono disponibili.");
        return Promise.all([italyResponse.json() as Promise<ItalyData>, internationalResponse.json() as Promise<InternationalData>]);
      })
      .then(([italyData, internationalData]) => { setItaly(italyData); setInternational(internationalData); })
      .catch(() => setError("I pack pubblici non si sono caricati. Controlla che il server locale stia servendo /data e riprova."));
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    updateMotion();
    media.addEventListener?.("change", updateMotion);
    return () => media.removeEventListener?.("change", updateMotion);
  }, []);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    navItems.forEach(([id]) => {
      const element = document.getElementById(id);
      if (!element) return;
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveId(id); }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, [italy]);

  const sources = useMemo(() => italy && international ? sourceMap(italy, international) : {}, [italy, international]);
  const personalResult = useMemo(() => calculatePersonal(personal), [personal]);
  const announcedPersonalResult = useDebouncedValue(personalResult);
  const macroPoints = useMemo(() => calculateMacro(macro), [macro]);
  const announcedMacro = useDebouncedValue(macro);
  const announcedMacroPoints = useMemo(() => calculateMacro(announcedMacro), [announcedMacro]);
  const baselinePoints = useMemo(() => calculateMacro(DEFAULT_MACRO_INPUTS), []);
  const pressurePoint = useMemo(() => interpolateMacroPoint(macroPoints, personalResult.retirementYear), [macroPoints, personalResult.retirementYear]);
  const employmentContext = useMemo(() => italy ? deriveEmploymentContext(italy) : null, [italy]);

  if (!italy || !international) return <LoadingShell error={error} retry={loadData} />;
  return (
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
  );
}
