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
import { inflationRates, productivityIndex, ppAnnotations } from "./macroeconomics";

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
  funFactFr: string;
  funFactEn: string;
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
    fr: "Données OLAP/CLAMEUR : loyers de marché à Paris intra-muros (logements remis en location). Non représentatif des loyers nationaux ni des locataires en place.",
    en: "OLAP/CLAMEUR data: market rents in Paris intra-muros (re-let dwellings). Not representative of national rents or sitting tenants.",
  },
  loyer_national: {
    fr: "Données estimées à partir de l'IRL INSEE (indice légal de révision) et de l'Enquête Logement INSEE. Reflète le loyer moyen de marché national (nouveaux baux), non les loyers réellement payés ni les logements sociaux.",
    en: "Estimates based on INSEE IRL (legal revision index) and INSEE Housing Survey. Reflects national average market rent (new leases), not actual paid rents or social housing.",
  },
  consultation_specialiste: {
    fr: "Prix moyen d'une consultation d'ophtalmologiste en secteur 2 (avec dépassements d'honoraires). Les tarifs varient fortement selon la spécialité, le secteur et la région. Source : DREES / SNDS.",
    en: "Average ophthalmologist consultation fee in sector 2 (with excess charges). Prices vary significantly by specialty, sector and region. Source: DREES / SNDS.",
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
    funFactFr: string;
    funFactEn: string;
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
    funFactFr:
      "En 1960, il fallait 18 minutes de travail pour acheter une baguette. Aujourd'hui, environ 7 minutes suffisent.",
    funFactEn:
      "In 1960, you needed 18 work-minutes to buy a baguette. Today, about 7 minutes is enough.",
    prices: {
      1950: 0.021,
      1960: 0.067,
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
    funFactFr:
      "Le prix de l'essence en minutes de travail est remarquablement stable depuis 30 ans, autour de 10-12 minutes.",
    funFactEn:
      "The petrol price in work-minutes has been remarkably stable for 30 years, around 10-12 minutes.",
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
      2024: 1.75,
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
    funFactFr:
      "Le cinéma est devenu un luxe relatif croissant : de 57 minutes en 1950 à 49 en 2024, mais la baisse ralentit.",
    funFactEn:
      "Cinema has become a slowly growing relative luxury: from 57 min in 1950 down to 49 in 2024, but the decline is slowing.",
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
      2024: 7.5,
    },
  },
  medecin: {
    id: "medecin",
    nameFr: "Consultation médicale",
    nameEn: "Doctor visit (GP)",
    unit: "1 consultation",
    emoji: "🩺",
    category: "services",
    funFactFr:
      "Une consultation de généraliste coûtait 208 minutes de travail en 1950. En 2025, c'est environ 191 minutes.",
    funFactEn:
      "A GP consultation cost 208 work-minutes in 1950. In 2025, it's about 191 minutes.",
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
    funFactFr:
      "Le timbre a presque doublé en minutes de travail depuis 2000 : de 6 à 10 minutes, reflet du déclin du courrier papier.",
    funFactEn:
      "A stamp costs almost twice as many work-minutes as in 2000: from 6 to 10 min, reflecting the decline of paper mail.",
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
    funFactFr:
      "Un journal quotidien coûtait 13 minutes de travail en 1960 contre 21 minutes en 2024.",
    funFactEn: "A daily newspaper cost 13 work-minutes in 1960 vs 21 in 2024.",
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
    funFactFr:
      "Le ticket de métro a toujours coûté environ 8 à 14 minutes de travail - une stabilité remarquable sur 70 ans.",
    funFactEn:
      "A metro ticket has always cost about 8-14 work-minutes - remarkably stable over 70 years.",
    prices: {
      1950: 0.015,
      1960: 0.03,
      1970: 0.046,
      1980: 0.183,
      1990: 0.46,
      2000: 1.07,
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
    funFactFr:
      "Les cigarettes sont le produit qui a le plus augmenté en temps de travail : de 21 min en 1960 à 80 min en 2025.",
    funFactEn:
      "Cigarettes saw the biggest increase in work-time: from 21 min in 1960 to 80 min in 2025.",
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
    funFactFr:
      "Le lait est passé de 17 minutes de travail en 1960 à 7 minutes aujourd'hui - divisé par 2,4.",
    funFactEn:
      "Milk went from 17 work-minutes in 1960 to 7 today - divided by 2.4.",
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
    funFactFr:
      "Un kilo de bœuf coûtait 415 minutes de travail en 1960 contre 169 minutes en 2024 - 2,5 fois moins.",
    funFactEn:
      "A kilo of beef cost 415 work-minutes in 1960 vs 169 in 2024 - 2.5 times less.",
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
    funFactFr:
      "Les œufs sont passés de 50 minutes de travail la douzaine en 1960 à 20 minutes en 2024.",
    funFactEn:
      "Eggs went from 50 work-minutes per dozen in 1960 to 20 in 2024.",
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
      2025: 2.31,
    },
  },
  cafe: {
    id: "cafe",
    nameFr: "Café expresso (comptoir)",
    nameEn: "Espresso (counter)",
    unit: "1 tasse",
    emoji: "☕",
    category: "cafe_restaurant",
    funFactFr:
      "Un café au comptoir coûte environ 10-12 minutes de travail depuis 60 ans - une constante française.",
    funFactEn:
      "A counter espresso has cost about 10-12 work-minutes for 60 years - a French constant.",
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
    funFactFr:
      "La plaquette de beurre est passée de 62 min de travail en 1960 à 16 min en 2024.",
    funFactEn:
      "A 250g block of butter went from 62 work-minutes in 1960 to 16 in 2024.",
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
      2025: 1.84,
    },
  },
  croissant: {
    id: "croissant",
    nameFr: "Croissant",
    nameEn: "Croissant",
    unit: "1 pièce",
    emoji: "🥐",
    category: "alimentation",
    funFactFr:
      "Le croissant coûtait 8 minutes de travail en 1960, et 8 minutes en 2024 - un produit remarquablement stable.",
    funFactEn:
      "A croissant cost 8 work-minutes in 1960 and 8 in 2024 - remarkably stable.",
    prices: {
      1960: 0.03,
      1970: 0.061,
      1980: 0.229,
      1990: 0.53,
      2000: 0.76,
      2005: 0.85,
      2010: 0.95,
      2015: 1.0,
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
    funFactFr:
      "Le camembert est passé de 46 minutes de travail en 1960 à 16 minutes en 2024.",
    funFactEn: "Camembert went from 46 work-minutes in 1960 to 16 in 2024.",
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
      2025: 1.89,
    },
  },
  vin: {
    id: "vin",
    nameFr: "Bouteille de vin rouge",
    nameEn: "Bottle of red wine (table)",
    unit: "75cl",
    emoji: "🍷",
    category: "alimentation",
    funFactFr:
      "Une bouteille de vin de table coûtait 25 minutes de travail en 1960. En 2024 : 20 minutes.",
    funFactEn:
      "A bottle of table wine cost 25 work-minutes in 1960. In 2024: 20 min.",
    prices: {
      1960: 0.091,
      1970: 0.152,
      1980: 0.534,
      1990: 1.07,
      2000: 1.52,
      2010: 2.0,
      2015: 2.3,
      2020: 2.5,
      2024: 3.0,
    },
  },
  pommes_de_terre: {
    id: "pommes_de_terre",
    nameFr: "Kilo de pommes de terre",
    nameEn: "Kilo of potatoes",
    unit: "1 kg",
    emoji: "🥔",
    category: "alimentation",
    funFactFr:
      "Le kilo de pommes de terre est passé de 17 minutes de travail en 1960 à 10 minutes en 2024.",
    funFactEn:
      "A kilo of potatoes went from 17 work-minutes in 1960 to 10 in 2024.",
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
    funFactFr:
      "Le poulet est passé de 208 min de travail/kg en 1960 à 62 min en 2024 - divisé par plus de 3.",
    funFactEn:
      "Chicken went from 208 work-min/kg in 1960 to 62 in 2024 - divided by more than 3.",
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
    funFactFr:
      "Les pâtes sont passées de 29 minutes de travail en 1960 à 10 minutes en 2024.",
    funFactEn: "Pasta went from 29 work-minutes in 1960 to 10 in 2024.",
    prices: {
      1960: 0.107,
      1970: 0.152,
      1980: 0.381,
      1990: 0.76,
      2000: 1.07,
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
    funFactFr:
      "Le sucre est passé de 33 minutes de travail en 1960 à 10 minutes en 2024.",
    funFactEn: "Sugar went from 33 work-minutes in 1960 to 10 in 2024.",
    prices: {
      1960: 0.122,
      1970: 0.168,
      1980: 0.457,
      1990: 0.76,
      2000: 1.07,
      2010: 1.4,
      2015: 1.2,
      2020: 1.3,
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
    funFactFr:
      "L'huile de tournesol coûtait 50 minutes de travail en 1960 et 14 minutes en 2024.",
    funFactEn: "Sunflower oil cost 50 work-minutes in 1960 and 14 in 2024.",
    prices: {
      1960: 0.183,
      1970: 0.229,
      1980: 0.533,
      1990: 0.76,
      2000: 1.07,
      2010: 1.5,
      2015: 1.4,
      2020: 1.6,
      2024: 2.2,
    },
  },
  oranges: {
    id: "oranges",
    nameFr: "Kilo d'oranges",
    nameEn: "Kilo of oranges",
    unit: "1 kg",
    emoji: "🍊",
    category: "alimentation",
    funFactFr:
      "Les oranges sont passées de 41 minutes de travail en 1960 à 14 minutes en 2024.",
    funFactEn: "Oranges went from 41 work-minutes in 1960 to 14 in 2024.",
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
    funFactFr:
      "Les tomates coûtaient 46 min de travail en 1960, 18 min en 2024.",
    funFactEn: "Tomatoes cost 46 work-minutes in 1960, 18 in 2024.",
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
    funFactFr:
      "Les pommes sont passées de 33 min de travail en 1960 à 14 min en 2024.",
    funFactEn: "Apples went from 30 min in 1960 to 14 min in 2024.",
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
    funFactFr: "Une salade coûtait 13 min de travail en 1960, 8 min en 2024.",
    funFactEn: "A head of lettuce cost 13 work-minutes in 1960, 8 in 2024.",
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
    funFactFr:
      "Les carottes sont passées de 13 min de travail en 1960 à 8 min en 2024.",
    funFactEn: "Carrots went from 13 work-minutes in 1960 to 8 in 2024.",
    prices: {
      1960: 0.046,
      1970: 0.076,
      1980: 0.229,
      1990: 0.46,
      2000: 0.76,
      2010: 1.1,
      2015: 1.1,
      2020: 1.2,
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
    funFactFr:
      "Le lot de yaourts est passé de 10 min de travail en 1970 à 5 min en 2024.",
    funFactEn: "A 4-pack of yogurt went from 9 min in 1970 to 6 min in 2024.",
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
    funFactFr:
      "Un demi au comptoir coûtait 8 min de travail en 1960. En 2024 : 23 minutes - presque 3 fois plus.",
    funFactEn:
      "A draft beer cost 8 work-minutes in 1960. In 2024: 23 min - nearly 3 times more.",
    prices: {
      1960: 0.03,
      1970: 0.076,
      1980: 0.305,
      1990: 0.76,
      2000: 1.52,
      2010: 2.5,
      2015: 3.0,
      2020: 3.5,
      2024: 4.5,
    },
  },
  magazine: {
    id: "magazine",
    nameFr: "Magazine hebdomadaire",
    nameEn: "Weekly magazine",
    unit: "1 exemplaire",
    emoji: "📖",
    category: "loisirs",
    funFactFr:
      "Un magazine hebdomadaire coûtait 25 min de travail en 1960 et 13 min en 2024.",
    funFactEn: "A weekly magazine cost 25 work-minutes in 1960 and 13 in 2024.",
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
    funFactFr:
      "Le kWh d'électricité coûtait 3,8 min de travail en 1960 et seulement 1,6 min en 2024 - malgré les hausses récentes.",
    funFactEn:
      "A kWh of electricity cost 3.8 work-minutes in 1960 and only 1.6 in 2024 - despite recent price hikes.",
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
    funFactFr:
      "Le loyer au m² est passé de 61 min de travail en 1970 à 88 min en 2024 - le logement pèse de plus en plus.",
    funFactEn:
      "Rent per m² went from 61 work-minutes in 1970 to 88 in 2024 - housing weighs more and more.",
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
    funFactFr:
      "Un abonnement Internet est passé de 367 min de travail en 2000 à 208 min en 2024 - de moins en moins cher malgré un débit multiplié par 1000.",
    funFactEn:
      "An Internet subscription went from 367 work-minutes in 2000 to 208 in 2024 - cheaper despite 1000× faster speeds.",
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
    funFactFr:
      "Le forfait mobile est passé de ~480 min de travail en 2000 à ~130 min en 2024 - et la disruption Free en 2012 a divisé les prix par 3 en quelques mois.",
    funFactEn:
      "A mobile plan went from ~480 work-minutes in 2000 to ~130 in 2024 - and Free Mobile's 2012 disruption cut prices by 3× in just months.",
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
    funFactFr:
      "Un abonnement streaming standard vaut 135 min de travail au SMIC en 2024 - soit moins que le cinéma pour un mois illimité.",
    funFactEn:
      "A standard streaming subscription costs 135 work-minutes at minimum wage in 2024 - less than a cinema ticket for unlimited monthly viewing.",
    prices: {
      2014: 8.99,
      2015: 8.99,
      2016: 9.99,
      2017: 9.99,
      2018: 11.99,
      2019: 12.99,
      2020: 13.99,
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
    funFactFr:
      "Un smartphone milieu de gamme représentait ~6 200 min de travail en 2007. En 2024 : ~4 000 min - mais avec une puissance informatique incomparable.",
    funFactEn:
      "A mid-range smartphone required ~6,200 work-minutes in 2007. By 2024: ~4,000 min - but with vastly more computing power.",
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
    funFactFr:
      "1 MWh de gaz coûtait 192 min de travail en 2000. La crise énergétique de 2022 l'a fait bondir à ~1 560 min - avant un reflux partiel.",
    funFactEn:
      "1 MWh of gas cost 192 work-minutes in 2000. The 2022 energy crisis pushed it to ~1,560 min - before a partial retreat.",
    prices: {
      2000: 16.0,
      2005: 32.0,
      2008: 58.0,
      2010: 47.0,
      2012: 62.0,
      2015: 68.0,
      2019: 63.0,
      2020: 52.0,
      2021: 80.0,
      2022: 130.0,
      2023: 95.0,
      2024: 80.0,
    },
  },
  loyer_paris: {
    id: "loyer_paris",
    nameFr: "Loyer Paris (1 m² / mois)",
    nameEn: "Paris rent (1 m² / month)",
    unit: "1 m²/mois",
    emoji: "🏛️",
    category: "logement",
    funFactFr:
      "Le m² parisien est passé de ~30 min de travail en 1970 à ~370 min en 2024 - une multiplication par 12, bien plus que les salaires.",
    funFactEn:
      "Paris rent per m² went from ~30 work-minutes in 1970 to ~370 in 2024 - a 12× increase, far outpacing wages.",
    prices: {
      1970: 2.5,
      1980: 8.0,
      1990: 18.0,
      2000: 22.0,
      2005: 29.0,
      2008: 36.0,
      2010: 35.0,
      2015: 37.0,
      2018: 35.0,
      2020: 35.0,
      2022: 34.5,
      2024: 36.0,
    },
  },
  voiture_milieu_gamme: {
    id: "voiture_milieu_gamme",
    nameFr: "Voiture milieu de gamme (neuve)",
    nameEn: "Mid-range car (new)",
    unit: "1 voiture",
    emoji: "🚘",
    category: "transport",
    funFactFr:
      "Une Peugeot 205 valait ~81 000 min de travail en 1983. Sa descendante 208 en vaut ~240 000 en 2024 - le pouvoir d'achat automobile a chuté.",
    funFactEn:
      "A Peugeot 205 cost ~81,000 work-minutes in 1983. Its successor the 208 costs ~240,000 in 2024 - car purchasing power has dropped sharply.",
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
    funFactFr:
      "Le loyer moyen national au m² est passé de ~70 min de travail en 1970 à ~94 min en 2024 - moins que Paris, mais la tendance est la même.",
    funFactEn:
      "The national average rent per m² went from ~70 work-minutes in 1970 to ~94 in 2024 - less than Paris, but the trend is the same.",
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
    funFactFr:
      "Une consultation chez l'ophtalmologiste représentait ~280 min de travail en 2000. En 2024, il faut ~360 min - l'accès aux soins spécialisés se dégrade.",
    funFactEn:
      "An ophthalmologist consultation cost ~280 work-minutes in 2000. In 2024 it takes ~360 minutes - access to specialist care is getting harder.",
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

  // Use the first year with basket data as base (1960 for smic/mean, 1996 for median)
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
