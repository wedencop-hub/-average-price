import { getOffline, putOffline, type OfflineRecord } from "./offline-store";
import type { InternalCost } from "./nomenclature-model";

export async function getInternalCost(objectId:string):Promise<InternalCost|null>{const r=await getOffline<InternalCost>(`cost:${objectId}`);return r?.payload??null}
export async function saveInternalCost(cost:InternalCost):Promise<void>{const id=`cost:${cost.objectId}`;const old=await getOffline<InternalCost>(id);const record:OfflineRecord<InternalCost>={id,entity:"internal_cost",payload:cost,version:(old?.version??0)+1,updatedAt:new Date().toISOString(),status:"pending"};await putOffline(record)}
