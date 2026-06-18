import { Router } from "express";
import { z } from "zod";
import { tin, voronoi, isolines, interpolate as idw, featureCollection, point as turfPoint, bbox as turfBbox, distance as turfDistanceFn } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema, unitEnum } from "../schemas/common";
import { runTurf } from "../lib/geojson";
import { ApiError } from "../middleware/errorHandler";
import { ok } from "../lib/format";

const MAX_GRID_CELLS = 250_000;
// idw/isolines build a full grid of (bboxWidth/cellSize) x (bboxHeight/cellSize) cells
// BEFORE computing anything — an unbounded grid can allocate multiple GB and OOM-crash
// the process. Reject oversized grids with a clean 400 before calling Turf's interpolate.
function assertGridBounded(fc: any, cellSize: number, units: any, bboxOpt?: number[]) {
  const bb = bboxOpt ?? runTurf(() => turfBbox(fc as any));
  const w = turfDistanceFn([bb[0], bb[1]], [bb[2], bb[1]], { units });
  const h = turfDistanceFn([bb[0], bb[1]], [bb[0], bb[3]], { units });
  const cells = (w / cellSize) * (h / cellSize);
  if (!Number.isFinite(cells) || cells > MAX_GRID_CELLS) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `cellSize too small for this extent (~${Math.round(cells)} grid cells; max ${MAX_GRID_CELLS}). Increase cellSize or narrow the point extent.`,
      400,
      { estimatedCells: Math.round(cells), max: MAX_GRID_CELLS }
    );
  }
}

const body = z.object({
  points: z.union([z.array(z.tuple([z.number(), z.number()])), geojsonSchema]),
  method: z.enum(["tin", "voronoi", "isolines", "idw"]),
  options: z.object({
    z: z.string().optional(),
    property: z.string().optional(),
    // idw/isolines build a grid before computing; capped at 250,000 cells (see assertGridBounded).
    cellSize: z.number().positive().optional().default(1),
    units: unitEnum,
    breaks: z.array(z.number()).optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    weight: z.number().positive().optional().default(1),
  }).optional().default({}),
});

export const interpolate = Router();
interpolate.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const o = b.options;
  const fc = Array.isArray(b.points)
    ? runTurf(() => featureCollection(b.points.map((p: number[]) => turfPoint(p))))
    : (b.points as any);

  let out: unknown;
  if (b.method === "tin") {
    out = runTurf(() => tin(fc as any, o.z));
  } else if (b.method === "voronoi") {
    const bb = o.bbox ?? runTurf(() => turfBbox(fc as any));
    out = runTurf(() => voronoi(fc as any, { bbox: bb as any }));
  } else if (b.method === "isolines") {
    if (Array.isArray(b.points)) throw new ApiError("VALIDATION_ERROR", "idw/isolines require the FeatureCollection<Point> input form with a numeric field named by `property` on each point; the [[lng,lat],…] shorthand only works for tin/voronoi.", 400);
    if (!o.breaks || !o.property) throw new ApiError("VALIDATION_ERROR", "isolines needs `breaks` and `property`", 400);
    assertGridBounded(fc, o.cellSize, o.units, o.bbox);
    const grid = runTurf(() => idw(fc as any, o.cellSize, { gridType: "point", property: o.property, units: o.units, weight: o.weight }));
    out = runTurf(() => isolines(grid as any, o.breaks as number[], { zProperty: o.property }));
  } else {
    // idw
    if (Array.isArray(b.points)) throw new ApiError("VALIDATION_ERROR", "idw/isolines require the FeatureCollection<Point> input form with a numeric field named by `property` on each point; the [[lng,lat],…] shorthand only works for tin/voronoi.", 400);
    if (!o.property) throw new ApiError("VALIDATION_ERROR", "idw needs a `property` (the z-value field)", 400);
    assertGridBounded(fc, o.cellSize, o.units, o.bbox);
    out = runTurf(() => idw(fc as any, o.cellSize, { gridType: "square", property: o.property, units: o.units, weight: o.weight }));
  }
  res.json(ok(out, b));
});
