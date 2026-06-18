import { Router } from "express";
import { z } from "zod";
import {
  booleanContains, booleanWithin, booleanCrosses, booleanDisjoint,
  booleanIntersects, booleanOverlap, booleanTouches, booleanEqual, booleanPointInPolygon,
} from "@turf/turf";
import { validateBody } from "../middleware/validate";
import { geojsonSchema } from "../schemas/common";
import { asGeoJSON, geomType, assertCoordsInRange } from "../lib/geojson";
import { ok } from "../lib/format";

const OPS = [
  "contains", "within", "crosses", "disjoint", "intersects",
  "overlap", "touches", "equal", "point-in-polygon",
] as const;

const body = z.object({
  a: geojsonSchema,
  b: geojsonSchema,
  op: z.enum(OPS).optional(),
});

// Each predicate wrapped so an unsupported type pair yields null, never a 500.
const safe = (fn: () => boolean): boolean | null => { try { return fn(); } catch { return null; } };

function pip(a: any, b: any): boolean | null {
  // point-in-polygon expects (point, polygon); accept either order.
  const at = geomType(a), bt = geomType(b);
  const poly = at.includes("Polygon") ? a : b;
  const pt = at.includes("Polygon") ? b : a;
  if (!geomType(poly).includes("Polygon") || geomType(pt) !== "Point") return null;
  return safe(() => booleanPointInPolygon(pt, poly));
}

export const relates = Router();
relates.post("/", validateBody(body), (_req, res) => {
  const b = res.locals.body;
  const a = asGeoJSON(b.a), bb = asGeoJSON(b.b);
  assertCoordsInRange(a); assertCoordsInRange(bb);

  if (b.op) {
    const result =
      b.op === "contains" ? safe(() => booleanContains(a, bb))
      : b.op === "within" ? safe(() => booleanWithin(a, bb))
      : b.op === "crosses" ? safe(() => booleanCrosses(a, bb))
      : b.op === "disjoint" ? safe(() => booleanDisjoint(a, bb))
      : b.op === "intersects" ? safe(() => booleanIntersects(a, bb))
      : b.op === "overlap" ? safe(() => booleanOverlap(a, bb))
      : b.op === "touches" ? safe(() => booleanTouches(a, bb))
      : b.op === "equal" ? safe(() => booleanEqual(a, bb))
      : pip(a, bb);
    res.json(ok({ op: b.op, result }, b));
    return;
  }

  res.json(ok({
    contains: safe(() => booleanContains(a, bb)),
    within: safe(() => booleanWithin(a, bb)),
    crosses: safe(() => booleanCrosses(a, bb)),
    disjoint: safe(() => booleanDisjoint(a, bb)),
    intersects: safe(() => booleanIntersects(a, bb)),
    overlap: safe(() => booleanOverlap(a, bb)),
    touches: safe(() => booleanTouches(a, bb)),
    equal: safe(() => booleanEqual(a, bb)),
    pointInPolygon: pip(a, bb),
  }, b));
});
