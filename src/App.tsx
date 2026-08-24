import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useLanguage } from "./lib/language";
import { getStoryCopy } from "./lib/statementCopy";
import {
  countdownToPeakYear,
  projectedPaymentExample,
  type ReplacementProjection,
} from "./lib/storyMath";
import type { ItalyData, Source } from "./lib/types";
import "./styles.css";

type SpendingPoint = {
  year: number;
  grossPublicPensionExpenditure: number;
};

const PEAK_YEAR = 2036;
const PEAK_VALUE = 17.3;
const pad = (value: number, length = 2): string => String(value).padStart(length, "0");
const clampProgress = (value: number): number => Math.min(1, Math.max(0, value));

const useCountdown = () => {
  const [countdown, setCountdown] = useState(() => countdownToPeakYear(new Date(), PEAK_YEAR));
  useEffect(() => {
    const interval = window.setInterval(() => setCountdown(countdownToPeakYear(new Date(), PEAK_YEAR)), 1_000);
    return () => window.clearInterval(interval);
  }, []);
  return countdown;
};

const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
};

const useScrollChoreography = (reducedMotion: boolean, ready: boolean) => {
  useEffect(() => {
    if (!ready) return;
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-scene]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - viewport;
      const pageProgress = documentHeight > 0 ? window.scrollY / documentHeight : 0;
      document.documentElement.style.setProperty("--page-progress", String(pageProgress));
      scenes.forEach((scene) => {
        if (reducedMotion) {
          scene.style.setProperty("--scene-progress", "1");
          scene.classList.add("is-visible");
          return;
        }
        const rect = scene.getBoundingClientRect();
        const stickyTravel = Math.max(1, rect.height - viewport);
        const regularTravel = viewport * 0.82 + Math.min(rect.height, viewport) * 0.65;
        const progress = scene.classList.contains("hero")
          ? clampProgress(-rect.top / Math.max(rect.height, viewport))
          : scene.classList.contains("scroll-scene")
            ? clampProgress(-rect.top / stickyTravel)
            : clampProgress((viewport * 0.82 - rect.top) / regularTravel);
        scene.style.setProperty("--scene-progress", String(progress));
        scene.classList.toggle("is-visible", rect.top < viewport * 0.82 && rect.bottom > viewport * 0.18);
      });
    };
    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ready, reducedMotion]);
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

const Hero = ({ source }: { source?: Source }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const countdown = useCountdown();
  const units = [
    { value: pad(countdown.days, 4), label: copy.common.days },
    { value: pad(countdown.hours), label: copy.common.hours },
    { value: pad(countdown.minutes), label: copy.common.minutes },
    { value: pad(countdown.seconds), label: copy.common.seconds },
  ];
  return (
    <section className="hero" id="top" data-scroll-scene>
      <DecorativeArtwork className="hero-art" src="/assets/hero-peak.png" width={1536} height={1024} priority />
      <div className="hero__inner">
      <span className="hero__eyebrow">{copy.hero.eyebrow}</span>
      <div className="countdown" aria-hidden="true">{units.map((unit, index) => <div className="countdown__unit" key={unit.label}><div className="countdown__value">{index > 0 ? <span className="countdown__separator">:</span> : null}<span>{unit.value}</span></div><span className="countdown__label">{unit.label}</span></div>)}</div>
      <p className="sr-only">{copy.hero.screenReaderCountdown}</p>
      <div className="hero__statement"><h1>{copy.hero.title}<br /><em>{copy.hero.titleAccent}</em></h1><div className="hero__explanation"><p>{copy.hero.body}</p><TruthLine kind="official" source={source} /></div></div>
      <div className="hero__metric" aria-label={`${copy.hero.metric}, ${copy.hero.metricLabel}`}><strong>{copy.hero.metric}</strong><span>{copy.hero.metricLabel}</span></div>
      <a className="scroll-cue" href="#story"><span>{copy.common.scroll}</span><i aria-hidden="true" /></a>
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
      <div className="payg-visual"><img src="/assets/payg-flow.png" alt={copy.payg.alt} width="1200" height="800" loading="lazy" decoding="async" /><div className="payg-fact"><strong>{copy.payg.fact}</strong><span>{copy.payg.factLabel}</span><small>{copy.payg.note}</small></div></div>
      <TruthLine kind="observed" source={source} />
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
      <div className="demography-visual"><img src="/assets/demographic-load.png" alt={copy.demography.alt} width="1200" height="675" loading="lazy" decoding="async" />
        <div className="share-shift" aria-label={`${copy.demography.now} ${copy.demography.working} ${value(current?.age15to64)}, ${copy.demography.future} ${value(future?.age15to64)}. ${copy.demography.now} ${copy.demography.older} ${value(current?.age65Plus)}, ${copy.demography.future} ${value(future?.age65Plus)}.`}>
          <div className="share-row"><span>{copy.demography.working}</span><div className="share-values"><strong>{value(current?.age15to64)}</strong><i aria-hidden="true">→</i><strong>{value(future?.age15to64)}</strong></div><div className="share-bar" aria-hidden="true"><span style={{ "--from": current?.age15to64 ?? 0, "--to": future?.age15to64 ?? 0 } as CSSProperties} /></div></div>
          <div className="share-row share-row--red"><span>{copy.demography.older}</span><div className="share-values"><strong>{value(current?.age65Plus)}</strong><i aria-hidden="true">→</i><strong>{value(future?.age65Plus)}</strong></div><div className="share-bar" aria-hidden="true"><span style={{ "--from": current?.age65Plus ?? 0, "--to": future?.age65Plus ?? 0 } as CSSProperties} /></div></div>
          <div className="share-years" aria-hidden="true"><span>{copy.demography.now}</span><span>{copy.demography.future}</span></div>
        </div>
      </div><TruthLine kind="official" source={source} />
    </div></section>
  );
};

const SpendingPath = ({ points, label, language }: { points: SpendingPoint[]; label: string; language: "it" | "en" }) => {
  const ordered = [...points, { year: PEAK_YEAR, grossPublicPensionExpenditure: PEAK_VALUE }].filter((point, index, rows) => rows.findIndex((row) => row.year === point.year) === index).sort((a, b) => a.year - b.year);
  const x = (year: number) => 70 + (year - 2022) / (2070 - 2022) * 860;
  const y = (value: number) => 400 - (value - 13) / 5 * 310;
  const path = ordered.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.year)} ${y(point.grossPublicPensionExpenditure)}`).join(" ");
  const highlights = ordered.filter((point) => [2022, 2036, 2070].includes(point.year));
  const format = new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <svg className="spending-path" viewBox="0 0 1000 480" role="img" aria-label={label}><title>{label}</title><line className="spending-path__baseline" x1="70" x2="930" y1="400" y2="400" /><path className="spending-path__ghost" d={path} pathLength="1" /><path className="spending-path__line" d={path} pathLength="1" />
      {highlights.map((point) => <g className={`spending-point spending-point--${point.year}`} key={point.year} transform={`translate(${x(point.year)} ${y(point.grossPublicPensionExpenditure)})`}><circle r="9" /><text className="spending-point__value" textAnchor={point.year === 2022 ? "start" : point.year === 2070 ? "end" : "middle"} x={point.year === 2022 ? 16 : point.year === 2070 ? -16 : 0} y="-22">{format.format(point.grossPublicPensionExpenditure)}%</text><text className="spending-point__year" textAnchor={point.year === 2022 ? "start" : point.year === 2070 ? "end" : "middle"} x={point.year === 2022 ? 16 : point.year === 2070 ? -16 : 0} y="30">{point.year}</text></g>)}
    </svg>
  );
};

const SpendingScene = ({ source, points }: { source?: Source; points: SpendingPoint[] }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <section className="scroll-scene scroll-scene--spending" data-scroll-scene><div className="scene-sticky scene-shell">
      <SectionHeading kicker={copy.spending.kicker} body={copy.spending.body}>{copy.spending.title}<br /><em>{copy.spending.accent}</em></SectionHeading>
      <div className="spending-visual"><DecorativeArtwork className="spending-art" src="/assets/spending-peak.png" width={1800} height={708} /><SpendingPath points={points} label={copy.spending.chartAlt} language={language} /></div><TruthLine kind="official" source={source} />
    </div></section>
  );
};

const PersonalScene = ({ source, projections }: { source?: Source; projections: ReplacementProjection[] }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const [age, setAge] = useState(32);
  const [grossAnnualPay, setGrossAnnualPay] = useState(32_000);
  const result = useMemo(() => projectedPaymentExample({ age, grossAnnualPay, projections }), [age, grossAnnualPay, projections]);
  const currency = useMemo(() => new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }), [language]);
  const number = useMemo(() => new Intl.NumberFormat(language === "it" ? "it-IT" : "en-GB", { maximumFractionDigits: 1 }), [language]);
  return (
    <section className="scroll-scene scroll-scene--personal" data-scroll-scene><div className="scene-sticky scene-shell personal-layout">
      <SectionHeading kicker={copy.personal.kicker} body={copy.personal.body}>{copy.personal.title}</SectionHeading>
      <div className="personal-controls"><label htmlFor="story-age"><span>{copy.personal.age}</span><output>{age}</output><input id="story-age" aria-label={copy.personal.age} type="range" min="20" max="55" step="1" value={age} onChange={(event) => setAge(Number(event.target.value))} /></label><label htmlFor="story-salary"><span>{copy.personal.salary}</span><output>{currency.format(grossAnnualPay)}</output><input id="story-salary" aria-label={copy.personal.salary} type="range" min="15000" max="100000" step="1000" value={grossAnnualPay} onChange={(event) => setGrossAnnualPay(Number(event.target.value))} /></label></div>
      <div className="personal-stage"><div className="personal-context" aria-live="polite"><span>{copy.personal.retirement}<strong>{result.retirementYear}</strong></span><span>{copy.personal.replacement}<strong>{number.format(result.replacementRatePercent)}%</strong></span></div>
        <DecorativeArtwork className="money-art" src="/assets/purchasing-power.png" width={1672} height={941} />
        <div className="money-compare"><div className="money-column money-column--real"><span>{copy.personal.realTitle}</span><strong>{currency.format(result.realPayment)}</strong><small>{copy.personal.realNote}</small></div><div className="money-equals" aria-hidden="true">=</div><div className="money-column money-column--nominal"><span>{copy.personal.nominalTitle}</span><strong>{currency.format(result.nominalPayment)}</strong><small>{copy.personal.nominalNote}</small></div></div>
        <p className="money-explanation">{copy.personal.equal}</p></div><div className="assumption-line"><TruthLine kind="scenario" /><p>{copy.personal.assumptions}</p><SourceLink source={source} compact /></div>
    </div></section>
  );
};

const LeversScene = () => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  return (
    <section className="scroll-scene scroll-scene--levers" data-scroll-scene><div className="scene-sticky scene-shell levers-layout"><SectionHeading kicker={copy.levers.kicker} body={copy.levers.intro}>{copy.levers.title}<br /><em>{copy.levers.accent}</em></SectionHeading><DecorativeArtwork className="levers-art" src="/assets/policy-levers.png" width={1800} height={670} /><ol className="lever-list">{copy.levers.items.map((item) => <li key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol><p className="lever-note">{copy.levers.note}</p></div></section>
  );
};

const Closing = ({ sources }: { sources: Record<string, Source> }) => {
  const { language } = useLanguage();
  const copy = getStoryCopy(language);
  const primaryIds = ["ec_ageing_2024_italy", "istat_population_2025", "inps_observatory_2026"];
  return (
    <footer className="closing" data-scroll-scene><div className="scene-shell closing__inner"><h2>{copy.closing.title}<br /><em>{copy.closing.accent}</em></h2><p className="closing__body">{copy.closing.body}</p><details className="sources-drawer" id="sources"><summary>{copy.common.method}<span aria-hidden="true">+</span></summary><div className="sources-drawer__body"><div><h3>{copy.closing.sourceList}</h3><p>{copy.closing.sourcesIntro}</p></div><ul>{primaryIds.map((id) => sources[id] ? <li key={id}><a href={sources[id].url} target="_blank" rel="noreferrer"><span>{sources[id].title}</span><span aria-hidden="true">↗</span></a></li> : null)}<li><a href="https://www.ecb.europa.eu/mopo/strategy/strategy-review/ecb.strategyreview202506_strategy_statement.en.html" target="_blank" rel="noreferrer"><span>European Central Bank, 2% medium-term inflation target</span><span aria-hidden="true">↗</span></a></li></ul><p className="privacy-note">{copy.closing.privacy}</p></div></details><div className="closing__mark"><span aria-hidden="true">●</span>{copy.common.brand}<b>2026</b></div></div></footer>
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
  const reducedMotion = useReducedMotion();
  const active = useRef(true);
  useScrollChoreography(reducedMotion, Boolean(italy));
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
  return <div className="app"><SiteChrome /><main><Hero source={sources.ec_ageing_2024_italy} /><PaygScene source={sources.ec_ageing_2024_italy} /><DemographyScene source={sources.istat_population_2025} shares={shares} /><SpendingScene source={sources.ec_ageing_2024_italy} points={spending} /><PersonalScene source={sources.ec_ageing_2024_italy} projections={projections} /><LeversScene /></main><Closing sources={sources} /></div>;
};

export default App;
