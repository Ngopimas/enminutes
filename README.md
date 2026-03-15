# En Minutes

Live: [ngopimas.github.io/enminutes](https://ngopimas.github.io/enminutes/)

---

## Overview

A baguette costs around €1.20 today. But is that expensive? Compared to what?

Raw prices are deceiving. In 1960, a baguette cost the equivalent of €0.07 - which sounds absurdly cheap, until you realize the net minimum wage was €0.22/h. That baguette took **18 minutes of work** to earn. Today, with a net SMIC of €9.52/h, it takes **7 minutes**.

_En Minutes_ converts every price into minutes of work at a given salary - a unit that cuts through inflation, currency changes, and seven decades of economic shifts. It tracks 35+ everyday goods in France from the 1950s to today, against SMIC, median salary, or mean salary, and presents the results as interactive items and charts.

---

## Features

- **35+ consumer products** tracked from 1950 to present
- **Three salary references**: SMIC (minimum wage), median salary, mean salary
- **Composite purchasing power index** (base 100 in 1960) with overlays:
  - CPI inflation rate
  - Labour productivity (OECD GDP per hour worked)
  - French presidential timeline
  - Historical context markers (Grenelle, 35h, euro, 2008 crisis…)
- **Per-product detail modal** with:
  - Two-era comparison + year range slider
  - Confidence bands for IPC-estimated products (±5%)
  - Pre-1970 shading for higher-uncertainty estimates
  - Inflection annotations (oil shock, Free Mobile, IRL spike…)
  - Data quality badge (actual / IPC estimate / manual)
  - Dynamic "Did you know?" fun fact that updates with the selected years
  - Share button (copies fun fact + deep link encoding ref and year range)
  - Download chart as PNG
- **Product explorer**: sparklines, search, category tabs, trend filter (↗ ↘ →)
- **Shareable deep links**: `/#/product/baguette?ref=median&from=1980&to=2024`
- **Embed mode**: `?embed=1` renders a stripped-down single-product card for iframes
- **Dynamic Insights**: top 3 most improved and most degraded products, adapts to salary reference
- **Methodology & Sources** section with links to all data sources
- Bilingual FR/EN, light/dark mode
- Fully static - no backend required

---

## Tech Stack

| Layer     | Libraries                                            |
| --------- | ---------------------------------------------------- |
| Build     | Vite 7 + TypeScript                                  |
| UI        | React 18, shadcn/ui, Tailwind CSS v3, Radix UI       |
| Charts    | Chart.js, chartjs-plugin-annotation, react-chartjs-2 |
| Routing   | wouter (hash router)                                 |
| Animation | Framer Motion                                        |
| Testing   | Vitest                                               |

---

## Getting Started

```bash
npm install
npm run dev       # dev server on http://localhost:5000
npm run build     # static output → dist/public/
npm run check     # TypeScript type-check
npm run test      # Vitest unit tests
```

---

## Project Structure

```
client/
  src/
    components/
      Header.tsx                  # Language / salary ref / theme toggles
      Hero.tsx                    # Animated intro with featured product rotation
      PurchasingPowerIndex.tsx    # Main composite index chart
      ProductExplorer.tsx         # Sparkline grid with filters
      ProductModal.tsx            # Per-product detail chart + comparison
      Insights.tsx                # Dynamic top 3 improved / degraded
      BasketComposition.tsx       # Basket weights table
      Sources.tsx                 # Methodology & sources cards
      ui/                         # shadcn/ui primitives + ErrorBoundary
    lib/
      data.ts                     # Re-export barrel (imports everything below)
      salary-rates.ts             # SMIC, mean, median hourly rates + DATA_START/END_YEAR
      calculations.ts             # interpolate(), computeMinutes()
      macroeconomics.ts           # inflationRates, productivityIndex, historicalEvents
      products.ts                 # rawProducts, basketWeights, getDynamicFunFact()…
      translations.ts             # FR/EN strings
      i18n.tsx                    # Language context
      theme.tsx                   # Dark/light mode context
      salaryRef.tsx               # Salary reference context
      chartColors.ts              # Theme-aware palette helpers
      constants.ts                # EURO_TO_FRANC, MOBILE_BREAKPOINT
    pages/
      Home.tsx                    # Root layout, embed mode detection
scripts/
  update-data.mjs                 # INSEE data fetcher + file updater
.github/
  workflows/
    update-data.yml               # Annual GitHub Action (runs 1 Feb)
```

---

## Data Sources

Salary and macroeconomic series are fetched automatically from INSEE. Product prices use three methods:

| Method                | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| **A - Direct prices** | INSEE "Prix moyens annuels de vente au détail" - actual retail prices in EUR |
| **B - IPC estimate**  | IPC consumer price index (base 100 = 2015) anchored to a known 2015 price    |
| **C - IRL estimate**  | INSEE IRL rent revision index anchored to a known 2015 market rent           |
| **Manual**            | Maintained from public sources (tariff tables, press releases, surveys)      |

### What is updated automatically vs. manually

> The update script (`scripts/update-data.mjs`) only **adds** new year entries - it never modifies historical values.

| Data                                                                                                              | Method          | Source / idbank                                                |
| ----------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------- |
| SMIC net hourly                                                                                                   | Auto            | INSEE `000879878` - January monthly net ÷ 151.67h              |
| Mean salary net hourly                                                                                            | Auto            | INSEE DADS `010752366` - annual net EQTP ÷ 1820h               |
| Median salary net hourly                                                                                          | Auto            | INSEE DADS `010752342` - annual net EQTP ÷ 1820h (from 1996)   |
| CPI inflation                                                                                                     | Auto            | INSEE IPC `001759970` - annual average, YoY % change           |
| Tomates, oranges, pommes                                                                                          | Auto - Method A | INSEE Prix moyens `000641464`, `000641386`, `000641388`        |
| Baguette, essence, lait, bœuf, œufs, beurre, poulet, pommes de terre, sucre, pâtes, huile, camembert, vin, yaourt | Auto - Method B | INSEE IPC indices (see `INDEX_PRICE_MAP` in `update-data.mjs`) |
| Loyer national moyen                                                                                              | Auto - Method C | INSEE IRL `001515333` - anchor €12.0/m² in 2015                |
| **Cigarettes**                                                                                                    | Manual          | DGDDI / Tabac Info Service                                     |
| **Cinéma**                                                                                                        | Manual          | CNC (Centre national du cinéma)                                |
| **Médecin généraliste**                                                                                           | Manual          | Assurance Maladie / CNAM                                       |
| **Consultation spécialiste**                                                                                      | Manual          | DREES / SNDS (ophtalmologiste secteur 2)                       |
| **Métro Paris**                                                                                                   | Manual          | RATP / Île-de-France Mobilités                                 |
| **Timbre**                                                                                                        | Manual          | La Poste (tarifs en vigueur)                                   |
| **Journal**                                                                                                       | Manual          | Prix éditeur                                                   |
| **Café**                                                                                                          | Manual          | Enquête prix services INSEE                                    |
| **Électricité**                                                                                                   | Manual          | EDF / CRE (tarifs réglementés)                                 |
| **Gaz**                                                                                                           | Manual          | CRE / DGEC                                                     |
| **Loyer Paris**                                                                                                   | Manual          | OLAP Paris / CLAMEUR                                           |
| **Internet (box)**                                                                                                | Manual          | ARCEP / opérateurs                                             |
| **Forfait mobile**                                                                                                | Manual          | ARCEP / opérateurs                                             |
| **Streaming**                                                                                                     | Manual          | Netflix France                                                 |
| **Smartphone**                                                                                                    | Manual          | GSMArena / Lesnumériques                                       |
| **Voiture milieu de gamme**                                                                                       | Manual          | Peugeot France (205 → 208)                                     |

### Reviewer checklist

When the annual GitHub Action opens a PR, all **Manual** rows above must be verified. The update script prints a checklist at the end of its run:

```
MANUAL PRODUCTS - reviewer checklist
- [ ] cigarettes (last: 2024) - DGDDI / Tabac Info Service
- [ ] cinema (last: 2024) - CNC (Centre national du cinéma)
...
```

---

## Automatic Data Updates

A GitHub Action runs every **February 1st** (or on demand) to fetch fresh INSEE data and open a PR for review.

### Trigger manually

**Actions → Update Purchasing Power Data → Run workflow**

### Run locally

```bash
# Dry-run - prints what would change without writing any files
node scripts/update-data.mjs

# Write mode - updates the three data files
node scripts/update-data.mjs --write
```

In write mode, the script updates:

- `client/src/lib/salary-rates.ts` - SMIC, mean, and median rates
- `client/src/lib/macroeconomics.ts` - annual CPI inflation rates
- `client/src/lib/products.ts` - product prices (Methods A, B, C)

### Adding a new auto-updated product

1. Find the INSEE idbank:
   - Direct prices: [Prix moyens annuels](https://www.insee.fr/fr/statistiques/series/103157792)
   - IPC indices: [IPC series browser](https://www.insee.fr/fr/statistiques/series/102342213)
2. Add an entry to `DIRECT_PRICE_MAP` or `INDEX_PRICE_MAP` in `scripts/update-data.mjs`
3. Add the product to `rawProducts` in `client/src/lib/products.ts` with historical anchor prices
4. Run `node scripts/update-data.mjs --write` to populate recent years

---

## Testing

```bash
npm run test
```

14 unit tests covering:

- `interpolate()` edge cases
- `computeMinutes()` for each salary reference
- Basket / composite purchasing power index computation
- Data integrity (no missing years, no negative prices, valid salary rates)

---

## License

[CC BY 4.0](LICENSE) - attribution required: credit **Romain Coupey** and link to this repository.
