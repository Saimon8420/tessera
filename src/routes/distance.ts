import { Router } from "express";
import { z } from "zod";
import {
  distance as turfDistance, bearing, destination, midpoint, along,
  nearestPoint, point as turfPoint, featureCollection,
} from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { unitEnum, pointInput, geojsonSchema } from "../schemas/common";
import { runTurf } from "../lib/geojson";
import { ApiError } from "../middleware/errorHandler";
import { ok, round } from "../lib/format";

const body = z.object({
  op: z.enum(["between", "destination", "along", "nearest"]).optional().default("between"),
  from: pointInput.optional(),
  to: pointInput.optional(),
  line: geojsonSchema.optional(),
  point: pointInput.optional(),
  points: z.array(pointInput).optional(),
  distance: z.number().optional(),
  bearing: z.number().optional(),
  options: z.object({ units: unitEnum }).optional().default({}),
});

const need = (v: unknown, name: string) => {
  if (v === undefined || v === null) throw new ApiError("VALIDATION_ERROR", `\`${name}\` is required for this op`, 400);
  return v;
};
// Accept [lng,lat] or Point/Feature<Point>; return a Turf point feature.
const toPoint = (v: any) =>
  runTurf(() => (Array.isArray(v) ? turfPoint(v) : v.type === "Feature" ? v : { type: "Feature", geometry: v, properties: {} }));

export const distance = Router();
distance.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const units = b.options.units;
  let data: unknown;

  if (b.op === "between") {
    const from = toPoint(need(b.from, "from"));
    const to = toPoint(need(b.to, "to"));
    data = runTurf(() => ({
      distance: round(turfDistance(from, to, { units }), 6),
      units,
      bearing: round(bearing(from, to), 6),
      midpoint: midpoint(from, to),
    }));
  } else if (b.op === "destination") {
    const from = toPoint(need(b.from, "from"));
    const dist = need(b.distance, "distance") as number;
    const brg = need(b.bearing, "bearing") as number;
    data = runTurf(() => destination(from, dist, brg, { units }));
  } else if (b.op === "along") {
    const line = need(b.line, "line");
    const dist = need(b.distance, "distance") as number;
    data = runTurf(() => along(line as any, dist, { units }));
  } else {
    // nearest
    const p = toPoint(need(b.point, "point"));
    const rawPts = need(b.points, "points") as any[];
    const fc = runTurf(() => featureCollection(rawPts.map((x) => toPoint(x))));
    const np = runTurf(() => nearestPoint(p, fc as any));
    data = {
      nearest: np,
      index: (np as any).properties.featureIndex,
      distanceToPoint: round(turfDistance(p, np as any, { units }), 6),
      distanceUnits: units,
    };
  }
  res.json(ok(data, b));
});
