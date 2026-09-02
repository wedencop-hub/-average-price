export type UserRole="super_admin"|"company_owner"|"admin"|"manager"|"estimator"|"foreman"|"installer"|"accountant"|"warehouse_manager"|"production_manager"|"viewer";
export type Company={id:string;name:string;createdAt:string;updatedAt:string};
export type UserProfile={id:string;telegramId:number;username?:string;firstName?:string;lastName?:string;languageCode?:string;role:UserRole;companyId:string;createdAt:string;updatedAt:string};
const USER_KEY="stelya-os:user",COMPANY_KEY="stelya-os:company";
export function getLocalUser():UserProfile|null{if(typeof window==="undefined")return null;try{const v=localStorage.getItem(USER_KEY);return v?JSON.parse(v):null}catch{return null}}
export function saveLocalUser(v:UserProfile){localStorage.setItem(USER_KEY,JSON.stringify(v))}
export function getLocalCompany():Company|null{if(typeof window==="undefined")return null;try{const v=localStorage.getItem(COMPANY_KEY);return v?JSON.parse(v):null}catch{return null}}
export function saveLocalCompany(v:Company){localStorage.setItem(COMPANY_KEY,JSON.stringify(v))}
export function hydrateAuth(user:UserProfile,company:Company){saveLocalUser(user);saveLocalCompany(company);return user}
