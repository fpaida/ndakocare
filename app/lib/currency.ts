export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "XAF", symbol: "FCFA", name: "Central African CFA Franc" },
  { code: "XOF", symbol: "CFA", name: "West African CFA Franc" },
  { code: "CDF", symbol: "FC", name: "Congolese Franc" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
] as const;

export type SupportedCurrency =
  (typeof SUPPORTED_CURRENCIES)[number]["code"];

/**
 * Development/reference exchange rates.
 *
 * Each value represents approximately how much of the
 * target currency equals 1 USD.
 *
 * IMPORTANT:
 * These are demo/reference rates for the NdakoCare prototype.
 * They are NOT live financial exchange rates.
 */
export const USD_REFERENCE_RATES: Record<
  SupportedCurrency,
  number
> = {
  USD: 1,
  EUR: 0.86,
  XAF: 565,
  XOF: 565,
  CDF: 2300,
  NGN: 1450,
  KES: 129,
  GHS: 11,
  ZAR: 17.5,
};

/**
 * NdakoCare prototype service fee.
 *
 * Later this can become country-, service-, merchant-,
 * or provider-specific.
 */
export const DEFAULT_SERVICE_FEE_RATE = 0.03;

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  language: "en" | "fr" = "en"
) {
  const locale =
    language === "fr" ? "fr-FR" : "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function getCurrencyName(code: string) {
  return (
    SUPPORTED_CURRENCIES.find(
      (currency) => currency.code === code
    )?.name || code
  );
}

export function getCurrencySymbol(code: string) {
  return (
    SUPPORTED_CURRENCIES.find(
      (currency) => currency.code === code
    )?.symbol || code
  );
}

export function isSupportedCurrency(
  currency: string
): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.some(
    (item) => item.code === currency
  );
}

/**
 * Get the prototype exchange rate from USD
 * to a supported target currency.
 */
export function getUsdReferenceRate(
  targetCurrency: string
): number {
  if (!isSupportedCurrency(targetCurrency)) {
    throw new Error(
      `Unsupported currency: ${targetCurrency}`
    );
  }

  return USD_REFERENCE_RATES[targetCurrency];
}

/**
 * Convert USD to a supported local currency.
 *
 * Example:
 * convertUsdToCurrency(10, "XAF")
 */
export function convertUsdToCurrency(
  usdAmount: number,
  targetCurrency: string
): number {
  if (!Number.isFinite(usdAmount) || usdAmount < 0) {
    throw new Error("Invalid USD amount.");
  }

  const rate = getUsdReferenceRate(targetCurrency);

  return usdAmount * rate;
}

/**
 * Convert a supported local currency amount to USD.
 *
 * Example:
 * convertCurrencyToUsd(2000, "XAF")
 */
export function convertCurrencyToUsd(
  amount: number,
  sourceCurrency: string
): number {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid currency amount.");
  }

  const rate = getUsdReferenceRate(sourceCurrency);

  return amount / rate;
}

/**
 * Round a USD value to cents.
 */
export function roundUsd(amount: number): number {
  return Math.round(
    (amount + Number.EPSILON) * 100
  ) / 100;
}

/**
 * Calculate the NdakoCare service fee.
 */
export function calculateServiceFee(
  usdAmount: number,
  feeRate: number = DEFAULT_SERVICE_FEE_RATE
): number {
  if (!Number.isFinite(usdAmount) || usdAmount < 0) {
    throw new Error("Invalid USD amount.");
  }

  if (
    !Number.isFinite(feeRate) ||
    feeRate < 0
  ) {
    throw new Error("Invalid service fee rate.");
  }

  return roundUsd(usdAmount * feeRate);
}

export type ServiceQuote = {
  localAmount: number;
  localCurrency: SupportedCurrency;
  exchangeRate: number;
  usdEquivalent: number;
  serviceFee: number;
  totalWalletCharge: number;
};

/**
 * Build a complete NdakoCare service quote.
 *
 * The beneficiary/service amount remains in the local
 * currency while the sender's wallet is charged in USD.
 */
export function createServiceQuote(
  localAmount: number,
  localCurrency: string,
  feeRate: number = DEFAULT_SERVICE_FEE_RATE
): ServiceQuote {
  if (!isSupportedCurrency(localCurrency)) {
    throw new Error(
      `Unsupported currency: ${localCurrency}`
    );
  }

  if (
    !Number.isFinite(localAmount) ||
    localAmount <= 0
  ) {
    throw new Error(
      "Service amount must be greater than zero."
    );
  }

  const exchangeRate =
    getUsdReferenceRate(localCurrency);

  const usdEquivalent = roundUsd(
    convertCurrencyToUsd(
      localAmount,
      localCurrency
    )
  );

  const serviceFee = calculateServiceFee(
    usdEquivalent,
    feeRate
  );

  const totalWalletCharge = roundUsd(
    usdEquivalent + serviceFee
  );

  return {
    localAmount,
    localCurrency,
    exchangeRate,
    usdEquivalent,
    serviceFee,
    totalWalletCharge,
  };
}