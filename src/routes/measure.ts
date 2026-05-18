import { Router } from "express";
import { z } from "zod";
import { area, length, centroid, centerOfMass, bbox, pointOnFeature } from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema, unitEnum } from "../schemas/common";
import { asGeoJSON, runTurf, geomType } from "../lib/geojson";
import { ok, round } from "../lib/format";

const body = z.object({
  geojson: geojsonSchema,
  options: z.object({ units: unitEnum }).optional().default({}),
});

export const measure = Router();
measure.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const g = asGeoJSON(b.geojson);
  const units = b.options.units;
  const t = geomType(g);
  const isArealOrLinear = ["Polygon", "MultiPolygon", "LineString", "MultiLineString"].includes(t);
  const data = runTurf(() => ({
    type: t,
    area_m2: ["Polygon", "MultiPolygon"].includes(t) ? round(area(g as any), 3) : null,
    length: isArealOrLinear ? round(length(g as any, { units }), 6) : null,
    lengthUnits: units,
    centroid: centroid(g as any),
    centerOfMass: centerOfMass(g as any),
    bbox: bbox(g as any),
    pointOnFeature: pointOnFeature(g as any),
  }));
  res.json(ok(data, b));
});
