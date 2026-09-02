"use client";

import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CeilingDrawing, Point2D, Wall } from "../../lib/ceiling-model";
import { distance, wallAngleDeg } from "../../lib/ceiling-model";
import type { ConstructorTool } from "./constructor-toolbar";

const W = 900;
const H = 560;
const PAD = 60;

type Props = {
  drawing: CeilingDrawing;
  tool: ConstructorTool;
  onChange: (drawing: CeilingDrawing) => void;
  onSelectWall: (wallId: string | null) => void;
};

export function CeilingCanvas({ drawing, tool, onChange, onSelectWall }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point2D[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ wallId: string; endpoint: "start" | "end" } | null>(null);

  const bounds = useMemo(() => {
    const points = drawing.walls.flatMap((w) => [w.start, w.end]);
    if (!points.length) return { minX: 0, minY: 0, maxX: 10, maxY: 6 };
    return { minX: Math.min(...points.map((p) => p.x)), minY: Math.min(...points.map((p) => p.y)), maxX: Math.max(...points.map((p) => p.x)), maxY: Math.max(...points.map((p) => p.y)) };
  }, [drawing.walls]);

  const scale = Math.min((W - PAD * 2) / Math.max(bounds.maxX - bounds.minX, 1), (H - PAD * 2) / Math.max(bounds.maxY - bounds.minY, 1));
  const pointToSvg = (p: Point2D) => ({ x: PAD + (p.x - bounds.minX) * scale, y: PAD + (p.y - bounds.minY) * scale });
  const eventToPoint = (event: { clientX: number; clientY: number }): Point2D => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (W / rect.width) / scale + bounds.minX - PAD / scale, y: (event.clientY - rect.top) * (H / rect.height) / scale + bounds.minY - PAD / scale };
  };

  function commit(nextWalls: Wall[], nextLights = drawing.lights) {
    onChange({ ...drawing, walls: nextWalls, lights: nextLights, version: drawing.version + 1, updatedAt: new Date().toISOString() });
  }

  function addWallPoint(point: Point2D) {
    if (!draftPoints.length) return setDraftPoints([point]);
    const start = draftPoints[draftPoints.length - 1];
    if (distance(start, point) < 0.05) return;
    commit([...drawing.walls, { id: crypto.randomUUID(), start, end: point, type: "wall" }]);
    setDraftPoints([point]);
  }

  function addLight(point: Point2D) {
    commit(drawing.walls, [...drawing.lights, { id: crypto.randomUUID(), type: "spot", position: point, quantity: 1 }]);
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    const point = eventToPoint(event);
    if (tool === "wall" || tool === "room") addWallPoint(point);
    else if (tool === "light") addLight(point);
  }

  function startEndpointDrag(wallId: string, endpoint: "start" | "end", event: ReactPointerEvent<SVGCircleElement>) {
    event.stopPropagation();
    if (tool !== "select" && tool !== "dimension") return;
    dragRef.current = { wallId, endpoint };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveEndpoint(event: ReactPointerEvent<SVGCircleElement>) {
    const drag = dragRef.current;
    if (!drag || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const point = eventToPoint(event);
    commit(drawing.walls.map((wall) => wall.id === drag.wallId ? { ...wall, [drag.endpoint]: point } : wall));
  }

  function finishEndpointDrag(event: ReactPointerEvent<SVGCircleElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function selectWall(id: string) {
    setSelected(id);
    onSelectWall(id);
  }

  function deleteWall(id: string) {
    commit(drawing.walls.filter((wall) => wall.id !== id));
    if (selected === id) { setSelected(null); onSelectWall(null); }
  }

  function handleDoubleClick() {
    if (tool === "wall" || tool === "room") setDraftPoints([]);
  }

  return (
    <div className="constructor-canvas-wrap">
      <div className="canvas-hint">{tool === "wall" && "Натисніть дві точки для стіни. Подвійне натискання — завершити."}{tool === "room" && "Натискайте точки по контуру приміщення. Подвійне натискання — завершити."}{tool === "light" && "Натисніть місце для світильника"}{tool === "select" && "Оберіть стіну або перетягніть її точку"}{tool === "delete" && "Оберіть стіну для видалення"}{tool === "dimension" && "Оберіть стіну та змініть її розмір праворуч"}</div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="constructor-canvas" role="img" aria-label="Конструктор стелі" onPointerDown={handleCanvasPointerDown} onDoubleClick={handleDoubleClick}>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity=".08" /></pattern></defs>
        <rect width={W} height={H} fill="url(#grid)" pointerEvents="none" />
        {drawing.walls.map((wall) => {
          const a = pointToSvg(wall.start); const b = pointToSvg(wall.end); const active = selected === wall.id;
          return <g key={wall.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={active ? "wall-line active" : "wall-line"} onPointerDown={(event) => { event.stopPropagation(); if (tool === "delete") deleteWall(wall.id); else selectWall(wall.id); }} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10} className="wall-label" pointerEvents="none">{distance(wall.start, wall.end).toFixed(2)} м · {wallAngleDeg(wall).toFixed(0)}°</text>
            {[{ point: a, endpoint: "start" as const }, { point: b, endpoint: "end" as const }].map(({ point, endpoint }) => <circle key={endpoint} cx={point.x} cy={point.y} r={active ? 10 : 7} className="wall-point" onPointerDown={(event) => startEndpointDrag(wall.id, endpoint, event)} onPointerMove={moveEndpoint} onPointerUp={finishEndpointDrag} />)}
          </g>;
        })}
        {drawing.lights.map((light) => { const p = pointToSvg(light.position); return <g key={light.id}><circle cx={p.x} cy={p.y} r="9" className="light-point" /><text x={p.x + 12} y={p.y + 4} className="light-label" pointerEvents="none">●</text></g>; })}
        {draftPoints.map((point, index) => { const p = pointToSvg(point); return <circle key={`${point.x}-${point.y}-${index}`} cx={p.x} cy={p.y} r="6" className="draft-point" pointerEvents="none" />; })}
      </svg>
    </div>
  );
}
