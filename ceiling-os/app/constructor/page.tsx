"use client";

import { useMemo, useState } from "react";
import { CeilingCanvas } from "../../components/constructor/ceiling-canvas";
import { ConstructorToolbar, type ConstructorTool } from "../../components/constructor/constructor-toolbar";
import type { CeilingDrawing } from "../../lib/ceiling-model";
import { calculateCeiling } from "../../lib/calculation-engine";
import "../../components/constructor/constructor.css";

const initialDrawing: CeilingDrawing = {
  id: "draft-room",
  version: 1,
  updatedAt: new Date().toISOString(),
  walls: [
    { id: "w1", start: { x: 0, y: 0 }, end: { x: 5.2, y: 0 }, type: "straight" },
    { id: "w2", start: { x: 5.2, y: 0 }, end: { x: 5.2, y: 3.8 }, type: "straight" },
    { id: "w3", start: { x: 5.2, y: 3.8 }, end: { x: 0, y: 3.8 }, type: "straight" },
    { id: "w4", start: { x: 0, y: 3.8 }, end: { x: 0, y: 0 }, type: "straight" },
  ],
  lights: [],
};

export default function ConstructorPage() {
  const [drawing, setDrawing] = useState(initialDrawing);
  const [tool, setTool] = useState<ConstructorTool>("select");
  const result = useMemo(() => calculateCeiling(drawing), [drawing]);

  return <main className="constructor-page">
    <header className="constructor-header">
      <div><div className="eyebrow">СТЕЛЯ OS</div><h1>Конструктор стелі</h1><p>Намалюйте приміщення та одразу отримайте розрахунок.</p></div>
      <button className="save-button" type="button">Зберегти</button>
    </header>
    <ConstructorToolbar tool={tool} onToolChange={setTool} />
    <section className="constructor-layout">
      <div className="canvas-card"><CeilingCanvas drawing={drawing} onChange={setDrawing} /></div>
      <aside className="calc-card">
        <h2>Розрахунок</h2>
        <div className="metric"><span>Площа</span><strong>{result.areaM2.toFixed(2)} м²</strong></div>
        <div className="metric"><span>Периметр</span><strong>{result.perimeterM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Полотно</span><strong>{result.membraneM2.toFixed(2)} м²</strong></div>
        <div className="metric"><span>Профіль</span><strong>{result.profileM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Гарпун</span><strong>{result.harpoonM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Світильники</span><strong>{result.lights}</strong></div>
        <div className="offline-note">● Розрахунок працює офлайн</div>
      </aside>
    </section>
  </main>;
}
