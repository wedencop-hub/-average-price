import {getOffline,putOffline,type OfflineRecord} from "./offline-store";
import type {PayrollEntry} from "./payroll-model";
export async function getPayroll(objectId:string):Promise<PayrollEntry[]>{const r=await getOffline<PayrollEntry[]>(`payroll:${objectId}`);return r?.payload??[]}
export async function savePayroll(objectId:string,entries:PayrollEntry[]):Promise<void>{const id=`payroll:${objectId}`;const old=await getOffline<PayrollEntry[]>(id);const record:OfflineRecord<PayrollEntry[]>={id,entity:"payroll",payload:entries,version:(old?.version??0)+1,updatedAt:new Date().toISOString(),status:"pending"};await putOffline(record)}
