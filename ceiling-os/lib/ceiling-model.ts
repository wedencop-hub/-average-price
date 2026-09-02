export type Point2D = { x: number; y: number };
export type Wall = { id: string; start: Point2D; end: Point2D; type: "wall" | "niche" | "projection" | "column" };
export type LightType = "spot" | "chandelier" | "led" | "track" | "light_line" | "floating_profile" | "cornice" | "other";
export type Light = { id: string; type: LightType; position: Point2D; quantity: number };
export type CeilingDrawing = { id: string; objectId: string; version: number; walls: Wall[]; lights: Light[]; createdAt: string; updatedAt: string };

export function distance(a: Point2D, b: Point2D): number { return Math.hypot(b.x - a.x, b.y - a.y); }
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) { const a = points[i]; const b = points[(i + 1) % points.length]; sum += a.x * b.y - b.x * a.y; }
  return Math.abs(sum) / 2;
}
export function perimeter(walls: Wall[]): number { return walls.reduce((sum, wall) => sum + distance(wall.start, wall.end), 0); }
export function wallAngleDeg(wall: Wall): number { return (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180 / Math.PI + 360) % 360; }

export function orderedRoomPoints(walls: Wall[]): Point2D[] {
  if (!walls.length) return [];
  const remaining = [...walls];
  const points: Point2D[] = [remaining[0].start];
  let current = remaining.shift()!.end;
  points.push(current);
  while (remaining.length) {
    const index = remaining.findIndex((wall) => distance(wall.start, current) < 0.01 || distance(wall.end, current) < 0.01);
    if (index < 0) break;
    const wall = remaining.splice(index, 1)[0];
    current = distance(wall.start, current) < 0.01 ? wall.end : wall.start;
    if (distance(current, points[0]) < 0.01) break;
    points.push(current);
  }
  return points;
}
export function drawingArea(walls: Wall[]): number {
  const points = orderedRoomPoints(walls);
  if (points.length < 3 || distance(points[points.length - 1], points[0]) >= 0.01) return 0;
  return polygonArea(points);
}
export function drawingSummary(drawing: CeilingDrawing) {
  return { area: drawingArea(drawing.walls), perimeter: perimeter(drawing.walls), wallCount: drawing.walls.length, lightCount: drawing.lights.reduce((sum, light) => sum + light.quantity, 0) };
}
