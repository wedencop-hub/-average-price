export type Point2D = { x: number; y: number };

export type Wall = {
  id: string;
  start: Point2D;
  end: Point2D;
  type: "wall" | "niche" | "projection" | "column";
};

export type LightType = "spot" | "chandelier" | "led" | "track" | "light_line" | "floating_profile" | "cornice" | "other";

export type Light = {
  id: string;
  type: LightType;
  position: Point2D;
  quantity: number;
};

export type CeilingDrawing = {
  id: string;
  objectId: string;
  version: number;
  walls: Wall[];
  lights: Light[];
  createdAt: string;
  updatedAt: string;
};

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function perimeter(walls: Wall[]): number {
  return walls.reduce((sum, wall) => sum + distance(wall.start, wall.end), 0);
}

export function wallAngleDeg(wall: Wall): number {
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180 / Math.PI;
  return (angle + 360) % 360;
}

export function drawingSummary(drawing: CeilingDrawing) {
  const orderedPoints = drawing.walls.map((wall) => wall.start);
  return {
    area: polygonArea(orderedPoints),
    perimeter: perimeter(drawing.walls),
    wallCount: drawing.walls.length,
    lightCount: drawing.lights.reduce((sum, light) => sum + light.quantity, 0),
  };
}
