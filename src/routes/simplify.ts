import { Router } from "express";
import { z } from "zod";
import { simplify as turfSimplify, cleanCoords, coordAll } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema } from "../schemas/common";
import { asGeoJSON, runTurf } from "../lib/geojson";
import { ok } from "../lib/format";

const body = z.object({
  geojson: geojsonSchema,
  options: z.object({
    tolerance: z.number().nonnegative().max(10).optional().default(0.01),
    highQuality: z.boolean().optional().default(false),
  }).optional().default({}),
});

export const simplify = Router();
simplify.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const g = asGeoJSON(b.geojson);
  const data = runTurf(() => {
    const before = coordAll(g as any).length;
    const cleaned = cleanCoords(g as any);
    const result = turfSimplify(cleaned as any, { tolerance: b.options.tolerance, highQuality: b.options.highQuality });
    const after = coordAll(result as any).length;
    return { result, verticesBefore: before, verticesAfter: after };
  });
  res.json(ok(data, b));
});
