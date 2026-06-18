import { Router } from "express";
import { z } from "zod";
import { convex, concave, featureCollection, point as turfPoint } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema, unitEnum } from "../schemas/common";
import { runTurf, assertCoordsInRange } from "../lib/geojson";
import { ApiError } from "../middleware/errorHandler";
import { ok } from "../lib/format";

const body = z.object({
  points: z.union([z.array(z.tuple([z.number(), z.number()])), geojsonSchema]),
  op: z.enum(["convex", "concave"]).optional().default("convex"),
  options: z.object({
    units: unitEnum,
    maxEdge: z.number().positive().optional(),
    concavity: z.number().positive().optional(),
  }).optional().default({}),
});

export const hull = Router();
hull.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  // Build a FeatureCollection<Point>.
  const fc = Array.isArray(b.points)
    ? runTurf(() => featureCollection(b.points.map((p: number[]) => turfPoint(p))))
    : (b.points as any);
  if (Array.isArray(b.points) && b.points.length < 3) {
    throw new ApiError("VALIDATION_ERROR", "At least 3 points are required for a hull", 400);
  }
  assertCoordsInRange(fc as any);
  const out =
    b.op === "concave"
      ? runTurf(() => concave(fc as any, { units: b.options.units, maxEdge: b.options.maxEdge ?? Infinity }))
      : runTurf(() => convex(fc as any));
  if (!out) throw new ApiError("GEOMETRY_ERROR", "Could not build a hull for these points", 400);
  res.json(ok(out, b));
});
