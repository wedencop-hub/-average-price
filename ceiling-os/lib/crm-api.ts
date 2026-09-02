import type{Client,ObjectRecord,ObjectStatus}from"./crm-model";
async function request<T>(url:string,init?:RequestInit):Promise<T>{const r=await fetch(url,{...init,headers:{"content-type":"application/json",...(init?.headers??{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.error??"API_ERROR");return data as T}
export async function apiClients(){return(await request<{ok:boolean;clients:Client[]}>("/api/clients")).clients}
export async function apiCreateClient(input:{name:string;phone:string}){return(await request<{ok:boolean;client:Client}>("/api/clients",{method:"POST",body:JSON.stringify(input)})).client}
export async function apiObjects(){return(await request<{ok:boolean;objects:ObjectRecord[]}>("/api/objects")).objects}
export async function apiCreateObject(input:{clientId:string;title:string;address:string;status:ObjectStatus}){return(await request<{ok:boolean;object:ObjectRecord}>("/api/objects",{method:"POST",body:JSON.stringify(input)})).object}
export async function apiUpdateObjectStatus(id:string,status:ObjectStatus){return(await request<{ok:boolean;object:{id:string;status:ObjectStatus}}>(`/api/objects/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({status})})).object}
