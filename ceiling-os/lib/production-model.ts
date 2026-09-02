import type { EstimateVersion } from "./estimate-model";
import type { StockItem } from "./warehouse-model";

export type ProductionStatus = "new" | "processing" | "ready" | "issued" | "completed";

export type ProductionItem = {
  id: string;
  sku: string;
  name: string;
  unit: "м²" | "м" | "шт";
  quantity: number;
  unitCost: number;
  totalCost: number;
  available: number;
  shortage: number;
};

export type ProductionOrder = {
  id: string;
  companyId: string;
  objectId: string;
  status: ProductionStatus;
  items: ProductionItem[];
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export function createProductionOrderFromEstimate(
  estimate: EstimateVersion,
  inventory: StockItem[],
  companyId = "demo-company",
): ProductionOrder {
  const items = estimate.items.map((item) => {
    const stock = inventory.find((entry) => entry.sku === item.sku);
    const available = stock?.quantity ?? 0;
    const unitCost = stock?.unitCost ?? 0;
    const shortage = Math.max(0, item.quantity - available);
    return {
      id: `production-item-${item.id}`,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unitCost,
      totalCost: item.quantity * unitCost,
      available,
      shortage,
    };
  });

  const now = new Date().toISOString();
  return {
    id: `production-${estimate.objectId}`,
    companyId,
    objectId: estimate.objectId,
    status: "new",
    items,
    totalCost: items.reduce((sum, item) => sum + item.totalCost, 0),
    createdAt: now,
    updatedAt: now,
  };
}

export function hasProductionShortage(order: ProductionOrder): boolean {
  return order.items.some((item) => item.shortage > 0);
}

export function productionTotal(order: ProductionOrder): number {
  return order.items.reduce((sum, item) => sum + item.totalCost, 0);
}
