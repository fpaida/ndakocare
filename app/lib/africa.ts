/**
 * NdakoCare African country configuration
 *
 * Phase 1:
 * Central Africa / Middle Africa
 *
 * This file is designed to become the central source of truth for:
 * - Profile country selection
 * - Beneficiary country selection
 * - Transfer destinations
 * - Country currencies
 * - International phone codes
 * - Time-zone selection
 * - Mobile-money providers
 * - Banks
 *
 * IMPORTANT:
 * `supported` controls whether transactions are enabled.
 * Keep it false until the business and payment integrations are ready.
 */

export type AfricanRegion =
  | "Central Africa"
  | "West Africa"
  | "East Africa"
  | "Southern Africa"
  | "North Africa";

export type SupportedInterfaceLanguage = "en" | "fr";

export type CountryTimezone = {
  value: string;
  city: string;
  labelEn: string;
  labelFr: string;
};

export type AfricanCountry = {
  /**
   * ISO 3166-1 alpha-2 country code.
   * Examples: CF, CM, GA
   */
  code: string;

  /**
   * ISO 3166-1 alpha-3 country code.
   * Examples: CAF, CMR, GAB
   */
  alpha3Code: string;

  /**
   * Country names.
   */
  name: string;
  frenchName: string;

  /**
   * Capital names.
   */
  capital: string;
  frenchCapital?: string;

  /**
   * Geographic region used by NdakoCare.
   */
  region: AfricanRegion;

  /**
   * ISO 4217 currency code.
   */
  currency: string;

  /**
   * International telephone prefix.
   */
  phoneCode: string;

  /**
   * Emoji flag.
   */
  flag: string;

  /**
   * Default IANA time-zone identifier.
   */
  defaultTimezone: string;

  /**
   * Some countries, such as the Democratic Republic of the Congo,
   * use more than one time zone.
   */
  timezones: CountryTimezone[];

  /**
   * Official or commonly used languages.
   */
  languages: string[];

  /**
   * Mobile-money providers.
   *
   * Keep this list empty until providers are verified for production.
   */
  mobileMoney: string[];

  /**
   * Banks available for integrations.
   *
   * Keep this list empty until institutions are verified for production.
   */
  banks: string[];

  /**
   * Set to true only after transactions are operational in the country.
   */
  supported: boolean;

  /**
   * Controls whether the interface may display "Coming soon."
   */
  comingSoon: boolean;
};

/**
 * Central African countries.
 *
 * Provider and bank arrays are intentionally empty during the
 * configuration phase because those services can change.
 */
export const CENTRAL_AFRICAN_COUNTRIES: AfricanCountry[] = [
  {
    code: "CF",
    alpha3Code: "CAF",
    name: "Central African Republic",
    frenchName: "République centrafricaine",
    capital: "Bangui",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+236",
    flag: "🇨🇫",
    defaultTimezone: "Africa/Bangui",
    timezones: [
      {
        value: "Africa/Bangui",
        city: "Bangui",
        labelEn:
          "Central Africa Time — Bangui, Central African Republic",
        labelFr:
          "Heure d’Afrique centrale — Bangui, République centrafricaine",
      },
    ],
    languages: ["French", "Sango"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "CM",
    alpha3Code: "CMR",
    name: "Cameroon",
    frenchName: "Cameroun",
    capital: "Yaoundé",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+237",
    flag: "🇨🇲",
    defaultTimezone: "Africa/Douala",
    timezones: [
      {
        value: "Africa/Douala",
        city: "Douala",
        labelEn:
          "Central Africa Time — Douala, Cameroon",
        labelFr:
          "Heure d’Afrique centrale — Douala, Cameroun",
      },
    ],
    languages: ["French", "English"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "TD",
    alpha3Code: "TCD",
    name: "Chad",
    frenchName: "Tchad",
    capital: "N'Djamena",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+235",
    flag: "🇹🇩",
    defaultTimezone: "Africa/Ndjamena",
    timezones: [
      {
        value: "Africa/Ndjamena",
        city: "N'Djamena",
        labelEn:
          "Central Africa Time — N'Djamena, Chad",
        labelFr:
          "Heure d’Afrique centrale — N'Djamena, Tchad",
      },
    ],
    languages: ["French", "Arabic"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "GA",
    alpha3Code: "GAB",
    name: "Gabon",
    frenchName: "Gabon",
    capital: "Libreville",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+241",
    flag: "🇬🇦",
    defaultTimezone: "Africa/Libreville",
    timezones: [
      {
        value: "Africa/Libreville",
        city: "Libreville",
        labelEn:
          "Central Africa Time — Libreville, Gabon",
        labelFr:
          "Heure d’Afrique centrale — Libreville, Gabon",
      },
    ],
    languages: ["French"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "GQ",
    alpha3Code: "GNQ",
    name: "Equatorial Guinea",
    frenchName: "Guinée équatoriale",
    capital: "Malabo",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+240",
    flag: "🇬🇶",
    defaultTimezone: "Africa/Malabo",
    timezones: [
      {
        value: "Africa/Malabo",
        city: "Malabo",
        labelEn:
          "Central Africa Time — Malabo, Equatorial Guinea",
        labelFr:
          "Heure d’Afrique centrale — Malabo, Guinée équatoriale",
      },
    ],
    languages: ["Spanish", "French", "Portuguese"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "CG",
    alpha3Code: "COG",
    name: "Republic of the Congo",
    frenchName: "République du Congo",
    capital: "Brazzaville",
    region: "Central Africa",
    currency: "XAF",
    phoneCode: "+242",
    flag: "🇨🇬",
    defaultTimezone: "Africa/Brazzaville",
    timezones: [
      {
        value: "Africa/Brazzaville",
        city: "Brazzaville",
        labelEn:
          "Central Africa Time — Brazzaville, Republic of the Congo",
        labelFr:
          "Heure d’Afrique centrale — Brazzaville, République du Congo",
      },
    ],
    languages: ["French"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "CD",
    alpha3Code: "COD",
    name: "Democratic Republic of the Congo",
    frenchName: "République démocratique du Congo",
    capital: "Kinshasa",
    region: "Central Africa",
    currency: "CDF",
    phoneCode: "+243",
    flag: "🇨🇩",
    defaultTimezone: "Africa/Kinshasa",
    timezones: [
      {
        value: "Africa/Kinshasa",
        city: "Kinshasa",
        labelEn:
          "West Central Africa Time — Kinshasa, DR Congo",
        labelFr:
          "Heure d’Afrique centrale occidentale — Kinshasa, RDC",
      },
      {
        value: "Africa/Lubumbashi",
        city: "Lubumbashi",
        labelEn:
          "Central Africa Time — Lubumbashi, DR Congo",
        labelFr:
          "Heure d’Afrique centrale — Lubumbashi, RDC",
      },
    ],
    languages: [
      "French",
      "Lingala",
      "Swahili",
      "Kikongo",
      "Tshiluba",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "AO",
    alpha3Code: "AGO",
    name: "Angola",
    frenchName: "Angola",
    capital: "Luanda",
    region: "Central Africa",
    currency: "AOA",
    phoneCode: "+244",
    flag: "🇦🇴",
    defaultTimezone: "Africa/Luanda",
    timezones: [
      {
        value: "Africa/Luanda",
        city: "Luanda",
        labelEn:
          "Central Africa Time — Luanda, Angola",
        labelFr:
          "Heure d’Afrique centrale — Luanda, Angola",
      },
    ],
    languages: ["Portuguese"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },

  {
    code: "ST",
    alpha3Code: "STP",
    name: "São Tomé and Príncipe",
    frenchName: "Sao Tomé-et-Principe",
    capital: "São Tomé",
    frenchCapital: "Sao Tomé",
    region: "Central Africa",
    currency: "STN",
    phoneCode: "+239",
    flag: "🇸🇹",
    defaultTimezone: "Africa/Sao_Tome",
    timezones: [
      {
        value: "Africa/Sao_Tome",
        city: "São Tomé",
        labelEn:
          "Greenwich Mean Time — São Tomé, São Tomé and Príncipe",
        labelFr:
          "Heure moyenne de Greenwich — Sao Tomé, Sao Tomé-et-Principe",
      },
    ],
    languages: ["Portuguese"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * This master array will receive the additional regions
 * as we complete the remaining phases.
 */
export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  ...CENTRAL_AFRICAN_COUNTRIES,
];

/**
 * Returns a localized country name.
 */
export function getCountryName(
  country: AfricanCountry,
  language: SupportedInterfaceLanguage = "en"
): string {
  return language === "fr"
    ? country.frenchName
    : country.name;
}

/**
 * Returns a country using its ISO alpha-2 code.
 *
 * Example:
 * getCountryByCode("CF")
 */
export function getCountryByCode(
  code: string
): AfricanCountry | undefined {
  const normalizedCode = code.trim().toUpperCase();

  return AFRICAN_COUNTRIES.find(
    (country) => country.code === normalizedCode
  );
}

/**
 * Returns a country using its ISO alpha-3 code.
 *
 * Example:
 * getCountryByAlpha3Code("CAF")
 */
export function getCountryByAlpha3Code(
  code: string
): AfricanCountry | undefined {
  const normalizedCode = code.trim().toUpperCase();

  return AFRICAN_COUNTRIES.find(
    (country) =>
      country.alpha3Code === normalizedCode
  );
}

/**
 * Returns every country that uses a specified currency.
 *
 * Example:
 * getCountriesByCurrency("XAF")
 */
export function getCountriesByCurrency(
  currency: string
): AfricanCountry[] {
  const normalizedCurrency = currency
    .trim()
    .toUpperCase();

  return AFRICAN_COUNTRIES.filter(
    (country) =>
      country.currency === normalizedCurrency
  );
}

/**
 * Returns every country in a selected African region.
 *
 * Example:
 * getCountriesByRegion("Central Africa")
 */
export function getCountriesByRegion(
  region: AfricanRegion
): AfricanCountry[] {
  return AFRICAN_COUNTRIES.filter(
    (country) => country.region === region
  );
}

/**
 * Returns only countries currently enabled for transactions.
 */
export function getSupportedCountries(): AfricanCountry[] {
  return AFRICAN_COUNTRIES.filter(
    (country) => country.supported
  );
}

/**
 * Returns countries marked as coming soon.
 */
export function getComingSoonCountries(): AfricanCountry[] {
  return AFRICAN_COUNTRIES.filter(
    (country) => country.comingSoon
  );
}

/**
 * Returns all available time zones for a country.
 */
export function getCountryTimezones(
  countryCode: string
): CountryTimezone[] {
  return getCountryByCode(countryCode)?.timezones ?? [];
}

/**
 * Returns the localized time-zone label.
 */
export function getTimezoneLabel(
  timezone: CountryTimezone,
  language: SupportedInterfaceLanguage = "en"
): string {
  return language === "fr"
    ? timezone.labelFr
    : timezone.labelEn;
}

/**
 * Returns a localized, alphabetically sorted country list.
 *
 * This is useful for dropdown menus.
 */
export function getSortedAfricanCountries(
  language: SupportedInterfaceLanguage = "en"
): AfricanCountry[] {
  return [...AFRICAN_COUNTRIES].sort(
    (firstCountry, secondCountry) =>
      getCountryName(firstCountry, language).localeCompare(
        getCountryName(secondCountry, language),
        language === "fr" ? "fr" : "en"
      )
  );
}

/**
 * Creates a dropdown label such as:
 *
 * 🇨🇫 Central African Republic (+236)
 * 🇨🇫 République centrafricaine (+236)
 */
export function getCountryDropdownLabel(
  country: AfricanCountry,
  language: SupportedInterfaceLanguage = "en"
): string {
  return `${country.flag} ${getCountryName(
    country,
    language
  )} (${country.phoneCode})`;
}

/**
 * Creates a country-and-currency label such as:
 *
 * 🇨🇲 Cameroon — XAF
 */
export function getCountryCurrencyLabel(
  country: AfricanCountry,
  language: SupportedInterfaceLanguage = "en"
): string {
  return `${country.flag} ${getCountryName(
    country,
    language
  )} — ${country.currency}`;
}

/**
 * Checks whether a country is currently enabled.
 */
export function isCountrySupported(
  countryCode: string
): boolean {
  return (
    getCountryByCode(countryCode)?.supported ?? false
  );
}

/**
 * Returns the country's default currency.
 */
export function getCountryCurrency(
  countryCode: string
): string | null {
  return getCountryByCode(countryCode)?.currency ?? null;
}

/**
 * Returns the country's international phone code.
 */
export function getCountryPhoneCode(
  countryCode: string
): string | null {
  return getCountryByCode(countryCode)?.phoneCode ?? null;
}

/**
 * Returns the country's default IANA time zone.
 */
export function getCountryDefaultTimezone(
  countryCode: string
): string | null {
  return (
    getCountryByCode(countryCode)?.defaultTimezone ??
    null
  );
}
