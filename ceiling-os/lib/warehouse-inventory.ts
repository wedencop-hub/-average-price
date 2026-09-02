import { getOffline, putOffline, type OfflineRecord } from "./offline-store";
import type { StockItem, StockMovement } from "./warehouse-model";

const INVENTORY_KEY = "warehouse:inventory:main";
const RESERVATION_PREFIX = "warehouse:reservation:";

export async function getInventory(): Promise<StockItem[]> {
  const r = await getOffline<StockItem[]>(INVENTORY_KEY);
  return r?.payload ?? [];
}

export async function saveInventory(items: StockItem[]): Promise<void> {
  const old = await getOffline<StockItem[]>(INVENTORY_KEY);
  const record: OfflineRecord<StockItem[]> = {
    id: INVENTORY_KEY, entity: "warehouse_inventory", payload: items,
    version: (old?.version ?? 0) + 1, updatedAt: new Date().toISOString(), status: "pending"
  };
  await putOffline(record);
}

export async function getObjectReservation(objectId: string): Promise<StockMovement[]> {
  const r = await getOffline<StockMovement[]>(`${RESERVATION_PREFIX}${objectId}`);
  return r?.payload ?? [];
}

export async function saveObjectReservation(objectId: string, movements: StockMovement[]): Promise<void> {
  const id = `${RESERVATION_PREFIX}${objectId}`;
  const old = await getOffline<StockMovement[]>(id);
  const record: OfflineRecord<StockMovement[]> = {
    id, entity: "warehouse_reservation", payload: movements,
    version: (old?.version ?? 0) + 1, updatedAt: new Date().toISOString(), status: "pending"
  };
  await putOffline(record);
}

export function inventoryBalance(items: StockItem[], sku: string): number {
  return items.find(x => x.sku === sku)?.quantity ?? 0;
}

export function reservedQuantity(movements: StockMovement[]): number {
  return movements.reduce((sum, x) => sum + Math.abs(x.quantity), 0);
}

export function availableQuantity(item: StockItem, reserved: number): number {
  return Math.max(0, item.quantity - reserved);
}

export function seedInventory(): StockItem[] {
  return [
    { sku: "membrane", name: "Полотно натяжної стелі", unit: "м²", quantity: 0, unitCost: 135, minStock: 20 },
    { sku: "profile", name: "Профіль", unit: "м", quantity: 0, unitCost: 82, minStock: 30 },
    { sku: "harpoon", name: "Гарпун", unit: "м", quantity: 0, unitCost: 18, minStock: 30 },
    { sku: "fasteners", name: "Кріплення", unit: "шт", quantity: 0, unitCost: 4, minStock: 100 },
    { sku: "lights", name: "Світильник", unit: "шт", quantity: 0, unitCost: 110, minStock: 10 },
    { sku: "led", name: "LED", unit: "м", quantity: 0, unitCost: 0, minStock: 10 },
    { sku: "power_supply", name: "Блок живлення", unit: "шт", quantity: 0, unitCost: 0, minStock: 2 },
  ];
}
