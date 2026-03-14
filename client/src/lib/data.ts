// ============================================================
// Pouvoir d'Achat - Data Module (TypeScript ES Module)
// All prices in euros, hourly rates, minutes of work
// ============================================================

// ── Salary reference types ─────────────────────────────────
export type SalaryRef = "smic" | "median" | "mean";

// ── SMIC hourly net rates (euros) ──────────────────────────
// All three salary references now use NET hourly rates for consistent comparison.
// 2005+: INSEE series 000879878 (SMIC net monthly for 151.67h / 151.67)
// 1950-2004: SMIC brut × (1 − cotisations salariales estimées)
// Cotisation sources: Sécurité sociale, IPP, INSEE séries longues
export const smicRates: Record<number, number> = {
  1950: 0.11,
  1951: 0.11,
  1952: 0.14,
  1953: 0.14,
  1954: 0.14,
  1955: 0.18,
  1956: 0.18,
  1957: 0.18,
  1958: 0.2,
  1959: 0.21,
  1960: 0.22,
  1961: 0.23,
  1962: 0.24,
  1963: 0.26,
  1964: 0.27,
  1965: 0.27,
  1966: 0.29,
  1967: 0.29,
  1968: 0.31,
  1969: 0.42,
  1970: 0.45,
  1971: 0.49,
  1972: 0.53,
  1973: 0.61,
  1974: 0.73,
  1975: 0.91,
  1976: 1.04,
  1977: 1.18,
  1978: 1.33,
  1979: 1.48,
  1980: 1.69,
  1981: 1.94,
  1982: 2.35,
  1983: 2.63,
  1984: 2.91,
  1985: 3.12,
  1986: 3.33,
  1987: 3.4,
  1988: 3.52,
  1989: 3.64,
  1990: 3.74,
  1991: 3.94,
  1992: 4.03,
  1993: 4.15,
  1994: 4.25,
  1995: 4.34,
  1996: 4.46,
  1997: 4.57,
  1998: 4.75,
  1999: 4.84,
  2000: 4.91,
  2001: 5.06,
  2002: 5.27,
  2003: 5.4,
  2004: 5.68,
  2005: 6.31,
  2006: 6.3,
  2007: 6.5,
  2008: 6.63,
  2009: 6.84,
  2010: 6.96,
  2011: 7.07,
  2012: 7.23,
  2013: 7.39,
  2014: 7.44,
  2015: 7.49,
  2016: 7.53,
  2017: 7.59,
  2018: 7.74,
  2019: 7.94,
  2020: 8.03,
  2021: 8.11,
  2022: 8.37,
  2023: 8.92,
  2024: 9.22,
  2025: 9.4,
  2026: 9.51,
};

export const DATA_START_YEAR = Math.min(...Object.keys(smicRates).map(Number));
export const DATA_END_YEAR = Math.max(...Object.keys(smicRates).map(Number));

// ── Mean salary net hourly rates (euros) ────────────────────
// Source: INSEE DADS (idbank 010752366), annual net EQTP / 1820h
export const meanSalaryRates: Record<number, number> = {
  1950: 0.23,
  1951: 0.26,
  1952: 0.31,
  1953: 0.31,
  1954: 0.34,
  1955: 0.38,
  1956: 0.42,
  1957: 0.46,
  1958: 0.52,
  1959: 0.55,
  1960: 0.6,
  1961: 0.65,
  1962: 0.72,
  1963: 0.79,
  1964: 0.84,
  1965: 0.89,
  1966: 0.94,
  1967: 0.99,
  1968: 1.09,
  1969: 1.21,
  1970: 1.32,
  1971: 1.47,
  1972: 1.62,
  1973: 1.81,
  1974: 2.12,
  1975: 2.43,
  1976: 2.82,
  1977: 3.11,
  1978: 3.52,
  1979: 3.82,
  1980: 4.35,
  1981: 4.93,
  1982: 5.6,
  1983: 6.19,
  1984: 6.64,
  1985: 7.11,
  1986: 7.49,
  1987: 7.69,
  1988: 7.92,
  1989: 8.27,
  1990: 8.7,
  1991: 9.01,
  1992: 9.24,
  1993: 9.47,
  1994: 9.62,
  1995: 9.88,
  1996: 10.02,
  1997: 10.23,
  1998: 10.41,
  1999: 10.63,
  2000: 10.86,
  2001: 11.09,
  2002: 11.34,
  2003: 11.56,
  2004: 11.81,
  2005: 12.15,
  2006: 12.35,
  2007: 12.74,
  2008: 13.15,
  2009: 13.33,
  2010: 13.61,
  2011: 13.94,
  2012: 14.14,
  2013: 14.24,
  2014: 14.37,
  2015: 14.54,
  2016: 14.61,
  2017: 14.94,
  2018: 15.26,
  2019: 15.52,
  2020: 14.93,
  2021: 15.56,
  2022: 16.38,
  2023: 17.1,
  2024: 17.56,
};

// ── Median salary net hourly rates (euros) ──────────────────
// Source: INSEE DADS (idbank 010752342), annual net EQTP / 1820h
// Available from 1996 onward
export const medianSalaryRates: Record<number, number> = {
  1996: 8.21,
  1997: 8.36,
  1998: 8.51,
  1999: 8.62,
  2000: 8.74,
  2001: 8.92,
  2002: 9.15,
  2003: 9.35,
  2004: 9.53,
  2005: 9.8,
  2006: 9.96,
  2007: 10.23,
  2008: 10.58,
  2009: 10.8,
  2010: 11.0,
  2011: 11.26,
  2012: 11.41,
  2013: 11.51,
  2014: 11.58,
  2015: 11.67,
  2016: 11.74,
  2017: 11.96,
  2018: 12.2,
  2019: 12.64,
  2020: 13.01,
  2021: 13.0,
  2022: 13.47,
  2023: 14.05,
  2024: 14.44,
};

// ── Get rates by salary reference ──────────────────────────
export function getRatesForRef(ref: SalaryRef): Record<number, number> {
  switch (ref) {
    case "median":
      return medianSalaryRates;
    case "mean":
      return meanSalaryRates;
    default:
      return smicRates;
  }
}

// ── Helper: linear interpolation ───────────────────────────
function interpolate(
  rawPoints: Record<number, number>,
): Record<number, number> {
  const years = Object.keys(rawPoints)
    .map(Number)
    .sort((a, b) => a - b);
  const result: Record<number, number> = {};
  for (let y = years[0]; y <= years[years.length - 1]; y++) {
    if (rawPoints[y] !== undefined) {
      result[y] = rawPoints[y];
    } else {
      let lo = years[0],
        hi = years[years.length - 1];
      for (const yr of years) {
        if (yr <= y) lo = yr;
      }
      for (let i = years.length - 1; i >= 0; i--) {
        if (years[i] >= y) hi = years[i];
      }
      if (lo === hi) {
        result[y] = rawPoints[lo];
      } else {
        const t = (y - lo) / (hi - lo);
        result[y] = +(
          rawPoints[lo] +
          t * (rawPoints[hi] - rawPoints[lo])
        ).toFixed(4);
      }
    }
  }
  return result;
}

// ── Helper: compute minutes of work ────────────────────────
function computeMinutes(
  pricesInterp: Record<number, number>,
  rates: Record<number, number> = smicRates,
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [y, price] of Object.entries(pricesInterp)) {
    const yr = Number(y);
    const rate = rates[yr];
    if (rate) {
      result[yr] = +((price / rate) * 60).toFixed(1);
    }
  }
  return result;
}

// ── Product interface ──────────────────────────────────────
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
}

/** Generate a dynamic fun fact for a product based on current salary reference */
export function getDynamicFunFact(
  product: Product,
  ref: SalaryRef,
  lang: "fr" | "en",
): string {
  const mins = getMinutes(product, ref);
  const years = getYearsForRef(product, ref);
  if (years.length < 2) return "";

  const first = years[0];
  const last = years[years.length - 1];
  const minFirst = Math.round(mins[first]);
  const minLast = Math.round(mins[last]);
  const wentDown = minLast < minFirst;

  if (lang === "fr") {
    if (wentDown) {
      return `En ${first}, il fallait ${minFirst} minutes de travail pour acheter 1 ${product.nameFr.toLowerCase()}. Aujourd'hui, environ ${minLast} minutes suffisent.`;
    }
    return `En ${first}, il fallait ${minFirst} minutes de travail pour 1 ${product.nameFr.toLowerCase()}. Aujourd'hui, il en faut ${minLast}.`;
  }
  if (wentDown) {
    return `In ${first}, you needed ${minFirst} work-minutes to buy 1 ${product.nameEn.toLowerCase()}. Today, about ${minLast} minutes is enough.`;
  }
  return `In ${first}, it took ${minFirst} work-minutes for 1 ${product.nameEn.toLowerCase()}. Today, it takes ${minLast}.`;
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

export interface Category {
  nameFr: string;
  nameEn: string;
  emoji: string;
}

export interface HistoricalEvent {
  year: number;
  fr: string;
  en: string;
}

export interface Era {
  start: number;
  end: number;
  labelFr: string;
  labelEn: string;
  color: string;
  colorDark: string;
}

export interface PPAnnotation {
  year: number;
  labelFr: string;
  labelEn: string;
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
      "Les cigarettes sont le produit qui a le plus augmenté en temps de travail : de 21 min en 1960 à 78 min en 2024.",
    funFactEn:
      "Cigarettes saw the biggest increase in work-time: from 21 min in 1960 to 78 min in 2024.",
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
      2010: 18.0,
      2015: 19.5,
      2020: 22.0,
      2024: 26.0,
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
      2010: 2.0,
      2015: 2.2,
      2020: 2.5,
      2024: 3.0,
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
      2015: 7.0,
      2020: 8.0,
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
      2010: 2.0,
      2015: 2.1,
      2020: 2.3,
      2024: 2.8,
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
      2020: 3.0,
      2024: 3.5,
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
};

// ── Process all products ───────────────────────────────────
export const products: Record<string, Product> = {};
for (const [key, prod] of Object.entries(rawProducts)) {
  const pricesInterp = interpolate(prod.prices);
  const minutes = computeMinutes(pricesInterp);
  const minutesMedian = computeMinutes(pricesInterp, medianSalaryRates);
  const minutesMean = computeMinutes(pricesInterp, meanSalaryRates);
  products[key] = {
    ...prod,
    pricesInterp,
    minutes,
    minutesMedian,
    minutesMean,
    years: Object.keys(minutes)
      .map(Number)
      .sort((a, b) => a - b),
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

// ── Historical events ──────────────────────────────────────
export const historicalEvents: HistoricalEvent[] = [
  {
    year: 1950,
    fr: "Création du SMIG",
    en: "Creation of SMIG (Guaranteed Minimum Wage)",
  },
  {
    year: 1960,
    fr: "Nouveau franc (1 NF = 100 AF)",
    en: "New franc (1 NF = 100 old francs)",
  },
  {
    year: 1968,
    fr: "Accords de Grenelle (+35% SMIG)",
    en: "Grenelle Agreements (+35% minimum wage)",
  },
  {
    year: 1970,
    fr: "Le SMIG devient SMIC",
    en: 'SMIG becomes SMIC ("Growth" Minimum Wage)',
  },
  {
    year: 1975,
    fr: "Carte Orange (transports Paris)",
    en: "Carte Orange (Paris transit pass)",
  },
  {
    year: 1981,
    fr: "Coup de pouce Mitterrand (+10%)",
    en: "Mitterrand boost (+10%)",
  },
  { year: 1982, fr: "Passage aux 39 heures", en: "Shift to 39-hour work week" },
  {
    year: 2000,
    fr: "Lois Aubry (35 heures)",
    en: "Aubry Laws (35-hour work week)",
  },
  {
    year: 2002,
    fr: "Passage à l'euro fiduciaire",
    en: "Euro banknotes/coins introduced",
  },
  { year: 2005, fr: "Unification du SMIC", en: "SMIC unification" },
  {
    year: 2012,
    fr: "Dernier coup de pouce gouvernemental",
    en: "Last government discretionary raise",
  },
];

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
  internet: 1,
};

const indexBaseYear = 1960;
const indexYears: number[] = [];
for (let y = 1960; y <= DATA_END_YEAR; y++) {
  if (smicRates[y]) indexYears.push(y);
}

function computeBasketMinutes(
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

// ── Productivity index: GDP per hour worked (base 100 = 1960) ──
// Source: OECD Productivity Levels (DSD_PDB@DF_PDB_LV) for 1995-2024
// Pre-1995 back-projected using documented growth rates:
//   1960-1973: ~5.2%/yr (Cette, Kocoglu, Mairesse 2009; France Stratégie 2020)
//   1973-1980: ~3.0%/yr, 1980-1990: ~2.6%/yr, 1990-1995: ~1.5%/yr
// Unit: constant EUR per hour, rebased to index 100 = 1960
export const productivityIndex: Record<number, number> = {
  1960: 100.0,
  1961: 105.2,
  1962: 110.7,
  1963: 116.5,
  1964: 122.5,
  1965: 128.9,
  1966: 135.6,
  1967: 142.7,
  1968: 150.0,
  1969: 157.9,
  1970: 166.1,
  1971: 174.7,
  1972: 183.8,
  1973: 193.4,
  1974: 199.2,
  1975: 205.1,
  1976: 211.3,
  1977: 217.6,
  1978: 224.1,
  1979: 230.8,
  1980: 237.8,
  1981: 244.0,
  1982: 250.3,
  1983: 256.8,
  1984: 263.5,
  1985: 270.3,
  1986: 277.4,
  1987: 284.6,
  1988: 292.0,
  1989: 299.6,
  1990: 307.4,
  1991: 312.0,
  1992: 316.7,
  1993: 321.4,
  1994: 326.3,
  1995: 331.1,
  1996: 334.6,
  1997: 340.7,
  1998: 348.3,
  1999: 352.5,
  2000: 362.4,
  2001: 368.6,
  2002: 379.0,
  2003: 381.6,
  2004: 385.9,
  2005: 390.1,
  2006: 400.4,
  2007: 398.8,
  2008: 396.6,
  2009: 392.8,
  2010: 398.2,
  2011: 403.3,
  2012: 404.1,
  2013: 410.6,
  2014: 414.8,
  2015: 418.2,
  2016: 417.9,
  2017: 425.9,
  2018: 426.5,
  2019: 428.7,
  2020: 429.4,
  2021: 423.6,
  2022: 418.2,
  2023: 421.1,
  2024: 422.4,
};

// ── Annual CPI inflation rates (%) ────────────────────────
// Source: INSEE IPC ensemble (base 100 = 2015, idbank 001759970)
// Pre-2015 values computed from historical IPC data
// Year-over-year change in annual average CPI
export const inflationRates: Record<number, number> = {
  1960: 3.2,
  1961: 3.5,
  1962: 4.8,
  1963: 4.8,
  1964: 3.4,
  1965: 2.5,
  1966: 2.7,
  1967: 2.7,
  1968: 4.5,
  1969: 6.5,
  1970: 5.2,
  1971: 5.5,
  1972: 6.2,
  1973: 7.3,
  1974: 13.7,
  1975: 11.8,
  1976: 9.6,
  1977: 9.4,
  1978: 9.1,
  1979: 10.8,
  1980: 13.6,
  1981: 13.4,
  1982: 11.8,
  1983: 9.6,
  1984: 7.4,
  1985: 5.8,
  1986: 2.5,
  1987: 3.3,
  1988: 2.7,
  1989: 3.5,
  1990: 3.4,
  1991: 3.2,
  1992: 2.4,
  1993: 2.1,
  1994: 1.7,
  1995: 1.8,
  1996: 2.1,
  1997: 1.3,
  1998: 0.7,
  1999: 0.6,
  2000: 1.8,
  2001: 1.8,
  2002: 1.9,
  2003: 2.2,
  2004: 2.3,
  2005: 1.9,
  2006: 1.9,
  2007: 1.6,
  2008: 3.2,
  2009: 0.1,
  2010: 1.7,
  2011: 2.3,
  2012: 2.2,
  2013: 1.0,
  2014: 0.6,
  2015: 0.1,
  2016: 0.2,
  2017: 1.0,
  2018: 1.8,
  2019: 1.1,
  2020: 0.5,
  2021: 1.6,
  2022: 5.2,
  2023: 4.9,
  2024: 2.0,
  2025: 1.0,
};

export const eras: Era[] = [
  {
    start: 1960,
    end: 1973,
    labelFr: "Trente Glorieuses",
    labelEn: "Trente Glorieuses",
    color: "rgba(76, 175, 80, 0.08)",
    colorDark: "rgba(76, 175, 80, 0.12)",
  },
  {
    start: 1974,
    end: 1985,
    labelFr: "Stagflation",
    labelEn: "Stagflation",
    color: "rgba(255, 152, 0, 0.08)",
    colorDark: "rgba(255, 152, 0, 0.10)",
  },
  {
    start: 1986,
    end: 2007,
    labelFr: "Modération",
    labelEn: "Moderation",
    color: "rgba(158, 158, 158, 0.06)",
    colorDark: "rgba(158, 158, 158, 0.08)",
  },
  {
    start: 2008,
    end: 2026,
    labelFr: "Crises & inflation",
    labelEn: "Crises & inflation",
    color: "rgba(244, 67, 54, 0.06)",
    colorDark: "rgba(244, 67, 54, 0.10)",
  },
];

export const ppAnnotations: PPAnnotation[] = [
  { year: 1968, labelFr: "Grenelle +35%", labelEn: "Grenelle +35%" },
  { year: 1981, labelFr: "Mitterrand +10%", labelEn: "Mitterrand +10%" },
  { year: 2000, labelFr: "35 heures", labelEn: "35-hour week" },
  { year: 2002, labelFr: "Passage à l'euro", labelEn: "Euro adoption" },
  {
    year: 2020,
    labelFr: "Confinements COVID",
    labelEn: "COVID lockdowns",
  },
];

export const purchasingPower = {
  indexYears,
  indexBaseYear,
  basketMinutesByYear,
  purchasingPowerIndex,
  multiplier,
  latestIndexYear,
  latestIndex,
  eras,
  ppAnnotations,
  inflationRates,
  productivityIndex,
};
