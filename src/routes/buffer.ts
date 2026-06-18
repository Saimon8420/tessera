import { Router } from "express";
import { z } from "zod";
import { buffer as turfBuffer } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema, unitEnum } from "../schemas/common";
import { asGeoJSON, runTurf, assertCoordsInRange } from "../lib/geojson";
import { ApiError } from "../middleware/errorHandler";
import { ok } from "../lib/format";

const body = z.object({
  geojson: geojsonSchema,
  radius: z.number({ required_error: "radius is required" }),
  options: z.object({ units: unitEnum, steps: z.number().int().positive().max(256).optional().default(8) }).optional().default({}),
});

export const buffer = Router();
buffer.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const g = asGeoJSON(b.geojson);
  assertCoordsInRange(g);
  const out = runTurf(() => turfBuffer(g as any, b.radius, { units: b.options.units, steps: b.options.steps }));
  if (!out) throw new ApiError("GEOMETRY_ERROR", "Buffer produced an empty result", 400);
  res.json(ok(out, b));
});
