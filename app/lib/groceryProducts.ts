export type GroceryCategory =
  | "staples"
  | "proteins"
  | "produce"
  | "beverages"
  | "household";

export type GroceryProduct = {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  description: {
    en: string;
    fr: string;
  };
  category: GroceryCategory;
  price: number;
  currency: string;
  unit: string;
  countries: string[];
  emoji: string;
  available: boolean;
};

export const GROCERY_PRODUCTS: GroceryProduct[] = [
  {
    id: "rice-5kg",
    name: {
      en: "Rice",
      fr: "Riz",
    },
    description: {
      en: "5 kg bag of rice",
      fr: "Sac de riz de 5 kg",
    },
    category: "staples",
    price: 6500,
    currency: "XAF",
    unit: "5 kg",
    countries: ["CF"],
    emoji: "🍚",
    available: true,
  },

  {
    id: "cooking-oil-1l",
    name: {
      en: "Cooking Oil",
      fr: "Huile de cuisine",
    },
    description: {
      en: "1 liter bottle",
      fr: "Bouteille de 1 litre",
    },
    category: "staples",
    price: 1800,
    currency: "XAF",
    unit: "1 L",
    countries: ["CF"],
    emoji: "🫗",
    available: true,
  },

  {
    id: "sugar-1kg",
    name: {
      en: "Sugar",
      fr: "Sucre",
    },
    description: {
      en: "1 kg package",
      fr: "Paquet de 1 kg",
    },
    category: "staples",
    price: 1200,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🧂",
    available: true,
  },

  {
    id: "flour-1kg",
    name: {
      en: "Flour",
      fr: "Farine",
    },
    description: {
      en: "1 kg package of flour",
      fr: "Paquet de farine de 1 kg",
    },
    category: "staples",
    price: 1000,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🌾",
    available: true,
  },

  {
    id: "chicken-1kg",
    name: {
      en: "Chicken",
      fr: "Poulet",
    },
    description: {
      en: "Approximately 1 kg",
      fr: "Environ 1 kg",
    },
    category: "proteins",
    price: 4500,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🍗",
    available: true,
  },

  {
    id: "fish-1kg",
    name: {
      en: "Fish",
      fr: "Poisson",
    },
    description: {
      en: "Fresh or frozen fish",
      fr: "Poisson frais ou congelé",
    },
    category: "proteins",
    price: 4000,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🐟",
    available: true,
  },

  {
    id: "eggs-12",
    name: {
      en: "Eggs",
      fr: "Œufs",
    },
    description: {
      en: "Tray of 12 eggs",
      fr: "Plateau de 12 œufs",
    },
    category: "proteins",
    price: 2500,
    currency: "XAF",
    unit: "12",
    countries: ["CF"],
    emoji: "🥚",
    available: true,
  },

  {
    id: "tomatoes-1kg",
    name: {
      en: "Tomatoes",
      fr: "Tomates",
    },
    description: {
      en: "Fresh tomatoes",
      fr: "Tomates fraîches",
    },
    category: "produce",
    price: 1500,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🍅",
    available: true,
  },

  {
    id: "onions-1kg",
    name: {
      en: "Onions",
      fr: "Oignons",
    },
    description: {
      en: "Fresh onions",
      fr: "Oignons frais",
    },
    category: "produce",
    price: 1200,
    currency: "XAF",
    unit: "1 kg",
    countries: ["CF"],
    emoji: "🧅",
    available: true,
  },

  {
    id: "bananas-bunch",
    name: {
      en: "Bananas",
      fr: "Bananes",
    },
    description: {
      en: "Fresh bunch of bananas",
      fr: "Régime de bananes fraîches",
    },
    category: "produce",
    price: 1800,
    currency: "XAF",
    unit: "1 bunch",
    countries: ["CF"],
    emoji: "🍌",
    available: true,
  },

  {
    id: "water-6",
    name: {
      en: "Bottled Water",
      fr: "Eau en bouteille",
    },
    description: {
      en: "Pack of 6 bottles",
      fr: "Pack de 6 bouteilles",
    },
    category: "beverages",
    price: 2500,
    currency: "XAF",
    unit: "6 bottles",
    countries: ["CF"],
    emoji: "💧",
    available: true,
  },

  {
    id: "milk-1l",
    name: {
      en: "Milk",
      fr: "Lait",
    },
    description: {
      en: "1 liter of milk",
      fr: "1 litre de lait",
    },
    category: "beverages",
    price: 1500,
    currency: "XAF",
    unit: "1 L",
    countries: ["CF"],
    emoji: "🥛",
    available: true,
  },

  {
    id: "soap-pack",
    name: {
      en: "Bath Soap",
      fr: "Savon de toilette",
    },
    description: {
      en: "Pack of bath soap",
      fr: "Paquet de savon de toilette",
    },
    category: "household",
    price: 2000,
    currency: "XAF",
    unit: "pack",
    countries: ["CF"],
    emoji: "🧼",
    available: true,
  },

  {
    id: "toothpaste",
    name: {
      en: "Toothpaste",
      fr: "Dentifrice",
    },
    description: {
      en: "Family-size toothpaste",
      fr: "Dentifrice format familial",
    },
    category: "household",
    price: 1500,
    currency: "XAF",
    unit: "1",
    countries: ["CF"],
    emoji: "🪥",
    available: true,
  },
];

export const GROCERY_CATEGORIES = [
  {
    id: "all",
    en: "All Products",
    fr: "Tous les produits",
  },
  {
    id: "staples",
    en: "Staples",
    fr: "Produits de base",
  },
  {
    id: "proteins",
    en: "Proteins",
    fr: "Protéines",
  },
  {
    id: "produce",
    en: "Fresh Produce",
    fr: "Produits frais",
  },
  {
    id: "beverages",
    en: "Beverages",
    fr: "Boissons",
  },
  {
    id: "household",
    en: "Household",
    fr: "Produits ménagers",
  },
] as const;

export function getGroceryProductsByCountry(
  countryCode: string
) {
  return GROCERY_PRODUCTS.filter(
    (product) =>
      product.available &&
      product.countries.includes(countryCode)
  );
}