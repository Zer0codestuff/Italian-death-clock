# International pension comparison data pack

Reviewed 23 August 2026. This research note documents the evidence behind `public/data/international.json` for Italy (IT), Switzerland (CH), Sweden (SE) and the Netherlands (NL). The data pack is designed for an interactive public site, so every numeric value has an observation year, unit, definition, comparability label and source ID.

## Scope and reading rules

The comparison separates four concepts that are often mixed together:

- Public PAYG benefits, where current contributions or taxes finance current benefits.
- Notional defined-contribution accounts, which record pension rights but do not themselves hold invested assets.
- Occupational funded pillars, where contributions are invested for retirement.
- Voluntary personal savings, which are outside mandatory public insurance.

The data pack uses `high`, `medium` and `low` comparability labels. A low label is deliberate where legal concepts, plan categories or observation years do not align. A null value means not applicable, unavailable or not aligned in the cited source. It must not be rendered as zero.

## Harmonised indicators

| Indicator | Italy | Switzerland | Sweden | Netherlands | Year and unit |
| --- | ---: | ---: | ---: | ---: | --- |
| Public cash old-age and survivor benefits | 16.1 | 6.6 | 8.0 | 6.4 | 2021, % of GDP, high |
| Pension-provider assets | 11.7 | 166.9 | 115.8 | 150.9 | End-2024 or latest, % of GDP, high |
| Public pension reserve funds | 5.4 | 6.7 | 33.3 | n/a | End-2024 or latest, % of GDP, low |
| Effective mandatory contribution rate | 33.0 | 16.6 | 22.3 | 22.0 | 2024, % of gross average earnings, medium |
| OECD model normal age, men / women | 64.8 / 63.8 | 65.0 / 64.0 | 66.0 / 66.0 | 67.0 / 67.0 | 2024, years, medium |
| Effective labour-market exit, men / women | 64.0 / 62.6 | 64.2 / 64.5 | 65.1 / 65.0 | 65.0 / 64.7 | 2024, years, medium |
| Gross replacement rate, average earner | 70.6 | 42.4 | 63.7 | 74.7 | 2024 model, %, medium |
| Net replacement rate, average earner | 79.0 | 47.5 | 66.3 | 96.0 | 2024 model, %, medium |
| Old-age dependency ratio | 39.0 | 29.8 | 33.4 | 32.4 | 2025, %, high |

The expenditure and contribution figures come from OECD *Pensions at a Glance 2025*. The expenditure table is for 2021 for all four countries. The asset table distinguishes assets of pension providers from public pension reserve funds. The latter support unfunded or PAYG public arrangements and are not individual funded entitlements. The demographic ratio is Eurostat's OLDDEP1 indicator: population aged 65 or over divided by population aged 15 to 64.

Coverage is intentionally a separate, low-comparability metric. OECD reports 2024 Italian voluntary occupational coverage of 13.9% and voluntary personal coverage of 16.0%, with 26.7% total voluntary coverage. It reports 2023 mandatory or quasi-mandatory occupational coverage of 81.5% for Switzerland and 97.4% for the Netherlands, and 2024 public premium-pension coverage of 99.4% for Sweden. These are plan-member or accrued-right measures among people aged 15 to 64. Categories can overlap and should not be summed or presented as a universal active-contributor rate.

## Country evidence

### Italy

Italy's public pension is a PAYG system in transition from legacy defined-benefit rules to the NDC method introduced in 1995. OECD expects the transition to be complete for new pensioners around 2040. The OECD country note reports public expenditure at about 16% of GDP and says at least one quarter is not financed by pension contributions. It reports a statutory ordinary age of 67 for 2025 and an early route from 64 subject to contribution conditions.

Supplementary pensions are supervised by [COVIP](https://www.covip.it/en/about-covip). For private-sector employees, [TFR can be transferred to a supplementary fund](https://www.covip.it/per-il-cittadino/educazione-previdenziale/faq/conferimento-tfr) through an explicit choice or silent-assent route. COVIP's current [automatic-enrolment glossary](https://www.covip.it/per-il-cittadino/educazione-previdenziale/glossario/adesione) describes a rule for employees first hired after 30 June 2026, subject to opt-out and fund-choice windows. The OECD coverage observation predates this change and is not a forecast of its effect.

### Switzerland

The [Swiss Federal Social Insurance Office three-pillar page](https://www.bsv.admin.ch/en/old-age-insurance-system) describes OASI/AVS, occupational BVG/LPP and voluntary private provision. The official [OASI/AVS brochure](https://www.bsv.admin.ch/dam/en/sd-web/HPs3-Czqe8-1/BSV_AHV_BroschureA5_ENG_2026.pdf) is explicit that the first pillar is PAYG: current contributions flow directly to current pensioners and OASI funds are not invested. The [occupational funding page](https://www.bsv.admin.ch/en/organisation-financing-bvg) describes the second pillar as generally capitalised, with individual savings capital built from contributions and interest.

This distinction matters for chart interpretation. Switzerland has 166.9% of GDP in pension-provider assets, but that does not make OASI a funded first pillar. The 2026 reference age is 65 after the AVS/AHV21 reform, with transitional rules for women. The OECD model table for a worker retiring in 2024 still reports 65 for men and 64 for women, which is why both concepts are kept in the JSON.

### Sweden

The [Swedish Pensions Agency](https://www.pensionsmyndigheten.se/other-languages/english-engelska/english-engelska/pension-system-in-sweden) describes public income, premium and guarantee pensions, occupational pensions and own savings. The public contribution is split into 16% for the PAYG NDC income pension and 2.5% for the funded premium pension. The [Swedish government brief](https://www.government.se/contentassets/c40b1026b5f64cba929445d37d0b3f12/the-swedish-pension-system-in-brief.pdf) adds the 18.5% total public contribution, common occupational contributions of about 4.5% to 6% and asset context.

Sweden has a clear automatic stabilizer. The [Pensions Agency explanation of balancing](https://www.pensionsmyndigheten.se/forsta-din-pension/om-pensionssystemet/balanseringen-i-pensionssystemet) says the income-pension system is financially autonomous and uses a balance index that lowers indexation when liabilities exceed assets. There is no fixed statutory retirement age. The [retirement-planning page](https://www.pensionsmyndigheten.se/other-languages/english-engelska/english-engelska/plan-your-pension) says public pension can start from 63 under the cited rules and that age limits are linked to life expectancy from 2026.

### Netherlands

The [Dutch central bank](https://www.dnb.nl/en/current-economic-issues/pensions/) identifies AOW, workplace pension and voluntary individual products as the three pillars. The [Social Insurance Bank](https://www.svb.nl/en/about-the-svb/who-we-are/history-of-social-security-schemes) explicitly describes AOW as PAYG: current workers' contributions finance current pensions. Full AOW depends on insured residence or work history, and the [SVB age table](https://www.svb.nl/nl/aow/aow-leeftijd/uw-aow-leeftijd) shows cohort-specific ages and the link to life expectancy.

The workplace pillar is funded and very broad, but its legal structure is changing. DNB's [new-system explanation](https://www.dnb.nl/en/current-economic-issues/pensions/towards-the-new-pension-system/) says the Future Pensions Act took effect on 1 July 2023, moves arrangements toward defined contribution with returns and risk sharing, removes a guarantee of a fixed pension amount, and requires compliance by 1 January 2028 at the latest. The high Dutch asset ratio therefore belongs mainly to the funded workplace pillar, not to AOW.

## PAYG to funded transition cost

The transition issue is a financing mechanism, not a country ranking. When contributions that previously financed PAYG benefits are diverted to funded accounts, the government still has to honour accrued PAYG promises. The result is a financing gap that can be met through taxes, spending reductions or debt. Current workers may face a double burden: financing residual PAYG benefits while also saving in the new funded pillar.

This is documented in [OECD Pensions Outlook 2022](https://www.oecd.org/en/publications/oecd-pensions-outlook-2022_20c7f443-en/full-report/component-4.html), [OECD Pensions Outlook 2018](https://www.oecd.org/en/publications/oecd-pensions-outlook-2018_pens_outlook-2018-en/full-report/component-4.html) and the [World Bank transition-cost primer](https://documents1.worldbank.org/curated/en/964361468340745524/pdf/333900rev0PRPNoteTransition.pdf). Sweden's reform is discussed as a gradual example where the funded diversion was limited. No harmonised country-specific euro estimate was found in the reviewed primary sources, so the JSON does not invent one.

## Comparability limitations

- OECD replacement rates are modelled entitlements for a full-career average earner in mandatory schemes. They are not observed retiree outcomes and do not make voluntary saving comparable.
- OECD model retirement ages assume entry at 22 and an uninterrupted career. Legal ages, early-retirement routes, pension-claim ages and labour-market exit ages are different measures.
- Contribution rates can include disability, invalidity or other social insurance. Ceilings, age bands and occupational-plan rules differ, even in the OECD table.
- Pension-provider assets are funded assets, not the present value of PAYG promises. Public pension reserve funds are kept in a separate series.
- Coverage values describe plan membership or accrued rights. They use different years and plan categories, and some categories overlap.
- The public-expenditure series is 2021, while most other harmonised series are 2024 or 2025. The observation year is shown beside every metric.

## Source register

The machine-readable [source catalog](../public/data/international.json) contains every URL, publisher, access date, observation year and supported metric. The main evidence families are:

- [OECD Pensions at a Glance 2025 public expenditure](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/public-expenditure-on-pensions_ddc9a2dd.html), [assets](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/assets-earmarked-for-retirement_089c3f13.html), [contributions](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/mandatory-pension-contributions_3aa18139.html), [retirement ages](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/current-retirement-ages_0f63b747.html), [replacement rates](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/gross-pension-replacement-rates_95e3eed6.html), [coverage](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/participation-in-pension-plans_77f7c663.html) and [effective labour-market exit](https://www.oecd.org/en/publications/pensions-at-a-glance-2025_e40274c1-en/full-report/effective-age-of-labour-market-exit_fd1212b7.html).
- [Eurostat OLDDEP1 API](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjanind?format=JSON&lang=en&indic_de=OLDDEP1&geo=IT&geo=NL&geo=SE&geo=CH).
- [Swiss BSV three pillars](https://www.bsv.admin.ch/en/old-age-insurance-system), [OASI/AVS PAYG brochure](https://www.bsv.admin.ch/dam/en/sd-web/HPs3-Czqe8-1/BSV_AHV_BroschureA5_ENG_2026.pdf) and [occupational financing](https://www.bsv.admin.ch/en/organisation-financing-bvg).
- [Swedish Pensions Agency system overview](https://www.pensionsmyndigheten.se/other-languages/english-engelska/english-engelska/pension-system-in-sweden), [retirement rules](https://www.pensionsmyndigheten.se/other-languages/english-engelska/english-engelska/plan-your-pension) and [balancing](https://www.pensionsmyndigheten.se/forsta-din-pension/om-pensionssystemet/balanseringen-i-pensionssystemet), plus the [government brief](https://www.government.se/contentassets/c40b1026b5f64cba929445d37d0b3f12/the-swedish-pension-system-in-brief.pdf).
- [Dutch DNB three pillars](https://www.dnb.nl/en/current-economic-issues/pensions/) and [new pension system](https://www.dnb.nl/en/current-economic-issues/pensions/towards-the-new-pension-system/), plus [SVB AOW PAYG history](https://www.svb.nl/en/about-the-svb/who-we-are/history-of-social-security-schemes) and [AOW age](https://www.svb.nl/nl/aow/aow-leeftijd/uw-aow-leeftijd).
- [COVIP supplementary-pension mandate](https://www.covip.it/en/about-covip), [TFR transfer](https://www.covip.it/per-il-cittadino/educazione-previdenziale/faq/conferimento-tfr) and [automatic-enrolment glossary](https://www.covip.it/per-il-cittadino/educazione-previdenziale/glossario/adesione).

## Validation note

The JSON is intended to be consumed directly by the public site. Validate it with `jq empty public/data/international.json` or `python3 -m json.tool public/data/international.json`. The source URLs are institutional pages or an official statistical API; link checks should be repeated at build time because publishers can change page paths or PDF locations.
