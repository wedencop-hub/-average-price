"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CeilingCanvas } from "../../components/constructor/ceiling-canvas";
import { ConstructorToolbar, type ConstructorTool } from "../../components/constructor/constructor-toolbar";
import type { CeilingDrawing } from "../../lib/ceiling-model";
import { calculateCeiling } from "../../lib/calculation-engine";
import { distance, wallAngleDeg } from "../../lib/ceiling-model";
import { getOffline } from "../../lib/offline-store";
import { listObjects, saveObject, type ObjectRecord } from "../../lib/crm-model";
import { saveOfflineDrawing } from "../../lib/offline-object";
import "../../components/constructor/constructor.css";
import "../../components/constructor/constructor-workspace.css";

const emptyDrawing=(objectId:string):CeilingDrawing=>{const now=new Date().toISOString();return{id:`drawing:${objectId}`,objectId,version:1,createdAt:now,updatedAt:now,walls:[],lights:[]}};
const clone=(value:CeilingDrawing):CeilingDrawing=>JSON.parse(JSON.stringify(value)) as CeilingDrawing;

export default function ConstructorPage(){
 const params=useSearchParams(); const objectId=params.get("object");
 const [object,setObject]=useState<ObjectRecord|null>(null); const [drawing,setDrawing]=useState<CeilingDrawing>(()=>emptyDrawing(objectId??"draft")); const [history,setHistory]=useState<CeilingDrawing[]>([]); const [future,setFuture]=useState<CeilingDrawing[]>([]); const [tool,setTool]=useState<ConstructorTool>("select"); const [selectedWallId,setSelectedWallId]=useState<string|null>(null); const [saved,setSaved]=useState(false); const result=useMemo(()=>calculateCeiling(drawing),[drawing]); const selectedWall=drawing.walls.find(w=>w.id===selectedWallId)??null;
 useEffect(()=>{if(!objectId)return; const found=listObjects("demo-company").find(item=>item.id===objectId)??null;setObject(found);getOffline<{drawing?:CeilingDrawing}>(`object:${objectId}`).then(record=>{if(record?.payload?.drawing)setDrawing(record.payload.drawing);}).catch(()=>{});},[objectId]);
 function applyDrawing(next:CeilingDrawing){setHistory(items=>[...items.slice(-29),clone(drawing)]);setFuture([]);setDrawing(next)}
 function undo(){const previous=history.at(-1);if(!previous)return;setHistory(items=>items.slice(0,-1));setFuture(items=>[clone(drawing),...items.slice(0,29)]);setDrawing(previous)}
 function redo(){const next=future[0];if(!next)return;setFuture(items=>items.slice(1));setHistory(items=>[...items.slice(-29),clone(drawing)]);setDrawing(next)}
 function updateSelectedWallLength(value:string){if(!selectedWall)return;const length=Number(value);if(!Number.isFinite(length)||length<=0)return;const dx=selectedWall.end.x-selectedWall.start.x,dy=selectedWall.end.y-selectedWall.start.y,current=Math.hypot(dx,dy)||1;const end={x:selectedWall.start.x+(dx/current)*length,y:selectedWall.start.y+(dy/current)*length};applyDrawing({...drawing,walls:drawing.walls.map(w=>w.id===selectedWall.id?{...w,end}:w),version:drawing.version+1,updatedAt:new Date().toISOString()})}
 async function handleSave(){if(!objectId||!object)return;try{await saveOfflineDrawing({id:object.id,companyId:object.companyId,clientId:object.clientId,address:object.address,status:"measurement",updatedAt:object.updatedAt},drawing);saveObject({...object,status:"measurement",updatedAt:new Date().toISOString()});setSaved(true);window.setTimeout(()=>setSaved(false),1800)}catch{setSaved(false)}}
 return <main className="constructor-page"><header className="constructor-header"><div><div className="eyebrow">СТЕЛЯ OS</div><h1>Конструктор стелі</h1><p>{object?`${object.title} · ${object.address}`:"Оберіть об’єкт для заміру"}</p></div><div className="constructor-actions"><button type="button" onClick={undo} disabled={!history.length}>↶ Назад</button><button type="button" onClick={redo} disabled={!future.length}>↷ Вперед</button><button className="save-button" type="button" onClick={handleSave} disabled={!objectId||!object}>{saved?"Збережено ✓":"Зберегти"}</button></div></header><ConstructorToolbar tool={tool} onToolChange={setTool}/><section className="constructor-layout"><div className="canvas-card"><CeilingCanvas drawing={drawing} tool={tool} onChange={applyDrawing} onSelectWall={setSelectedWallId}/></div><aside className="calc-card"><h2>Розрахунок</h2><div className="metric"><span>Площа</span><strong>{result.areaM2.toFixed(2)} м²</strong></div><div className="metric"><span>Периметр</span><strong>{result.perimeterM.toFixed(2)} м</strong></div><div className="metric"><span>Полотно</span><strong>{result.membraneM2.toFixed(2)} м²</strong></div><div className="metric"><span>Профіль</span><strong>{result.profileM.toFixed(2)} м</strong></div><div className="metric"><span>Гарпун</span><strong>{result.harpoonM.toFixed(2)} м</strong></div><div className="metric"><span>Кріплення</span><strong>{result.fasteners}</strong></div><div className="metric"><span>Світильники</span><strong>{result.lights}</strong></div>{selectedWall&&<div className="wall-editor"><h3>Вибрана стіна</h3><label>Довжина, м<input type="number" min="0.1" step="0.01" value={distance(selectedWall.start,selectedWall.end).toFixed(2)} onChange={e=>updateSelectedWallLength(e.target.value)}/></label><div className="wall-angle">Кут: {wallAngleDeg(selectedWall).toFixed(1)}°</div></div>}<div className="offline-note">● Розрахунок працює офлайн</div></aside></section></main>;
}
