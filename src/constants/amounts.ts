export const QUANTITY_AMOUNTS = [
  "0.25",
  "0.5",
  "0.75",
  "1",
  "1.25",
  "1.5",
  "1.75",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
  "Custom",
] as const;

export type QuantityAmount = (typeof QUANTITY_AMOUNTS)[number];
