"use client";

import { useMemo, useState } from "react";
import type { CeilingDrawing, Point2D, Wall } from "../../lib/ceiling-model";
import { distance } from "../../lib/ceiling-model";

const W = 900;
const H = 560;
const PAD = 60;

export function CeilingCanvas({ drawing, onChange }: { drawing: CeilingDrawing; onChange: (drawing: CeilingDrawing) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
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

  const sx = (W - PAD * 2) / Math.max(bounds.maxX - bounds.minX, 1);
  const sy = (H - PAD * 2) / Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(sx, sy);
  const pointToSvg = (p: Point2D) => ({ x: PAD + (p.x - bounds.minX) * scale, y: PAD + (p.y - bounds.minY) * scale });

  function moveWallEndpoint(wallId: string, endpoint: "start" | "end", event: React.PointerEvent<SVGCircleElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left - PAD) / scale + bounds.minX;
    const y = (event.clientY - rect.top - PAD) / scale + bounds.minY;
    const walls = drawing.walls.map((wall) => wall.id === wallId ? { ...wall, [endpoint]: { x: Math.max(0, x), y: Math.max(0, y) } } : wall) as Wall[];
    onChange({ ...drawing, walls, version: drawing.version + 1, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="constructor-canvas-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="constructor-canvas" role="img" aria-label="Конструктор стелі">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity=".08" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {drawing.walls.map((wall) => {
          const a = pointToSvg(wall.start); const b = pointToSvg(wall.end);
          const active = selected === wall.id;
          return <g key={wall.id} onPointerDown={() => setSelected(wall.id)}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={active ? "wall-line active" : "wall-line"} />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 10} className="wall-label">{distance(wall.start, wall.end).toFixed(2)} м</text>
            <circle cx={a.x} cy={a.y} r={active ? 10 : 7} className="wall-point" onPointerMove={(e) => e.buttons === 1 && moveWallEndpoint(wall.id, "start", e)} />
            <circle cx={b.x} cy={b.y} r={active ? 10 : 7} className="wall-point" onPointerMove={(e) => e.buttons === 1 && moveWallEndpoint(wall.id, "end", e)} />
          </g>;
        })}
      </svg>
    </div>
  );
}
