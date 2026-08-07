/**
 * NdakoCare payment-provider configuration
 *
 * Phase 1:
 * - Provider type definitions
 * - Provider capability definitions
 * - Central Africa payment providers
 * - Mobile-money providers
 * - Banks
 * - Internal NdakoCare wallet
 * - Reusable provider helper functions
 *
 * IMPORTANT:
 * This file is an application configuration registry.
 *
 * A provider should only be marked as:
 *
 * status: "active"
 * supported: true
 * apiReady: true
 *
 * after NdakoCare has completed:
 *
 * - Legal review
 * - Commercial agreement
 * - Compliance review
 * - API integration
 * - Sandbox testing
 * - Production testing
 * - Transaction monitoring setup
 */

export type ProviderType =
  | "mobile_money"
  | "bank"
  | "wallet"
  | "cash_pickup";

export type ProviderStatus =
  | "active"
  | "coming_soon"
  | "disabled";

export type TransferDirection =
  | "incoming"
  | "outgoing"
  | "both";

export type ProviderEnvironment =
  | "configuration"
  | "sandbox"
  | "production";

export type ProviderIdentifierType =
  | "phone_number"
  | "account_number"
  | "wallet_id"
  | "email"
  | "qr_code"
  | "beneficiary_id";

export type ProviderCapability =
  | "deposit"
  | "withdrawal"
  | "send_money"
  | "receive_money"
  | "bank_transfer"
  | "mobile_money_transfer"
  | "wallet_transfer"
  | "cash_pickup"
  | "bill_payment"
  | "merchant_payment"
  | "qr_payment"
  | "refund"
  | "scheduled_transfer"
  | "bulk_payment";

export type ProviderName = {
  en: string;
  fr: string;
};

export type ProviderAmountLimits = {
  /**
   * Minimum transaction amount in the provider's currency.
   */
  minimum: number | null;

  /**
   * Maximum transaction amount in the provider's currency.
   */
  maximum: number | null;

  /**
   * Maximum total amount per day.
   */
  dailyMaximum: number | null;

  /**
   * Maximum total amount per month.
   */
  monthlyMaximum: number | null;
};

export type ProviderFeeConfiguration = {
  /**
   * Fixed fee in the provider's currency.
   */
  fixedFee: number;

  /**
   * Percentage charged on the transaction.
   *
   * Example:
   * 1.5 means 1.5%.
   */
  percentageFee: number;

  /**
   * Minimum fee applied to a transaction.
   */
  minimumFee: number | null;

  /**
   * Maximum fee applied to a transaction.
   */
  maximumFee: number | null;

  /**
   * Indicates whether the provider fee has been verified.
   */
  verified: boolean;
};

export type ProviderApiConfiguration = {
  /**
   * NdakoCare integration status.
   */
  ready: boolean;

  /**
   * Current environment used by the integration.
   */
  environment: ProviderEnvironment;

  /**
   * External API provider or payment aggregator.
   *
   * Examples:
   * - Direct provider API
   * - Flutterwave
   * - Paystack
   * - Cellulant
   *
   * Keep null until a provider is selected.
   */
  integrationPartner: string | null;

  /**
   * External provider API version.
   */
  apiVersion: string | null;

  /**
   * Indicates whether webhook processing is available.
   */
  webhookSupported: boolean;

  /**
   * Indicates whether the provider supports transaction-status checks.
   */
  transactionStatusSupported: boolean;

  /**
   * Indicates whether the provider supports automatic refunds.
   */
  refundSupported: boolean;
};

export type PaymentProvider = {
  /**
   * NdakoCare's unique provider identifier.
   *
   * Examples:
   * - orange-money-cm
   * - ecobank-cf
   * - ndakocare-wallet
   */
  id: string;

  /**
   * Provider display name.
   */
  name: ProviderName;

  /**
   * Short display name.
   */
  shortName: string;

  /**
   * ISO 3166-1 alpha-2 country code.
   *
   * Use "GLOBAL" for an internal provider available
   * across multiple countries.
   */
  countryCode: string;

  /**
   * ISO 4217 currency code.
   */
  currency: string;

  /**
   * Provider category.
   */
  providerType: ProviderType;

  /**
   * Local image path.
   *
   * The actual file can be added later under:
   * public/providers/
   */
  logoPath: string;

  /**
   * Provider website.
   *
   * Keep null until verified.
   */
  website: string | null;

  /**
   * Whether NdakoCare currently allows users to transact
   * through this provider.
   */
  supported: boolean;

  /**
   * Provider availability status.
   */
  status: ProviderStatus;

  /**
   * Whether the interface should show "Coming soon."
   */
  comingSoon: boolean;

  /**
   * Whether transfers may enter NdakoCare, leave NdakoCare,
   * or operate in both directions.
   */
  transferDirection: TransferDirection;

  /**
   * Supported beneficiary identifier.
   */
  identifierType: ProviderIdentifierType;

  /**
   * Transfer and payment capabilities.
   */
  capabilities: ProviderCapability[];

  /**
   * Transaction limits.
   */
  limits: ProviderAmountLimits;

  /**
   * Fee configuration.
   */
  fees: ProviderFeeConfiguration;

  /**
   * Provider API configuration.
   */
  api: ProviderApiConfiguration;

  /**
   * Whether a phone number is required.
   */
  requiresPhone: boolean;

  /**
   * Whether an account number is required.
   */
  requiresAccountNumber: boolean;

  /**
   * Whether the recipient's full legal name is required.
   */
  requiresRecipientName: boolean;

  /**
   * Whether the recipient's bank or branch code is required.
   */
  requiresBankCode: boolean;

  /**
   * Whether identity verification may be required.
   */
  kycRequired: boolean;

  /**
   * Whether a transfer note or reference may be provided.
   */
  supportsReference: boolean;

  /**
   * Optional internal note.
   *
   * This must not contain credentials or API secrets.
   */
  notes: string | null;
};

export type ProviderDropdownOption = {
  value: string;
  label: string;
  disabled: boolean;
};

/**
 * Reusable default values.
 *
 * We use factory functions instead of shared objects so that
 * each provider receives its own independent configuration.
 */

function createUnknownLimits(): ProviderAmountLimits {
  return {
    minimum: null,
    maximum: null,
    dailyMaximum: null,
    monthlyMaximum: null,
  };
}

function createUnverifiedFees(): ProviderFeeConfiguration {
  return {
    fixedFee: 0,
    percentageFee: 0,
    minimumFee: null,
    maximumFee: null,
    verified: false,
  };
}

function createPendingApiConfiguration(): ProviderApiConfiguration {
  return {
    ready: false,
    environment: "configuration",
    integrationPartner: null,
    apiVersion: null,
    webhookSupported: false,
    transactionStatusSupported: false,
    refundSupported: false,
  };
}

/**
 * NdakoCare internal wallet.
 *
 * This provider represents transfers between NdakoCare users.
 * Keep it disabled until wallet-to-wallet transfers are fully tested.
 */
export const INTERNAL_WALLET_PROVIDERS: PaymentProvider[] = [
  {
    id: "ndakocare-wallet",
    name: {
      en: "NdakoCare Wallet",
      fr: "Portefeuille NdakoCare",
    },
    shortName: "NdakoCare",
    countryCode: "GLOBAL",
    currency: "USD",
    providerType: "wallet",
    logoPath: "/providers/ndakocare-wallet.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "wallet_id",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "wallet_transfer",
      "merchant_payment",
      "qr_payment",
      "refund",
      "scheduled_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Internal NdakoCare provider. Enable only after wallet-transfer validation.",
  },
];

/**
 * Central African Republic
 */
export const CENTRAL_AFRICAN_REPUBLIC_PROVIDERS: PaymentProvider[] = [
  {
    id: "orange-money-cf",
    name: {
      en: "Orange Money",
      fr: "Orange Money",
    },
    shortName: "Orange Money",
    countryCode: "CF",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/orange-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider availability and API access must be confirmed before activation.",
  },
  {
    id: "telecel-money-cf",
    name: {
      en: "Telecel Money",
      fr: "Telecel Money",
    },
    shortName: "Telecel Money",
    countryCode: "CF",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/telecel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider availability and technical integration must be verified.",
  },
  {
    id: "ecobank-cf",
    name: {
      en: "Ecobank Central African Republic",
      fr: "Ecobank Centrafrique",
    },
    shortName: "Ecobank",
    countryCode: "CF",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ecobank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Bank-transfer requirements and integration access must be verified.",
  },
  {
    id: "bgfi-bank-cf",
    name: {
      en: "BGFI Bank Central African Republic",
      fr: "BGFI Bank Centrafrique",
    },
    shortName: "BGFI Bank",
    countryCode: "CF",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/bgfi-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Bank-transfer requirements and integration access must be verified.",
  },
];

/**
 * Cameroon
 */
export const CAMEROON_PROVIDERS: PaymentProvider[] = [
  {
    id: "orange-money-cm",
    name: {
      en: "Orange Money",
      fr: "Orange Money",
    },
    shortName: "Orange Money",
    countryCode: "CM",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/orange-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "mtn-momo-cm",
    name: {
      en: "MTN Mobile Money",
      fr: "MTN Mobile Money",
    },
    shortName: "MTN MoMo",
    countryCode: "CM",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/mtn-momo.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "afriland-first-bank-cm",
    name: {
      en: "Afriland First Bank",
      fr: "Afriland First Bank",
    },
    shortName: "Afriland",
    countryCode: "CM",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/afriland-first-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "ecobank-cm",
    name: {
      en: "Ecobank Cameroon",
      fr: "Ecobank Cameroun",
    },
    shortName: "Ecobank",
    countryCode: "CM",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ecobank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "uba-cm",
    name: {
      en: "United Bank for Africa Cameroon",
      fr: "United Bank for Africa Cameroun",
    },
    shortName: "UBA",
    countryCode: "CM",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/uba.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "bgfi-bank-cm",
    name: {
      en: "BGFI Bank Cameroon",
      fr: "BGFI Bank Cameroun",
    },
    shortName: "BGFI Bank",
    countryCode: "CM",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/bgfi-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Chad
 */
export const CHAD_PROVIDERS: PaymentProvider[] = [
  {
    id: "airtel-money-td",
    name: {
      en: "Airtel Money",
      fr: "Airtel Money",
    },
    shortName: "Airtel Money",
    countryCode: "TD",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/airtel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider presence, product name, and API access must be reconfirmed before production.",
  },
  {
    id: "moov-africa-money-td",
    name: {
      en: "Moov Africa Money",
      fr: "Moov Africa Money",
    },
    shortName: "Moov Money",
    countryCode: "TD",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/moov-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider presence, product name, and API access must be reconfirmed before production.",
  },
  {
    id: "ecobank-td",
    name: {
      en: "Ecobank Chad",
      fr: "Ecobank Tchad",
    },
    shortName: "Ecobank",
    countryCode: "TD",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ecobank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "uba-td",
    name: {
      en: "United Bank for Africa Chad",
      fr: "United Bank for Africa Tchad",
    },
    shortName: "UBA",
    countryCode: "TD",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/uba.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Gabon
 */
export const GABON_PROVIDERS: PaymentProvider[] = [
  {
    id: "airtel-money-ga",
    name: {
      en: "Airtel Money",
      fr: "Airtel Money",
    },
    shortName: "Airtel Money",
    countryCode: "GA",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/airtel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "moov-money-ga",
    name: {
      en: "Moov Money",
      fr: "Moov Money",
    },
    shortName: "Moov Money",
    countryCode: "GA",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/moov-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider name and API availability must be reconfirmed before production.",
  },
  {
    id: "bgfi-bank-ga",
    name: {
      en: "BGFI Bank Gabon",
      fr: "BGFI Bank Gabon",
    },
    shortName: "BGFI Bank",
    countryCode: "GA",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/bgfi-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "ecobank-ga",
    name: {
      en: "Ecobank Gabon",
      fr: "Ecobank Gabon",
    },
    shortName: "Ecobank",
    countryCode: "GA",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ecobank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Equatorial Guinea
 */
export const EQUATORIAL_GUINEA_PROVIDERS: PaymentProvider[] = [
  {
    id: "getesa-mobile-money-gq",
    name: {
      en: "GETESA Mobile Money",
      fr: "GETESA Mobile Money",
    },
    shortName: "GETESA",
    countryCode: "GQ",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/getesa.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Mobile-money product availability and official product name must be verified.",
  },
  {
    id: "bgfi-bank-gq",
    name: {
      en: "BGFI Bank Equatorial Guinea",
      fr: "BGFI Bank Guinée équatoriale",
    },
    shortName: "BGFI Bank",
    countryCode: "GQ",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/bgfi-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "cceibank-gq",
    name: {
      en: "CCEI Bank Equatorial Guinea",
      fr: "CCEI Bank Guinée équatoriale",
    },
    shortName: "CCEI Bank",
    countryCode: "GQ",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ccei-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Republic of the Congo
 */
export const REPUBLIC_OF_THE_CONGO_PROVIDERS: PaymentProvider[] = [
  {
    id: "airtel-money-cg",
    name: {
      en: "Airtel Money",
      fr: "Airtel Money",
    },
    shortName: "Airtel Money",
    countryCode: "CG",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/airtel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "mtn-momo-cg",
    name: {
      en: "MTN Mobile Money",
      fr: "MTN Mobile Money",
    },
    shortName: "MTN MoMo",
    countryCode: "CG",
    currency: "XAF",
    providerType: "mobile_money",
    logoPath: "/providers/mtn-momo.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "bgfi-bank-cg",
    name: {
      en: "BGFI Bank Congo",
      fr: "BGFI Bank Congo",
    },
    shortName: "BGFI Bank",
    countryCode: "CG",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/bgfi-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "ecobank-cg",
    name: {
      en: "Ecobank Congo",
      fr: "Ecobank Congo",
    },
    shortName: "Ecobank",
    countryCode: "CG",
    currency: "XAF",
    providerType: "bank",
    logoPath: "/providers/ecobank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Democratic Republic of the Congo
 */
export const DEMOCRATIC_REPUBLIC_OF_THE_CONGO_PROVIDERS: PaymentProvider[] = [
  {
    id: "airtel-money-cd",
    name: {
      en: "Airtel Money",
      fr: "Airtel Money",
    },
    shortName: "Airtel Money",
    countryCode: "CD",
    currency: "CDF",
    providerType: "mobile_money",
    logoPath: "/providers/airtel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "orange-money-cd",
    name: {
      en: "Orange Money",
      fr: "Orange Money",
    },
    shortName: "Orange Money",
    countryCode: "CD",
    currency: "CDF",
    providerType: "mobile_money",
    logoPath: "/providers/orange-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "mpesa-cd",
    name: {
      en: "M-Pesa",
      fr: "M-Pesa",
    },
    shortName: "M-Pesa",
    countryCode: "CD",
    currency: "CDF",
    providerType: "mobile_money",
    logoPath: "/providers/mpesa.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "rawbank-cd",
    name: {
      en: "Rawbank",
      fr: "Rawbank",
    },
    shortName: "Rawbank",
    countryCode: "CD",
    currency: "CDF",
    providerType: "bank",
    logoPath: "/providers/rawbank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "equity-bcdc-cd",
    name: {
      en: "EquityBCDC",
      fr: "EquityBCDC",
    },
    shortName: "EquityBCDC",
    countryCode: "CD",
    currency: "CDF",
    providerType: "bank",
    logoPath: "/providers/equity-bcdc.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "trust-merchant-bank-cd",
    name: {
      en: "Trust Merchant Bank",
      fr: "Trust Merchant Bank",
    },
    shortName: "TMB",
    countryCode: "CD",
    currency: "CDF",
    providerType: "bank",
    logoPath: "/providers/trust-merchant-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * Angola
 */
export const ANGOLA_PROVIDERS: PaymentProvider[] = [
  {
    id: "unitel-money-ao",
    name: {
      en: "Unitel Money",
      fr: "Unitel Money",
    },
    shortName: "Unitel Money",
    countryCode: "AO",
    currency: "AOA",
    providerType: "mobile_money",
    logoPath: "/providers/unitel-money.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
      "bill_payment",
      "merchant_payment",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Provider product and integration availability must be verified.",
  },
  {
    id: "banco-bai-ao",
    name: {
      en: "Banco Angolano de Investimentos",
      fr: "Banco Angolano de Investimentos",
    },
    shortName: "BAI",
    countryCode: "AO",
    currency: "AOA",
    providerType: "bank",
    logoPath: "/providers/bai.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "banco-bfa-ao",
    name: {
      en: "Banco de Fomento Angola",
      fr: "Banco de Fomento Angola",
    },
    shortName: "BFA",
    countryCode: "AO",
    currency: "AOA",
    providerType: "bank",
    logoPath: "/providers/bfa.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "standard-bank-ao",
    name: {
      en: "Standard Bank Angola",
      fr: "Standard Bank Angola",
    },
    shortName: "Standard Bank",
    countryCode: "AO",
    currency: "AOA",
    providerType: "bank",
    logoPath: "/providers/standard-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
];

/**
 * São Tomé and Príncipe
 */
export const SAO_TOME_AND_PRINCIPE_PROVIDERS: PaymentProvider[] = [
  {
    id: "cst-money-st",
    name: {
      en: "CST Mobile Payment",
      fr: "Paiement mobile CST",
    },
    shortName: "CST",
    countryCode: "ST",
    currency: "STN",
    providerType: "mobile_money",
    logoPath: "/providers/cst.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "phone_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "mobile_money_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: true,
    requiresAccountNumber: false,
    requiresRecipientName: true,
    requiresBankCode: false,
    kycRequired: true,
    supportsReference: true,
    notes:
      "The official product name and availability must be verified before production use.",
  },
  {
    id: "banco-internacional-st",
    name: {
      en: "Banco Internacional de São Tomé e Príncipe",
      fr: "Banco Internacional de São Tomé e Príncipe",
    },
    shortName: "BISTP",
    countryCode: "ST",
    currency: "STN",
    providerType: "bank",
    logoPath: "/providers/bistp.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes: null,
  },
  {
    id: "afriland-first-bank-st",
    name: {
      en: "Afriland First Bank São Tomé and Príncipe",
      fr: "Afriland First Bank Sao Tomé-et-Principe",
    },
    shortName: "Afriland",
    countryCode: "ST",
    currency: "STN",
    providerType: "bank",
    logoPath: "/providers/afriland-first-bank.svg",
    website: null,
    supported: false,
    status: "coming_soon",
    comingSoon: true,
    transferDirection: "both",
    identifierType: "account_number",
    capabilities: [
      "deposit",
      "withdrawal",
      "send_money",
      "receive_money",
      "bank_transfer",
    ],
    limits: createUnknownLimits(),
    fees: createUnverifiedFees(),
    api: createPendingApiConfiguration(),
    requiresPhone: false,
    requiresAccountNumber: true,
    requiresRecipientName: true,
    requiresBankCode: true,
    kycRequired: true,
    supportsReference: true,
    notes:
      "Institution name and current operations must be confirmed before production.",
  },
];

/**
 * Master Central Africa provider collection.
 */
export const CENTRAL_AFRICA_PROVIDERS: PaymentProvider[] = [
  ...CENTRAL_AFRICAN_REPUBLIC_PROVIDERS,
  ...CAMEROON_PROVIDERS,
  ...CHAD_PROVIDERS,
  ...GABON_PROVIDERS,
  ...EQUATORIAL_GUINEA_PROVIDERS,
  ...REPUBLIC_OF_THE_CONGO_PROVIDERS,
  ...DEMOCRATIC_REPUBLIC_OF_THE_CONGO_PROVIDERS,
  ...ANGOLA_PROVIDERS,
  ...SAO_TOME_AND_PRINCIPE_PROVIDERS,
];

/**
 * Main NdakoCare provider registry.
 *
 * Future regions will be added here:
 *
 * - West Africa
 * - East Africa
 * - Southern Africa
 * - North Africa
 */
export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  ...INTERNAL_WALLET_PROVIDERS,
  ...CENTRAL_AFRICA_PROVIDERS,
];

/**
 * Alias that may be more convenient in some modules.
 */
export const PROVIDERS = PAYMENT_PROVIDERS;

/**
 * Returns a localized provider name.
 */
export function getProviderName(
  provider: PaymentProvider,
  language: "en" | "fr" = "en"
): string {
  return provider.name[language];
}

/**
 * Returns one provider by its unique ID.
 *
 * Example:
 * getProviderById("orange-money-cm")
 */
export function getProviderById(
  providerId: string
): PaymentProvider | undefined {
  const normalizedId = providerId.trim().toLowerCase();

  return PAYMENT_PROVIDERS.find(
    (provider) => provider.id.toLowerCase() === normalizedId
  );
}

/**
 * Returns every provider configured for a country.
 *
 * Example:
 * getProvidersByCountry("CM")
 */
export function getProvidersByCountry(
  countryCode: string,
  includeGlobalProviders = false
): PaymentProvider[] {
  const normalizedCountryCode = countryCode
    .trim()
    .toUpperCase();

  return PAYMENT_PROVIDERS.filter((provider) => {
    if (
      includeGlobalProviders &&
      provider.countryCode === "GLOBAL"
    ) {
      return true;
    }

    return provider.countryCode === normalizedCountryCode;
  });
}

/**
 * Returns every provider using a selected currency.
 *
 * Example:
 * getProvidersByCurrency("XAF")
 */
export function getProvidersByCurrency(
  currency: string
): PaymentProvider[] {
  const normalizedCurrency = currency
    .trim()
    .toUpperCase();

  return PAYMENT_PROVIDERS.filter(
    (provider) =>
      provider.currency === normalizedCurrency
  );
}

/**
 * Returns providers by category.
 *
 * Example:
 * getProvidersByType("mobile_money")
 */
export function getProvidersByType(
  providerType: ProviderType
): PaymentProvider[] {
  return PAYMENT_PROVIDERS.filter(
    (provider) =>
      provider.providerType === providerType
  );
}

/**
 * Returns mobile-money providers.
 *
 * Optionally filter by country.
 *
 * Examples:
 * getMobileMoneyProviders()
 * getMobileMoneyProviders("CM")
 */
export function getMobileMoneyProviders(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) =>
      provider.providerType === "mobile_money"
  );
}

/**
 * Returns bank providers.
 *
 * Optionally filter by country.
 *
 * Examples:
 * getBanks()
 * getBanks("CD")
 */
export function getBanks(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) => provider.providerType === "bank"
  );
}

/**
 * Returns internal or external wallet providers.
 */
export function getWalletProviders(
  countryCode?: string
): PaymentProvider[] {
  if (!countryCode) {
    return PAYMENT_PROVIDERS.filter(
      (provider) =>
        provider.providerType === "wallet"
    );
  }

  return getProvidersByCountry(
    countryCode,
    true
  ).filter(
    (provider) =>
      provider.providerType === "wallet"
  );
}

/**
 * Returns cash-pickup providers.
 */
export function getCashPickupProviders(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) =>
      provider.providerType === "cash_pickup"
  );
}

/**
 * Returns providers that NdakoCare currently permits
 * for real transactions.
 */
export function getSupportedProviders(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode, true)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) =>
      provider.supported &&
      provider.status === "active"
  );
}

/**
 * Returns providers marked as coming soon.
 */
export function getComingSoonProviders(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode, true)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) =>
      provider.comingSoon ||
      provider.status === "coming_soon"
  );
}

/**
 * Returns providers that have completed API setup.
 */
export function getApiReadyProviders(
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode, true)
    : PAYMENT_PROVIDERS;

  return providers.filter(
    (provider) => provider.api.ready
  );
}

/**
 * Returns providers supporting a capability.
 *
 * Example:
 * getProvidersByCapability("qr_payment")
 */
export function getProvidersByCapability(
  capability: ProviderCapability,
  countryCode?: string
): PaymentProvider[] {
  const providers = countryCode
    ? getProvidersByCountry(countryCode, true)
    : PAYMENT_PROVIDERS;

  return providers.filter((provider) =>
    provider.capabilities.includes(capability)
  );
}

/**
 * Checks whether a provider supports a capability.
 */
export function providerSupportsCapability(
  providerId: string,
  capability: ProviderCapability
): boolean {
  const provider = getProviderById(providerId);

  return (
    provider?.capabilities.includes(capability) ??
    false
  );
}

/**
 * Checks whether a provider is enabled.
 */
export function isProviderSupported(
  providerId: string
): boolean {
  const provider = getProviderById(providerId);

  return Boolean(
    provider?.supported &&
      provider.status === "active"
  );
}

/**
 * Checks whether a provider is API-ready.
 */
export function isProviderApiReady(
  providerId: string
): boolean {
  return getProviderById(providerId)?.api.ready ?? false;
}

/**
 * Returns the provider logo path.
 */
export function getProviderLogo(
  providerId: string
): string | null {
  return getProviderById(providerId)?.logoPath ?? null;
}

/**
 * Returns the provider currency.
 */
export function getProviderCurrency(
  providerId: string
): string | null {
  return getProviderById(providerId)?.currency ?? null;
}

/**
 * Returns the provider country code.
 */
export function getProviderCountryCode(
  providerId: string
): string | null {
  return getProviderById(providerId)?.countryCode ?? null;
}

/**
 * Returns the identifier required by a provider.
 */
export function getProviderIdentifierType(
  providerId: string
): ProviderIdentifierType | null {
  return (
    getProviderById(providerId)?.identifierType ??
    null
  );
}

/**
 * Returns providers sorted by localized provider name.
 */
export function getSortedProviders(
  providers: PaymentProvider[] = PAYMENT_PROVIDERS,
  language: "en" | "fr" = "en"
): PaymentProvider[] {
  return [...providers].sort(
    (firstProvider, secondProvider) =>
      getProviderName(
        firstProvider,
        language
      ).localeCompare(
        getProviderName(
          secondProvider,
          language
        ),
        language
      )
  );
}

/**
 * Creates a user-friendly provider label.
 *
 * Examples:
 *
 * Orange Money — Mobile Money
 * Ecobank — Bank
 */
export function getProviderDropdownLabel(
  provider: PaymentProvider,
  language: "en" | "fr" = "en"
): string {
  const typeLabels: Record<
    ProviderType,
    ProviderName
  > = {
    mobile_money: {
      en: "Mobile Money",
      fr: "Mobile Money",
    },
    bank: {
      en: "Bank",
      fr: "Banque",
    },
    wallet: {
      en: "Wallet",
      fr: "Portefeuille",
    },
    cash_pickup: {
      en: "Cash pickup",
      fr: "Retrait en espèces",
    },
  };

  return `${getProviderName(
    provider,
    language
  )} — ${typeLabels[provider.providerType][language]}`;
}

/**
 * Converts providers into options for a select element.
 */
export function createProviderDropdownOptions(
  providers: PaymentProvider[],
  language: "en" | "fr" = "en"
): ProviderDropdownOption[] {
  return getSortedProviders(
    providers,
    language
  ).map((provider) => ({
    value: provider.id,
    label: getProviderDropdownLabel(
      provider,
      language
    ),
    disabled:
      !provider.supported ||
      provider.status !== "active",
  }));
}

/**
 * Searches providers by:
 *
 * - Provider name
 * - Short name
 * - Country code
 * - Currency
 * - Provider ID
 */
export function searchProviders(
  query: string,
  language: "en" | "fr" = "en"
): PaymentProvider[] {
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase();

  if (!normalizedQuery) {
    return getSortedProviders(
      PAYMENT_PROVIDERS,
      language
    );
  }

  return getSortedProviders(
    PAYMENT_PROVIDERS.filter((provider) => {
      const searchableValues = [
        provider.id,
        provider.name.en,
        provider.name.fr,
        provider.shortName,
        provider.countryCode,
        provider.currency,
        provider.providerType,
      ];

      return searchableValues.some((value) =>
        value
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      );
    }),
    language
  );
}

/**
 * Verifies that provider IDs are unique.
 *
 * This can be called in development tests.
 */
export function hasDuplicateProviderIds(): boolean {
  const providerIds = PAYMENT_PROVIDERS.map(
    (provider) => provider.id
  );

  return (
    new Set(providerIds).size !==
    providerIds.length
  );
}

/**
 * Returns duplicate provider IDs.
 *
 * The expected result is an empty array.
 */
export function getDuplicateProviderIds(): string[] {
  const occurrences = new Map<string, number>();

  PAYMENT_PROVIDERS.forEach((provider) => {
    occurrences.set(
      provider.id,
      (occurrences.get(provider.id) ?? 0) + 1
    );
  });

  return [...occurrences.entries()]
    .filter(([, count]) => count > 1)
    .map(([providerId]) => providerId);
}

/**
 * Returns a basic summary for development dashboards.
 */
export function getProviderRegistrySummary() {
  return {
    total: PAYMENT_PROVIDERS.length,
    mobileMoney: getMobileMoneyProviders().length,
    banks: getBanks().length,
    wallets: getWalletProviders().length,
    cashPickup: getCashPickupProviders().length,
    supported: getSupportedProviders().length,
    comingSoon: getComingSoonProviders().length,
    apiReady: getApiReadyProviders().length,
    duplicateIds: getDuplicateProviderIds(),
  };
}