import type { CeilingDrawing } from "./ceiling-model";
import { drawingSummary } from "./ceiling-model";

export type CalculationInput = {
  membraneWastePercent?: number;
  profileReservePercent?: number;
  harpoonPerimeterMultiplier?: number;
  fastenerStepMeters?: number;
};

export type CeilingCalculation = {
  areaM2: number;
  perimeterM: number;
  membraneM2: number;
  profileM: number;
  harpoonM: number;
  fasteners: number;
  lights: number;
};

export function calculateCeiling(
  drawing: CeilingDrawing,
  input: CalculationInput = {},
): CeilingCalculation {
  const summary = drawingSummary(drawing);
  const membraneWaste = (input.membraneWastePercent ?? 7) / 100;
  const profileReserve = (input.profileReservePercent ?? 5) / 100;
  const harpoonMultiplier = input.harpoonPerimeterMultiplier ?? 1;
  const step = input.fastenerStepMeters ?? 0.25;

  return {
    areaM2: round(summary.area),
    perimeterM: round(summary.perimeter),
    membraneM2: round(summary.area * (1 + membraneWaste)),
    profileM: round(summary.perimeter * (1 + profileReserve)),
    harpoonM: round(summary.perimeter * harpoonMultiplier),
    fasteners: Math.ceil(summary.perimeter / step),
    lights: summary.lightCount,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
