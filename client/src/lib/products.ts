// ============================================================
// Products, categories, basket weights, and purchasing power
// ============================================================

import {
  SalaryRef,
  smicRates,
  medianSalaryRates,
  meanSalaryRates,
  DATA_START_YEAR,
  DATA_END_YEAR,
  getRatesForRef,
} from "./salary-rates";
import { interpolate, computeMinutes } from "./calculations";
import {
  inflationRates,
  productivityIndex,
  ppAnnotations,
} from "./macroeconomics";

// ── Product interface ──────────────────────────────────────
export type ProductDataType = "actual" | "ipc_estimate" | "manual";

export interface ProductInflection {
  year: number;
  labelFr: string;
  labelEn: string;
}

export interface Product {
  id: string;
  nameFr: string;
  nameEn: string;
  unit: string;
  emoji: string;
  category: string;
  prices: Record<number, number>;
  pricesInterp: Record<number, number>;
  minutes: Record<number, number>;
  minutesMedian: Record<number, number>;
  minutesMean: Record<number, number>;
  years: number[];
  dataType: ProductDataType;
  source?: string;
  disclaimerFr?: string;
  disclaimerEn?: string;
  inflections?: ProductInflection[];
}

export interface Category {
  nameFr: string;
  nameEn: string;
  emoji: string;
}

// ── Source labels per product ──────────────────────────────
const PRODUCT_SOURCES: Record<string, string> = {
  baguette: "INSEE IPC 04.1.1.1",
  essence: "INSEE IPC 07.2.2",
  lait: "INSEE IPC 01.1.4.1",
  boeuf: "INSEE IPC 01.1.2.1",
  oeufs: "INSEE IPC 01.1.7",
  beurre: "INSEE IPC 01.1.5.1",
  poulet: "INSEE IPC 01.1.2.2",
  pommes_de_terre: "INSEE IPC 01.1.6.1",
  sucre: "INSEE IPC 01.1.8.1",
  pates: "INSEE IPC 01.1.3.1",
  huile: "INSEE IPC 01.1.5.2",
  camembert: "INSEE IPC 01.1.4.2",
  vin: "INSEE IPC 02.1.1",
  yaourt: "INSEE IPC 01.1.4.1",
  tomates: "INSEE Prix moyens à la consommation",
  oranges: "INSEE Prix moyens à la consommation",
  pommes: "INSEE Prix moyens à la consommation",
  cigarettes: "DGDDI / Tabac Info Service",
  cinema: "CNC",
  medecin: "Assurance Maladie",
  metro: "RATP / IDF Mobilités",
  timbre: "La Poste",
  journal: "Prix éditeur",
  cafe: "Enquête prix services INSEE",
  electricite: "EDF / CRE",
  loyer: "OLAP / CLAMEUR",
  internet: "ARCEP / opérateurs",
  gaz: "CRE / DGEC",
  loyer_paris: "OLAP Paris / CLAMEUR",
  loyer_national: "INSEE IRL / INSEE Enquête Logement",
  consultation_specialiste: "DREES / Assurance Maladie (SNDS)",
  forfait_mobile: "ARCEP / opérateurs",
  streaming: "Netflix France",
  smartphone: "GSMArena / Lesnumériques",
  voiture_milieu_gamme: "Peugeot France",
};

// ── Inflection points per product ─────────────────────────
const PRODUCT_INFLECTIONS: Record<string, ProductInflection[]> = {
  forfait_mobile: [
    { year: 2012, labelFr: "Free Mobile −65%", labelEn: "Free Mobile −65%" },
  ],
  smartphone: [{ year: 2007, labelFr: "1er iPhone", labelEn: "1st iPhone" }],
  streaming: [
    { year: 2014, labelFr: "Netflix France", labelEn: "Netflix FR launch" },
  ],
  essence: [
    {
      year: 1970,
      labelFr: "Choc pétrolier",
      labelEn: "Oil shock",
    },
  ],
  gaz: [{ year: 2022, labelFr: "Crise énergie", labelEn: "Energy crisis" }],
  cigarettes: [
    { year: 2004, labelFr: "Hausse fiscale", labelEn: "Tax hike" },
    { year: 2017, labelFr: "Plan Buzyn", labelEn: "Buzyn Plan" },
  ],
  loyer_paris: [
    { year: 2015, labelFr: "Encadrement loyers", labelEn: "Rent control" },
    {
      year: 2019,
      labelFr: "Encadrement rétabli",
      labelEn: "Rent control reinstated",
    },
  ],
  loyer_national: [
    { year: 2006, labelFr: "IRL remplace ICC", labelEn: "IRL replaces ICC" },
    {
      year: 2022,
      labelFr: "Hausse IRL +6,5%",
      labelEn: "IRL +6.5% (inflation spike)",
    },
  ],
  consultation_specialiste: [
    {
      year: 2012,
      labelFr: "Contrats secteur optionnel",
      labelEn: "Optional sector contracts",
    },
    {
      year: 2017,
      labelFr: "Accord dépassements",
      labelEn: "Fee excess reform",
    },
  ],
  baguette: [{ year: 2022, labelFr: "Hausse blé +60%", labelEn: "Wheat +60%" }],
  voiture_milieu_gamme: [
    { year: 2020, labelFr: "Virage électrique", labelEn: "EV shift" },
  ],
};

// ── Product-level disclaimers ──────────────────────────────
const PRODUCT_DISCLAIMERS: Record<string, { fr: string; en: string }> = {
  loyer_paris: {
    fr: "Données OLAP\u202F: loyers moyens de l'ensemble du parc privé à Paris intra-muros (hors charges). Source\u202F: rapports annuels OLAP (Tableaux n°10 et n°12). Ces chiffres incluent les locataires en place et les nouveaux baux.",
    en: "OLAP data: average rents for all private housing in Paris intra-muros (excl. charges). Source: OLAP annual reports (Tables 10 & 12). These figures include sitting tenants and new leases.",
  },
  loyer_national: {
    fr: "Données estimées à partir de l'IRL INSEE et de l'Enquête Logement INSEE. Loyer hors charges, tous baux confondus. Les plateformes d'annonces (LocService) indiquent des moyennes plus élevées (charges comprises).",
    en: "Estimates based on INSEE IRL and INSEE Housing Survey. Rent excluding charges, all leases. Listing platforms (LocService) report higher averages (charges included).",
  },
  consultation_specialiste: {
    fr: "Honoraires moyens d'un ophtalmologiste en secteur 2 (dépassements inclus). Fourchette observée\u202F: 40–100\u202F€. Ce chiffre reflète la tranche haute\u202F; le tarif conventionnel secteur 1 est de 30\u202F€. Source\u202F: DREES / SNDS.",
    en: "Average ophthalmologist fee in sector 2 (excess charges included). Observed range: €40–100. This figure reflects the upper range; the sector 1 convention rate is €30. Source: DREES / SNDS.",
  },
};

/** Generate a dynamic fun fact for a product based on current salary reference */
export function getDynamicFunFact(
  product: Product,
  ref: SalaryRef,
  lang: "fr" | "en",
  yearA?: number,
  yearB?: number,
): string {
  const mins = getMinutes(product, ref);
  const years = getYearsForRef(product, ref);
  if (years.length < 2) return "";

  const first = yearA ?? years[0];
  const last = yearB ?? years[years.length - 1];
  const minFirstRaw = Math.round(mins[first]);
  const minLastRaw = Math.round(mins[last]);
  const wentDown = minLastRaw < minFirstRaw;
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const minFirst = minFirstRaw.toLocaleString(locale);
  const minLast = minLastRaw.toLocaleString(locale);

  if (lang === "fr") {
    if (wentDown) {
      return `En ${first}, il fallait ${minFirst} minutes de travail pour acheter 1 ${product.nameFr.toLowerCase()}. En ${last}, environ ${minLast} minutes suffisent.`;
    }
    return `En ${first}, il fallait ${minFirst} minutes de travail pour 1 ${product.nameFr.toLowerCase()}. En ${last}, il en faut ${minLast}.`;
  }
  if (wentDown) {
    return `In ${first}, you needed ${minFirst} work-minutes to buy 1 ${product.nameEn.toLowerCase()}. In ${last}, about ${minLast} minutes is enough.`;
  }
  return `In ${first}, it took ${minFirst} work-minutes for 1 ${product.nameEn.toLowerCase()}. In ${last}, it takes ${minLast}.`;
}

/** Get the minutes record for a product given a salary reference */
export function getMinutes(
  product: Product,
  ref: SalaryRef,
): Record<number, number> {
  switch (ref) {
    case "median":
      return product.minutesMedian;
    case "mean":
      return product.minutesMean;
    default:
      return product.minutes;
  }
}

/** Get years that have data for a given salary reference */
export function getYearsForRef(product: Product, ref: SalaryRef): number[] {
  const mins = getMinutes(product, ref);
  return Object.keys(mins)
    .map(Number)
    .sort((a, b) => a - b);
}

// ── Raw product prices ─────────────────────────────────────
const rawProducts: Record<
  string,
  {
    id: string;
    nameFr: string;
    nameEn: string;
    unit: string;
    emoji: string;
    category: string;
    prices: Record<number, number>;
  }
> = {
  baguette: {
    id: "baguette",
    nameFr: "Baguette de pain",
    nameEn: "Baguette (250g)",
    unit: "250g",
    emoji: "🥖",
    category: "alimentation",
    prices: {
      1950: 0.021,
      1960: 0.05,
      1970: 0.084,
      1980: 0.255,
      1990: 0.479,
      1995: 0.58,
      2000: 0.64,
      2005: 0.75,
      2010: 0.84,
      2015: 0.86,
      2020: 0.89,
      2024: 1.02,
    },
  },
  essence: {
    id: "essence",
    nameFr: "Litre d'essence SP95",
    nameEn: "Litre of petrol (SP95)",
    unit: "1L",
    emoji: "⛽",
    category: "transport",
    prices: {
      1950: 0.072,
      1960: 0.157,
      1970: 0.175,
      1980: 0.469,
      1990: 0.786,
      2000: 1.14,
      2005: 1.16,
      2010: 1.42,
      2015: 1.3,
      2020: 1.3,
      2024: 1.78,
      2025: 1.61,
    },
  },
  cinema: {
    id: "cinema",
    nameFr: "Place de cinéma",
    nameEn: "Cinema ticket",
    unit: "1 place",
    emoji: "🎬",
    category: "services",
    prices: {
      1950: 0.105,
      1960: 0.284,
      1970: 0.729,
      1980: 2.459,
      1990: 4.787,
      2000: 5.9,
      2005: 6.4,
      2010: 6.5,
      2015: 6.8,
      2020: 7.0,
      2024: 7.42,
    },
  },
  medecin: {
    id: "medecin",
    nameFr: "Consultation médicale",
    nameEn: "Doctor visit (GP)",
    unit: "1 consultation",
    emoji: "🩺",
    category: "services",
    prices: {
      1950: 0.381,
      1960: 1.282,
      1970: 2.542,
      1980: 6.555,
      1990: 13.72,
      2000: 17.53,
      2005: 20.0,
      2010: 23.0,
      2017: 25.0,
      2024: 26.5,
      2025: 30.0,
    },
  },
  timbre: {
    id: "timbre",
    nameFr: "Timbre-poste",
    nameEn: "Postage stamp",
    unit: "1 timbre",
    emoji: "📮",
    category: "communication",
    prices: {
      1950: 0.023,
      1960: 0.038,
      1970: 0.061,
      1980: 0.213,
      1990: 0.351,
      2000: 0.46,
      2005: 0.53,
      2010: 0.58,
      2015: 0.76,
      2020: 1.16,
      2024: 1.49,
    },
  },
  journal: {
    id: "journal",
    nameFr: "Journal quotidien",
    nameEn: "Daily newspaper",
    unit: "1 exemplaire",
    emoji: "📰",
    category: "communication",
    prices: {
      1960: 0.046,
      1970: 0.076,
      1980: 0.381,
      1990: 0.76,
      2000: 1.07,
      2010: 1.3,
      2020: 2.4,
      2024: 3.2,
    },
  },
  metro: {
    id: "metro",
    nameFr: "Ticket de métro Paris",
    nameEn: "Paris metro ticket",
    unit: "1 ticket",
    emoji: "🚇",
    category: "transport",
    // Corrected 1960, 1970, 1990: original values used carnet (reduced) prices
    // Source: STIF via Le Miroir de Rufus, Le Monde oct. 1980, Wikipedia ticket t+
    prices: {
      1950: 0.015,
      1960: 0.064,
      1970: 0.076,
      1980: 0.229,
      1990: 0.69,
      2000: 1.14,
      2005: 1.4,
      2010: 1.6,
      2015: 1.8,
      2020: 1.9,
      2024: 2.15,
      2025: 2.5,
    },
  },
  cigarettes: {
    id: "cigarettes",
    nameFr: "Paquet de cigarettes",
    nameEn: "Pack of cigarettes (20)",
    unit: "20 cigarettes",
    emoji: "🚬",
    category: "tabac",
    prices: {
      1960: 0.076,
      1970: 0.122,
      1980: 0.381,
      1990: 1.5,
      2000: 3.2,
      2005: 5.0,
      2010: 5.65,
      2015: 7.0,
      2020: 10.2,
      2024: 12.0,
      2025: 12.5,
    },
  },
  lait: {
    id: "lait",
    nameFr: "Litre de lait",
    nameEn: "Litre of milk",
    unit: "1L",
    emoji: "🥛",
    category: "alimentation",
    prices: {
      1960: 0.061,
      1970: 0.091,
      1980: 0.305,
      1990: 0.53,
      2000: 0.7,
      2005: 0.75,
      2010: 0.85,
      2015: 0.87,
      2020: 0.95,
      2024: 1.1,
    },
  },
  boeuf: {
    id: "boeuf",
    nameFr: "Kilo de bœuf",
    nameEn: "Kilo of beef (sirloin)",
    unit: "1 kg",
    emoji: "🥩",
    category: "alimentation",
    prices: {
      1960: 1.52,
      1970: 2.74,
      1980: 6.86,
      1990: 12.2,
      2000: 15.24,
      2010: 18,
      2015: 19.5,
      2020: 22,
      2024: 26,
      2025: 25.99,
    },
  },
  oeufs: {
    id: "oeufs",
    nameFr: "Douzaine d'œufs",
    nameEn: "Dozen eggs",
    unit: "12 œufs",
    emoji: "🥚",
    category: "alimentation",
    prices: {
      1960: 0.183,
      1970: 0.305,
      1980: 0.762,
      1990: 1.22,
      2000: 1.6,
      2005: 1.8,
      2010: 2,
      2015: 2.2,
      2020: 2.5,
      2024: 3,
      2025: 3.1,
    },
  },
  cafe: {
    id: "cafe",
    nameFr: "Café expresso (comptoir)",
    nameEn: "Espresso (counter)",
    unit: "1 tasse",
    emoji: "☕",
    category: "cafe_restaurant",
    prices: {
      1960: 0.038,
      1970: 0.076,
      1980: 0.305,
      1990: 0.76,
      2000: 1.07,
      2010: 1.4,
      2015: 1.5,
      2020: 1.6,
      2024: 1.8,
    },
  },
  beurre: {
    id: "beurre",
    nameFr: "Beurre (250g)",
    nameEn: "Butter (250g)",
    unit: "250g",
    emoji: "🧈",
    category: "alimentation",
    // Corrected 2025: 1.84€ was the margarine price, not butter
    // Source: FranceAgriMer, INSEE IPC beurre (base 2015=100, indice 171.2 en 2024)
    prices: {
      1960: 0.228,
      1970: 0.343,
      1980: 0.762,
      1990: 1.14,
      2000: 1.34,
      2010: 1.63,
      2015: 1.7,
      2020: 2.13,
      2024: 2.5,
      2025: 2.9,
    },
  },
  croissant: {
    id: "croissant",
    nameFr: "Croissant",
    nameEn: "Croissant",
    unit: "1 pièce",
    emoji: "🥐",
    category: "alimentation",
    // Corrected 2000: INSEE série 000442619 gives 0.54€ (original 0.76€ was +41%)
    // 2005, 2010 also adjusted downward to match corrected trajectory
    prices: {
      1960: 0.03,
      1970: 0.061,
      1980: 0.229,
      1990: 0.53,
      2000: 0.54,
      2005: 0.65,
      2010: 0.8,
      2015: 0.95,
      2020: 1.1,
      2024: 1.25,
    },
  },
  camembert: {
    id: "camembert",
    nameFr: "Camembert (250g)",
    nameEn: "Camembert (250g)",
    unit: "250g",
    emoji: "🧀",
    category: "alimentation",
    prices: {
      1960: 0.168,
      1970: 0.305,
      1980: 0.762,
      1990: 1.37,
      2000: 1.52,
      2010: 1.8,
      2015: 1.9,
      2020: 2.1,
      2024: 2.4,
      2025: 2.3,
    },
  },
  vin: {
    id: "vin",
    nameFr: "Bouteille de vin rouge",
    nameEn: "Bottle of red wine (table)",
    unit: "75cl",
    emoji: "🍷",
    category: "alimentation",
    // Corrected: harmonized to table wine in bottle (75cl) throughout
    // Source: INSEE Annuaire 1961 (1,39 FRF/L → 1,04 FRF/75cl), Ordre Spontané (déc. 2001: 0,94€/75cl)
    prices: {
      1960: 0.159,
      1970: 0.24,
      1980: 0.6,
      1990: 1.07,
      2000: 0.94,
      2010: 1.3,
      2015: 1.5,
      2020: 1.7,
      2024: 2.2,
    },
  },
  pommes_de_terre: {
    id: "pommes_de_terre",
    nameFr: "Kilo de pommes de terre",
    nameEn: "Kilo of potatoes",
    unit: "1 kg",
    emoji: "🥔",
    category: "alimentation",
    prices: {
      1960: 0.061,
      1970: 0.076,
      1980: 0.229,
      1990: 0.46,
      2000: 0.76,
      2010: 1.1,
      2015: 1.2,
      2020: 1.3,
      2024: 1.6,
    },
  },
  poulet: {
    id: "poulet",
    nameFr: "Kilo de poulet",
    nameEn: "Kilo of chicken",
    unit: "1 kg",
    emoji: "🍗",
    category: "alimentation",
    prices: {
      1960: 0.762,
      1970: 1.22,
      1980: 3.05,
      1990: 5.34,
      2000: 5.8,
      2010: 6.5,
      2015: 7,
      2020: 8,
      2024: 9.5,
    },
  },
  pates: {
    id: "pates",
    nameFr: "Kilo de pâtes",
    nameEn: "Kilo of pasta",
    unit: "1 kg",
    emoji: "🍝",
    category: "alimentation",
    // Pre-2010 corrected: original values were for 500g, not 1kg
    // Source: INSEE Annuaire 1961 (1,91 FRF/kg), Ordre Spontané (déc. 2001: 1,48€/kg)
    prices: {
      1960: 0.24,
      1970: 0.34,
      1980: 0.76,
      1990: 1.15,
      2000: 1.45,
      2010: 1.5,
      2015: 1.3,
      2020: 1.4,
      2024: 1.6,
    },
  },
  sucre: {
    id: "sucre",
    nameFr: "Kilo de sucre",
    nameEn: "Kilo of sugar",
    unit: "1 kg",
    emoji: "🍬",
    category: "alimentation",
    // Corrected 2010, 2015, 2020: sugar was stable at ~0.85–1.00€/kg before 2022 spike
    // Source: INSEE IPC sucre, FranceAgriMer
    prices: {
      1960: 0.122,
      1970: 0.168,
      1980: 0.457,
      1990: 0.76,
      2000: 1.07,
      2010: 0.95,
      2015: 0.9,
      2020: 0.95,
      2024: 1.5,
    },
  },
  huile: {
    id: "huile",
    nameFr: "Huile de tournesol (1L)",
    nameEn: "Sunflower oil (1L)",
    unit: "1L",
    emoji: "🌻",
    category: "alimentation",
    prices: {
      1960: 0.183,
      1970: 0.229,
      1980: 0.533,
      1990: 0.76,
      2000: 1.07,
      2010: 1.5,
      2015: 1.4,
      2020: 1.1,
      2024: 1.8,
    },
  },
  oranges: {
    id: "oranges",
    nameFr: "Kilo d'oranges",
    nameEn: "Kilo of oranges",
    unit: "1 kg",
    emoji: "🍊",
    category: "alimentation",
    prices: {
      1960: 0.152,
      1970: 0.229,
      1980: 0.534,
      1990: 1.07,
      2000: 1.52,
      2010: 2,
      2015: 2.1,
      2020: 2.3,
      2024: 2.8,
      2025: 2.72,
    },
  },
  tomates: {
    id: "tomates",
    nameFr: "Kilo de tomates",
    nameEn: "Kilo of tomatoes",
    unit: "1 kg",
    emoji: "🍅",
    category: "alimentation",
    prices: {
      1960: 0.183,
      1970: 0.305,
      1980: 0.61,
      1990: 1.22,
      2000: 1.98,
      2010: 2.8,
      2015: 2.5,
      2020: 3,
      2024: 3.5,
      2025: 3.6,
    },
  },
  pommes: {
    id: "pommes",
    nameFr: "Kilo de pommes",
    nameEn: "Kilo of apples",
    unit: "1 kg",
    emoji: "🍎",
    category: "alimentation",
    prices: {
      1960: 0.122,
      1970: 0.183,
      1980: 0.457,
      1990: 0.91,
      2000: 1.52,
      2010: 2.2,
      2015: 2.1,
      2020: 2.4,
      2024: 2.8,
      2025: 3.02,
    },
  },
  salade: {
    id: "salade",
    nameFr: "Salade (pièce)",
    nameEn: "Head of lettuce",
    unit: "1 pièce",
    emoji: "🥬",
    category: "alimentation",
    prices: {
      1960: 0.046,
      1970: 0.076,
      1980: 0.229,
      1990: 0.46,
      2000: 0.76,
      2010: 1.2,
      2015: 1.0,
      2020: 1.1,
      2024: 1.3,
    },
  },
  carottes: {
    id: "carottes",
    nameFr: "Kilo de carottes",
    nameEn: "Kilo of carrots",
    unit: "1 kg",
    emoji: "🥕",
    category: "alimentation",
    // Corrected 1960/1970: original values were transposed from salade
    // Source: INSEE Annuaire 1961 (Paris: 1,18 FRF/kg = 0,18€), INSEE série 000641422
    prices: {
      1960: 0.18,
      1970: 0.28,
      1980: 0.38,
      1990: 0.55,
      2000: 0.85,
      2010: 1.25,
      2015: 1.35,
      2020: 1.55,
      2024: 1.5,
    },
  },
  yaourt: {
    id: "yaourt",
    nameFr: "Yaourt nature (lot de 4)",
    nameEn: "Plain yogurt (4-pack)",
    unit: "lot de 4",
    emoji: "🥄",
    category: "alimentation",
    prices: {
      1970: 0.076,
      1980: 0.229,
      1990: 0.46,
      2000: 0.65,
      2010: 0.75,
      2015: 0.8,
      2020: 0.85,
      2024: 1.1,
    },
  },
  biere: {
    id: "biere",
    nameFr: "Bière (demi, comptoir)",
    nameEn: "Draft beer (25cl, counter)",
    unit: "25cl",
    emoji: "🍺",
    category: "cafe_restaurant",
    // Corrected: 1960 (+53%), 1980 (+25%), 2000 (+25%), 2015/2020/2024 lowered to INSEE national avg
    // Source: TCMA/INSEE, INSEE série 000806957, Assemblée nationale rapport 2025
    prices: {
      1960: 0.046,
      1970: 0.076,
      1980: 0.381,
      1990: 0.76,
      2000: 1.9,
      2010: 2.5,
      2015: 2.6,
      2020: 3.0,
      2024: 3.5,
    },
  },
  magazine: {
    id: "magazine",
    nameFr: "Magazine hebdomadaire",
    nameEn: "Weekly magazine",
    unit: "1 exemplaire",
    emoji: "📖",
    category: "loisirs",
    prices: {
      1960: 0.091,
      1970: 0.183,
      1980: 0.533,
      1990: 0.991,
      2000: 0.991,
      2010: 1.0,
      2020: 1.9,
      2024: 2.5,
    },
  },
  electricite: {
    id: "electricite",
    nameFr: "Électricité (1 kWh)",
    nameEn: "Electricity (1 kWh)",
    unit: "1 kWh",
    emoji: "⚡",
    category: "logement",
    prices: {
      1960: 0.014,
      1970: 0.018,
      1980: 0.046,
      1990: 0.087,
      2000: 0.11,
      2005: 0.113,
      2010: 0.119,
      2015: 0.152,
      2020: 0.158,
      2024: 0.252,
    },
  },
  loyer: {
    id: "loyer",
    nameFr: "Loyer (1 m² / mois)",
    nameEn: "Rent (1 m² / month)",
    unit: "1 m²/mois",
    emoji: "🏠",
    category: "logement",
    prices: {
      1970: 0.46,
      1980: 1.83,
      1990: 4.57,
      2000: 6.71,
      2005: 8.8,
      2010: 10.5,
      2015: 11.5,
      2020: 12.5,
      2024: 13.5,
    },
  },
  internet: {
    id: "internet",
    nameFr: "Abonnement Internet (box)",
    nameEn: "Internet subscription (box)",
    unit: "1 mois",
    emoji: "📶",
    category: "communication",
    prices: {
      2000: 30.0,
      2005: 29.9,
      2010: 29.9,
      2015: 29.9,
      2020: 30.0,
      2024: 32.0,
    },
  },
  forfait_mobile: {
    id: "forfait_mobile",
    nameFr: "Forfait mobile (5-10 Go)",
    nameEn: "Mobile plan (5-10 GB)",
    unit: "1 mois",
    emoji: "📱",
    category: "communication",
    prices: {
      2000: 40.0,
      2005: 35.0,
      2008: 32.0,
      2010: 30.0,
      2011: 30.0,
      2012: 9.99,
      2013: 9.99,
      2015: 12.0,
      2018: 10.0,
      2020: 9.99,
      2022: 10.99,
      2024: 12.99,
    },
  },
  streaming: {
    id: "streaming",
    nameFr: "Streaming vidéo (abonnement standard)",
    nameEn: "Video streaming (standard plan)",
    unit: "1 mois",
    emoji: "🎬",
    category: "loisirs",
    // Source: Le Figaro, PhonAndroid, Frandroid, Presse-Citron (historique Netflix France)
    // Corrected: 2017–2020 were shifted by one year in original data
    prices: {
      2014: 8.99,
      2015: 9.99,
      2016: 9.99,
      2017: 10.99,
      2018: 10.99,
      2019: 11.99,
      2020: 11.99,
      2021: 13.49,
      2022: 13.49,
      2023: 13.49,
      2024: 13.49,
    },
  },
  smartphone: {
    id: "smartphone",
    nameFr: "Smartphone milieu de gamme",
    nameEn: "Mid-range smartphone",
    unit: "1 appareil",
    emoji: "📲",
    category: "communication",
    prices: {
      2007: 499.0,
      2008: 450.0,
      2010: 350.0,
      2012: 280.0,
      2014: 300.0,
      2016: 320.0,
      2018: 350.0,
      2020: 370.0,
      2022: 399.0,
      2024: 429.0,
    },
  },
  gaz: {
    id: "gaz",
    nameFr: "Gaz naturel (1 MWh, usage résidentiel)",
    nameEn: "Natural gas (1 MWh, residential)",
    unit: "1 MWh",
    emoji: "🔥",
    category: "logement",
    // Source: SDES / Ministère de la Transition Écologique (rapports 2020 & 2024)
    // Corrected: 2000 (+25%), 2019 (+30%), 2020 (+48%), 2024 (+63%) vs originals
    prices: {
      2000: 20.0,
      2005: 32.0,
      2008: 50.0,
      2010: 52.0,
      2012: 65.0,
      2015: 68.0,
      2019: 82.0,
      2020: 77.0,
      2021: 80.0,
      2022: 96.0,
      2023: 115.0,
      2024: 130.0,
    },
  },
  loyer_paris: {
    id: "loyer_paris",
    nameFr: "Loyer Paris (1 m² / mois)",
    nameEn: "Paris rent (1 m² / month)",
    unit: "1 m²/mois",
    emoji: "🏛️",
    category: "logement",
    // OLAP official data: "ensemble du parc privé, Paris intra-muros"
    // Source: OLAP rapports Paris 2009, 2011, 2024 (Tableau n°12 / Tableau 10)
    prices: {
      1997: 12.4,
      2000: 13.1,
      2005: 16.3,
      2008: 18.4,
      2010: 19.7,
      2015: 22.3,
      2018: 22.9,
      2020: 23.7,
      2022: 24.1,
      2024: 25.5,
    },
  },
  voiture_milieu_gamme: {
    id: "voiture_milieu_gamme",
    nameFr: "Voiture milieu de gamme (neuve)",
    nameEn: "Mid-range car (new)",
    unit: "1 voiture",
    emoji: "🚘",
    category: "transport",
    prices: {
      1983: 6800.0,
      1990: 8000.0,
      1995: 9500.0,
      2000: 10900.0,
      2005: 12500.0,
      2009: 13900.0,
      2012: 15200.0,
      2015: 16500.0,
      2018: 17900.0,
      2020: 19200.0,
      2022: 21500.0,
      2024: 23500.0,
    },
  },
  loyer_national: {
    id: "loyer_national",
    nameFr: "Loyer national moyen (1 m² / mois)",
    nameEn: "National avg. rent (1 m² / month)",
    unit: "1 m²/mois",
    emoji: "🏘️",
    category: "logement",
    // Anchor: ~12.0 €/m² in 2015 (INSEE Enquête Logement + OLAP national)
    // 2006–2024: projected via INSEE IRL quarterly index (idbank 001515333)
    // Pre-2006: projected via ICC (Indice du Coût de la Construction)
    prices: {
      1970: 0.46,
      1975: 0.75,
      1980: 1.5,
      1985: 2.7,
      1990: 4.2,
      1995: 5.6,
      2000: 6.7,
      2005: 8.4,
      2008: 10.2,
      2010: 10.9,
      2012: 11.6,
      2015: 12.0,
      2018: 12.4,
      2020: 12.7,
      2022: 13.2,
      2024: 14.2,
    },
  },
  consultation_specialiste: {
    id: "consultation_specialiste",
    nameFr: "Consultation ophtalmologiste",
    nameEn: "Ophthalmologist consultation",
    unit: "1 consultation",
    emoji: "👁️",
    category: "services",
    // Source: DREES Données statistiques sur les professions libérales de santé
    // Average total fee (secteur 2, dépassements d'honoraires inclus)
    prices: {
      1990: 25.0,
      1995: 33.0,
      2000: 43.0,
      2005: 52.0,
      2010: 61.0,
      2013: 65.0,
      2015: 68.0,
      2017: 72.0,
      2019: 82.0,
      2021: 87.0,
      2023: 92.0,
      2024: 95.0,
    },
  },
};

// ── Data source classification ─────────────────────────────
// actual: direct INSEE retail prices (Prix moyens annuels)
// ipc_estimate: anchor price × (current IPC / anchor IPC)
// manual: manually maintained from public sources
const IPC_ESTIMATE_PRODUCTS = new Set([
  "baguette",
  "essence",
  "lait",
  "boeuf",
  "oeufs",
  "beurre",
  "poulet",
  "pommes_de_terre",
  "sucre",
  "pates",
  "huile",
  "camembert",
  "vin",
  "yaourt",
]);
const ACTUAL_PRICE_PRODUCTS = new Set(["tomates", "oranges", "pommes"]);

// ── Process all products ───────────────────────────────────
export const products: Record<string, Product> = {};
for (const [key, prod] of Object.entries(rawProducts)) {
  const pricesInterp = interpolate(prod.prices);
  const minutes = computeMinutes(pricesInterp);
  const minutesMedian = computeMinutes(pricesInterp, medianSalaryRates);
  const minutesMean = computeMinutes(pricesInterp, meanSalaryRates);
  const dataType: ProductDataType = ACTUAL_PRICE_PRODUCTS.has(key)
    ? "actual"
    : IPC_ESTIMATE_PRODUCTS.has(key)
      ? "ipc_estimate"
      : "manual";
  products[key] = {
    ...prod,
    pricesInterp,
    minutes,
    minutesMedian,
    minutesMean,
    years: Object.keys(minutes)
      .map(Number)
      .sort((a, b) => a - b),
    dataType,
    source: PRODUCT_SOURCES[key],
    disclaimerFr: PRODUCT_DISCLAIMERS[key]?.fr,
    disclaimerEn: PRODUCT_DISCLAIMERS[key]?.en,
    inflections: PRODUCT_INFLECTIONS[key],
  };
}

// ── Categories ─────────────────────────────────────────────
export const categories: Record<string, Category> = {
  alimentation: { nameFr: "Alimentation", nameEn: "Food", emoji: "🛒" },
  cafe_restaurant: {
    nameFr: "Café & Restaurant",
    nameEn: "Café & Restaurant",
    emoji: "☕",
  },
  transport: { nameFr: "Transport", nameEn: "Transport", emoji: "🚗" },
  tabac: { nameFr: "Tabac", nameEn: "Tobacco", emoji: "🚬" },
  services: { nameFr: "Services", nameEn: "Services", emoji: "🏥" },
  logement: {
    nameFr: "Logement & Énergie",
    nameEn: "Housing & Energy",
    emoji: "🏠",
  },
  communication: {
    nameFr: "Communication",
    nameEn: "Communication",
    emoji: "📬",
  },
  loisirs: { nameFr: "Loisirs", nameEn: "Leisure", emoji: "🎭" },
};

// ── Featured products for hero rotation ────────────────────
export const featuredProducts = [
  "baguette",
  "cigarettes",
  "essence",
  "cinema",
  "metro",
  "cafe",
  "boeuf",
  "lait",
  "forfait_mobile",
  "streaming",
];

// ── Composite Purchasing Power Index ────────────────────────
export const basketWeights: Record<string, number> = {
  baguette: 3,
  lait: 2,
  oeufs: 2,
  boeuf: 1,
  poulet: 1,
  beurre: 1,
  pates: 1,
  pommes_de_terre: 1,
  sucre: 1,
  cafe: 2,
  essence: 2,
  metro: 2,
  cinema: 1,
  journal: 1,
  cigarettes: 0,
  timbre: 1,
  medecin: 1,
  electricite: 1,
  loyer: 0,
  internet: 0,
  forfait_mobile: 0,
  streaming: 0,
  gaz: 0,
  loyer_paris: 0,
  loyer_national: 0,
  consultation_specialiste: 0,
  smartphone: 0,
  voiture_milieu_gamme: 0,
};

const indexBaseYear = 1960;
const indexYears: number[] = [];
for (let y = 1960; y <= DATA_END_YEAR; y++) {
  if (smicRates[y]) indexYears.push(y);
}

export function computeBasketMinutes(
  year: number,
  ref: SalaryRef = "smic",
): number | null {
  let totalWeightedMinutes = 0;
  let totalWeight = 0;
  let maxWeight = 0;
  for (const [pid, w] of Object.entries(basketWeights)) {
    if (w === 0) continue;
    const prod = products[pid];
    if (!prod) continue;
    maxWeight += w;
    const mins = getMinutes(prod, ref);
    if (mins[year] === undefined) continue;
    totalWeightedMinutes += mins[year] * w;
    totalWeight += w;
  }
  if (totalWeight === 0 || totalWeight / maxWeight < 0.8) return null;
  return totalWeightedMinutes / totalWeight;
}

/** Compute purchasing power data for any salary reference */
export function computePurchasingPowerForRef(ref: SalaryRef) {
  const rates = getRatesForRef(ref);
  const refYears: number[] = [];
  for (let y = DATA_START_YEAR; y <= DATA_END_YEAR; y++) {
    if (rates[y]) refYears.push(y);
  }

  // Use the first year with basket data as base (1960 for smic/mean/median)
  const baseYr =
    refYears.find((y) => y >= 1960 && computeBasketMinutes(y, ref) !== null) ??
    refYears[0];

  const bmy: Record<number, number> = {};
  const ppIdx: Record<number, number> = {};
  const base = computeBasketMinutes(baseYr, ref);

  refYears.forEach((y) => {
    const m = computeBasketMinutes(y, ref);
    if (m !== null && base !== null) {
      bmy[y] = +m.toFixed(2);
      ppIdx[y] = +((base / m) * 100).toFixed(1);
    }
  });

  let latest = refYears[refYears.length - 1];
  for (let i = refYears.length - 1; i >= 0; i--) {
    if (ppIdx[refYears[i]] !== undefined) {
      latest = refYears[i];
      break;
    }
  }
  const latIdx = ppIdx[latest];
  const mult = latIdx ? (latIdx / 100).toFixed(1) : "?";

  return {
    indexYears: refYears.filter((y) => ppIdx[y] !== undefined),
    indexBaseYear: baseYr,
    basketMinutesByYear: bmy,
    purchasingPowerIndex: ppIdx,
    multiplier: mult,
    latestIndexYear: latest,
    latestIndex: latIdx,
  };
}

const basketMinutesByYear: Record<number, number> = {};
const purchasingPowerIndex: Record<number, number> = {};
const baseMinutes = computeBasketMinutes(indexBaseYear);

indexYears.forEach((y) => {
  const m = computeBasketMinutes(y);
  if (m !== null && baseMinutes !== null) {
    basketMinutesByYear[y] = +m.toFixed(2);
    purchasingPowerIndex[y] = +((baseMinutes / m) * 100).toFixed(1);
  }
});

let latestIndexYear = indexYears[indexYears.length - 1];
for (let i = indexYears.length - 1; i >= 0; i--) {
  if (purchasingPowerIndex[indexYears[i]] !== undefined) {
    latestIndexYear = indexYears[i];
    break;
  }
}
const latestIndex = purchasingPowerIndex[latestIndexYear];
const multiplier = latestIndex ? (latestIndex / 100).toFixed(1) : "?";

export const purchasingPower = {
  indexYears,
  indexBaseYear,
  basketMinutesByYear,
  purchasingPowerIndex,
  multiplier,
  latestIndexYear,
  latestIndex,
  ppAnnotations,
  inflationRates,
  productivityIndex,
};
