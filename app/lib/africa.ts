/**
 * NdakoCare African country configuration
 *
 * This file is the central source of truth for:
 * - Profile country selection
 * - Beneficiary country selection
 * - Transfer destinations
 * - Country currencies
 * - International phone codes
 * - Time-zone selection
 * - Mobile network operators
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
  code: string;
  alpha3Code: string;
  name: string;
  frenchName: string;
  capital: string;
  frenchCapital?: string;
  region: AfricanRegion;
  currency: string;
  phoneCode: string;
  flag: string;
  defaultTimezone: string;
  timezones: CountryTimezone[];
  languages: string[];
  mobileOperators: string[];
  mobileMoney: string[];
  banks: string[];
  supported: boolean;
  comingSoon: boolean;
};

function makeTimezone(
  value: string,
  city: string,
  countryName: string,
  frenchCountryName: string
): CountryTimezone {
  return {
    value,
    city,
    labelEn: `${city} — ${countryName}`,
    labelFr: `${city} — ${frenchCountryName}`,
  };
}

/**
 * ============================================================
 * CENTRAL AFRICA — 9 countries
 * ============================================================
 */

export const CENTRAL_AFRICAN_COUNTRIES: AfricanCountry[] = [
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
    timezones: [makeTimezone("Africa/Luanda", "Luanda", "Angola", "Angola")],
    languages: ["Portuguese"],
   mobileOperators: ["Unitel", "Africell", "Movicel"],
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
    timezones: [makeTimezone("Africa/Douala", "Douala", "Cameroon", "Cameroun")],
    languages: ["French", "English"],
    mobileOperators: ["MTN Cameroon", "Orange Cameroon", "NEXTtel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
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
    timezones: [makeTimezone("Africa/Bangui", "Bangui", "Central African Republic", "République centrafricaine")],
    languages: ["French", "Sango"],
    mobileOperators: ["Orange", "Telecel", "Moov Africa"],
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
    timezones: [makeTimezone("Africa/Ndjamena", "N'Djamena", "Chad", "Tchad")],
    languages: ["French", "Arabic"],
    mobileOperators: ["Airtel", "Moov Africa"],
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
    timezones: [makeTimezone("Africa/Brazzaville", "Brazzaville", "Republic of the Congo", "République du Congo")],
    languages: ["French"],
     mobileOperators: ["Airtel", "MTN"],
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
      makeTimezone("Africa/Kinshasa", "Kinshasa", "Democratic Republic of the Congo", "République démocratique du Congo"),
      makeTimezone("Africa/Lubumbashi", "Lubumbashi", "Democratic Republic of the Congo", "République démocratique du Congo"),
    ],
    languages: ["French", "Lingala", "Swahili", "Kikongo", "Tshiluba"],
    mobileOperators: ["Vodacom", "Airtel", "Orange", "Africell"],
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
    timezones: [makeTimezone("Africa/Malabo", "Malabo", "Equatorial Guinea", "Guinée équatoriale")],
    languages: ["Spanish", "French", "Portuguese"],
    mobileOperators: ["GETESA", "Muni"],
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
    timezones: [makeTimezone("Africa/Libreville", "Libreville", "Gabon", "Gabon")],
    languages: ["French"],
    mobileOperators: ["Airtel", "Moov Africa"],
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
    timezones: [makeTimezone("Africa/Sao_Tome", "São Tomé", "São Tomé and Príncipe", "Sao Tomé-et-Principe")],
    languages: ["Portuguese"],
    mobileOperators: ["CST", "Unitel STP"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * ============================================================
 * WEST AFRICA — 16 countries
 * ============================================================
 */

export const WEST_AFRICAN_COUNTRIES: AfricanCountry[] = [
  {
    code: "BJ",
    alpha3Code: "BEN",
    name: "Benin",
    frenchName: "Bénin",
    capital: "Porto-Novo",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+229",
    flag: "🇧🇯",
    defaultTimezone: "Africa/Porto-Novo",
    timezones: [
      makeTimezone(
        "Africa/Porto-Novo",
        "Porto-Novo",
        "Benin",
        "Bénin"
      ),
    ],
    languages: ["French"],
    mobileOperators: [
      "MTN Benin",
      "Moov Africa Benin",
      "Celtiis",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "BF",
    alpha3Code: "BFA",
    name: "Burkina Faso",
    frenchName: "Burkina Faso",
    capital: "Ouagadougou",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+226",
    flag: "🇧🇫",
    defaultTimezone: "Africa/Ouagadougou",
    timezones: [
      makeTimezone(
        "Africa/Ouagadougou",
        "Ouagadougou",
        "Burkina Faso",
        "Burkina Faso"
      ),
    ],
    languages: ["French"],
    mobileOperators: [
      "Orange Burkina Faso",
      "Moov Africa",
      "Telecel Faso",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "CV",
    alpha3Code: "CPV",
    name: "Cabo Verde",
    frenchName: "Cabo Verde",
    capital: "Praia",
    region: "West Africa",
    currency: "CVE",
    phoneCode: "+238",
    flag: "🇨🇻",
    defaultTimezone: "Atlantic/Cape_Verde",
    timezones: [
      makeTimezone(
        "Atlantic/Cape_Verde",
        "Praia",
        "Cabo Verde",
        "Cabo Verde"
      ),
    ],
    languages: ["Portuguese", "Cape Verdean Creole"],
    mobileOperators: [
      "CVMovel",
      "Unitel T+",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "CI",
    alpha3Code: "CIV",
    name: "Côte d'Ivoire",
    frenchName: "Côte d’Ivoire",
    capital: "Yamoussoukro",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+225",
    flag: "🇨🇮",
    defaultTimezone: "Africa/Abidjan",
    timezones: [
      makeTimezone(
        "Africa/Abidjan",
        "Abidjan",
        "Côte d'Ivoire",
        "Côte d’Ivoire"
      ),
    ],
    languages: ["French"],
    mobileOperators: [
      "Orange Côte d'Ivoire",
      "MTN Côte d'Ivoire",
      "Moov Africa Côte d'Ivoire",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "GM",
    alpha3Code: "GMB",
    name: "Gambia",
    frenchName: "Gambie",
    capital: "Banjul",
    region: "West Africa",
    currency: "GMD",
    phoneCode: "+220",
    flag: "🇬🇲",
    defaultTimezone: "Africa/Banjul",
    timezones: [
      makeTimezone(
        "Africa/Banjul",
        "Banjul",
        "Gambia",
        "Gambie"
      ),
    ],
    languages: ["English"],
    mobileOperators: [
      "Africell",
      "QCell",
      "Gamcel",
      "Comium",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "GH",
    alpha3Code: "GHA",
    name: "Ghana",
    frenchName: "Ghana",
    capital: "Accra",
    region: "West Africa",
    currency: "GHS",
    phoneCode: "+233",
    flag: "🇬🇭",
    defaultTimezone: "Africa/Accra",
    timezones: [
      makeTimezone(
        "Africa/Accra",
        "Accra",
        "Ghana",
        "Ghana"
      ),
    ],
    languages: ["English"],
    mobileOperators: [
      "MTN Ghana",
      "Telecel Ghana",
      "AT",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "GN",
    alpha3Code: "GIN",
    name: "Guinea",
    frenchName: "Guinée",
    capital: "Conakry",
    region: "West Africa",
    currency: "GNF",
    phoneCode: "+224",
    flag: "🇬🇳",
    defaultTimezone: "Africa/Conakry",
    timezones: [
      makeTimezone(
        "Africa/Conakry",
        "Conakry",
        "Guinea",
        "Guinée"
      ),
    ],
    languages: ["French"],
    mobileOperators: [
      "Orange Guinea",
      "MTN Guinea",
      "Cellcom",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "GW",
    alpha3Code: "GNB",
    name: "Guinea-Bissau",
    frenchName: "Guinée-Bissau",
    capital: "Bissau",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+245",
    flag: "🇬🇼",
    defaultTimezone: "Africa/Bissau",
    timezones: [
      makeTimezone(
        "Africa/Bissau",
        "Bissau",
        "Guinea-Bissau",
        "Guinée-Bissau"
      ),
    ],
    languages: ["Portuguese"],
    mobileOperators: [
      "Orange Bissau",
      "MTN Guinea-Bissau",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "LR",
    alpha3Code: "LBR",
    name: "Liberia",
    frenchName: "Libéria",
    capital: "Monrovia",
    region: "West Africa",
    currency: "LRD",
    phoneCode: "+231",
    flag: "🇱🇷",
    defaultTimezone: "Africa/Monrovia",
    timezones: [
      makeTimezone(
        "Africa/Monrovia",
        "Monrovia",
        "Liberia",
        "Libéria"
      ),
    ],
    languages: ["English"],
    mobileOperators: [
      "Orange Liberia",
      "Lonestar Cell MTN",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ML",
    alpha3Code: "MLI",
    name: "Mali",
    frenchName: "Mali",
    capital: "Bamako",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+223",
    flag: "🇲🇱",
    defaultTimezone: "Africa/Bamako",
    timezones: [
      makeTimezone(
        "Africa/Bamako",
        "Bamako",
        "Mali",
        "Mali"
      ),
    ],
    languages: ["Bambara", "French"],
    mobileOperators: [
      "Orange Mali",
      "Moov Africa Malitel",
      "Telecel Mali",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MR",
    alpha3Code: "MRT",
    name: "Mauritania",
    frenchName: "Mauritanie",
    capital: "Nouakchott",
    region: "West Africa",
    currency: "MRU",
    phoneCode: "+222",
    flag: "🇲🇷",
    defaultTimezone: "Africa/Nouakchott",
    timezones: [
      makeTimezone(
        "Africa/Nouakchott",
        "Nouakchott",
        "Mauritania",
        "Mauritanie"
      ),
    ],
    languages: ["Arabic"],
    mobileOperators: [
      "Mauritel",
      "Mattel",
      "Chinguitel",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "NE",
    alpha3Code: "NER",
    name: "Niger",
    frenchName: "Niger",
    capital: "Niamey",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+227",
    flag: "🇳🇪",
    defaultTimezone: "Africa/Niamey",
    timezones: [
      makeTimezone(
        "Africa/Niamey",
        "Niamey",
        "Niger",
        "Niger"
      ),
    ],
    languages: ["French", "Hausa"],
    mobileOperators: [
      "Airtel Niger",
      "Moov Africa Niger",
      "Zamani Telecom",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "NG",
    alpha3Code: "NGA",
    name: "Nigeria",
    frenchName: "Nigéria",
    capital: "Abuja",
    region: "West Africa",
    currency: "NGN",
    phoneCode: "+234",
    flag: "🇳🇬",
    defaultTimezone: "Africa/Lagos",
    timezones: [
      makeTimezone(
        "Africa/Lagos",
        "Lagos",
        "Nigeria",
        "Nigéria"
      ),
    ],
    languages: ["English"],
    mobileOperators: [
      "MTN Nigeria",
      "Airtel Nigeria",
      "Globacom",
      "T2 Mobile",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SN",
    alpha3Code: "SEN",
    name: "Senegal",
    frenchName: "Sénégal",
    capital: "Dakar",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+221",
    flag: "🇸🇳",
    defaultTimezone: "Africa/Dakar",
    timezones: [
      makeTimezone(
        "Africa/Dakar",
        "Dakar",
        "Senegal",
        "Sénégal"
      ),
    ],
    languages: ["French", "Wolof"],
    mobileOperators: [
      "Orange Senegal",
      "Yas Senegal",
      "Expresso Senegal",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SL",
    alpha3Code: "SLE",
    name: "Sierra Leone",
    frenchName: "Sierra Leone",
    capital: "Freetown",
    region: "West Africa",
    currency: "SLE",
    phoneCode: "+232",
    flag: "🇸🇱",
    defaultTimezone: "Africa/Freetown",
    timezones: [
      makeTimezone(
        "Africa/Freetown",
        "Freetown",
        "Sierra Leone",
        "Sierra Leone"
      ),
    ],
    languages: ["English", "Krio"],
    mobileOperators: [
      "Orange Sierra Leone",
      "Africell Sierra Leone",
      "QCell",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "TG",
    alpha3Code: "TGO",
    name: "Togo",
    frenchName: "Togo",
    capital: "Lomé",
    region: "West Africa",
    currency: "XOF",
    phoneCode: "+228",
    flag: "🇹🇬",
    defaultTimezone: "Africa/Lome",
    timezones: [
      makeTimezone(
        "Africa/Lome",
        "Lomé",
        "Togo",
        "Togo"
      ),
    ],
    languages: ["French"],
    mobileOperators: [
      "Yas Togo",
      "Moov Africa Togo",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * ============================================================
 * EAST AFRICA — 18 countries
 * ============================================================
 */

export const EAST_AFRICAN_COUNTRIES: AfricanCountry[] = [
  {
    code: "BI",
    alpha3Code: "BDI",
    name: "Burundi",
    frenchName: "Burundi",
    capital: "Gitega",
    region: "East Africa",
    currency: "BIF",
    phoneCode: "+257",
    flag: "🇧🇮",
    defaultTimezone: "Africa/Bujumbura",
    timezones: [
      makeTimezone(
        "Africa/Bujumbura",
        "Bujumbura",
        "Burundi",
        "Burundi"
      ),
    ],
    languages: ["Kirundi", "French", "English"],
    mobileOperators: ["Lumitel", "Econet Leo", "Onatel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "KM",
    alpha3Code: "COM",
    name: "Comoros",
    frenchName: "Comores",
    capital: "Moroni",
    region: "East Africa",
    currency: "KMF",
    phoneCode: "+269",
    flag: "🇰🇲",
    defaultTimezone: "Indian/Comoro",
    timezones: [
      makeTimezone(
        "Indian/Comoro",
        "Moroni",
        "Comoros",
        "Comores"
      ),
    ],
    languages: ["Comorian", "Arabic", "French"],
    mobileOperators: ["Comores Telecom", "Telma Comores"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "DJ",
    alpha3Code: "DJI",
    name: "Djibouti",
    frenchName: "Djibouti",
    capital: "Djibouti",
    region: "East Africa",
    currency: "DJF",
    phoneCode: "+253",
    flag: "🇩🇯",
    defaultTimezone: "Africa/Djibouti",
    timezones: [
      makeTimezone(
        "Africa/Djibouti",
        "Djibouti",
        "Djibouti",
        "Djibouti"
      ),
    ],
    languages: ["Arabic", "French"],
    mobileOperators: ["Djibouti Telecom"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ER",
    alpha3Code: "ERI",
    name: "Eritrea",
    frenchName: "Érythrée",
    capital: "Asmara",
    region: "East Africa",
    currency: "ERN",
    phoneCode: "+291",
    flag: "🇪🇷",
    defaultTimezone: "Africa/Asmara",
    timezones: [
      makeTimezone(
        "Africa/Asmara",
        "Asmara",
        "Eritrea",
        "Érythrée"
      ),
    ],
    languages: ["Tigrinya", "Arabic", "English"],
    mobileOperators: ["EriTel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ET",
    alpha3Code: "ETH",
    name: "Ethiopia",
    frenchName: "Éthiopie",
    capital: "Addis Ababa",
    frenchCapital: "Addis-Abeba",
    region: "East Africa",
    currency: "ETB",
    phoneCode: "+251",
    flag: "🇪🇹",
    defaultTimezone: "Africa/Addis_Ababa",
    timezones: [
      makeTimezone(
        "Africa/Addis_Ababa",
        "Addis Ababa",
        "Ethiopia",
        "Éthiopie"
      ),
    ],
    languages: ["Amharic"],
    mobileOperators: ["Ethio Telecom", "Safaricom Ethiopia"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "KE",
    alpha3Code: "KEN",
    name: "Kenya",
    frenchName: "Kenya",
    capital: "Nairobi",
    region: "East Africa",
    currency: "KES",
    phoneCode: "+254",
    flag: "🇰🇪",
    defaultTimezone: "Africa/Nairobi",
    timezones: [
      makeTimezone(
        "Africa/Nairobi",
        "Nairobi",
        "Kenya",
        "Kenya"
      ),
    ],
    languages: ["Swahili", "English"],
    mobileOperators: [
      "Safaricom",
      "Airtel Kenya",
      "Telkom Kenya",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MG",
    alpha3Code: "MDG",
    name: "Madagascar",
    frenchName: "Madagascar",
    capital: "Antananarivo",
    region: "East Africa",
    currency: "MGA",
    phoneCode: "+261",
    flag: "🇲🇬",
    defaultTimezone: "Indian/Antananarivo",
    timezones: [
      makeTimezone(
        "Indian/Antananarivo",
        "Antananarivo",
        "Madagascar",
        "Madagascar"
      ),
    ],
    languages: ["Malagasy", "French"],
    mobileOperators: ["Yas", "Orange", "Airtel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MW",
    alpha3Code: "MWI",
    name: "Malawi",
    frenchName: "Malawi",
    capital: "Lilongwe",
    region: "East Africa",
    currency: "MWK",
    phoneCode: "+265",
    flag: "🇲🇼",
    defaultTimezone: "Africa/Blantyre",
    timezones: [
      makeTimezone(
        "Africa/Blantyre",
        "Blantyre",
        "Malawi",
        "Malawi"
      ),
    ],
    languages: ["English", "Chichewa"],
    mobileOperators: ["Airtel Malawi", "TNM"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MU",
    alpha3Code: "MUS",
    name: "Mauritius",
    frenchName: "Maurice",
    capital: "Port Louis",
    region: "East Africa",
    currency: "MUR",
    phoneCode: "+230",
    flag: "🇲🇺",
    defaultTimezone: "Indian/Mauritius",
    timezones: [
      makeTimezone(
        "Indian/Mauritius",
        "Port Louis",
        "Mauritius",
        "Maurice"
      ),
    ],
    languages: ["English", "French", "Mauritian Creole"],
    mobileOperators: ["my.t", "Emtel", "MTML"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MZ",
    alpha3Code: "MOZ",
    name: "Mozambique",
    frenchName: "Mozambique",
    capital: "Maputo",
    region: "East Africa",
    currency: "MZN",
    phoneCode: "+258",
    flag: "🇲🇿",
    defaultTimezone: "Africa/Maputo",
    timezones: [
      makeTimezone(
        "Africa/Maputo",
        "Maputo",
        "Mozambique",
        "Mozambique"
      ),
    ],
    languages: ["Portuguese"],
    mobileOperators: ["Vodacom", "Movitel", "Tmcel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "RW",
    alpha3Code: "RWA",
    name: "Rwanda",
    frenchName: "Rwanda",
    capital: "Kigali",
    region: "East Africa",
    currency: "RWF",
    phoneCode: "+250",
    flag: "🇷🇼",
    defaultTimezone: "Africa/Kigali",
    timezones: [
      makeTimezone(
        "Africa/Kigali",
        "Kigali",
        "Rwanda",
        "Rwanda"
      ),
    ],
    languages: ["Kinyarwanda", "English", "French", "Swahili"],
    mobileOperators: ["MTN Rwanda", "Airtel Rwanda"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SC",
    alpha3Code: "SYC",
    name: "Seychelles",
    frenchName: "Seychelles",
    capital: "Victoria",
    region: "East Africa",
    currency: "SCR",
    phoneCode: "+248",
    flag: "🇸🇨",
    defaultTimezone: "Indian/Mahe",
    timezones: [
      makeTimezone(
        "Indian/Mahe",
        "Victoria",
        "Seychelles",
        "Seychelles"
      ),
    ],
    languages: ["Seychellois Creole", "English", "French"],
    mobileOperators: [
      "Airtel Seychelles",
      "Cable & Wireless Seychelles",
      "Intelvision",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SO",
    alpha3Code: "SOM",
    name: "Somalia",
    frenchName: "Somalie",
    capital: "Mogadishu",
    frenchCapital: "Mogadiscio",
    region: "East Africa",
    currency: "SOS",
    phoneCode: "+252",
    flag: "🇸🇴",
    defaultTimezone: "Africa/Mogadishu",
    timezones: [
      makeTimezone(
        "Africa/Mogadishu",
        "Mogadishu",
        "Somalia",
        "Somalie"
      ),
    ],
    languages: ["Somali", "Arabic"],
    mobileOperators: [
      "Hormuud Telecom",
      "Somtel",
      "Golis Telecom",
      "Telesom",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SS",
    alpha3Code: "SSD",
    name: "South Sudan",
    frenchName: "Soudan du Sud",
    capital: "Juba",
    frenchCapital: "Djouba",
    region: "East Africa",
    currency: "SSP",
    phoneCode: "+211",
    flag: "🇸🇸",
    defaultTimezone: "Africa/Juba",
    timezones: [
      makeTimezone(
        "Africa/Juba",
        "Juba",
        "South Sudan",
        "Soudan du Sud"
      ),
    ],
    languages: ["English"],
    mobileOperators: ["MTN South Sudan", "Zain South Sudan"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "TZ",
    alpha3Code: "TZA",
    name: "Tanzania",
    frenchName: "Tanzanie",
    capital: "Dodoma",
    region: "East Africa",
    currency: "TZS",
    phoneCode: "+255",
    flag: "🇹🇿",
    defaultTimezone: "Africa/Dar_es_Salaam",
    timezones: [
      makeTimezone(
        "Africa/Dar_es_Salaam",
        "Dar es Salaam",
        "Tanzania",
        "Tanzanie"
      ),
    ],
    languages: ["Swahili", "English"],
    mobileOperators: [
      "Vodacom",
      "Yas",
      "Airtel",
      "Halotel",
      "TTCL",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "UG",
    alpha3Code: "UGA",
    name: "Uganda",
    frenchName: "Ouganda",
    capital: "Kampala",
    region: "East Africa",
    currency: "UGX",
    phoneCode: "+256",
    flag: "🇺🇬",
    defaultTimezone: "Africa/Kampala",
    timezones: [
      makeTimezone(
        "Africa/Kampala",
        "Kampala",
        "Uganda",
        "Ouganda"
      ),
    ],
    languages: ["English", "Swahili"],
    mobileOperators: [
      "MTN Uganda",
      "Airtel Uganda",
      "Lyca Mobile",
      "UTCL",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ZM",
    alpha3Code: "ZMB",
    name: "Zambia",
    frenchName: "Zambie",
    capital: "Lusaka",
    region: "East Africa",
    currency: "ZMW",
    phoneCode: "+260",
    flag: "🇿🇲",
    defaultTimezone: "Africa/Lusaka",
    timezones: [
      makeTimezone(
        "Africa/Lusaka",
        "Lusaka",
        "Zambia",
        "Zambie"
      ),
    ],
    languages: ["English"],
    mobileOperators: ["MTN Zambia", "Airtel Zambia", "Zamtel"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ZW",
    alpha3Code: "ZWE",
    name: "Zimbabwe",
    frenchName: "Zimbabwe",
    capital: "Harare",
    region: "East Africa",
    currency: "ZWG",
    phoneCode: "+263",
    flag: "🇿🇼",
    defaultTimezone: "Africa/Harare",
    timezones: [
      makeTimezone(
        "Africa/Harare",
        "Harare",
        "Zimbabwe",
        "Zimbabwe"
      ),
    ],
    languages: ["English", "Shona", "Ndebele"],
    mobileOperators: ["Econet", "NetOne", "Telecel Zimbabwe"],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * ============================================================
 * SOUTHERN AFRICA — 5 countries
 * ============================================================
 */

export const SOUTHERN_AFRICAN_COUNTRIES: AfricanCountry[] = [
  {
    code: "BW",
    alpha3Code: "BWA",
    name: "Botswana",
    frenchName: "Botswana",
    capital: "Gaborone",
    region: "Southern Africa",
    currency: "BWP",
    phoneCode: "+267",
    flag: "🇧🇼",
    defaultTimezone: "Africa/Gaborone",
    timezones: [
      makeTimezone(
        "Africa/Gaborone",
        "Gaborone",
        "Botswana",
        "Botswana"
      ),
    ],
    languages: ["English", "Tswana"],
    mobileOperators: [
      "Mascom",
      "Orange Botswana",
      "BTC Mobile",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SZ",
    alpha3Code: "SWZ",
    name: "Eswatini",
    frenchName: "Eswatini",
    capital: "Mbabane",
    region: "Southern Africa",
    currency: "SZL",
    phoneCode: "+268",
    flag: "🇸🇿",
    defaultTimezone: "Africa/Mbabane",
    timezones: [
      makeTimezone(
        "Africa/Mbabane",
        "Mbabane",
        "Eswatini",
        "Eswatini"
      ),
    ],
    languages: ["Swazi", "English"],
    mobileOperators: [
      "MTN Eswatini",
      "Eswatini Mobile",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "LS",
    alpha3Code: "LSO",
    name: "Lesotho",
    frenchName: "Lesotho",
    capital: "Maseru",
    region: "Southern Africa",
    currency: "LSL",
    phoneCode: "+266",
    flag: "🇱🇸",
    defaultTimezone: "Africa/Maseru",
    timezones: [
      makeTimezone(
        "Africa/Maseru",
        "Maseru",
        "Lesotho",
        "Lesotho"
      ),
    ],
    languages: ["Sesotho", "English"],
    mobileOperators: [
      "Vodacom Lesotho",
      "Econet Telecom Lesotho",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "NA",
    alpha3Code: "NAM",
    name: "Namibia",
    frenchName: "Namibie",
    capital: "Windhoek",
    region: "Southern Africa",
    currency: "NAD",
    phoneCode: "+264",
    flag: "🇳🇦",
    defaultTimezone: "Africa/Windhoek",
    timezones: [
      makeTimezone(
        "Africa/Windhoek",
        "Windhoek",
        "Namibia",
        "Namibie"
      ),
    ],
    languages: ["English"],
    mobileOperators: [
      "MTC",
      "Telecom Namibia",
      "Paratus",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "ZA",
    alpha3Code: "ZAF",
    name: "South Africa",
    frenchName: "Afrique du Sud",
    capital: "Pretoria",
    region: "Southern Africa",
    currency: "ZAR",
    phoneCode: "+27",
    flag: "🇿🇦",
    defaultTimezone: "Africa/Johannesburg",
    timezones: [
      makeTimezone(
        "Africa/Johannesburg",
        "Johannesburg",
        "South Africa",
        "Afrique du Sud"
      ),
    ],
    languages: [
      "Zulu",
      "Xhosa",
      "Afrikaans",
      "English",
    ],
    mobileOperators: [
      "Vodacom",
      "MTN",
      "Telkom Mobile",
      "Cell C",
      "Rain",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * ============================================================
 * NORTH AFRICA — 6 countries
 * ============================================================
 */

export const NORTH_AFRICAN_COUNTRIES: AfricanCountry[] = [
  {
    code: "DZ",
    alpha3Code: "DZA",
    name: "Algeria",
    frenchName: "Algérie",
    capital: "Algiers",
    frenchCapital: "Alger",
    region: "North Africa",
    currency: "DZD",
    phoneCode: "+213",
    flag: "🇩🇿",
    defaultTimezone: "Africa/Algiers",
    timezones: [
      makeTimezone(
        "Africa/Algiers",
        "Algiers",
        "Algeria",
        "Algérie"
      ),
    ],
    languages: ["Arabic", "Tamazight"],
    mobileOperators: [
      "Mobilis",
      "Djezzy",
      "Ooredoo Algeria",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "EG",
    alpha3Code: "EGY",
    name: "Egypt",
    frenchName: "Égypte",
    capital: "Cairo",
    frenchCapital: "Le Caire",
    region: "North Africa",
    currency: "EGP",
    phoneCode: "+20",
    flag: "🇪🇬",
    defaultTimezone: "Africa/Cairo",
    timezones: [
      makeTimezone(
        "Africa/Cairo",
        "Cairo",
        "Egypt",
        "Égypte"
      ),
    ],
    languages: ["Arabic"],
    mobileOperators: [
      "Vodafone Egypt",
      "Orange Egypt",
      "e& Egypt",
      "WE",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "LY",
    alpha3Code: "LBY",
    name: "Libya",
    frenchName: "Libye",
    capital: "Tripoli",
    region: "North Africa",
    currency: "LYD",
    phoneCode: "+218",
    flag: "🇱🇾",
    defaultTimezone: "Africa/Tripoli",
    timezones: [
      makeTimezone(
        "Africa/Tripoli",
        "Tripoli",
        "Libya",
        "Libye"
      ),
    ],
    languages: ["Arabic"],
    mobileOperators: [
      "Almadar Aljadid",
      "Libyana",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "MA",
    alpha3Code: "MAR",
    name: "Morocco",
    frenchName: "Maroc",
    capital: "Rabat",
    region: "North Africa",
    currency: "MAD",
    phoneCode: "+212",
    flag: "🇲🇦",
    defaultTimezone: "Africa/Casablanca",
    timezones: [
      makeTimezone(
        "Africa/Casablanca",
        "Casablanca",
        "Morocco",
        "Maroc"
      ),
    ],
    languages: ["Arabic", "Tamazight"],
    mobileOperators: [
      "Maroc Telecom",
      "Orange Morocco",
      "inwi",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "SD",
    alpha3Code: "SDN",
    name: "Sudan",
    frenchName: "Soudan",
    capital: "Khartoum",
    region: "North Africa",
    currency: "SDG",
    phoneCode: "+249",
    flag: "🇸🇩",
    defaultTimezone: "Africa/Khartoum",
    timezones: [
      makeTimezone(
        "Africa/Khartoum",
        "Khartoum",
        "Sudan",
        "Soudan"
      ),
    ],
    languages: ["Arabic", "English"],
    mobileOperators: [
      "Zain Sudan",
      "MTN Sudan",
      "Sudani",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
  {
    code: "TN",
    alpha3Code: "TUN",
    name: "Tunisia",
    frenchName: "Tunisie",
    capital: "Tunis",
    region: "North Africa",
    currency: "TND",
    phoneCode: "+216",
    flag: "🇹🇳",
    defaultTimezone: "Africa/Tunis",
    timezones: [
      makeTimezone(
        "Africa/Tunis",
        "Tunis",
        "Tunisia",
        "Tunisie"
      ),
    ],
    languages: ["Arabic"],
    mobileOperators: [
      "Tunisie Telecom",
      "Ooredoo Tunisia",
      "Orange Tunisia",
    ],
    mobileMoney: [],
    banks: [],
    supported: false,
    comingSoon: true,
  },
];

/**
 * ============================================================
 * MASTER AFRICAN COUNTRY LIST — 54 sovereign states
 * ============================================================
 */

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  ...CENTRAL_AFRICAN_COUNTRIES,
  ...WEST_AFRICAN_COUNTRIES,
  ...EAST_AFRICAN_COUNTRIES,
  ...SOUTHERN_AFRICAN_COUNTRIES,
  ...NORTH_AFRICAN_COUNTRIES,
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
 */
export function getCountryByAlpha3Code(
  code: string
): AfricanCountry | undefined {
  const normalizedCode = code.trim().toUpperCase();

  return AFRICAN_COUNTRIES.find(
    (country) => country.alpha3Code === normalizedCode
  );
}

/**
 * Returns every country that uses a specified currency.
 */
export function getCountriesByCurrency(
  currency: string
): AfricanCountry[] {
  const normalizedCurrency = currency
    .trim()
    .toUpperCase();

  return AFRICAN_COUNTRIES.filter(
    (country) => country.currency === normalizedCurrency
  );
}

/**
 * Returns every country in a selected African region.
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
 * 🇨🇫 Central African Republic (+236)
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

/**
 * Returns the mobile network operators configured
 * for airtime recharge in a country.
 */
export function getCountryMobileOperators(
  countryCode: string
): string[] {
  return (
    getCountryByCode(countryCode)?.mobileOperators ?? []
  );
}

/**
 * Returns true when airtime recharge operators
 * have been configured for a country.
 */
export function hasCountryMobileOperators(
  countryCode: string
): boolean {
  return getCountryMobileOperators(countryCode).length > 0;
}