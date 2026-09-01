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

  const bounds = useMemo(() => {
    const points = drawing.walls.flatMap((w) => [w.start, w.end]);
    if (!points.length) return { minX: 0, minY: 0, maxX: 10, maxY: 6 };
    return {
      minX: Math.min(...points.map((p) => p.x)),
      minY: Math.min(...points.map((p) => p.y)),
      maxX: Math.max(...points.map((p) => p.x)),
      maxY: Math.max(...points.map((p) => p.y)),
    };
  }, [drawing.walls]);

  const scale = Math.min(
    (W - PAD * 2) / Math.max(bounds.maxX - bounds.minX, 1),
    (H - PAD * 2) / Math.max(bounds.maxY - bounds.minY, 1),
  );

  const pointToSvg = (p: Point2D) => ({ x: PAD + (p.x - bounds.minX) * scale, y: PAD + (p.y - bounds.minY) * scale });
  const svgToPoint = (event: ReactPointerEvent<SVGSVGElement>): Point2D => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, (event.clientX - rect.left) * (W / rect.width) / scale + bounds.minX - PAD / scale),
      y: Math.max(0, (event.clientY - rect.top) * (H / rect.height) / scale + bounds.minY - PAD / scale),
    };
  };

  function commit(nextWalls: Wall[], nextLights = drawing.lights) {
    onChange({ ...drawing, walls: nextWalls, lights: nextLights, version: drawing.version + 1, updatedAt: new Date().toISOString() });
  }

  function addWallPoint(point: Point2D) {
    if (draftPoints.length === 0) {
      setDraftPoints([point]);
      return;
    }
    const start = draftPoints[draftPoints.length - 1];
    const wall: Wall = { id: crypto.randomUUID(), start, end: point, type: "wall" };
    commit([...drawing.walls, wall]);
    setDraftPoints([point]);
  }

  function addLight(point: Point2D) {
    const light = { id: crypto.randomUUID(), type: "spot" as const, position: point, quantity: 1 };
    commit(drawing.walls, [...drawing.lights, light]);
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    const point = svgToPoint(event);
    if (tool === "wall" || tool === "room") addWallPoint(point);
    if (tool === "light") addLight(point);
  }

  function moveEndpoint(wallId: string, endpoint: "start" | "end", event: ReactPointerEvent<SVGCircleElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const point: Point2D = {
      x: Math.max(0, (event.clientX - rect.left) * (W / rect.width) / scale + bounds.minX - PAD / scale),
      y: Math.max(0, (event.clientY - rect.top) * (H / rect.height) / scale + bounds.minY - PAD / scale),
    };
    commit(drawing.walls.map((wall) => wall.id === wallId ? { ...wall, [endpoint]: point } : wall));
  }

  function selectWall(id: string) {
    setSelected(id);
    onSelectWall(id);
  }

  function deleteWall(id: string) {
    commit(drawing.walls.filter((wall) => wall.id !== id));
    if (selected === id) {
      setSelected(null);
      onSelectWall(null);
    }
  }

  return (
    <div className="constructor-canvas-wrap">
      <div className="canvas-hint">
        {tool === "wall" && "Торкніться двох точок, щоб додати стіну"}
        {tool === "room" && "Додавайте стіни по контуру приміщення"}
        {tool === "light" && "Торкніться місця для світильника"}
        {tool === "select" && "Оберіть стіну або перетягніть її точку"}
        {tool === "delete" && "Оберіть стіну для видалення"}
        {tool === "dimension" && "Оберіть стіну для редагування розміру"}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="constructor-canvas" role="img" aria-label="Конструктор стелі" onPointerDown={handleCanvasPointerDown}>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity=".08" /></pattern></defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {drawing.walls.map((wall) => {
          const a = pointToSvg(wall.start); const b = pointToSvg(wall.end); const active = selected === wall.id;
          return <g key={wall.id} onPointerDown={(e) => { e.stopPropagation(); if (tool === "delete") deleteWall(wall.id); else selectWall(wall.id); }}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={active ? "wall-line active" : "wall-line"} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10} className="wall-label">{distance(wall.start, wall.end).toFixed(2)} м · {wallAngleDeg(wall).toFixed(0)}°</text>
            <circle cx={a.x} cy={a.y} r={active ? 10 : 7} className="wall-point" onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.buttons === 1 && moveEndpoint(wall.id, "start", e)} />
            <circle cx={b.x} cy={b.y} r={active ? 10 : 7} className="wall-point" onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.buttons === 1 && moveEndpoint(wall.id, "end", e)} />
          </g>;
        })}
        {drawing.lights.map((light) => { const p = pointToSvg(light.position); return <g key={light.id}><circle cx={p.x} cy={p.y} r="9" className="light-point" /><text x={p.x + 12} y={p.y + 4} className="light-label">●</text></g>; })}
        {draftPoints.length > 0 && <circle cx={pointToSvg(draftPoints[draftPoints.length - 1]).x} cy={pointToSvg(draftPoints[draftPoints.length - 1]).y} r="6" className="draft-point" />}
      </svg>
    </div>
  );
}
