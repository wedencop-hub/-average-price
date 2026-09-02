import type { ProductionOrder } from "./production-model";
import { getOffline, putOffline } from "./offline-store";

const key = (objectId: string) => `production:${objectId}`;

export async function getProductionOrder(objectId: string) {
  const record = await getOffline<ProductionOrder>(key(objectId));
  return record?.payload ?? null;
}

export async function saveProductionOrder(order: ProductionOrder) {
  const updated = { ...order, updatedAt: new Date().toISOString() };
  await putOffline({ id: key(order.objectId), payload: updated, status: "pending", updatedAt: updated.updatedAt });
  return updated;
}
