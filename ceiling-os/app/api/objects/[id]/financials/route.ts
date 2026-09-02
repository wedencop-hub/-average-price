import {NextResponse} from "next/server";
import {query} from "../../../../../db/client";
import {requireSession} from "../../../../../lib/auth-session";
export const runtime="nodejs";

type FinancialRow={revenue:string;paid:string;material_cost:string;payroll_cost:string;delivery_cost:string;other_cost:string;profit:string;debt:string};
type Body={action:"expense"|"payment";amount:number;category?:string;paymentType?:string;note?:string};

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{user}=await requireSession(); const{id}=await params;
    const r=await query<FinancialRow>(`with revenue as (select coalesce(max(total),0) revenue from estimate_versions where object_id=$1 and company_id=$2), payments as (select coalesce(sum(amount),0) paid from object_payments where object_id=$1 and company_id=$2), materials as (select coalesce(sum(abs(quantity)*unit_cost),0) material_cost from stock_movements where object_id=$1 and company_id=$2 and movement_type='issue'), payroll as (select coalesce(sum(amount),0) payroll_cost from payroll_entries where object_id=$1 and company_id=$2 and status in ('confirmed','paid')), extras as (select coalesce(sum(case when category='delivery' then amount else 0 end),0) delivery_cost,coalesce(sum(case when category<>'delivery' then amount else 0 end),0) other_cost from object_expenses where object_id=$1 and company_id=$2) select revenue::text,paid::text,material_cost::text,payroll_cost::text,delivery_cost::text,other_cost::text,(revenue-material_cost-payroll_cost-delivery_cost-other_cost)::text profit,greatest(revenue-paid,0)::text debt from revenue,payments,materials,payroll,extras`,[id,user.company_id]);
    return NextResponse.json({ok:true,financials:r.rows[0]??null});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error&&e.message==="AUTH_REQUIRED"?"AUTH_REQUIRED":"FINANCIALS_READ_FAILED"},{status:e instanceof Error&&e.message==="AUTH_REQUIRED"?401:500})}
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const{user}=await requireSession(); const{id}=await params; const body=await req.json() as Partial<Body>;
    const amount=Number(body.amount);
    if(!Number.isFinite(amount)||amount<=0||!body.action) return NextResponse.json({ok:false,error:"INVALID_FINANCIAL_INPUT"},{status:400});
    const object=await query<{id:string}>("select id from objects where id=$1 and company_id=$2",[id,user.company_id]);
    if(!object.rows[0]) return NextResponse.json({ok:false,error:"OBJECT_NOT_FOUND"},{status:404});
    if(body.action==="expense"){
      const category=String(body.category||"other");
      const r=await query<{id:string}>("insert into object_expenses(company_id,object_id,category,amount,note,created_by) values($1,$2,$3,$4,$5,$6) returning id",[user.company_id,id,category,amount,String(body.note||""),user.id]);
      await query("insert into audit_log(company_id,user_id,action,entity_type,entity_id,metadata) values($1,$2,$3,$4,$5,$6)",[user.company_id,user.id,"finance.expense.created","object",id,JSON.stringify({expense_id:r.rows[0]?.id,category,amount})]);
      return NextResponse.json({ok:true,id:r.rows[0]?.id});
    }
    const paymentType=String(body.paymentType||"client_payment");
    const r=await query<{id:string}>("insert into object_payments(company_id,object_id,amount,payment_type,note,created_by) values($1,$2,$3,$4,$5,$6) returning id",[user.company_id,id,amount,paymentType,String(body.note||""),user.id]);
    await query("insert into audit_log(company_id,user_id,action,entity_type,entity_id,metadata) values($1,$2,$3,$4,$5,$6)",[user.company_id,user.id,"finance.payment.created","object",id,JSON.stringify({payment_id:r.rows[0]?.id,payment_type:paymentType,amount})]);
    return NextResponse.json({ok:true,id:r.rows[0]?.id});
  }catch(e){return NextResponse.json({ok:false,error:e instanceof Error&&e.message==="AUTH_REQUIRED"?"AUTH_REQUIRED":"FINANCIALS_WRITE_FAILED"},{status:e instanceof Error&&e.message==="AUTH_REQUIRED"?401:500})}
}
