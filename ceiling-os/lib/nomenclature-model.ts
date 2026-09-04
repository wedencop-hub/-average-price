export type NomenclatureCategory = "membrane" | "profile" | "harpoon" | "fasteners" | "lights" | "led" | "power_supply" | "cornice" | "consumables" | "work" | "delivery";
export type NomenclatureItem = { id:string; sku:string; name:string; category:NomenclatureCategory; unit:"м²"|"м"|"шт"|"послуга"; salePrice:number; purchasePrice:number; active:boolean };
export type CostItem = { id:string; sku:string; name:string; unit:string; quantity:number; unitCost:number; total:number };
export type InternalCost = { objectId:string; items:CostItem[]; materialCost:number; installationCost:number; deliveryCost:number; otherCost:number; totalCost:number; revenue:number; profit:number; margin:number };
export const DEFAULT_NOMENCLATURE:NomenclatureItem[]=[
{id:"n-membrane",sku:"membrane",name:"Полотно натяжної стелі",category:"membrane",unit:"м²",salePrice:280,purchasePrice:135,active:true},
{id:"n-profile",sku:"profile",name:"Профіль",category:"profile",unit:"м",salePrice:180,purchasePrice:82,active:true},
{id:"n-harpoon",sku:"harpoon",name:"Гарпун",category:"harpoon",unit:"м",salePrice:45,purchasePrice:18,active:true},
{id:"n-fasteners",sku:"fasteners",name:"Кріплення",category:"fasteners",unit:"шт",salePrice:12,purchasePrice:4,active:true},
{id:"n-lights",sku:"lights",name:"Світильник",category:"lights",unit:"шт",salePrice:250,purchasePrice:110,active:true},
{id:"n-installation",sku:"installation",name:"Монтаж",category:"work",unit:"послуга",salePrice:0,purchasePrice:0,active:true},
{id:"n-delivery",sku:"delivery",name:"Доставка",category:"delivery",unit:"послуга",salePrice:0,purchasePrice:0,active:true},
];
export function calculateInternalCost(objectId:string,items:CostItem[],revenue:number,installationCost=0,deliveryCost=0,otherCost=0):InternalCost{const materialCost=round(items.reduce((sum,item)=>sum+item.total,0));const totalCost=round(materialCost+installationCost+deliveryCost+otherCost);const profit=round(revenue-totalCost);return{objectId,items,materialCost,installationCost,deliveryCost,otherCost,totalCost,revenue,profit,margin:revenue>0?round(profit/revenue*100):0}}
export function costItemsFromEstimate(items:{sku:string;name:string;unit:string;quantity:number}[],nomenclature=DEFAULT_NOMENCLATURE):CostItem[]{return items.map(item=>{const n=nomenclature.find(x=>x.sku===item.sku);const unitCost=n?.purchasePrice??0;return{id:`cost:${item.sku}`,sku:item.sku,name:item.name,unit:item.unit,quantity:item.quantity,unitCost,total:round(item.quantity*unitCost)}}).filter(item=>item.quantity>0)}
function round(v:number){return Math.round(v*100)/100}
