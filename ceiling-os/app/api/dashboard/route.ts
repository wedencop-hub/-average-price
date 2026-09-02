import {NextResponse} from "next/server";
import {query} from "../../../db/client";
import {requireSession} from "../../../lib/auth-session";
export const runtime="nodejs";

type Metrics={objects:string;active:string;completed:string;revenue:string;expenses:string;profit:string;receivables:string;payroll:string;low_stock:string};
export async function GET(){
 try{
  const{user}=await requireSession();
  const r=await query<Metrics>(`with object_stats as(select count(*) objects,count(*) filter(where status not in ('completed','cancelled')) active,count(*) filter(where status='completed') completed from objects where company_id=$1), revenue as(select coalesce(sum(ev.total),0) revenue from objects o join lateral(select total from estimate_versions e where e.object_id=o.id and e.company_id=$1 order by version desc limit 1) ev on true where o.company_id=$1), expenses as(select coalesce(sum(amount),0) expenses from object_expenses where company_id=$1), material as(select coalesce(sum(abs(quantity)*unit_cost),0) material from stock_movements where company_id=$1 and movement_type='issue'), payroll as(select coalesce(sum(amount),0) payroll from payroll_entries where company_id=$1 and status in ('confirmed','paid')), payments as(select coalesce(sum(amount),0) paid from object_payments where company_id=$1), low as(select count(*) low_stock from stock_items s join warehouses w on w.id=s.warehouse_id left join nomenclature n on n.company_id=w.company_id and n.sku=s.sku where w.company_id=$1 and s.quantity<=coalesce(n.minimum_stock,0)) select objects::text,active::text,completed::text,revenue::text,(expenses+material+payroll)::text expenses,(revenue-expenses-material-payroll)::text profit,greatest(revenue-payments,0)::text receivables,payroll::text,low_stock::text from object_stats,revenue,expenses,material,payroll,payments,low`,[user.company_id]);
  return NextResponse.json({ok:true,metrics:r.rows[0]??null});
 }catch(e){return NextResponse.json({ok:false,error:e instanceof Error&&e.message==="AUTH_REQUIRED"?"AUTH_REQUIRED":"DASHBOARD_READ_FAILED"},{status:e instanceof Error&&e.message==="AUTH_REQUIRED"?401:500})}
}
