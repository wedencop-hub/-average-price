import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { query } from "../db/client";
const COOKIE="stelya_session",MAX_AGE=604800;
type Session={userId:string;telegramId:number;companyId:string;role:string;expiresAt:number};
function secret(){const s=process.env.AUTH_SESSION_SECRET;if(!s||s.length<32)throw new Error("AUTH_SESSION_SECRET must be at least 32 characters");return s}
function sign(v:string){return createHmac("sha256",secret()).update(v).digest("base64url")}
function encode(p:Session){const b=Buffer.from(JSON.stringify(p)).toString("base64url");return `${b}.${sign(b)}`}
function decode(v:string):Session|null{const [b,s]=v.split(".");if(!b||!s)return null;const a=Buffer.from(s),e=Buffer.from(sign(b));if(a.length!==e.length||!timingSafeEqual(a,e))return null;try{const p=JSON.parse(Buffer.from(b,"base64url").toString()) as Session;return p.expiresAt>Date.now()?p:null}catch{return null}}
export async function createSession(p:Omit<Session,"expiresAt">){(await cookies()).set(COOKIE,encode({...p,expiresAt:Date.now()+MAX_AGE*1000}),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:MAX_AGE})}
export async function clearSession(){(await cookies()).set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0})}
export async function requireSession(){const raw=(await cookies()).get(COOKIE)?.value;const session=raw?decode(raw):null;if(!session)throw new Error("AUTH_REQUIRED");const r=await query<{id:string;telegram_id:number;company_id:string;role:string;company_name:string}>(`select u.id,u.telegram_id,u.company_id,u.role::text as role,c.name as company_name from users u join companies c on c.id=u.company_id where u.id=$1 and u.company_id=$2 limit 1`,[session.userId,session.companyId]);const user=r.rows[0];if(!user)throw new Error("AUTH_REQUIRED");return{session,user,company:{id:user.company_id,name:user.company_name}}}
