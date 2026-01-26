/**
 * Countries and regions data for dropdowns
 * Based on Ethiopia and Djibouti (matching origin/destination options)
 */

export interface Country {
  code: string;
  name: string;
  regions?: Region[];
}

export interface Region {
  code: string;
  name: string;
}

// Ethiopian administrative regions
export const ETHIOPIAN_REGIONS: Region[] = [
  { code: "addis_ababa", name: "Addis Ababa" },
  { code: "afar", name: "Afar" },
  { code: "amhara", name: "Amhara" },
  { code: "benishangul_gumuz", name: "Benishangul-Gumuz" },
  { code: "dire_dawa", name: "Dire Dawa" },
  { code: "gambela", name: "Gambela" },
  { code: "harari", name: "Harari" },
  { code: "oromia", name: "Oromia" },
  { code: "sidama", name: "Sidama" },
  { code: "somali", name: "Somali" },
  {
    code: "snnpr",
    name: "SNNPR (Southern Nations, Nationalities, and Peoples' Region)",
  },
  { code: "tigray", name: "Tigray" },
];

// Djibouti administrative regions
export const DJIBOUTI_REGIONS: Region[] = [
  { code: "djibouti", name: "Djibouti" },
];

// Countries list - only Ethiopia and Djibouti
export const COUNTRIES: Country[] = [
  {
    code: "et",
    name: "Ethiopia",
    regions: ETHIOPIAN_REGIONS,
  },
  {
    code: "dj",
    name: "Djibouti",
    regions: DJIBOUTI_REGIONS,
  },
];

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getRegionsByCountryCode(countryCode: string): Region[] {
  const country = getCountryByCode(countryCode);
  return country?.regions || [];
}

export function getCountryName(code: string): string {
  const country = getCountryByCode(code);
  return country?.name || code;
}

export function getRegionName(countryCode: string, regionCode: string): string {
  const regions = getRegionsByCountryCode(countryCode);
  const region = regions.find((r) => r.code === regionCode);
  return region?.name || regionCode;
}

// For backward compatibility and flexibility, also support free text
// But we'll use these as the primary options in dropdowns
export const COMMON_COUNTRIES = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

// All regions flattened with country context
export const ALL_REGIONS: Array<
  Region & { countryCode: string; countryName: string }
> = COUNTRIES.flatMap((country) =>
  (country.regions || []).map((region) => ({
    ...region,
    countryCode: country.code,
    countryName: country.name,
  }))
);
