# En Minutes

Interactive visualization of French minimum wage purchasing power since 1950, measured in work-minutes per everyday good.

## Features

- 30+ consumer products tracked from 1950 to present
- Composite purchasing power index (base 100 = 1960)
- **CPI inflation overlay** - toggle annual inflation rate (IPC) on the main chart
- French president timeline overlay with historical context markers
- Product explorer with sparklines and per-product detail charts
- Two-era comparison tool with searchable product selector
- **Methodology & Sources section** with clickable links to all data sources
- Bilingual FR/EN toggle
- Light/Dark mode with distinct chart color palettes per theme
- Fully static - no backend required

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
# Static output in dist/public/ - deploy anywhere (Vercel, Netlify, S3, GitHub Pages…)
```

## Data Sources

All data lives in [`client/src/lib/data.ts`](client/src/lib/data.ts):

- **SMIC rates**: INSEE ([historique du SMIC](https://www.insee.fr/fr/statistiques/1375188)), Dares
- **Product prices**: INSEE consumer price indices (IPC), INSEE prix moyens de détail, Thomas Piketty (PSE/ENS), fiche-paie.fr, Blog Didier (prix historiques), Guichet du Savoir (Bibliothèque de Lyon)
- **Interpolation**: Linear interpolation between known data points

## Automatic Data Updates

A GitHub Action runs every February 1st (or on demand) to fetch the latest INSEE price data and propose a PR with updated product prices.

### How it works

1. The script (`scripts/update-data.mjs`) fetches multiple data types:
   - **SMIC hourly rate** (idbank `000822484`): Auto-fetched from INSEE BDM - uses January value per year
   - **CPI inflation** (idbank `001759970`): IPC ensemble (base 2015) - computes annual average then YoY %
   - **Direct retail prices** (Method A): For some products, INSEE publishes actual retail prices in EUR via their ["Prix moyens annuels"](https://www.insee.fr/fr/statistiques/series/103157792) series. These are the most accurate.
   - **IPC index estimates** (Method B): For other products, the script fetches [IPC consumer price indices](https://www.insee.fr/en/information/2868055) (base 100 = 2015) and converts them to estimated prices using a known anchor price.
2. New year data points are **added** to `data.ts` - historical data is never modified
3. A Pull Request is created for human review before merging

### Manual trigger

Go to **Actions** → **Update Purchasing Power Data** → **Run workflow**

### What's auto-updated vs manual

| Method                       | Data                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SMIC hourly rate** (auto)  | Fetched from INSEE idbank `000822484`                                                                                                                               |
| **CPI inflation** (auto)     | Fetched from INSEE idbank `001759970`                                                                                                                               |
| **Direct prices** (Method A) | Tomates, oranges, pommes                                                                                                                                            |
| **IPC estimates** (Method B) | Baguette, essence, lait, bœuf, œufs, beurre, poulet, pommes de terre, sucre, pâtes, huile, camembert, vin, yaourt                                                   |
| **Manual update needed**     | Cigarettes (tax policy), cinema (CNC), médecin (CNAM), métro (RATP), café/bière (service prices), timbre (La Poste), journal, magazine, croissant, carottes, salade |

### SMIC updates

SMIC hourly rates are now **auto-fetched** from INSEE (idbank `000822484`). The script reads the January value for each year. If INSEE data is unavailable (e.g., the new rate was just published), you can add a manual override in `scripts/update-data.mjs`:

```js
const SMIC_UPDATES = {
  2027: 12.XX,  // ← manual override (takes precedence over API)
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
# Dry-run - shows what would change without modifying files
node scripts/update-data.mjs

# Write mode - updates data.ts with new data points
node scripts/update-data.mjs --write
```

## Project Structure

```
client/
  src/
    components/   # React components (Header, Hero, Charts, etc.)
    lib/
      data.ts         # All product prices, SMIC rates, inflation rates, computed minutes
      translations.ts # FR/EN translation strings
      i18n.tsx        # Language context provider
      theme.tsx       # Dark/light mode context
    pages/
      Home.tsx        # Main page layout
scripts/
  update-data.mjs     # INSEE data fetcher + data.ts updater
.github/
  workflows/
    update-data.yml   # Yearly auto-update GitHub Action
```

## License

MIT
