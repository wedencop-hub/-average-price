import {getOffline,putOffline,type OfflineRecord} from "./offline-store";
export type {PayrollEntry} from "./payroll-model";
import type {PayrollEntry} from "./payroll-model";

function payload(e:PayrollEntry){return{installerId:e.installerId,amount:e.amount,status:e.status,ruleType:e.method,baseValue:e.base, note:`rule:${e.ruleId}`}}
export async function getPayroll(objectId:string):Promise<PayrollEntry[]>{
 try{const r=await fetch(`/api/objects/${objectId}/payroll`,{cache:"no-store"});if(r.ok){const d=await r.json();if(d.ok&&Array.isArray(d.entries))return d.entries.map((x:Record<string,unknown>)=>({id:String(x.id),objectId,installerId:String(x.installer_id),installerName:String(x.installer_name??x.installer_id),method:(String(x.rule_type)==="percentage"?"percentage":"per_m2") as PayrollEntry["method"],ruleId:String(x.note??"").replace("rule:",""),base:Number(x.base_value??0),rate:0,amount:Number(x.amount??0),status:(String(x.status)==="paid"?"paid":"confirmed") as PayrollEntry["status"],createdAt:String(x.created_at)})) as PayrollEntry[]}}catch{}
 const r=await getOffline<PayrollEntry[]>(`payroll:${objectId}`);return r?.payload??[]
}
export async function savePayroll(objectId:string,entries:PayrollEntry[]):Promise<void>{let allOk=true;for(const e of entries){try{const r=await fetch(`/api/objects/${objectId}/payroll`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload(e))});if(!r.ok)allOk=false}catch{allOk=false}}const id=`payroll:${objectId}`;const old=await getOffline<PayrollEntry[]>(id);const record:OfflineRecord<PayrollEntry[]>={id,entity:"payroll",payload:entries,version:(old?.version??0)+1,updatedAt:new Date().toISOString(),status:allOk?"synced":"pending"};await putOffline(record)}
