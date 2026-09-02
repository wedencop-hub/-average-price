import type { CeilingCalculation } from "./calculation-engine";

export type EstimateItem = {
  id: string;
  sku: string;
  name: string;
  unit: "м²" | "м" | "шт";
  quantity: number;
  unitPrice: number;
  total: number;
};

export type EstimateVersion = {
  id: string;
  objectId: string;
  version: number;
  createdAt: string;
  author: string;
  discount: number;
  items: EstimateItem[];
  subtotal: number;
  total: number;
};

export const DEFAULT_ESTIMATE_PRICES: Record<string, number> = {
  membrane: 280,
  profile: 180,
  harpoon: 45,
  fasteners: 12,
  lights: 250,
};

export function estimateFromCalculation(objectId: string, calculation: CeilingCalculation, previous?: EstimateVersion): EstimateVersion {
  const values = [
    ["membrane", "Полотно натяжної стелі", "м²", calculation.membraneM2],
    ["profile", "Профіль", "м", calculation.profileM],
    ["harpoon", "Гарпун", "м", calculation.harpoonM],
    ["fasteners", "Кріплення", "шт", calculation.fasteners],
    ["lights", "Світильники", "шт", calculation.lights],
  ] as const;
  const items = values.map(([sku, name, unit, quantity]) => {
    const old = previous?.items.find((item) => item.sku === sku);
    const unitPrice = old?.unitPrice ?? DEFAULT_ESTIMATE_PRICES[sku];
    return { id: `${objectId}:${sku}`, sku, name, unit, quantity, unitPrice, total: round(quantity * unitPrice) };
  }).filter((item) => item.quantity > 0);
  const subtotal = round(items.reduce((sum, item) => sum + item.total, 0));
  const discount = previous?.discount ?? 0;
  return { id: previous?.id ?? `estimate:${objectId}`, objectId, version: (previous?.version ?? 0) + 1, createdAt: new Date().toISOString(), author: "Офлайн-користувач", discount, items, subtotal, total: round(Math.max(0, subtotal - discount)) };
}

export function recalculateEstimate(estimate: EstimateVersion, prices: Record<string, number> = {}): EstimateVersion {
  const items = estimate.items.map((item) => {
    const unitPrice = prices[item.sku] ?? item.unitPrice;
    return { ...item, unitPrice, total: round(item.quantity * unitPrice) };
  });
  const subtotal = round(items.reduce((sum, item) => sum + item.total, 0));
  return { ...estimate, items, subtotal, total: round(Math.max(0, subtotal - estimate.discount)) };
}

function round(value: number) { return Math.round(value * 100) / 100; }
