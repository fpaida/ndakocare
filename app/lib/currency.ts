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

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  language: "en" | "fr" = "en"
) {
  const locale = language === "fr" ? "fr-FR" : "en-US";

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