export type StockMovementType="receipt"|"issue"|"transfer"|"adjustment";
export type StockMovement={id:string;companyId:string;warehouseId:string;objectId?:string;sku:string;name:string;unit:string;quantity:number;unitCost:number;type:StockMovementType;createdAt:string};
export type StockItem={sku:string;name:string;unit:string;quantity:number;unitCost:number;minStock:number};
export type ObjectConsumption={objectId:string;items:StockMovement[];totalCost:number};
export function createIssue(objectId:string,companyId:string,warehouseId:string,item:{sku:string;name:string;unit:string;quantity:number;unitCost:number}):StockMovement{return{id:`issue:${objectId}:${item.sku}`,companyId,warehouseId,objectId,sku:item.sku,name:item.name,unit:item.unit,quantity:-Math.abs(item.quantity),unitCost:item.unitCost,type:"issue",createdAt:new Date().toISOString()}}
export function consumptionTotal(movements:StockMovement[]):number{return Math.round(movements.filter(x=>x.type==="issue").reduce((s,x)=>s+Math.abs(x.quantity)*x.unitCost,0)*100)/100}
