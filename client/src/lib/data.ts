// ============================================================
// Pouvoir d'Achat - Data Module (TypeScript ES Module)
// All prices in euros, SMIC hourly rates, minutes of work
// ============================================================

// ── SMIC hourly rates (euros) ──────────────────────────────
export const smicRates: Record<number, number> = {
  1950: 0.12,
  1951: 0.12,
  1952: 0.15,
  1953: 0.15,
  1954: 0.15,
  1955: 0.19,
  1956: 0.19,
  1957: 0.19,
  1958: 0.21,
  1959: 0.23,
  1960: 0.24,
  1961: 0.25,
  1962: 0.26,
  1963: 0.28,
  1964: 0.29,
  1965: 0.29,
  1966: 0.31,
  1967: 0.32,
  1968: 0.34,
  1969: 0.47,
  1970: 0.5,
  1971: 0.55,
  1972: 0.6,
  1973: 0.69,
  1974: 0.83,
  1975: 1.03,
  1976: 1.2,
  1977: 1.36,
  1978: 1.53,
  1979: 1.72,
  1980: 1.97,
  1981: 2.25,
  1982: 2.77,
  1983: 3.09,
  1984: 3.47,
  1985: 3.71,
  1986: 3.97,
  1987: 4.1,
  1988: 4.24,
  1989: 4.38,
  1990: 4.56,
  1991: 4.87,
  1992: 4.98,
  1993: 5.19,
  1994: 5.31,
  1995: 5.42,
  1996: 5.64,
  1997: 5.78,
  1998: 6.01,
  1999: 6.13,
  2000: 6.21,
  2001: 6.41,
  2002: 6.67,
  2003: 6.83,
  2004: 7.19,
  2005: 8.03,
  2006: 8.27,
  2007: 8.44,
  2008: 8.71,
  2009: 8.82,
  2010: 8.86,
  2011: 9.0,
  2012: 9.4,
  2013: 9.43,
  2014: 9.53,
  2015: 9.61,
  2016: 9.67,
  2017: 9.76,
  2018: 9.88,
  2019: 10.03,
  2020: 10.15,
  2021: 10.25,
  2022: 10.57,
  2023: 11.27,
  2024: 11.65,
  2025: 11.88,
  2026: 12.02,
};

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
): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [y, price] of Object.entries(pricesInterp)) {
    const yr = Number(y);
    const smic = smicRates[yr];
    if (smic) {
      result[yr] = +((price / smic) * 60).toFixed(1);
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
  years: number[];
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
      "En 1960, il fallait 17 minutes de SMIC pour acheter une baguette. Aujourd'hui, environ 5 minutes suffisent.",
    funFactEn:
      "In 1960, you needed 17 minutes of minimum wage to buy a baguette. Today, about 5 minutes is enough.",
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
      "Le prix de l'essence en minutes de travail est remarquablement stable depuis 30 ans, autour de 9-10 minutes.",
    funFactEn:
      "The petrol price in work-minutes has been remarkably stable for 30 years, around 9-10 minutes.",
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
      "Le cinéma est devenu un luxe relatif croissant : de 53 minutes en 1950 à seulement 39 en 2024, mais la baisse ralentit.",
    funFactEn:
      "Cinema has become a slowly growing relative luxury: from 53 min in 1950 down to 39 in 2024, but the decline is slowing.",
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
      "Une consultation de généraliste coûtait 190 minutes de SMIC en 1950. En 2024, c'est environ 136 minutes.",
    funFactEn:
      "A GP consultation cost 190 min of minimum wage in 1950. In 2024, it's about 136 minutes.",
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
      "Le timbre a doublé en minutes de travail depuis 2000 : de 4 à 8 minutes, reflet du déclin du courrier papier.",
    funFactEn:
      "A stamp costs twice as many work-minutes as in 2000: from 4 to 8 min, reflecting the decline of paper mail.",
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
      "Un journal quotidien coûtait 12 minutes de SMIC en 1960 contre 16 minutes en 2024.",
    funFactEn:
      "A daily newspaper cost 12 min of minimum wage in 1960 vs 16 min in 2024.",
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
      "Le ticket de métro a toujours coûté environ 8 à 11 minutes de SMIC - une stabilité remarquable sur 70 ans.",
    funFactEn:
      "A metro ticket has always cost about 8-11 min of minimum wage - remarkably stable over 70 years.",
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
      "Les cigarettes sont le produit qui a le plus augmenté en temps de travail : de 19 min en 1960 à 62 min en 2024.",
    funFactEn:
      "Cigarettes saw the biggest increase in work-time: from 19 min in 1960 to 62 min in 2024.",
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
      "Le lait est passé de 15 minutes de travail en 1960 à 6 minutes aujourd'hui - divisé par 2,5.",
    funFactEn:
      "Milk went from 15 work-minutes in 1960 to 6 today - divided by 2.5.",
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
      "Un kilo de bœuf coûtait 380 minutes de SMIC en 1960 contre 134 minutes en 2024 - presque 3 fois moins.",
    funFactEn:
      "A kilo of beef cost 380 min of minimum wage in 1960 vs 134 in 2024 - nearly 3 times less.",
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
      "Les œufs sont passés de 46 minutes de SMIC la douzaine en 1960 à 15 minutes en 2024.",
    funFactEn: "Eggs went from 46 min per dozen in 1960 to 15 min in 2024.",
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
      "Un café au comptoir coûte environ 9 minutes de SMIC depuis 60 ans - une constante française.",
    funFactEn:
      "A counter espresso has cost about 9 min of minimum wage for 60 years - a French constant.",
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
      "La plaquette de beurre est passée de 57 min de SMIC en 1960 à 13 min en 2024.",
    funFactEn:
      "A 250g block of butter went from 57 min of minimum wage in 1960 to 13 in 2024.",
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
      "Le croissant coûtait 8 minutes en 1960, et 6 minutes en 2024 - un produit relativement stable.",
    funFactEn:
      "A croissant cost 8 min in 1960 and 6 min in 2024 - relatively stable.",
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
      "Le camembert est passé de 42 minutes de SMIC en 1960 à 12 minutes en 2024.",
    funFactEn:
      "Camembert went from 42 min of minimum wage in 1960 to 12 min in 2024.",
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
      "Une bouteille de vin de table coûtait 23 minutes de SMIC en 1960. En 2024 : 15 minutes.",
    funFactEn:
      "A bottle of table wine cost 23 min of minimum wage in 1960. In 2024: 15 min.",
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
      "Le kilo de pommes de terre est passé de 15 minutes de SMIC en 1960 à 8 minutes en 2024.",
    funFactEn:
      "A kilo of potatoes went from 15 min of minimum wage in 1960 to 8 min in 2024.",
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
      "Le poulet est passé de 190 min/kg en 1960 à 49 min en 2024 - divisé par presque 4.",
    funFactEn:
      "Chicken went from 190 min/kg in 1960 to 49 min in 2024 - divided by nearly 4.",
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
      "Les pâtes sont passées de 27 minutes de SMIC en 1960 à 8 minutes en 2024.",
    funFactEn:
      "Pasta went from 27 min of minimum wage in 1960 to 8 min in 2024.",
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
      "Le sucre est passé de 30 minutes de SMIC en 1960 à 8 minutes en 2024.",
    funFactEn:
      "Sugar went from 30 min of minimum wage in 1960 to 8 min in 2024.",
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
      "L'huile de tournesol coûtait 46 minutes de SMIC en 1960 et 11 minutes en 2024.",
    funFactEn:
      "Sunflower oil cost 46 min of minimum wage in 1960 and 11 min in 2024.",
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
      "Les oranges sont passées de 38 minutes de SMIC en 1960 à 14 minutes en 2024.",
    funFactEn:
      "Oranges went from 38 min of minimum wage in 1960 to 14 min in 2024.",
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
    funFactFr: "Les tomates coûtaient 46 min de SMIC en 1960, 18 min en 2024.",
    funFactEn: "Tomatoes cost 46 min of minimum wage in 1960, 18 min in 2024.",
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
      "Les pommes sont passées de 30 min de SMIC en 1960 à 14 min en 2024.",
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
    funFactFr: "Une salade coûtait 12 min de SMIC en 1960, 7 min en 2024.",
    funFactEn:
      "A head of lettuce cost 12 min of minimum wage in 1960, 7 min in 2024.",
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
      "Les carottes sont passées de 12 min de SMIC en 1960 à 8 min en 2024.",
    funFactEn:
      "Carrots went from 12 min of minimum wage in 1960 to 8 min in 2024.",
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
      "Le lot de yaourts est passé de 9 min de SMIC en 1970 à 6 min en 2024.",
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
      "Un demi au comptoir coûtait 8 min de SMIC en 1960. En 2024 : 23 minutes - presque 3 fois plus.",
    funFactEn:
      "A draft beer cost 8 min of minimum wage in 1960. In 2024: 23 min - nearly 3 times more.",
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
      "Un magazine hebdomadaire coûtait 23 min de SMIC en 1960 et 13 min en 2024.",
    funFactEn:
      "A weekly magazine cost 23 min of minimum wage in 1960 and 13 min in 2024.",
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
};

// ── Process all products ───────────────────────────────────
export const products: Record<string, Product> = {};
for (const [key, prod] of Object.entries(rawProducts)) {
  const pricesInterp = interpolate(prod.prices);
  const minutes = computeMinutes(pricesInterp);
  products[key] = {
    ...prod,
    pricesInterp,
    minutes,
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
};

const indexBaseYear = 1960;
const indexYears: number[] = [];
for (let y = 1960; y <= 2026; y++) {
  if (smicRates[y]) indexYears.push(y);
}

function computeBasketMinutes(year: number): number | null {
  let totalWeightedMinutes = 0;
  let totalWeight = 0;
  for (const [pid, w] of Object.entries(basketWeights)) {
    if (w === 0) continue;
    const prod = products[pid];
    if (!prod || prod.minutes[year] === undefined) continue;
    totalWeightedMinutes += prod.minutes[year] * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return null;
  return totalWeightedMinutes / totalWeight;
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
    year: 2022,
    labelFr: "Inflation post-COVID",
    labelEn: "Post-COVID inflation",
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
};
