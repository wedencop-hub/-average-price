import {getOffline,putOffline,type OfflineRecord} from "./offline-store";
export type {PayrollEntry} from "./payroll-model";
import type {PayrollEntry} from "./payroll-model";

export async function getPayroll(objectId:string):Promise<PayrollEntry[]>{
 try{const r=await fetch(`/api/objects/${objectId}/payroll`,{cache:"no-store"});if(r.ok){const data=await r.json();if(data.ok&&Array.isArray(data.entries))return data.entries as PayrollEntry[]}}catch{}
 const r=await getOffline<PayrollEntry[]>(`payroll:${objectId}`);return r?.payload??[]
}
export async function savePayroll(objectId:string,entries:PayrollEntry[]):Promise<void>{
 let allOk=true;
 for(const e of entries){try{const r=await fetch(`/api/objects/${objectId}/payroll`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({installerId:e.installerId,installerName:e.installerName,amount:e.amount,status:e.status,note:e.notes??""})});if(!r.ok)allOk=false}catch{allOk=false}}
 const id=`payroll:${objectId}`;const old=await getOffline<PayrollEntry[]>(id);const record:OfflineRecord<PayrollEntry[]>={id,entity:"payroll",payload:entries,version:(old?.version??0)+1,updatedAt:new Date().toISOString(),status:allOk?"synced":"pending"};await putOffline(record)
}
