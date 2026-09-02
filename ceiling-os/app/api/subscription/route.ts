import {NextResponse} from "next/server";
import {query} from "../../../db/client";
import {requireSession} from "../../../lib/auth-session";
export const runtime="nodejs";
export async function GET(){try{const{user}=await requireSession();const r=await query(`select id,company_id,plan::text as plan,status::text as status,current_period_start,current_period_end,grace_until from subscriptions where company_id=$1`,[user.company_id]);if(!r.rows[0]){const created=await query(`insert into subscriptions(company_id) values($1) on conflict(company_id) do update set updated_at=now() returning id,company_id,plan::text as plan,status::text as status,current_period_start,current_period_end,grace_until`,[user.company_id]);return NextResponse.json({ok:true,subscription:created.rows[0]})}return NextResponse.json({ok:true,subscription:r.rows[0]})}catch(e){const m=e instanceof Error?e.message:"SUBSCRIPTION_READ_FAILED";return NextResponse.json({ok:false,error:m},{status:m==="AUTH_REQUIRED"?401:500})}}
