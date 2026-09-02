import { getOffline, putOffline, type OfflineRecord } from "./offline-store";
import type { EstimateVersion } from "./estimate-model";

export async function getEstimate(objectId: string): Promise<EstimateVersion | null> {
  try {
    const r = await fetch(`/api/objects/${encodeURIComponent(objectId)}/estimates`, { cache: "no-store" });
    if (r.ok) {
      const data = await r.json();
      if (data?.estimate) return data.estimate as EstimateVersion;
    }
  } catch {}
  const record = await getOffline<EstimateVersion>(`estimate:${objectId}`);
  return record?.payload ?? null;
}

export async function saveEstimate(estimate: EstimateVersion): Promise<void> {
  try {
    const r = await fetch(`/api/objects/${encodeURIComponent(estimate.objectId)}/estimates`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ discount: estimate.discount, items: estimate.items }),
    });
    if (r.ok) {
      const data = await r.json();
      if (data?.estimate) return;
    }
  } catch {}
  const existing = await getOffline<EstimateVersion>(`estimate:${estimate.objectId}`);
  const record: OfflineRecord<EstimateVersion> = {
    id: `estimate:${estimate.objectId}`, entity: "estimate", payload: estimate,
    version: (existing?.version ?? 0) + 1, updatedAt: new Date().toISOString(), status: "pending",
  };
  await putOffline(record);
}
