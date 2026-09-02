import type { EstimateVersion } from "./estimate-model";
import type { StockItem } from "./warehouse-model";
import type { StockReservation } from "./warehouse-operations";

export type ProductionStatus = "new" | "processing" | "ready" | "issued" | "completed";
export type ProductionItem = { id:string; sku:string; name:string; unit:"м²"|"м"|"шт"; quantity:number; unitCost:number; totalCost:number; available:number; shortage:number };
export type ProductionOrder = { id:string; companyId:string; objectId:string; status:ProductionStatus; items:ProductionItem[]; totalCost:number; createdAt:string; updatedAt:string; notes?:string };

export function createProductionOrderFromEstimate(estimate:EstimateVersion, inventory:StockItem[], reservations:StockReservation[]=[], companyId="demo-company"):ProductionOrder {
 const items=estimate.items.map(item=>{const stock=inventory.find(x=>x.sku===item.sku);const reserved=reservations.filter(r=>r.status==="active"&&r.objectId!==estimate.objectId).reduce((s,r)=>s+(r.items.find(x=>x.sku===item.sku)?.quantity??0),0);const available=Math.max(0,(stock?.quantity??0)-reserved);const unitCost=stock?.unitCost??0;return{id:`production-item-${item.id}`,sku:item.sku,name:item.name,unit:item.unit,quantity:item.quantity,unitCost,totalCost:item.quantity*unitCost,available,shortage:Math.max(0,item.quantity-available)}});
 const now=new Date().toISOString();return{id:`production-${estimate.objectId}`,companyId,objectId:estimate.objectId,status:"new",items,totalCost:items.reduce((s,x)=>s+x.totalCost,0),createdAt:now,updatedAt:now};
}
export function hasProductionShortage(order:ProductionOrder){return order.items.some(x=>x.shortage>0)}
export function productionTotal(order:ProductionOrder){return order.items.reduce((s,x)=>s+x.totalCost,0)}
