// ============================================================
// Macroeconomic data: productivity, inflation, historical events
// ============================================================

export interface HistoricalEvent {
  year: number;
  fr: string;
  en: string;
}

export interface PPAnnotation {
  year: number;
  labelFr: string;
  labelEn: string;
}

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
  {
    year: 2022,
    fr: "Crise énergétique (gaz +150 %)",
    en: "Energy crisis (gas +150%)",
  },
];

export const ppAnnotations: PPAnnotation[] = [
  { year: 1968, labelFr: "Grenelle +35%", labelEn: "Grenelle +35%" },
  { year: 1970, labelFr: "TVA → 23%", labelEn: "VAT → 23%" },
  { year: 1975, labelFr: "Choc pétrolier", labelEn: "Oil crisis" },
  { year: 1981, labelFr: "Mitterrand +10%", labelEn: "Mitterrand +10%" },
  { year: 1982, labelFr: "Passage aux 39h", labelEn: "39-hour week" },
  { year: 2000, labelFr: "35 heures", labelEn: "35-hour week" },
  { year: 2002, labelFr: "Passage à l'euro", labelEn: "Euro adoption" },
  { year: 2005, labelFr: "Unification SMIC", labelEn: "SMIC unification" },
  {
    year: 2008,
    labelFr: "Crise des subprimes",
    labelEn: "Subprime crisis",
  },
  {
    year: 2020,
    labelFr: "Confinements COVID",
    labelEn: "COVID lockdowns",
  },
  {
    year: 2022,
    labelFr: "Crise énergétique",
    labelEn: "Energy crisis",
  },
];
