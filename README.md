# En Minutes

Interactive visualization of French purchasing power since 1950, measured in work-minutes per everyday good.

## Features

- **30+ consumer products** tracked from 1950 to present (food, energy, housing, tobacco, services…)
- **Composite purchasing power index** (base 100) with multiple overlays:
  - CPI inflation rate (IPC)
  - Labour productivity (GDP per hour worked, OECD)
  - French president timeline
  - Historical context markers (Grenelle, 35h, euro, etc.)
- **Salary reference selector** — switch between SMIC (minimum wage), median salary, or mean salary
- Product explorer with sparklines, search filter, and per-product detail charts
- Two-era comparison tool with searchable product selector
- Dynamic insights section — all figures computed from data, adapts to salary reference
- Methodology & Sources section with clickable links to all data sources
- Bilingual FR/EN toggle
- Light/Dark mode with distinct chart color palettes per theme
- Fully static — no backend required

## Tech Stack

- **Vite** + **React 18** + **TypeScript**
- **shadcn/ui** + **Tailwind CSS v3**
- **Chart.js** + `chartjs-plugin-annotation` + `react-chartjs-2`
- **Framer Motion** for subtle animations

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000).

## Build & Deploy

```bash
npm run build
# Static output in dist/public/ — deploy anywhere (Vercel, Netlify, S3, GitHub Pages…)
```

## Data Sources

All data lives in [`client/src/lib/data.ts`](client/src/lib/data.ts):

- **SMIC net hourly rates**: INSEE series [000879878](https://www.insee.fr/fr/statistiques/serie/000879878) (monthly net / 151.67h for 2005+, estimated via cotisation rates for 1950–2004)
- **Mean salary**: INSEE DADS series [010752366](https://www.insee.fr/fr/statistiques/serie/010752366) (annual net EQTP / 1820h)
- **Median salary**: INSEE DADS series [010752342](https://www.insee.fr/fr/statistiques/serie/010752342) (annual net EQTP / 1820h, from 1996)
- **Product prices**: INSEE consumer price indices (IPC), INSEE prix moyens de détail, Thomas Piketty (PSE/ENS), fiche-paie.fr, Blog Didier, Guichet du Savoir (Bibliothèque de Lyon)
- **CPI inflation**: INSEE IPC ensemble series [001759970](https://www.insee.fr/fr/statistiques/serie/001759970)
- **Productivity**: OECD Productivity Levels — GDP per hour worked, constant prices ([data explorer](https://data-explorer.oecd.org/vis?lc=en&df[id]=DSD_PDB%40DF_PDB_LV&dq=FRA.A.GDPHRS..XDC_H.Q))
- **Interpolation**: Linear interpolation between known data points

## Automatic Data Updates

A GitHub Action runs every February 1st (or on demand) to fetch the latest INSEE data and propose a PR with updated prices.

### How it works

1. The script (`scripts/update-data.mjs`) fetches multiple data types:
   - **SMIC monthly net** (idbank `000879878`): Auto-fetched from INSEE BDM — uses January value per year, converted to hourly (÷ 151.67h)
   - **Mean salary** (idbank `010752366`): Annual net EQTP, converted to hourly (÷ 1820h)
   - **Median salary** (idbank `010752342`): Annual net EQTP, converted to hourly (÷ 1820h)
   - **CPI inflation** (idbank `001759970`): IPC ensemble (base 2015) — computes annual average then YoY %
   - **Direct retail prices** (Method A): For some products, INSEE publishes actual retail prices in EUR via their ["Prix moyens annuels"](https://www.insee.fr/fr/statistiques/series/103157792) series. These are the most accurate.
   - **IPC index estimates** (Method B): For other products, the script fetches [IPC consumer price indices](https://www.insee.fr/en/information/2868055) (base 100 = 2015) and converts them to estimated prices using a known anchor price.
2. New year data points are **added** to `data.ts` — historical data is never modified
3. A Pull Request is created for human review before merging
4. Includes retry logic (3 retries with exponential backoff) and data validation (SMIC range checks)

### Manual trigger

Go to **Actions** → **Update Purchasing Power Data** → **Run workflow**

### What's auto-updated vs manual

| Method                        | Data                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SMIC net hourly** (auto)    | Fetched from INSEE idbank `000879878`                                                                                                                               |
| **Mean salary** (auto)        | Fetched from INSEE idbank `010752366`                                                                                                                               |
| **Median salary** (auto)      | Fetched from INSEE idbank `010752342`                                                                                                                               |
| **CPI inflation** (auto)      | Fetched from INSEE idbank `001759970`                                                                                                                               |
| **Direct prices** (Method A)  | Tomates, oranges, pommes                                                                                                                                            |
| **IPC estimates** (Method B)  | Baguette, essence, lait, bœuf, œufs, beurre, poulet, pommes de terre, sucre, pâtes, huile, camembert, vin, yaourt                                                   |
| **Manual update needed**      | Cigarettes (tax policy), cinema (CNC), médecin (CNAM), métro (RATP), café/bière (service prices), timbre (La Poste), journal, magazine, croissant, carottes, salade, électricité, loyer, internet |

### SMIC updates

SMIC net hourly rates are **auto-fetched** from INSEE (idbank `000879878`). The script reads the monthly net value and divides by 151.67h. If INSEE data is unavailable (e.g., the new rate was just published), you can add a manual override in `scripts/update-data.mjs`:

```js
const SMIC_UPDATES = {
  2027: 9.XX,  // ← manual override (net hourly, takes precedence over API)
};
```

Then run the update script or trigger the GitHub Action.

### Adding a new product

1. Find the INSEE idbank:
   - For direct prices: search [Prix moyens](https://www.insee.fr/fr/statistiques/series/103157792)
   - For IPC indices: search [IPC series](https://www.insee.fr/fr/statistiques/series/102342213)
2. Add an entry to `DIRECT_PRICE_MAP` or `INDEX_PRICE_MAP` in `scripts/update-data.mjs`
3. Add the product to `rawProducts` in `data.ts` with historical anchor prices
4. Run `node scripts/update-data.mjs --write` to populate recent years

### Running the update locally

```bash
# Dry-run — shows what would change without modifying files
node scripts/update-data.mjs

# Write mode — updates data.ts with new data points
node scripts/update-data.mjs --write
```

## Project Structure

```
client/
  src/
    components/   # React components (Header, Hero, Charts, Insights, etc.)
    lib/
      data.ts         # All product prices, salary rates, inflation, productivity, computed minutes
      translations.ts # FR/EN translation strings
      i18n.tsx        # Language context provider
      theme.tsx       # Dark/light mode context
      salaryRef.tsx   # Salary reference context (SMIC / median / mean)
      chartColors.ts  # Theme-aware chart color helpers
    pages/
      Home.tsx        # Main page layout
scripts/
  update-data.mjs     # INSEE data fetcher + data.ts updater
.github/
  workflows/
    update-data.yml   # Yearly auto-update GitHub Action
```

## License

CC BY 4.0 — see [LICENSE](LICENSE).

Attribution required: credit Romain Coupey and link to this repository.
