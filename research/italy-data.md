# Italian pension system data pack

Scope: public-facing evidence for Italian workers aged 20 to 45. Data cut: 23 August 2026. The companion file is [public/data/italy.json](/Users/gabrielemonni/Documents/ChatGPT/Italian-death-clock/public/data/italy.json).

The pack separates:

- `observed`: an administrative, statistical, or financial value published for a stated date;
- `official_baseline`: a historical or base-year value used by an official model;
- `official_projection`: a conditional value from an official model;
- `derived`: arithmetic calculated from published values in this pack.

The source IDs below match the `sourceId` fields in the JSON. Money values from INPS accounts are in EUR million unless stated otherwise. Percentages of GDP, people, benefits, and monthly amounts retain their source units.

## 1. What the public system does

Italy's mandatory public pension system is pay-as-you-go: current contributions and state transfers finance current benefits. It is not a personal investment account. The European Commission's 2024 Ageing Report Italy fiche describes the transition from legacy defined-benefit rules to a notional defined-contribution calculation:

- Contributions in the notional account are capitalized at nominal GDP growth using a five-year moving average.
- A transformation coefficient linked to mortality and remaining life expectancy converts the notional capital into an annuity.
- The pension depends on contribution rate, contribution years, and retirement age.
- Contributions before the relevant 1995 or 2011 transition dates can remain under a pro-rata defined-benefit calculation. People starting after 1 January 1996 are fully in the contributory calculation.

The fiche reports contribution rates of about 33 percent for private and public employees, about 24 percent for self-employed workers in 2023, and 33 percent for parasubordinate workers, with a 24 percent case for people already insured elsewhere or already pensioners. OECD's 2025 comparison reports a 33 percent effective mandatory rate for an average earner in 2024. These rates are not a worker's full tax wedge and should not be treated as an individual investment return.

Sources: [EC and MEF 2024 Ageing Report Italy fiche](https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf) (`ec_ageing_2024_italy`), [OECD mandatory contributions](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/mandatory-pension-contributions_3aa18139.html) (`oecd_contributions_2025`).

## 2. Current INPS stock, benefits, and beneficiaries

The latest INPS pension observatory was published on 25 March 2026. It measures benefits in force at 1 January 2026, not a forecast:

| Measure | Value | Definition |
| --- | ---: | --- |
| Current benefits | 21,257,999 | All INPS benefits in the stock, including previdenziale and assistenziale categories |
| Previdenziale benefits | 16,840,238, or 79.2% | Mainly old-age, contributory invalidity, and survivor benefits |
| Assistenziale benefits | 4,417,761, or 20.8% | Mainly civil invalidity and social pensions or allowances |
| Annualized current amount | EUR 353,480.3 million | January amount multiplied by 13, or by 12 for attendance allowances |
| Average monthly benefit | EUR 1,283.8 | Stock average, not a unique person's total pension income |

The stock includes the public employee management, GDP, in this edition. The report excludes former INPGI. The amount is an annualized administrative measure, not the same perimeter or accounting basis as INPS annual budget outlays, Eurostat ESSPROS, or the European Commission's Ageing Report.

The 23 October 2025 INPS beneficiary observatory covers 31 December 2024 and gives a different but complementary count:

| Measure | Value |
| --- | ---: |
| Benefits | 23,015,011 |
| Annualized benefit amount | EUR 364,132 million |
| Unique pensioners | 16,305,880 |
| Male pensioners | 7,918,215 |
| Female pensioners | 8,387,665 |

The difference between 23.015 million benefits and 16.306 million people is expected. One person can receive several benefits. The category tables also overlap, so category pensioner counts cannot be added.

Sources: [INPS 2026 pension observatory PDF](https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1037) (`inps_observatory_2026`), [INPS 2026 observatory news page](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.online-l-osservatorio-sulle-pensioni-erogate-dall-istituto.html), and [INPS 2024 pension benefits and beneficiaries PDF](https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007) (`inps_beneficiaries_2024`).

## 3. INPS financial flows and state transfers

The 2025 INPS General Accounts are the latest full financial flow source in this pack. They are competence accounts, not a consolidated cash-flow statement for the whole public pension system.

### 2025 INPS account lines

| Line | EUR million | Status |
| --- | ---: | --- |
| Contribution revenue | 294,194 | observed |
| Current transfers | 165,492 | observed |
| State current transfers | 165,419 | observed |
| Other current revenue | 5,363 | observed |
| Capital revenue | 15,402 | observed |
| Giro revenue | 90,752 | observed |
| Total inflows | 571,210 | observed |
| Pension outlays | 325,067 | observed |
| Income-support outlays | 19,768 | observed |
| Institutional benefits | 425,613 | observed |
| Other current outlays | 25,622 | observed |
| Capital outlays | 12,405 | observed |
| Total outlays | 554,392 | observed |
| Financial competence balance | 16,818 | observed |

The pension outlay line covers EUR 229,754 million for private managements and EUR 95,312 million for public managements. The broader institutional-benefit line also includes income support, social inclusion, family benefits, and other services, so it must not be labelled as pension spending.

For scale, three valid official perimeters give nearby but non-identical results: [Eurostat ESSPROS](https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/36405.pdf) reports 15.5 percent of GDP for Italy in 2022, the [EC and MEF/RGS Ageing Report](https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf) public baseline uses 15.6 percent in 2022, and the [OECD](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/public-expenditure-on-pensions_ddc9a2dd.html) reports 16.1 percent for public cash old-age and survivor benefits in 2021. These are not a single historical series.

### What state transfers finance

The 2025 GIAS detail totals EUR 165,252 million. It includes pension-related charges of EUR 70,645 million, social pensions and allowances of EUR 5,090 million, civil invalidity of EUR 23,579 million, income support of EUR 8,276 million, social inclusion of EUR 5,241 million, family benefits of EUR 25,324 million, contribution relief of EUR 24,244 million, and other items of EUR 2,853 million. The small difference from the EUR 165,419 million broad state-transfer line is an accounting reconciliation issue, not a contradiction in the categories.

The detailed pension-related GIAS items include the state share of each pension month, disability pensions predating 1984, early-retirement charges, public employee management charges, and special historical schemes. This is why a comparison of contributions with pension outlays alone does not identify a single "pension deficit".

### Historical INPS financial series

| Year | Contributions | Current transfers | Other current revenue | Current revenue total | Institutional benefits |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2015 | 214,787 | 103,957 | 4,355 | 323,098 | 307,831 |
| 2021 | 236,893 | 144,945 | 4,544 | 386,382 | 359,843 |
| 2022 | 256,138 | 159,566 | 4,893 | 420,597 | 380,718 |
| 2023 | 269,152 | 164,822 | 5,219 | 439,193 | 398,063 |
| 2024 | 284,047 | 180,740 | 5,985 | 470,772 | 417,408 |
| 2025 | 294,194 | 165,492 | 5,363 | 465,049 | 425,613 |

### Derived values

These are arithmetic, not additional official indicators:

- EUR 325,067 million of 2025 pension outlays divided by EUR 294,194 million of contributions equals 1.1049, or 110.5 percent. This comparison excludes transfers and other revenue and mixes lines with different purposes. It is not a complete system balance.
- Contributions were 63.3 percent of 2025 current revenue, current transfers were 35.6 percent, and other current revenue was 1.2 percent. Rounded components sum to 100.1 percent.

Source: [INPS 2025 General Accounts explanatory report](https://www.inps.it/content/dam/inps-site/pdf/allegatinews/Relazione_rendiconto_generale_2025.pdf) and [2025 accounts landing page](https://www.inps.it/it/it/dati-e-bilanci/bilanci--rendiconti-e-flussi-finanziari/rendiconti-generali/2025.html) (`inps_budget_2025`).

## 4. Amount bands and high pensions

The 2024 INPS benefit distribution contains 23.015 million benefits. The three bands below EUR 1,500 contain 15.558 million benefits, or 67.6 percent. The 5000 and over band contains 363,468 benefits, or 1.6 percent, and represents 8.2 percent of annualized benefit amount.

The 2024 pensioner income distribution is a different unit. It sums all benefits received by each unique pensioner. Only 28.1 percent of pensioners had total pension income below EUR 1,000, compared with 53.9 percent of individual benefits below EUR 1,000. More than EUR 1,500 of total pension income covered 54.5 percent of pensioners, while more than EUR 2,000 covered 37.7 percent.

The 2026 stock report groups benefits differently: 9,704,016 benefits, or 45.7 percent, were at or below EUR 749.99 per month. INPS reports that 4,091,750 of those were linked to its defined set of low-income provisions, 42.2 percent of that band. A low individual benefit does not reveal household income, and a high benefit band does not establish abuse or illegality.

The JSON keeps all three distributions separate:

- `benefitsByMonthlyAmount2024` is a benefit count and annualized amount distribution;
- `pensionsByMonthlyAmount2026` is the current stock's broader monthly band distribution;
- `pensionerIncomeBands2024` is a unique-person distribution after adding that person's benefits.

## 5. Multiple pensions and combinations

The 2024 INPS table explicitly treats categories as overlapping. The following values are people in each category, not a partition of the population:

| Category | Category people | Same type only | Cumulated with other types | Average benefits per person |
| --- | ---: | ---: | ---: | ---: |
| Old-age | 11,443,352 | 72.3% | 27.7% | 1.43 |
| Contributory invalidity | 890,395 | 54.0% | 46.0% | 1.70 |
| Survivor | 4,154,044 | 31.7% | 68.3% | 1.99 |
| Indennitarie | 604,647 | 28.5% | 71.5% | 2.02 |
| Assistenziale | 3,932,284 | 51.8% | 48.2% | 1.86 |

Examples of combinations are an old-age pension with a survivor pension, or a contributory pension with an assistenziale or invalidity benefit. The table is descriptive. It does not show that a combination is abusive, improper, or financially unjustified. The system has separate legal programs and survivor or disability rules that naturally create overlap.

## 6. Demographic and worker pressure

Istat's 2025 population projection starts from 1 January 2024 and gives a median path plus a 90 percent uncertainty interval:

| Year | Population, million | Age 15 to 64 | Age 65 and over | Age 85 and over |
| ---: | ---: | ---: | ---: | ---: |
| 2024 | 59.0 | 63.5% | 24.3% | 3.9% |
| 2050 | 54.7 | 54.3% | 34.6% | 7.2% |
| 2080 | 45.8 | not reported in this compact table | not reported in this compact table | not reported in this compact table |

The 2050 90 percent interval is 52.5 to 56.8 million residents, 53.2 to 55.4 percent for age 15 to 64, and 33.2 to 35.9 percent for age 65 and over. Istat's median fertility path rises from 1.18 births per woman in 2024 to 1.46 in 2080, while women aged 15 to 49 fall from about 11.5 million to 7.6 million. Median net migration is below 200 thousand a year to 2040 and about 165 thousand a year thereafter.

The EC Ageing Report uses a separate model and population vintage. Its public-system baseline has:

| Year | Pensioners, thousands | Employment, thousands | Pensioners per worker, rounded | Age 65 plus, thousands | Age 20 to 64, thousands |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2022 | 14,760 | 23,181 | 0.6 | 14,120 | 34,605 |
| 2040 | 17,222 | 22,770 | 0.8 | 18,876 | 31,034 |
| 2050 | 17,523 | 22,332 | 0.8 | 19,370 | 29,354 |
| 2070 | 15,457 | 21,924 | 0.7 | 17,955 | 27,396 |

The Ageing Report projects participation of people aged 55 to 64 from 57.9 percent in 2022 to 76.3 percent in 2070, and participation at ages 65 to 74 from 9.4 percent to 33.0 percent. Average labour-market exit age rises from 64.0 for men and 64.5 for women in 2022 to 68.6 and 69.0 in 2070. OECD's 2025 Italy note reports employment of only 47 percent among 60 to 64 year olds in 2024, about 10 percentage points below the OECD average. These are labour-market constraints as well as demographic constraints.

Sources: [Istat population projection report](https://www.istat.it/wp-content/uploads/2025/07/Report_Previsioni-della-popolazione-residente-e-delle-famiglie_Base-Base-112024.pdf) (`istat_population_2025`), [Istat release page](https://www.istat.it/comunicato-stampa/previsioni-della-popolazione-residente-e-delle-famiglie-base-1-1-2024/), [EC Ageing Report Italy fiche](https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf), and [OECD Italy note](https://www.oecd.org/en/publications/pensions-at-a-glance-2025-country-notes_8a53ef12-en/italy_3dd0d4fa-en.html) (`oecd_italy_note_2025`).

## 7. Retirement ages and policy transitions

The current ordinary old-age rule is 67 years plus at least 20 years of contributions for 2026. INPS reports the life-expectancy update as 67 years and 1 month in 2027 and 67 years and 3 months in 2028. Post-1995 contributory workers also face a minimum pension-amount condition at old age, stated by INPS as at least 1.5 times the social allowance in the ordinary path.

Ordinary early retirement has no ordinary age floor in the main contribution path. The contribution thresholds are 42 years and 10 months for men and 41 years and 10 months for women through 2026, 42 years and 11 months and 41 years and 11 months in 2027, and 43 years and 1 month and 42 years and 1 month in 2028. INPS lists exemptions for specified strenuous, night, assembly-line, and early heavy-worker categories. APE Sociale has separate eligibility rules and is not the ordinary old-age pension.

The main temporary pathways show how policy changes can move the effective retirement age independently of the long-run NDC formula:

- Quota 100 used age 62 plus 38 contribution years in 2019 to 2021.
- Quota 102 used age 64 plus 38 contribution years in 2022.
- Quota 103 used age 62 plus 41 contribution years for specified 2023 to 2025 maturities. The 2026 Budget Law did not extend new maturities; people who met the conditions by 31 December 2025 remain covered under the stated rules.
- APE Sociale is extended through 31 December 2026 at age 63 years and 5 months for eligible categories. It is an allowance bridge, not an ordinary pension.

Sources: [INPS old-age pension service sheet](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-di-vecchiaia.html) (`inps_retirement_age`), [INPS 2027 and 2028 update](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.pensioni-requisiti-aggiornati-per-il-2027-e-il-2028.html) (`inps_requirements_2026`), [INPS 2026 Budget Law](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.legge-di-bilancio-2026-le-novit-sulle-pensioni.html) (`inps_pension_law_2026`), and [INPS 2025 Budget Law](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.03.legge-di-bilancio-2025-disposizioni-in-materia-pensionistica.html) (`inps_pension_law_2025`).

## 8. Official expenditure projections through 2070

The EC and MEF/RGS Ageing Report Italy fiche uses a public-pension perimeter and a model vintage with policy information at 30 September 2023. It projects gross public pension expenditure from 15.6 percent of GDP in the 2022 baseline to a peak of 17.3 percent in 2036, then 13.7 percent in 2070:

| Year | Gross public pension expenditure | Net public pension expenditure | Public pension contributions | Public system balance |
| ---: | ---: | ---: | ---: | ---: |
| 2022 | 15.6% GDP | 12.6% GDP | 10.9% GDP | -4.7% GDP |
| 2030 | 16.6% GDP | 13.5% GDP | 11.2% GDP | -5.5% GDP |
| 2040 | 17.1% GDP | 13.8% GDP | 11.2% GDP | -5.8% GDP |
| 2050 | 15.5% GDP | 12.5% GDP | 11.3% GDP | -4.2% GDP |
| 2060 | 13.7% GDP | 11.1% GDP | 11.4% GDP | -2.3% GDP |
| 2070 | 13.7% GDP | 11.1% GDP | 11.3% GDP | -2.4% GDP |

Gross expenditure is before taxes. Net expenditure excludes taxes on pensions and contributions paid by beneficiaries. The public pension balance is not the same as the INPS budget balance or Italy's general government deficit.

The report's public-scheme benefit ratio is 69 percent in 2022, 71 percent in 2030, 65 percent in 2040, 57 percent in 2050, 53 percent in 2060, and 56 percent in 2070. The full-career old-age earnings-related replacement rate is 59 percent in 2022, 55 percent in 2030, 50 percent in 2040, 46 percent in 2050, 50 percent in 2060, and 52 percent in 2070. These are model indicators, not a promise about the pension of a particular worker.

### Sensitivity and uncertainty

The official sensitivity table reports deviations from the baseline in percentage points of GDP. Examples for 2070 are:

- higher net migration by 33 percent: -0.6 points;
- lower net migration by 33 percent: +0.7 points;
- lower fertility by 20 percent: +0.6 points;
- 10 percentage points more employment among older workers: +0.3 points;
- constant retirement age: +1.2 points;
- constant benefit ratio: +1.5 points.

These are scenario deltas, not probabilities. A projected decline after 2036 is a conditional model path. It is not an evidence-based collapse date, and later legislation or demographic outcomes can change it.

Source: [2024 Ageing Report Italy country fiche](https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf) (`ec_ageing_2024_italy`).

## 9. Perimeter warnings and known gaps

The data should be displayed with the source label and reference date visible:

1. INPS current stock is an administrative benefits stock annualized from January amounts. INPS budget outlays are competence-accounting financial lines. Neither is the Eurostat ESSPROS function series.
2. The Ageing Report public perimeter is narrower than total ESSPROS pension expenditure in some years. It excludes or treats differently certain disability, work-injury, war-pension, and other items, and excludes non-mandatory professional funds.
3. OECD public cash pension expenditure is internationally comparable but its latest data in the cited 2025 chapter are mainly 2021. It should not be blended with 2025 INPS accounts.
4. Eurostat's latest cited pension-expenditure article covers 2022 and reports Italy at 15.5 percent of GDP under ESSPROS. The Ageing Report's 2022 public baseline is 15.6 percent. The small difference is a perimeter and methodology difference, not a data error.
5. Istat projections run to 2080, while the EC Ageing Report runs to 2070. Their population assumptions and age definitions are not interchangeable.
6. The current legal framework can change. Retirement-age values for 2027 and 2028 are based on the current INPS update available at the data cut, not a guarantee that no later law will modify them.
7. The pack has no microdata for household income, tax treatment, private occupational funds, individual contribution histories, health status, or the legal validity of a specific benefit combination. The amount bands cannot answer those questions.

## 10. Source catalog

| Source ID | Publisher and document | Publication date | Direct URL |
| --- | --- | --- | --- |
| `inps_observatory_2026` | INPS pension observatory, current stock and 2025 liquidations | 2026-03-25 | [PDF](https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1037) |
| `inps_beneficiaries_2024` | INPS pension benefits and beneficiaries observatory | 2025-10-23 | [PDF](https://servizi2.inps.it/servizi/osservatoristatistici/api/getAllegato/?idAllegato=1007) |
| `inps_budget_2025` | INPS 2025 General Accounts explanatory report | 2026-07-23 | [PDF](https://www.inps.it/content/dam/inps-site/pdf/allegatinews/Relazione_rendiconto_generale_2025.pdf) |
| `ec_ageing_2024_italy` | European Commission, MEF, and RGS 2024 Ageing Report Italy fiche | 2024-04-18, document dated 2024-01-16 | [PDF](https://economy-finance.ec.europa.eu/document/download/82b762d7-21ce-4992-aa97-888fd2c66205_en?filename=2024-ageing-report-country-fiche-Italy.pdf) |
| `istat_population_2025` | Istat population and household projections, base 2024-01-01 | 2025-07-28, updated 2025-10-21 | [PDF](https://www.istat.it/wp-content/uploads/2025/07/Report_Previsioni-della-popolazione-residente-e-delle-famiglie_Base-Base-112024.pdf) |
| `inps_retirement_age` | INPS old-age pension service sheet | 2024-02-08, updated 2026-06-12 | [Service sheet](https://www.inps.it/it/it/dettaglio-scheda.it.schede-servizio-strumento.schede-servizi.pensione-di-vecchiaia.html) |
| `inps_requirements_2026` | INPS updated requirements for 2027 and 2028 | 2026-03-17 | [News page](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.03.pensioni-requisiti-aggiornati-per-il-2027-e-il-2028.html) |
| `inps_pension_law_2026` | INPS 2026 Budget Law pension changes | 2026-02-26 | [News page](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.legge-di-bilancio-2026-le-novit-sulle-pensioni.html) |
| `inps_pension_law_2025` | INPS 2025 Budget Law pension provisions | 2025-03-06 | [News page](https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2025.03.legge-di-bilancio-2025-disposizioni-in-materia-pensionistica.html) |
| `oecd_italy_note_2025` | OECD Pensions at a Glance 2025 Italy country note | 2025-11-27 | [Country note](https://www.oecd.org/en/publications/pensions-at-a-glance-2025-country-notes_8a53ef12-en/italy_3dd0d4fa-en.html) |
| `oecd_contributions_2025` | OECD mandatory pension contributions chapter | 2025-11-27 | [Chapter](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/mandatory-pension-contributions_3aa18139.html) |
| `oecd_expenditure_2025` | OECD public expenditure on pensions chapter | 2025-11-27 | [Chapter](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/public-expenditure-on-pensions_ddc9a2dd.html) |
| `eurostat_pension_expenditure_2026` | Eurostat pension expenditure and ESSPROS statistics | 2026-04-17 | [Statistics explained PDF](https://ec.europa.eu/eurostat/statistics-explained/SEPDF/cache/36405.pdf), [dataset](https://ec.europa.eu/eurostat/databrowser/view/spr_exp_pens/default/table?lang=en) |

The JSON source catalog contains the same IDs, direct URLs, publication dates, coverage descriptions, and landing pages where available.
