import type { Source } from "./types";
import type { Language } from "./i18n";

const titleTranslations: Record<string, string> = {
  inps_observatory_2026: "Osservatorio INPS sulle pensioni erogate e liquidate nel 2025",
  inps_beneficiaries_2024: "Osservatorio INPS su prestazioni pensionistiche e beneficiari",
  inps_budget_2025: "Rendiconto generale INPS 2025 e relazione illustrativa",
  ec_ageing_2024_italy: "Ageing Report 2024, scheda paese Italia",
  istat_population_2025: "Previsioni Istat della popolazione e delle famiglie",
  inps_retirement_age: "Scheda INPS sulla pensione di vecchiaia",
  inps_requirements_2026: "Requisiti pensionistici INPS aggiornati per 2027 e 2028",
  inps_pension_law_2026: "Legge di bilancio 2026, novità sulle pensioni",
  inps_pension_law_2025: "Legge di bilancio 2025, disposizioni pensionistiche",
  oecd_italy_note_2025: "OECD, Panorama delle pensioni 2025, scheda Italia",
  oecd_contributions_2025: "OECD, Panorama delle pensioni 2025, contributi obbligatori",
  oecd_expenditure_2025: "OECD, Panorama delle pensioni 2025, spesa pubblica per pensioni",
  eurostat_pension_expenditure_2026: "Eurostat, statistiche sulla spesa per pensioni",
  oecd_pag2025_public_expenditure: "OECD, Panorama delle pensioni 2025, spesa pubblica per pensioni",
  oecd_pag2025_assets: "OECD, Panorama delle pensioni 2025, attività destinate alla pensione",
  oecd_pag2025_contributions: "OECD, Panorama delle pensioni 2025, contributi pensionistici obbligatori",
  oecd_pag2025_current_ages: "OECD, Panorama delle pensioni 2025, età pensionistiche correnti",
  oecd_pag2025_effective_exit: "OECD, Panorama delle pensioni 2025, età effettiva di uscita dal lavoro",
  oecd_pag2025_gross_replacement: "OECD, Panorama delle pensioni 2025, tassi lordi di sostituzione",
  oecd_pag2025_net_replacement: "OECD, Panorama delle pensioni 2025, tassi netti di sostituzione",
  oecd_pag2025_coverage: "OECD, Panorama delle pensioni 2025, partecipazione ai piani pensionistici",
  eurostat_old_age_dependency: "Eurostat, indice di dipendenza degli anziani",
  oecd_italy_country_note: "OECD, note paese 2025, Italia",
  covip_about: "COVIP, informazioni sulla vigilanza dei fondi pensione",
  covip_tfr: "COVIP, conferimento del TFR ai fondi pensione",
  covip_auto_enrolment_2026: "COVIP, adesione automatica e regole per il TFR",
  bsv_ch_three_pillars: "Svizzera, sistema dell'assicurazione per la vecchiaia",
  bsv_ch_oasi_payg: "Svizzera, opuscolo AVS/OASI 2026",
  bsv_ch_occupational_funding: "Svizzera, organizzazione e finanziamento della previdenza professionale",
  sweden_pensionsmyndigheten: "Svezia, il sistema pensionistico pubblico e occupazionale",
  sweden_retirement_rules: "Svezia, regole per pianificare la pensione",
  sweden_gov_brief: "Svezia, il sistema pensionistico in breve",
  sweden_automatic_balancing: "Svezia, bilanciamento automatico del sistema pensionistico",
  dnb_nl_three_pillars: "Paesi Bassi, i tre pilastri pensionistici",
  dnb_nl_new_system: "Paesi Bassi, transizione verso il nuovo sistema pensionistico",
  svb_nl_aow: "Paesi Bassi, che cos'è la pensione statale AOW",
  svb_nl_aow_age: "Paesi Bassi, età per la pensione AOW",
  svb_nl_aow_payg: "Paesi Bassi, storia del finanziamento della sicurezza sociale",
  oecd_pensions_outlook_2022_transition: "OECD, costi di transizione dalla ripartizione alla capitalizzazione",
  oecd_pensions_outlook_2018_transition: "OECD, transizione dalla ripartizione alla capitalizzazione",
  world_bank_transition_costs: "Banca mondiale, costi di transizione della riforma pensionistica",
};

const noteTranslations: Record<string, string> = {
  inps_observatory_2026: "Fonte INPS per il conteggio delle prestazioni in vigore e delle nuove liquidazioni.",
  inps_beneficiaries_2024: "Fonte INPS per beneficiari, categorie di prestazione e importi annualizzati al 31 dicembre 2024.",
  inps_budget_2025: "Bilancio INPS usato per distinguere contributi, trasferimenti ed esborsi correnti.",
  ec_ageing_2024_italy: "Baseline e proiezioni ufficiali della spesa pubblica, con il perimetro Ageing Report.",
  istat_population_2025: "Scenario mediano Istat per popolazione residente e composizione per età.",
  inps_retirement_age: "Regola INPS di riferimento per la pensione di vecchiaia e i requisiti ordinari.",
  inps_requirements_2026: "Aggiornamento INPS sui requisiti applicabili negli anni 2027 e 2028.",
  inps_pension_law_2026: "Documento INPS sulle modifiche pensionistiche della legge di bilancio 2026.",
  inps_pension_law_2025: "Documento INPS sulle disposizioni pensionistiche della legge di bilancio 2025.",
  oecd_italy_note_2025: "Nota comparabile OECD per il contesto del sistema italiano.",
  oecd_contributions_2025: "Aliquote contributive armonizzate OECD, con perimetri nazionali non identici.",
  oecd_expenditure_2025: "Spesa pubblica per pensioni secondo la definizione comparabile OECD.",
  eurostat_pension_expenditure_2026: "Serie Eurostat sulla spesa pensionistica nel perimetro ESSPROS.",
  oecd_pag2025_public_expenditure: "Tabella OECD 8.2, ultima osservazione 2021 per i quattro paesi.",
  oecd_pag2025_assets: "Tabella OECD 9.2, attività di schemi finanziati a fine 2024 o ultima disponibilità.",
  oecd_pag2025_contributions: "Tabella OECD 8.1, aliquote effettive corrette per i massimali di reddito.",
  oecd_pag2025_current_ages: "Tabella OECD 3.5, età modellate per un ingresso a 22 anni e carriera continua.",
  oecd_pag2025_effective_exit: "Stima OECD dell'uscita media dal mercato del lavoro per chi ha almeno 40 anni.",
  oecd_pag2025_gross_replacement: "Tabella OECD 4.1, diritto lordo modellato per un lavoratore medio a carriera completa.",
  oecd_pag2025_net_replacement: "Tabella OECD 4.4, diritto netto modellato dopo imposte e contributi.",
  oecd_pag2025_coverage: "Tabella OECD 9.1, copertura dei piani con categorie e anni non perfettamente sovrapponibili.",
  eurostat_old_age_dependency: "Indicatore OLDDEP1: residenti di almeno 65 anni rispetto ai residenti tra 15 e 64 anni.",
  oecd_italy_country_note: "Contesto OECD su transizione contributiva, spesa ed età di riferimento italiana.",
  covip_about: "Descrizione istituzionale della vigilanza sui fondi pensione complementari.",
  covip_tfr: "Indicazioni COVIP sulla scelta esplicita e sul conferimento tacito del TFR.",
  covip_auto_enrolment_2026: "Regole COVIP sull'adesione automatica per i nuovi assunti del settore privato.",
  bsv_ch_three_pillars: "Descrizione ufficiale dei tre pilastri, delle soglie professionali e del risparmio volontario.",
  bsv_ch_oasi_payg: "L'AVS/OASI è a ripartizione: i contributi correnti finanziano i pensionati correnti.",
  bsv_ch_occupational_funding: "La previdenza professionale svizzera è generalmente finanziata a capitalizzazione.",
  sweden_pensionsmyndigheten: "Descrizione ufficiale di pensione pubblica, premio, garanzia, lavoro e risparmio personale.",
  sweden_retirement_rules: "Regole svedesi sull'età di accesso e sul collegamento con la speranza di vita.",
  sweden_gov_brief: "Quadro istituzionale sulla ripartizione del contributo pubblico e sulla previdenza occupazionale.",
  sweden_automatic_balancing: "Spiegazione del meccanismo automatico che adegua l'indicizzazione all'equilibrio del sistema.",
  dnb_nl_three_pillars: "Descrizione ufficiale di AOW, previdenza tramite datore di lavoro e prodotti individuali.",
  dnb_nl_new_system: "Transizione olandese verso contributi definiti, con termine ultimo indicato dalla legge.",
  svb_nl_aow: "Regole della pensione statale olandese e della storia assicurativa.",
  svb_nl_aow_age: "Tabella ufficiale dell'età AOW per coorte e collegamento con la speranza di vita.",
  svb_nl_aow_payg: "Storia istituzionale del finanziamento AOW a ripartizione.",
  oecd_pensions_outlook_2022_transition: "Spiega il divario da finanziare quando i contributi vengono deviati verso schemi finanziati.",
  oecd_pensions_outlook_2018_transition: "Descrive il doppio onere della transizione e la riforma svedese graduale.",
  world_bank_transition_costs: "Introduzione al doppio onere e al residuo fabbisogno di finanziamento PAYG.",
};

const dateYear = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4})/);
  return match?.[1] ?? null;
};

const nonEmpty = (value?: number | string | null): string | null => {
  const text = value == null ? "" : String(value).trim();
  return text ? text : null;
};

export const sourceReferenceYear = (source: Source): string | null =>
  nonEmpty(source.observedYear) ?? dateYear(source.updatedDate) ?? dateYear(source.publicationDate) ?? dateYear(source.accessed);

export const sourceMetadataLabel = (source: Source, language: Language = "it"): string => {
  const observed = nonEmpty(source.observedYear);
  const publication = dateYear(source.publicationDate);
  const updated = dateYear(source.updatedDate);
  const labels = language === "it"
    ? { updated: "aggiornata", published: "pubblicata", accessed: "consultata", missing: "anno non indicato" }
    : { updated: "updated", published: "published", accessed: "accessed", missing: "year not stated" };
  if (observed) return updated && updated !== observed ? `${observed} · ${labels.updated} ${updated}` : observed;
  if (updated && publication && updated !== publication) return `${labels.updated} ${updated} · ${labels.published} ${publication}`;
  if (updated) return `${labels.updated} ${updated}`;
  if (publication) return `${labels.published} ${publication}`;
  const accessed = dateYear(source.accessed);
  return accessed ? `${labels.accessed} ${accessed}` : labels.missing;
};

export const sourceCardTitle = (source: Source, language: Language = "it"): string => {
  if (language === "en") return source.title || "Institutional source linked to the figure";
  return titleTranslations[source.id] ?? "Fonte istituzionale collegata al dato mostrato";
};

export const sourceCardNote = (source: Source, language: Language = "it"): string => {
  if (language === "it") return noteTranslations[source.id] ?? "Fonte istituzionale collegata al dato e al perimetro indicati.";
  const sourceWithCoverage = source as Source & { coverage?: string };
  return source.notes ?? sourceWithCoverage.coverage ?? "Institutional source linked to the stated figure and scope.";
};
