export type UserRole = "super_admin"|"company_owner"|"admin"|"manager"|"estimator"|"foreman"|"installer"|"accountant"|"warehouse_manager"|"production_manager"|"viewer";
export type Company = { id:string; name:string; createdAt:string; updatedAt:string };
export type UserProfile = { id:string; telegramId:number; username?:string; firstName?:string; lastName?:string; languageCode?:string; role:UserRole; companyId?:string; createdAt:string; updatedAt:string };
const USER_KEY="stelya-os:user";const COMPANY_KEY="stelya-os:company";
export function getLocalUser():UserProfile|null{if(typeof window==="undefined")return null;try{const v=localStorage.getItem(USER_KEY);return v?JSON.parse(v):null}catch{return null}}
export function saveLocalUser(v:UserProfile){localStorage.setItem(USER_KEY,JSON.stringify(v))}
export function getLocalCompany():Company|null{if(typeof window==="undefined")return null;try{const v=localStorage.getItem(COMPANY_KEY);return v?JSON.parse(v):null}catch{return null}}
export function saveLocalCompany(v:Company){localStorage.setItem(COMPANY_KEY,JSON.stringify(v))}
export function ensureCompany(name="Моя компанія"){const existing=getLocalCompany();if(existing)return existing;const now=new Date().toISOString();const company={id:crypto.randomUUID(),name,createdAt:now,updatedAt:now};saveLocalCompany(company);return company}
export function upsertTelegramUser(user:{id:number;username?:string;first_name?:string;last_name?:string;language_code?:string},role:UserRole="company_owner"){const now=new Date().toISOString();const current=getLocalUser();const company=current?.companyId?getLocalCompany():ensureCompany();const profile={id:current?.id??crypto.randomUUID(),telegramId:user.id,username:user.username,firstName:user.first_name,lastName:user.last_name,languageCode:user.language_code,role:current?.role??role,companyId:current?.companyId??company.id,createdAt:current?.createdAt??now,updatedAt:now};saveLocalUser(profile);return profile}
