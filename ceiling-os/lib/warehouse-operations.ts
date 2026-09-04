import type { StockItem } from "./warehouse-model";
import { getOffline, putOffline, type OfflineRecord } from "./offline-store";
import { getInventory, saveInventory } from "./warehouse-inventory";

export type ReservationLine = { sku: string; quantity: number; unitCost: number };
export type StockReservation = { id: string; objectId: string; companyId: string; warehouseId: string; items: ReservationLine[]; createdAt: string; status: "active" | "released" | "issued" };

const RESERVATIONS_KEY = "warehouse:reservations";

export async function getReservations(): Promise<StockReservation[]> {
  const r = await getOffline<StockReservation[]>(RESERVATIONS_KEY);
  return r?.payload ?? [];
}

async function saveReservations(items: StockReservation[]) {
  const old = await getOffline<StockReservation[]>(RESERVATIONS_KEY);
  const record: OfflineRecord<StockReservation[]> = { id: RESERVATIONS_KEY, entity: "warehouse_reservations", payload: items, version: (old?.version ?? 0) + 1, updatedAt: new Date().toISOString(), status: "pending" };
  await putOffline(record);
}

export async function reserveForObject(objectId: string, companyId: string, items: ReservationLine[], warehouseId = "main") {
  const inventory = await getInventory();
  const reservations = await getReservations();
  const otherActive = reservations.filter(r => r.status === "active" && r.objectId !== objectId);
  const shortage = items.some(line => {
    const stock = inventory.find(x => x.sku === line.sku)?.quantity ?? 0;
    const reserved = otherActive.reduce((sum, r) => sum + (r.items.find(x => x.sku === line.sku)?.quantity ?? 0), 0);
    return stock - reserved < line.quantity;
  });
  if (shortage) throw new Error("Недостатньо вільного залишку для резерву.");
  const next: StockReservation = { id: `reservation-${objectId}`, objectId, companyId, warehouseId, items, createdAt: new Date().toISOString(), status: "active" };
  await saveReservations([...reservations.filter(r => r.id !== next.id), next]);
  return next;
}

export async function releaseObjectReservation(objectId: string) {
  const reservations = await getReservations();
  await saveReservations(reservations.map(r => r.objectId === objectId && r.status === "active" ? { ...r, status: "released" } : r));
}

export async function issueReservedForObject(objectId: string): Promise<StockItem[]> {
  const reservations = await getReservations();
  const reservation = reservations.find(r => r.objectId === objectId && r.status === "active");
  if (!reservation) throw new Error("Активний резерв матеріалів не знайдено.");
  const inventory = await getInventory();
  const next = inventory.map(stock => {
    const line = reservation.items.find(x => x.sku === stock.sku);
    return line ? { ...stock, quantity: Math.max(0, stock.quantity - line.quantity) } : stock;
  });
  for (const line of reservation.items) {
    const stock = inventory.find(x => x.sku === line.sku);
    if (!stock || stock.quantity < line.quantity) throw new Error(`Недостатньо матеріалу: ${line.sku}`);
  }
  await saveInventory(next);
  await saveReservations(reservations.map(r => r.id === reservation.id ? { ...r, status: "issued" } : r));
  return next;
}

export function reservedBySku(reservations: StockReservation[], sku: string, excludeObjectId?: string) {
  return reservations.filter(r => r.status === "active" && r.objectId !== excludeObjectId).reduce((sum, r) => sum + (r.items.find(x => x.sku === sku)?.quantity ?? 0), 0);
}
