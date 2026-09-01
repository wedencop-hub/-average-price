"use client";

import { useMemo, useState } from "react";
import { CeilingCanvas } from "../../components/constructor/ceiling-canvas";
import { ConstructorToolbar, type ConstructorTool } from "../../components/constructor/constructor-toolbar";
import type { CeilingDrawing } from "../../lib/ceiling-model";
import { calculateCeiling } from "../../lib/calculation-engine";
import { saveOfflineDrawing, type OfflineObject } from "../../lib/offline-object";
import "../../components/constructor/constructor.css";
import "../../components/constructor/constructor-workspace.css";

const now = new Date().toISOString();
const initialDrawing: CeilingDrawing = {
  id: "draft-room",
  objectId: "demo-object",
  version: 1,
  createdAt: now,
  updatedAt: now,
  walls: [
    { id: "w1", start: { x: 0, y: 0 }, end: { x: 5.2, y: 0 }, type: "wall" },
    { id: "w2", start: { x: 5.2, y: 0 }, end: { x: 5.2, y: 3.8 }, type: "wall" },
    { id: "w3", start: { x: 5.2, y: 3.8 }, end: { x: 0, y: 3.8 }, type: "wall" },
    { id: "w4", start: { x: 0, y: 3.8 }, end: { x: 0, y: 0 }, type: "wall" },
  ],
  lights: [],
};

const initialObject: OfflineObject = {
  id: "demo-object",
  companyId: "demo-company",
  address: "Новий об'єкт",
  status: "measurement",
  updatedAt: now,
};

export default function ConstructorPage() {
  const [drawing, setDrawing] = useState(initialDrawing);
  const [tool, setTool] = useState<ConstructorTool>("select");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const result = useMemo(() => calculateCeiling(drawing), [drawing]);
  const selectedWall = drawing.walls.find((wall) => wall.id === selectedWallId) ?? null;

  function updateSelectedWallLength(value: string) {
    if (!selectedWall) return;
    const length = Number(value);
    if (!Number.isFinite(length) || length <= 0) return;
    const dx = selectedWall.end.x - selectedWall.start.x;
    const dy = selectedWall.end.y - selectedWall.start.y;
    const current = Math.hypot(dx, dy) || 1;
    const next = {
      x: selectedWall.start.x + (dx / current) * length,
      y: selectedWall.start.y + (dy / current) * length,
    };
    setDrawing((currentDrawing) => ({
      ...currentDrawing,
      walls: currentDrawing.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, end: next } : wall),
      version: currentDrawing.version + 1,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleSave() {
    try {
      await saveOfflineDrawing(initialObject, drawing);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setSaved(false);
    }
  }

  return <main className="constructor-page">
    <header className="constructor-header">
      <div><div className="eyebrow">СТЕЛЯ OS</div><h1>Конструктор стелі</h1><p>Намалюйте приміщення та одразу отримайте розрахунок.</p></div>
      <button className="save-button" type="button" onClick={handleSave}>{saved ? "Збережено ✓" : "Зберегти"}</button>
    </header>
    <ConstructorToolbar tool={tool} onToolChange={setTool} />
    <section className="constructor-layout">
      <div className="canvas-card"><CeilingCanvas drawing={drawing} tool={tool} onChange={setDrawing} onSelectWall={setSelectedWallId} /></div>
      <aside className="calc-card">
        <h2>Розрахунок</h2>
        <div className="metric"><span>Площа</span><strong>{result.areaM2.toFixed(2)} м²</strong></div>
        <div className="metric"><span>Периметр</span><strong>{result.perimeterM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Полотно</span><strong>{result.membraneM2.toFixed(2)} м²</strong></div>
        <div className="metric"><span>Профіль</span><strong>{result.profileM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Гарпун</span><strong>{result.harpoonM.toFixed(2)} м</strong></div>
        <div className="metric"><span>Світильники</span><strong>{result.lights}</strong></div>
        {selectedWall && <div className="wall-editor">
          <h3>Вибрана стіна</h3>
          <label>Довжина, м<input type="number" min="0.1" step="0.01" value={distance(selectedWall.start, selectedWall.end).toFixed(2)} onChange={(event) => updateSelectedWallLength(event.target.value)} /></label>
          <div className="wall-angle">Кут: {wallAngleDeg(selectedWall).toFixed(1)}°</div>
        </div>}
        <div className="offline-note">● Розрахунок працює офлайн</div>
      </aside>
    </section>
  </main>;
}

import { distance, wallAngleDeg } from "../../lib/ceiling-model";
