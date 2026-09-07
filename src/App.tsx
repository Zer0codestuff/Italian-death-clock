import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useLanguage } from "./lib/language";
import { getStoryCopy } from "./lib/statementCopy";
import {
  countdownToPeakYear,
  EARLIEST_CONTRIBUTION_AGE,
  estimatePensionPayment,
  ILLUSTRATIVE_INFLATION_RATE,
  MINIMUM_ORDINARY_CONTRIBUTION_YEARS,
  type ReplacementProjection,
} from "./lib/storyMath";
import type { ItalyData, Source } from "./lib/types";
import "./styles.css";

type SpendingPoint = {
  year: number;
  grossPublicPensionExpenditure: number;
};

const pad = (value: number, length = 2): string => String(value).padStart(length, "0");
const useCountdown = (peakYear: number) => {
  const [countdown, setCountdown] = useState(() => countdownToPeakYear(new Date(), peakYear));
  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(countdownToPeakYear(new Date(), peakYear)), 1_000);
    return () => window.clearInterval(interval);
  }, [peakYear]);
  return countdown;
};

const useScrollChoreography = (ready: boolean) => {
  useEffect(() => {
    if (!ready) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = Array.from(document.querySelectorAll<HTMLElement>(
      ".hero__statement, .hero-art, .money-art, .levers-art, .scene-heading, .payg-visual, .demography-visual, .share-shift, .spending-visual, .money-compare, .lever-list li, .closing h2, .closing__body",
    ));
    targets.forEach((target) => target.classList.add("motion-target"));
    let frame = 0;
    const update = () => {
      frame = 0;
      targets.forEach((target) => {
        // Layout offsets stay stable while transforms animate the artwork.
        let top = 0;
        const track = target.closest<HTMLElement>(".cinema-track");
        let node: HTMLElement | null = track ?? target;
        while (node) {
          top += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        const viewportTop = top - window.scrollY;
        const rawProgress = target.classList.contains("hero-art")
          ? window.scrollY / (window.innerHeight * .7)
          : (window.innerHeight * .85 - viewportTop) / (track ? track.offsetHeight * 1.05 : window.innerHeight * .85);
        const progress = motion.matches ? 1 : Math.min(1, Math.max(0, rawProgress));
        target.style.setProperty("--scene-progress", String(progress));
        target.classList.toggle("is-visible", motion.matches || viewportTop < window.innerHeight * .94);
      });
      const travel = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--page-progress", String(travel > 0 ? window.scrollY / travel : 0));
    };
    const requestUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    motion.addEventListener("change", requestUpdate);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      motion.removeEventListener("change", requestUpdate);
      targets.forEach((target) => {
        target.classList.remove("motion-target", "is-visible");
        target.style.removeProperty("--scene-progress");
      });
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ready]);
};

const SourceLink = ({ source, compact = false }: { source?: Source; compact?: boolean }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  if (!source) return null;
  const date = source.observedYear ?? source.updatedDate?.slice(0, 4) ?? source.publicationDate?.slice(0, 4);
  return (
    <a className={compact ? "source-link source-link--compact" : "source-link"} href={source.url} target="_blank" rel="noreferrer" aria-label={`${copy.common.openSource}: ${source.title}, ${copy.common.external}`}>
      <span>{source.publisher}{date ? ` · ${date}` : ""}</span><span aria-hidden="true">↗</span>
    </a>
  );
};

const TruthLine = ({ kind, source }: { kind: "observed" | "official" | "scenario"; source?: Source }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return <div className="truth-line"><span className={`truth-label truth-label--${kind}`}>{copy.common[kind]}</span>{source ? <SourceLink source={source} compact /> : null}</div>;
};

const EvidenceSource = ({ index, kind }: { index: number; kind?: "observed" | "official" }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const source = copy.closing.sourceLinks[index];
  return <div className="truth-line">{kind ? <span className={`truth-label truth-label--${kind}`}>{copy.common[kind]}</span> : null}<a className="source-link" href={source.url} target="_blank" rel="noreferrer" aria-label={`${copy.common.openSource}: ${source.label}, ${copy.common.external}`}><span>{source.label}, {source.year}</span><span aria-hidden="true">↗</span></a></div>;
};

const SectionHeading = ({ kicker, children, body }: { kicker: string; children: ReactNode; body: string }) => (
  <header className="scene-heading reveal-stack"><span className="scene-kicker">{kicker}</span><h2>{children}</h2><p>{body}</p></header>
);

const DecorativeArtwork = ({ className, src, width, height, priority = false }: { className: string; src: string; width: number; height: number; priority?: boolean }) => (
  <div className={`editorial-art ${className}`} aria-hidden="true">
    <img src={src} alt="" width={width} height={height} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" />
  </div>
);

const LanguageSwitch = () => {
  const { language, setLanguage } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <div className="language-switch" role="group" aria-label={copy.common.language}>
      <button type="button" onClick={() => setLanguage("it")} aria-pressed={language === "it"}>IT</button>
      <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
    </div>
  );
};

const SiteChrome = () => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <><a className="skip-link" href="#story">{copy.common.skip}</a><div className="page-progress" aria-hidden="true"><span /></div><header className="site-chrome"><a className="wordmark" href="#top" aria-label={copy.common.brand}><span aria-hidden="true">●</span>{copy.common.brand}</a><LanguageSwitch /></header></>
  );
};

const Hero = ({ source, peakYear }: { source?: Source; peakYear: number }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const countdown = useCountdown(peakYear);
  const units = [
    { value: pad(countdown.days, 4), label: copy.common.days },
    { value: pad(countdown.hours), label: copy.common.hours },
    { value: pad(countdown.minutes), label: copy.common.minutes },
    { value: pad(countdown.seconds), label: copy.common.seconds },
  ];
  return (
    <section className="hero" id="top" data-scroll-scene>
      <div className="hero__stage">
        <DecorativeArtwork className="hero-art" src="/assets/hero-peak.png" width={1536} height={1024} priority />
        <div className="hero__inner">
          <div className="hero__statement"><h1>{copy.hero.titleAccent}</h1><div className="hero__explanation"><p className="hero__qualifier">{copy.hero.title}</p><p>{copy.hero.body}</p></div></div>
          <div className="hero__evidence"><div className="hero__metric" aria-label={`${copy.hero.metric}, ${copy.hero.metricLabel}`}><strong>{copy.hero.metric}</strong><span>{copy.hero.metricLabel}</span></div><TruthLine kind="official" source={source} /></div>
          <div className="hero__clock"><span className="hero__eyebrow">{copy.hero.eyebrow}</span><div className="countdown" aria-hidden="true">{units.map((unit, index) => <div className="countdown__unit" key={unit.label}><div className="countdown__value">{index > 0 ? <span className="countdown__separator">:</span> : null}<span>{unit.value}</span></div><span className="countdown__label">{unit.label}</span></div>)}</div><p className="sr-only">{copy.hero.screenReaderCountdown}</p></div><p className="hero__timer-note">{copy.hero.timerNote}</p>
          <a className="scroll-cue" href="#story"><span>{copy.common.scroll}</span><i aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
};

const PaygScene = ({ source }: { source?: Source }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <section className="scroll-scene scroll-scene--payg" id="story" data-scroll-scene><div className="scene-sticky scene-shell">
      <SectionHeading kicker={copy.payg.kicker} body={copy.payg.body}>{copy.payg.title}<br /><em>{copy.payg.accent}</em></SectionHeading>
      <div className="payg-flow"><span>{copy.payg.flow[0]}</span><b aria-hidden="true">+</b><span>{copy.payg.flow[1]}</span><b aria-hidden="true">→</b><strong>{copy.payg.flow[2]}</strong></div>
      <div className="cinema-track"><div className="payg-visual"><img src="/assets/payg-flow.png" alt={copy.payg.alt} width="1200" height="800" loading="lazy" decoding="async" /><div className="payg-fact"><strong>{copy.payg.fact}</strong><span>{copy.payg.factLabel}</span><small>{copy.payg.note}</small></div></div></div>
      <div className="evidence-group"><TruthLine kind="observed" source={source} /><EvidenceSource index={3} kind="observed" /></div>
    </div></section>
  );
};

const DemographyScene = ({ source, shares }: { source?: Source; shares: Array<{ year: number; age15to64: number; age65Plus: number }> }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const format = useMemo(() => new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [language]);
  const current = shares.find((row) => row.year === 2024);
  const future = shares.find((row) => row.year === 2050);
  const value = (number?: number) => `${format.format(number ?? 0)}%`;
  return (
    <section className="scroll-scene scroll-scene--demography" data-scroll-scene><div className="scene-sticky scene-shell">
      <SectionHeading kicker={copy.demography.kicker} body={copy.demography.body}>{copy.demography.title}<br /><em>{copy.demography.accent}</em></SectionHeading>
      <div className="cinema-track"><div className="demography-visual"><img src="/assets/demographic-load.png" alt={copy.demography.alt} width="1200" height="675" loading="lazy" decoding="async" />
        <div className="share-shift" aria-label={`${copy.demography.now} ${copy.demography.working} ${value(current?.age15to64)}, ${copy.demography.future} ${value(future?.age15to64)}. ${copy.demography.now} ${copy.demography.older} ${value(current?.age65Plus)}, ${copy.demography.future} ${value(future?.age65Plus)}.`}>
          <div className="share-row"><span>{copy.demography.working}</span><div className="share-values"><strong>{value(current?.age15to64)}</strong><i aria-hidden="true">→</i><strong>{value(future?.age15to64)}</strong></div><div className="share-bar" aria-hidden="true"><span style={{ "--from": current?.age15to64 ?? 0, "--to": future?.age15to64 ?? 0 } as CSSProperties} /></div></div>
          <div className="share-row share-row--red"><span>{copy.demography.older}</span><div className="share-values"><strong>{value(current?.age65Plus)}</strong><i aria-hidden="true">→</i><strong>{value(future?.age65Plus)}</strong></div><div className="share-bar" aria-hidden="true"><span style={{ "--from": current?.age65Plus ?? 0, "--to": future?.age65Plus ?? 0 } as CSSProperties} /></div></div>
          <div className="share-years"><span>{copy.demography.now}<small>{copy.common.observed}</small></span><span>{copy.demography.future}<small>{copy.common.official}</small></span></div>
        </div>
      </div></div><div className="evidence-group"><TruthLine kind="official" source={source} /><EvidenceSource index={1} kind="observed" /></div>
    </div></section>
  );
};

const SpendingPath = ({ points, peak, label, language }: { points: SpendingPoint[]; peak: SpendingPoint; label: string; language: "it" | "en" }) => {
  const ordered = [...points, peak].filter((point, index, rows) => rows.findIndex((row) => row.year === point.year) === index).sort((a, b) => a.year - b.year);
  const x = (year: number) => 70 + (year - 2022) / (2070 - 2022) * 860;
  const y = (value: number) => 400 - (value - 13) / 5 * 310;
  const path = ordered.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.year)} ${y(point.grossPublicPensionExpenditure)}`).join(" ");
  const highlights = ordered.filter((point) => [2022, peak.year, 2070].includes(point.year));
  const format = new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <svg className="spending-path" viewBox="0 0 1000 480" role="img" aria-label={label}><title>{label}</title><line className="spending-path__baseline" x1="70" x2="930" y1="400" y2="400" /><path className="spending-path__ghost" d={path} pathLength="1" /><path className="spending-path__line" d={path} pathLength="1" />
      {highlights.map((point) => <g className={`spending-point${point.year === peak.year ? " spending-point--peak" : ""}`} key={point.year} transform={`translate(${x(point.year)} ${y(point.grossPublicPensionExpenditure)})`}><circle r="9" /><text className="spending-point__value" textAnchor={point.year === 2022 ? "start" : point.year === 2070 ? "end" : "middle"} x={point.year === 2022 ? 16 : point.year === 2070 ? -16 : 0} y="-22">{format.format(point.grossPublicPensionExpenditure)}%</text><text className="spending-point__year" textAnchor={point.year === 2022 ? "start" : point.year === 2070 ? "end" : "middle"} x={point.year === 2022 ? 16 : point.year === 2070 ? -16 : 0} y="30">{point.year}</text></g>)}
    </svg>
  );
};

const SpendingScene = ({ source, points, peak }: { source?: Source; points: SpendingPoint[]; peak: SpendingPoint }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <section className="scroll-scene scroll-scene--spending" data-scroll-scene><div className="scene-sticky scene-shell">
      <SectionHeading kicker={copy.spending.kicker} body={copy.spending.body}>{copy.spending.title}<br /><em>{copy.spending.accent}</em></SectionHeading>
      <div className="cinema-track"><div className="spending-visual"><DecorativeArtwork className="spending-art" src="/assets/spending-peak.png" width={1800} height={708} /><SpendingPath peak={peak} points={points} label={copy.spending.chartAlt} language={language} /></div></div><div className="spending-checkpoints"><span>{copy.spending.y2022}<strong>{copy.spending.v2022}</strong></span><span>{copy.spending.y2036}<strong>{copy.spending.v2036}</strong></span><span>{copy.spending.y2070}<strong>{copy.spending.v2070}</strong></span><small>{copy.spending.unit}</small></div><TruthLine kind="official" source={source} />
    </div></section>
  );
};

const PersonalScene = ({
  source,
  requirementSource,
  projections,
}: {
  source?: Source;
  requirementSource?: Source;
  projections: ReplacementProjection[];
}) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const [age, setAge] = useState(32);
  const [contributionYearsToday, setContributionYearsToday] = useState(10);
  const [grossAnnualPay, setGrossAnnualPay] = useState(32_000);
  const [inflationPercent, setInflationPercent] = useState(ILLUSTRATIVE_INFLATION_RATE * 100);
  const maximumContributionYearsToday = Math.max(0, age - EARLIEST_CONTRIBUTION_AGE);
  const result = useMemo(() => estimatePensionPayment({
    age,
    grossAnnualPay,
    contributionYearsToday,
    inflationRate: inflationPercent / 100,
    projections,
  }), [age, contributionYearsToday, grossAnnualPay, inflationPercent, projections]);
  const currency = useMemo(() => new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }), [language]);
  const number = useMemo(() => new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 }), [language]);
  const handleAgeChange = (nextAge: number) => {
    setAge(nextAge);
    setContributionYearsToday((current) => Math.min(
      current,
      Math.max(0, nextAge - EARLIEST_CONTRIBUTION_AGE),
    ));
  };
  const equivalence = copy.personal.equivalence({
    futureAmount: currency.format(result.nominalPayment),
    currentAmount: currency.format(result.realPayment),
    retirementYear: result.retirementYear,
    years: result.years,
    inflationPercent: number.format(inflationPercent),
  });
  const eligibility = copy.personal.eligibility({
    projectedYears: number.format(result.projectedContributionYears),
    minimumYears: MINIMUM_ORDINARY_CONTRIBUTION_YEARS,
  });
  return (
    <section className="scroll-scene scroll-scene--personal" data-scroll-scene><div className="scene-sticky scene-shell personal-layout">
      <SectionHeading kicker={copy.personal.kicker} body={copy.personal.body}>{copy.personal.title}</SectionHeading>
      <div className="personal-controls">
        <label htmlFor="story-age"><span>{copy.personal.age}</span><output htmlFor="story-age">{age}</output><input id="story-age" type="range" min="20" max="55" step="1" value={age} onChange={(event) => handleAgeChange(Number(event.target.value))} /></label>
        <label htmlFor="story-contributions"><span>{copy.personal.contributions}</span><output htmlFor="story-contributions">{contributionYearsToday} {copy.personal.years}</output><input id="story-contributions" type="range" min="0" max={maximumContributionYearsToday} step="1" value={contributionYearsToday} aria-valuetext={`${contributionYearsToday} ${copy.personal.years}`} onChange={(event) => setContributionYearsToday(Number(event.target.value))} /></label>
        <label htmlFor="story-salary"><span>{copy.personal.salary}</span><output htmlFor="story-salary">{currency.format(grossAnnualPay)}</output><input id="story-salary" type="range" min="15000" max="100000" step="1000" value={grossAnnualPay} aria-valuetext={currency.format(grossAnnualPay)} onChange={(event) => setGrossAnnualPay(Number(event.target.value))} /></label>
        <label htmlFor="story-inflation"><span>{copy.personal.inflation}</span><output htmlFor="story-inflation">{number.format(inflationPercent)}%</output><input id="story-inflation" type="range" min="0" max="5" step="0.1" value={inflationPercent} aria-valuetext={`${number.format(inflationPercent)}%`} onChange={(event) => setInflationPercent(Number(event.target.value))} /></label>
      </div>
      <div className="personal-stage"><DecorativeArtwork className="money-art" src="/assets/purchasing-power.png" width={1672} height={941} /><div className="personal-context"><span>{copy.personal.retirement}<strong>{result.retirementYear}</strong></span><span>{copy.personal.contributionsAtRetirement}<strong>{number.format(result.projectedContributionYears)} {copy.personal.years}</strong></span><span>{copy.personal.replacement}<strong>{number.format(result.estimatedReplacementRatePercent)}%</strong></span></div>
        {result.meetsOrdinaryContributionRequirement ? <>
          <div className="money-compare" aria-live="polite" aria-atomic="true"><div className="money-column money-column--nominal"><span>{copy.personal.nominalTitle}</span><strong>{currency.format(result.nominalPayment)}</strong><small>{copy.personal.nominalNote(result.retirementYear)}</small></div><div className="money-arrow" aria-hidden="true">→</div><div className="money-column money-column--real"><span>{copy.personal.realTitle}</span><strong>{currency.format(result.realPayment)}</strong><small>{copy.personal.realNote}</small></div></div>
          <p className="money-explanation">{equivalence}</p>
        </> : <div className="eligibility-message" role="status" aria-live="polite"><strong>{MINIMUM_ORDINARY_CONTRIBUTION_YEARS}</strong><p>{eligibility}</p></div>}
      </div><div className="assumption-line"><TruthLine kind="scenario" /><p>{copy.personal.assumptions}</p><div className="personal-sources"><SourceLink source={source} compact /><SourceLink source={requirementSource} compact /></div></div>
    </div></section>
  );
};

const LeversScene = ({ source }: { source?: Source }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <section className="scroll-scene scroll-scene--levers" data-scroll-scene><div className="scene-sticky scene-shell levers-layout"><SectionHeading kicker={copy.levers.kicker} body={copy.levers.intro}>{copy.levers.title}<br /><em>{copy.levers.accent}</em></SectionHeading><div className="cinema-track cinema-track--levers"><DecorativeArtwork className="levers-art" src="/assets/policy-levers.png" width={1800} height={670} /></div><ol className="lever-list">{copy.levers.items.map((item) => <li key={item.number}><span>{item.number}</span><h3>{item.title}</h3><div><p>{item.body}</p>{item.number === "02" ? <EvidenceSource index={0} kind="official" /> : item.number === "03" ? <EvidenceSource index={4} kind="observed" /> : null}</div></li>)}</ol><p className="lever-note">{copy.levers.note}</p><EvidenceSource index={6} /><SourceLink source={source} compact /></div></section>
  );
};

const Closing = ({ sources }: { sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);

  return (
    <footer className="closing" data-scroll-scene><div className="scene-shell closing__inner"><h2>{copy.closing.title}<br /><em>{copy.closing.accent}</em></h2><p className="closing__body">{copy.closing.body}</p><EvidenceSource index={3} kind="observed" /><details className="sources-drawer" id="sources"><summary>{copy.common.method}<span aria-hidden="true">+</span></summary><div className="sources-drawer__body"><div><h3>{copy.closing.sourceList}</h3><p>{copy.closing.sourcesIntro}</p></div><ul>{copy.closing.sourceLinks.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer"><span>{source.label}, {source.year}</span><span aria-hidden="true">↗</span></a></li>)}<li><SourceLink source={sources.inps_retirement_age} /></li><li><a href="https://www.ecb.europa.eu/mopo/strategy/strategy-review/ecb.strategyreview202506_strategy_statement.en.html" target="_blank" rel="noreferrer"><span>{language === "it" ? "Banca centrale europea, obiettivo di inflazione del 2% nel medio termine, 2025" : "European Central Bank, 2% medium-term inflation target, 2025"}</span><span aria-hidden="true">↗</span></a></li></ul><p className="privacy-note">{copy.closing.privacy}</p></div></details><div className="closing__mark"><span aria-hidden="true">●</span>{copy.common.brand}<b>2026</b></div></div></footer>
  );
};

const LoadingState = ({ error, retry }: { error: boolean; retry: () => void }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return <main className="loading-state"><span aria-hidden="true">●</span><p>{error ? copy.common.failed : copy.common.loading}</p>{error ? <button type="button" onClick={retry}>{copy.common.retry}</button> : null}</main>;
};

const App = () => {
  const [italy, setItaly] = useState<ItalyData | null>(null);
  const [error, setError] = useState(false);
  const [request, setRequest] = useState(0);
  const active = useRef(true);
  useScrollChoreography(Boolean(italy));
  const retry = useCallback(() => { setError(false); setRequest((value) => value + 1); }, []);
  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    fetch("/data/italy.json", { signal: controller.signal }).then((response) => { if (!response.ok) throw new Error(`Data request failed: ${response.status}`); return response.json() as Promise<ItalyData>; }).then((data) => { if (active.current) setItaly(data); }).catch((reason: unknown) => { if (active.current && !(reason instanceof DOMException && reason.name === "AbortError")) setError(true); });
    return () => { active.current = false; controller.abort(); };
  }, [request]);
  const sources = useMemo(() => italy ? Object.fromEntries(italy.sourceCatalog.map((source) => [source.id, source])) : {}, [italy]);
  if (!italy) return <><SiteChrome /><LoadingState error={error} retry={retry} /></>;
  const shares = italy.demography.istatAgeShares as Array<{ year: number; age15to64: number; age65Plus: number }>;
  const spending = italy.spendingProjection.baselineByYear as SpendingPoint[];
  const projections = italy.spendingProjection.benefitAndReplacementProfile as ReplacementProjection[];
  return <div className="app"><SiteChrome /><main><Hero peakYear={italy.spendingProjection.officialPeak.year} source={sources.ec_ageing_2024_italy} /><PaygScene source={sources.ec_ageing_2024_italy} /><DemographyScene source={sources.istat_population_2025} shares={shares} /><SpendingScene peak={italy.spendingProjection.officialPeak} source={sources.ec_ageing_2024_italy} points={spending} /><PersonalScene source={sources.ec_ageing_2024_italy} requirementSource={sources.inps_retirement_age} projections={projections} /><LeversScene source={sources.ec_ageing_2024_italy} /></main><Closing sources={sources} /></div>;
};

export default App;
