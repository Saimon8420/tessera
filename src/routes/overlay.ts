import { Router } from "express";
import { z } from "zod";
import { union, intersect, difference, bboxClip, featureCollection } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema } from "../schemas/common";
import { asGeoJSON, runTurf, requireTypes } from "../lib/geojson";
import { ApiError } from "../middleware/errorHandler";
import { ok } from "../lib/format";

const POLY = ["Polygon", "MultiPolygon"];
// featureCollection() requires actual Feature objects; callers may send bare geometries.
const toFeature = (g: any) => (g.type === "Feature" ? g : { type: "Feature", geometry: g, properties: {} });
const body = z.object({
  op: z.enum(["union", "intersect", "difference", "bbox-clip"]),
  a: geojsonSchema,
  b: geojsonSchema.optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});

export const overlay = Router();
overlay.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const a = asGeoJSON(b.a);
  requireTypes(a, POLY, "a");

  let out: unknown;
  if (b.op === "bbox-clip") {
    if (!b.bbox) throw new ApiError("VALIDATION_ERROR", "bbox is required for bbox-clip", 400);
    out = runTurf(() => bboxClip(a as any, b.bbox));
    const c = (out as any)?.geometry?.coordinates;
    if (Array.isArray(c) && c.length === 0) {
      throw new ApiError("GEOMETRY_ERROR", "bbox-clip produced an empty result (geometry lies outside the bbox)", 400);
    }
  } else {
    if (!b.b) throw new ApiError("VALIDATION_ERROR", "`b` polygon is required for this op", 400);
    const bb = asGeoJSON(b.b);
    requireTypes(bb, POLY, "b");
    const fc = runTurf(() => featureCollection([toFeature(a), toFeature(bb)]));
    out =
      b.op === "union" ? runTurf(() => union(fc as any))
      : b.op === "intersect" ? runTurf(() => intersect(fc as any))
      : runTurf(() => difference(fc as any));
  }
  if (!out) throw new ApiError("GEOMETRY_ERROR", "Overlay produced an empty result (geometries may not overlap)", 400);
  res.json(ok(out, b));
});
