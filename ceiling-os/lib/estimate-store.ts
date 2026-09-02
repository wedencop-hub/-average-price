import { getOffline, putOffline, type OfflineRecord } from "./offline-store";
import type { EstimateVersion } from "./estimate-model";

export async function getEstimate(objectId: string): Promise<EstimateVersion | null> {
  const record = await getOffline<EstimateVersion>(`estimate:${objectId}`);
  return record?.payload ?? null;
}

export async function saveEstimate(estimate: EstimateVersion): Promise<void> {
  const existing = await getOffline<EstimateVersion>(`estimate:${estimate.objectId}`);
  const record: OfflineRecord<EstimateVersion> = {
    id: `estimate:${estimate.objectId}`,
    entity: "estimate",
    payload: estimate,
    version: (existing?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
    status: "pending",
  };
  await putOffline(record);
}
