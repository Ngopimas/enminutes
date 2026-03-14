#!/usr/bin/env node
/**
 * Pouvoir d'Achat - Data Update Script
 *
 * Fetches the latest SMIC rates, product prices, and CPI inflation data
 * from INSEE, then regenerates client/src/lib/data.ts with updated values.
 *
 * Usage:
 *   node scripts/update-data.mjs              # dry-run (prints what would change)
 *   node scripts/update-data.mjs --write      # write updated data.ts
 *
 * Data sources (all from INSEE SDMX API - no auth required):
 *   - SMIC monthly net:   idbank 000879878
 *   - Product prices:     IPC indices + "Prix moyens annuels" series
 *   - CPI inflation:      IPC ensemble (base 100 = 2015), idbank 001759970
 *
 * The script is intentionally conservative:
 *   - It only ADDS new years, never modifies historical data
 *   - If a fetch fails, it skips that source (no partial corruption)
 *   - All changes are logged for review before committing
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "../client/src/lib/data.ts");
const WRITE_MODE = process.argv.includes("--write");

// ─── Configuration ─────────────────────────────────────────────

/**
 * SMIC monthly net (after CSG/CRDS) - INSEE series 000879878
 * Monthly data for 151.67h (35h/week). We take January value for each year,
 * then divide by 151.67 to get the net hourly rate.
 * Source: https://www.insee.fr/fr/statistiques/serie/000879878
 */
const SMIC_IDBANK = "000879878";
const SMIC_MONTHLY_HOURS = 151.67;

/**
 * CPI inflation - IPC ensemble, base 100 = 2015, idbank 001759970
 * We compute annual averages, then year-over-year % change.
 * Source: https://www.insee.fr/fr/statistiques/serie/001759970
 */
const CPI_IDBANK = "001759970";

/**
 * Mean salary net annual EQTP (all workers) - INSEE DADS, idbank 010752366
 * Annual net salary in euros, converted to hourly by dividing by 1820h.
 * Source: https://www.insee.fr/fr/statistiques/serie/010752366
 */
const MEAN_SALARY_IDBANK = "010752366";

/**
 * Median salary net annual EQTP (all workers) - INSEE DADS, idbank 010752342
 * Annual net salary in euros, converted to hourly by dividing by 1820h.
 * Available from 1996 onward.
 * Source: https://www.insee.fr/fr/statistiques/serie/010752342
 */
const MEDIAN_SALARY_IDBANK = "010752342";

const HOURS_PER_YEAR = 1820; // Standard full-time equivalent hours

/**
 * METHOD A: Products with "Prix moyens annuels de vente au détail" series.
 * These return ACTUAL retail prices in EUR - the most accurate method.
 * idbanks from: https://www.insee.fr/fr/statistiques/series/103157792
 */
const DIRECT_PRICE_MAP = {
  tomates: { idbank: "000641464" },
  oranges: { idbank: "000641386" },
  pommes: { idbank: "000641388" },
};

/**
 * METHOD B: Products using IPC (Consumer Price Index) with anchor price calibration.
 * IPC tracks category-level price evolution (base 100 = 2015).
 * We convert to estimated prices: anchorPrice × (currentIndex / anchorIndex)
 *
 * IMPORTANT: These are ESTIMATES. The PR reviewer should check values are plausible.
 * To find idbanks: https://www.insee.fr/fr/statistiques/series/102342213
 */
const INDEX_PRICE_MAP = {
  baguette: { idbank: "001762397", anchorYear: 2015, anchorPrice: 0.86 },
  essence: { idbank: "001762471", anchorYear: 2015, anchorPrice: 1.3 },
  lait: { idbank: "001762395", anchorYear: 2015, anchorPrice: 0.87 },
  boeuf: { idbank: "001762385", anchorYear: 2015, anchorPrice: 19.5 },
  oeufs: { idbank: "001762393", anchorYear: 2015, anchorPrice: 2.2 },
  beurre: { idbank: "001762389", anchorYear: 2015, anchorPrice: 1.7 },
  poulet: { idbank: "001762387", anchorYear: 2015, anchorPrice: 7.0 },
  pommes_de_terre: { idbank: "001762399", anchorYear: 2015, anchorPrice: 1.2 },
  sucre: { idbank: "001762405", anchorYear: 2015, anchorPrice: 1.2 },
  pates: { idbank: "001762403", anchorYear: 2015, anchorPrice: 1.3 },
  huile: { idbank: "001762411", anchorYear: 2015, anchorPrice: 1.4 },
  camembert: { idbank: "001762391", anchorYear: 2015, anchorPrice: 1.9 },
  vin: { idbank: "001762413", anchorYear: 2015, anchorPrice: 2.3 },
  yaourt: { idbank: "001762415", anchorYear: 2015, anchorPrice: 0.8 },
};

// ─── INSEE API fetching ────────────────────────────────────────

const INSEE_BASE = "https://api.insee.fr/series/BDM/V1/data/SERIES_BDM";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function fetchInseeXml(idbank, startYear = 2015) {
  const url = `${INSEE_BASE}/${idbank}?startPeriod=${startYear}-01`;
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { Accept: "application/xml" },
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      if (!text || text.length < 100) throw new Error("Empty or invalid response");
      return text;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.warn(`  ⚠ Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}. Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Fetch SMIC net hourly from INSEE (monthly net / 151.67h).
 * Returns { year: rate } using the January value of each year.
 */
async function fetchSmicRates(startYear = 2015) {
  console.log(`  Fetching SMIC net monthly (${SMIC_IDBANK})...`);
  try {
    const xml = await fetchInseeXml(SMIC_IDBANK, startYear);
    const obsRegex = /TIME_PERIOD="(\d{4}-\d{2})"\s+OBS_VALUE="([^"]+)"/g;
    const byYearMonth = {};
    let match;
    while ((match = obsRegex.exec(xml)) !== null) {
      const [, period, value] = match;
      const val = parseFloat(value);
      if (!isNaN(val)) byYearMonth[period] = val;
    }

    // For each year, take the January value (when new SMIC typically takes effect)
    // Convert from monthly net to hourly net: monthly / 151.67
    const rates = {};
    for (const [period, val] of Object.entries(byYearMonth)) {
      const [yearStr, month] = period.split("-");
      const year = parseInt(yearStr);
      if (month === "01" && year >= startYear) {
        rates[year] = +(val / SMIC_MONTHLY_HOURS).toFixed(2);
      }
    }
    return rates;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch SMIC: ${err.message}`);
    return null;
  }
}

/**
 * Fetch CPI (IPC ensemble) and compute annual inflation rates (% YoY).
 */
async function fetchInflationRates(startYear = 2015) {
  console.log(`  Fetching CPI inflation (${CPI_IDBANK})...`);
  try {
    const xml = await fetchInseeXml(CPI_IDBANK, startYear - 1); // need prior year for YoY
    const obsRegex = /TIME_PERIOD="(\d{4}(?:-\d{2})?)"\s+OBS_VALUE="([^"]+)"/g;
    const monthly = {};
    let match;
    while ((match = obsRegex.exec(xml)) !== null) {
      const year = parseInt(match[1].slice(0, 4));
      const val = parseFloat(match[2]);
      if (!isNaN(val)) {
        if (!monthly[year]) monthly[year] = [];
        monthly[year].push(val);
      }
    }

    // Compute annual averages, then YoY % change
    const annualAvg = {};
    for (const [year, vals] of Object.entries(monthly)) {
      if (vals.length >= 6) {
        annualAvg[parseInt(year)] =
          vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    }

    const rates = {};
    const years = Object.keys(annualAvg)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 1; i < years.length; i++) {
      const yr = years[i];
      const prevAvg = annualAvg[years[i - 1]];
      const curAvg = annualAvg[yr];
      if (prevAvg && curAvg && yr >= startYear) {
        rates[yr] = +((curAvg / prevAvg - 1) * 100).toFixed(1);
      }
    }
    return rates;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch CPI inflation: ${err.message}`);
    return null;
  }
}

/**
 * Fetch direct annual prices from INSEE "Prix moyens annuels" series.
 */
async function fetchDirectPrices(idbank, startYear = 2015) {
  console.log(`  Fetching INSEE ${idbank} (direct prices)...`);
  try {
    const xml = await fetchInseeXml(idbank, startYear);
    const obsRegex = /TIME_PERIOD="(\d{4})"\s+OBS_VALUE="([^"]+)"/g;
    const prices = {};
    let match;
    while ((match = obsRegex.exec(xml)) !== null) {
      const year = parseInt(match[1]);
      const val = parseFloat(match[2]);
      if (!isNaN(val) && year >= startYear) {
        prices[year] = +val.toFixed(2);
      }
    }
    return Object.keys(prices).length > 0 ? prices : null;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${idbank}: ${err.message}`);
    return null;
  }
}

/**
 * Fetch monthly IPC index values and return annual averages.
 */
async function fetchInseeAnnualIndex(idbank, startYear = 2015) {
  console.log(`  Fetching INSEE ${idbank} (IPC index)...`);
  try {
    const xml = await fetchInseeXml(idbank, startYear);
    const obsRegex = /TIME_PERIOD="(\d{4}(?:-\d{2})?)"\s+OBS_VALUE="([^"]+)"/g;
    const monthly = {};
    let match;
    while ((match = obsRegex.exec(xml)) !== null) {
      const year = parseInt(match[1].slice(0, 4));
      const val = parseFloat(match[2]);
      if (!isNaN(val)) {
        if (!monthly[year]) monthly[year] = [];
        monthly[year].push(val);
      }
    }

    const annual = {};
    for (const [year, values] of Object.entries(monthly)) {
      const yr = parseInt(year);
      if (yr < startYear || values.length < 6) continue;
      annual[yr] = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(
        2,
      );
    }
    return Object.keys(annual).length > 0 ? annual : null;
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch ${idbank}: ${err.message}`);
    return null;
  }
}

function indexToPrice(indexByYear, anchorYear, anchorPrice) {
  const baseIndex = indexByYear[anchorYear];
  if (!baseIndex) return {};
  const prices = {};
  for (const [year, idx] of Object.entries(indexByYear)) {
    prices[parseInt(year)] = +((anchorPrice * idx) / baseIndex).toFixed(2);
  }
  return prices;
}

// ─── data.ts parsing and updating ─────────────────────────────

function readDataFile() {
  return readFileSync(DATA_FILE, "utf-8");
}

function extractPrices(content, productId) {
  const productRegex = new RegExp(
    `${productId}:\\s*\\{[^}]*prices:\\s*\\{([^}]+)\\}`,
    "s",
  );
  const match = content.match(productRegex);
  if (!match) return null;
  const prices = {};
  const pairRegex = /(\d{4})\s*:\s*([\d.]+)/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    prices[parseInt(m[1])] = parseFloat(m[2]);
  }
  return prices;
}

function extractSmicRates(content) {
  const match = content.match(/smicRates[^{]*\{([^}]+)\}/s);
  if (!match) return {};
  const rates = {};
  const pairRegex = /(\d{4})\s*:\s*([\d.]+)/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    rates[parseInt(m[1])] = parseFloat(m[2]);
  }
  return rates;
}

function extractSalaryRates(content, varName) {
  const regex = new RegExp(`${varName}[^{]*\\{([\\s\\S]*?)\\};`, "m");
  const match = content.match(regex);
  if (!match) return {};
  const rates = {};
  const pairRegex = /(\d{4})\s*:\s*([\d.]+)/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    rates[parseInt(m[1])] = parseFloat(m[2]);
  }
  return rates;
}

function replaceSalaryRates(content, varName, newRates) {
  const formatted = formatBlock(newRates);
  const regex = new RegExp(`(${varName}[^{]*)\\{[\\s\\S]*?\\}`, "m");
  return content.replace(regex, `$1${formatted}`);
}

function extractInflationRates(content) {
  const match = content.match(/inflationRates[^{]*\{([^}]+)\}/s);
  if (!match) return {};
  const rates = {};
  const pairRegex = /(\d{4})\s*:\s*([\d.]+)/g;
  let m;
  while ((m = pairRegex.exec(match[1])) !== null) {
    rates[parseInt(m[1])] = parseFloat(m[2]);
  }
  return rates;
}

function formatPrices(prices) {
  const sorted = Object.entries(prices).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );
  return "{" + sorted.map(([y, p]) => `${y}:${p}`).join(",") + "}";
}

function formatBlock(data, perLine = 5) {
  const sorted = Object.entries(data).sort(
    ([a], [b]) => parseInt(a) - parseInt(b),
  );
  const lines = [];
  for (let i = 0; i < sorted.length; i += perLine) {
    const chunk = sorted.slice(i, i + perLine);
    lines.push("  " + chunk.map(([y, r]) => `${y}:${r}`).join(", "));
  }
  return "{\n" + lines.join(",\n") + "\n}";
}

function replacePrices(content, productId, newPrices) {
  const formatted = formatPrices(newPrices);
  const regex = new RegExp(
    `(${productId}:\\s*\\{[^}]*prices:\\s*)\\{[^}]+\\}`,
    "s",
  );
  return content.replace(regex, `$1${formatted}`);
}

function replaceSmicRates(content, newRates) {
  const formatted = formatBlock(newRates);
  return content.replace(/(smicRates[^{]*)\{[^}]+\}/s, `$1${formatted}`);
}

function replaceInflationRates(content, newRates) {
  const formatted = formatBlock(newRates);
  return content.replace(/(inflationRates[^{]*)\{[^}]+\}/s, `$1${formatted}`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("Pouvoir d'Achat - Data Updater");
  console.log("==============================\n");

  let content = readDataFile();
  const changes = [];
  const currentYear = new Date().getFullYear();

  // 1. Update SMIC rates (automatically from INSEE API)
  console.log("Step 1: SMIC net hourly rates (INSEE 000879878)");
  const existingSmicRates = extractSmicRates(content);
  const maxSmicYear = Math.max(...Object.keys(existingSmicRates).map(Number));
  console.log(`  Current data: up to ${maxSmicYear}`);

  const fetchedSmic = await fetchSmicRates(maxSmicYear);
  if (fetchedSmic) {
    let smicUpdated = false;
    for (const [year, rate] of Object.entries(fetchedSmic)) {
      const yr = parseInt(year);
      if (!existingSmicRates[yr]) {
        existingSmicRates[yr] = rate;
        changes.push(`SMIC: added ${yr} → ${rate} €/h`);
        smicUpdated = true;
      }
    }
    if (smicUpdated) {
      // Validate: net hourly should be reasonable (between 5€ and 20€ for recent years)
      for (const [year, rate] of Object.entries(existingSmicRates)) {
        const yr = parseInt(year);
        if (yr >= 2005 && (rate < 5 || rate > 20)) {
          console.error(`  ✘ SMIC validation failed: ${yr} → ${rate} €/h is out of range [5-20]. Skipping SMIC update.`);
          smicUpdated = false;
          break;
        }
      }
      if (smicUpdated) content = replaceSmicRates(content, existingSmicRates);
    } else {
      console.log("  No new SMIC rates available.");
    }
  }

  // 2. Update mean salary rates (INSEE DADS)
  console.log("\nStep 2a: Mean salary net hourly (INSEE 010752366)");
  const existingMeanRates = extractSalaryRates(content, "meanSalaryRates");
  const maxMeanYear =
    Object.keys(existingMeanRates).length > 0
      ? Math.max(...Object.keys(existingMeanRates).map(Number))
      : 2024;
  console.log(`  Current data: up to ${maxMeanYear}`);

  try {
    console.log(`  Fetching mean salary (${MEAN_SALARY_IDBANK})...`);
    const meanXml = await fetchInseeXml(MEAN_SALARY_IDBANK, maxMeanYear);
    const meanObsRegex = /TIME_PERIOD="(\d{4})"\s+OBS_VALUE="([^"]+)"/g;
    let meanMatch;
    let meanUpdated = false;
    while ((meanMatch = meanObsRegex.exec(meanXml)) !== null) {
      const year = parseInt(meanMatch[1]);
      const annualNet = parseFloat(meanMatch[2]);
      if (!isNaN(annualNet) && year > maxMeanYear && year <= currentYear) {
        const hourly = +(annualNet / HOURS_PER_YEAR).toFixed(2);
        existingMeanRates[year] = hourly;
        changes.push(`Mean salary: added ${year} → ${hourly} €/h (from ${annualNet} €/year)`);
        meanUpdated = true;
      }
    }
    if (meanUpdated) {
      content = replaceSalaryRates(content, "meanSalaryRates", existingMeanRates);
    } else {
      console.log("  No new mean salary data available.");
    }
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch mean salary: ${err.message}`);
  }

  // 2b. Update median salary rates (INSEE DADS)
  console.log("\nStep 2b: Median salary net hourly (INSEE 010752342)");
  const existingMedianRates = extractSalaryRates(content, "medianSalaryRates");
  const maxMedianYear =
    Object.keys(existingMedianRates).length > 0
      ? Math.max(...Object.keys(existingMedianRates).map(Number))
      : 2024;
  console.log(`  Current data: up to ${maxMedianYear}`);

  try {
    console.log(`  Fetching median salary (${MEDIAN_SALARY_IDBANK})...`);
    const medianXml = await fetchInseeXml(MEDIAN_SALARY_IDBANK, maxMedianYear);
    const medianObsRegex = /TIME_PERIOD="(\d{4})"\s+OBS_VALUE="([^"]+)"/g;
    let medianMatch;
    let medianUpdated = false;
    while ((medianMatch = medianObsRegex.exec(medianXml)) !== null) {
      const year = parseInt(medianMatch[1]);
      const annualNet = parseFloat(medianMatch[2]);
      if (!isNaN(annualNet) && year > maxMedianYear && year <= currentYear) {
        const hourly = +(annualNet / HOURS_PER_YEAR).toFixed(2);
        existingMedianRates[year] = hourly;
        changes.push(`Median salary: added ${year} → ${hourly} €/h (from ${annualNet} €/year)`);
        medianUpdated = true;
      }
    }
    if (medianUpdated) {
      content = replaceSalaryRates(content, "medianSalaryRates", existingMedianRates);
    } else {
      console.log("  No new median salary data available.");
    }
  } catch (err) {
    console.warn(`  ⚠ Failed to fetch median salary: ${err.message}`);
  }

  // 3. Update CPI inflation rates
  console.log("\nStep 2: CPI inflation (INSEE 001759970)");
  const existingInflation = extractInflationRates(content);
  const maxInflationYear =
    Object.keys(existingInflation).length > 0
      ? Math.max(...Object.keys(existingInflation).map(Number))
      : 2024;
  console.log(`  Current data: up to ${maxInflationYear}`);

  const fetchedInflation = await fetchInflationRates(maxInflationYear);
  if (fetchedInflation) {
    let inflationUpdated = false;
    for (const [year, rate] of Object.entries(fetchedInflation)) {
      const yr = parseInt(year);
      if (
        yr > maxInflationYear &&
        yr <= currentYear &&
        !existingInflation[yr]
      ) {
        existingInflation[yr] = rate;
        changes.push(`Inflation: added ${yr} → ${rate}%`);
        inflationUpdated = true;
      }
    }
    if (inflationUpdated) {
      content = replaceInflationRates(content, existingInflation);
    } else {
      console.log("  No new inflation data available.");
    }
  }

  // 3. Update product prices - Method A (direct prices)
  console.log('\nStep 3a: Direct retail prices (INSEE "Prix moyens annuels")');

  for (const [productId, config] of Object.entries(DIRECT_PRICE_MAP)) {
    console.log(`\n  [${productId}] - direct prices`);

    const existingPrices = extractPrices(content, productId);
    if (!existingPrices) {
      console.warn(
        `  ⚠ Could not find product "${productId}" in data.ts - skipping`,
      );
      continue;
    }

    const maxYear = Math.max(...Object.keys(existingPrices).map(Number));
    console.log(`  Current data: up to ${maxYear}`);

    if (maxYear >= currentYear) {
      console.log(`  Already up to date.`);
      continue;
    }

    const newPrices = await fetchDirectPrices(config.idbank);
    if (!newPrices) {
      console.log(`  No new data from INSEE.`);
      continue;
    }

    let updated = false;
    for (const [year, price] of Object.entries(newPrices)) {
      if (year > maxYear && year <= currentYear) {
        existingPrices[year] = price;
        changes.push(`${productId}: added ${year} → ${price} € (direct price)`);
        updated = true;
      }
    }

    if (updated) {
      content = replacePrices(content, productId, existingPrices);
      console.log(`  ✓ Updated.`);
    } else {
      console.log(`  No new years available.`);
    }
  }

  // 4. Update product prices - Method B (IPC index estimates)
  console.log("\n\nStep 3b: IPC index-based estimates");
  console.log(
    "  ℹ These are estimates from category indices - review before merging.\n",
  );

  for (const [productId, config] of Object.entries(INDEX_PRICE_MAP)) {
    console.log(`\n  [${productId}] - IPC estimate`);

    const existingPrices = extractPrices(content, productId);
    if (!existingPrices) {
      console.warn(
        `  ⚠ Could not find product "${productId}" in data.ts - skipping`,
      );
      continue;
    }

    const maxYear = Math.max(...Object.keys(existingPrices).map(Number));
    console.log(`  Current data: up to ${maxYear}`);

    if (maxYear >= currentYear) {
      console.log(`  Already up to date.`);
      continue;
    }

    const indexData = await fetchInseeAnnualIndex(
      config.idbank,
      config.anchorYear,
    );
    if (!indexData) {
      console.log(`  No new data from INSEE.`);
      continue;
    }

    const estimatedPrices = indexToPrice(
      indexData,
      config.anchorYear,
      config.anchorPrice,
    );
    let updated = false;

    for (const [year, price] of Object.entries(estimatedPrices)) {
      if (year > maxYear && year <= currentYear) {
        existingPrices[year] = price;
        changes.push(`${productId}: added ${year} → ${price} € (IPC estimate)`);
        updated = true;
      }
    }

    if (updated) {
      content = replacePrices(content, productId, existingPrices);
      console.log(`  ✓ Updated.`);
    } else {
      console.log(`  No new years available.`);
    }
  }

  // 5. Summary
  console.log("\n\n══════════════════════════════════");
  if (changes.length === 0) {
    console.log("No changes detected. Data is up to date.");
  } else {
    console.log(`${changes.length} changes detected:\n`);
    for (const c of changes) {
      console.log(`  + ${c}`);
    }

    if (WRITE_MODE) {
      writeFileSync(DATA_FILE, content, "utf-8");
      console.log(`\n✓ Written to ${DATA_FILE}`);
    } else {
      console.log("\n⚠ Dry run - use --write to save changes.");
    }
  }

  // 6. Manual products checklist
  const MANUAL_SOURCES = {
    cigarettes: "DGDDI / Tabac Info Service",
    cinema:     "CNC (Centre national du cinéma)",
    medecin:    "Assurance Maladie / CNAM",
    metro:      "RATP / Île-de-France Mobilités",
    timbre:     "La Poste (tarifs en vigueur)",
    journal:    "Prix éditeur (ex: Le Monde, Le Figaro)",
    magazine:   "Prix éditeur / kiosque",
    cafe:       "Enquête prix services (INSEE / secteur)",
    biere:      "Enquête prix services (INSEE / secteur)",
    internet:   "ARCEP / opérateurs (offres entrée de gamme)",
    electricite:"EDF / CRE (tarifs réglementés)",
    loyer:      "OLAP / CLAMEUR / INSEE Enquête Logement",
    baguette_tradition: "Fédération des boulangers (si applicable)",
    gaz:             "CRE / DGEC (tarifs réglementés ou prix spot marché)",
    loyer_paris:     "OLAP Paris / CLAMEUR (m² Paris intra-muros)",
    forfait_mobile:  "ARCEP / opérateurs (forfait 5-10 Go entrée de gamme)",
    streaming:       "Netflix France (abonnement standard)",
    smartphone:      "GSM Arena / Lesnumeriques (milieu de gamme référence)",
    voiture_milieu_gamme: "Peugeot France (prix catalogue neuf, gamme 205→208)",
  };

  const allProductIds = [
    ...content.matchAll(/^\s+(\w+):\s*\{[^}]*id:\s*["'](\w+)["']/gm),
  ].map((m) => m[2]);
  const autoIds = new Set([
    ...Object.keys(DIRECT_PRICE_MAP),
    ...Object.keys(INDEX_PRICE_MAP),
  ]);
  const manualProducts = allProductIds.filter((id) => !autoIds.has(id));

  // Find last known year for each manual product
  function getLastYear(productId) {
    const re = new RegExp(
      `id:\\s*["']${productId}["'][\\s\\S]*?prices:\\s*\\{([^}]+)\\}`,
      "m",
    );
    const m = content.match(re);
    if (!m) return "?";
    const years = [...m[1].matchAll(/(\d{4}):/g)].map((x) => Number(x[1]));
    return years.length ? Math.max(...years) : "?";
  }

  console.log("\n\n════════════════════════════════════");
  console.log("MANUAL PRODUCTS — reviewer checklist");
  console.log("════════════════════════════════════");
  for (const id of manualProducts) {
    const lastYear = getLastYear(id);
    const source = MANUAL_SOURCES[id] ?? "source à vérifier";
    console.log(`- [ ] ${id} (last: ${lastYear}) — ${source}`);
  }
  console.log("");

  return changes.length;
}

main()
  .then((n) => {
    process.exit(n > 0 && !WRITE_MODE ? 1 : 0);
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(2);
  });
