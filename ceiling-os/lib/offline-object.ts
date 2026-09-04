import type { CeilingDrawing } from "./ceiling-model";
import { calculateCeiling } from "./calculation-engine";
import { enqueueSync } from "./sync-queue";
import { putOffline } from "./offline-store";

export type OfflineObject = {
  id: string;
  companyId: string;
  clientId?: string;
  address: string;
  status: "lead" | "measurement" | "estimate" | "contract" | "deposit_paid" | "production" | "ready" | "delivery" | "installation" | "completed" | "cancelled";
  drawing?: CeilingDrawing;
  calculation?: ReturnType<typeof calculateCeiling>;
  updatedAt: string;
};

export async function saveOfflineObject(object: OfflineObject): Promise<void> {
  await putOffline({
    id: `object:${object.id}`,
    entity: "object",
    payload: object,
    version: 1,
    updatedAt: object.updatedAt,
    status: "pending",
  });

  enqueueSync({
    companyId: object.companyId,
    entity: "object",
    entityId: object.id,
    operation: "update",
    payload: object,
  });
}

export async function saveOfflineDrawing(object: OfflineObject, drawing: CeilingDrawing): Promise<OfflineObject> {
  const calculation = calculateCeiling(drawing);
  const updated: OfflineObject = {
    ...object,
    drawing,
    calculation,
    updatedAt: new Date().toISOString(),
  };
  await saveOfflineObject(updated);
  return updated;
}
