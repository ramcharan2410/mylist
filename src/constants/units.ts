export const QUANTITY_UNITS = [
  "kgs",
  "g",
  "ltrs",
  "ml",
  "no.",
  "pieces",
  "packs",
  "dozen",
] as const;

export type QuantityUnit = (typeof QUANTITY_UNITS)[number];
