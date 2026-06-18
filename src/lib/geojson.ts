import { coordEach } from "@turf/turf";
import { ApiError } from "../middleware/errorHandler";

const isObj = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Passthrough guard: throws 400 if `value` is not a plausible GeoJSON object. */
export function asGeoJSON(value: unknown): any {
  if (!isObj(value) || typeof (value as any).type !== "string") {
    throw new ApiError("VALIDATION_ERROR", "Expected a GeoJSON object with a string `type`", 400);
  }
  return value;
}

/** GeoJSON type of a Feature/Geometry/Collection (unwraps Feature.geometry). */
export function geomType(g: any): string {
  if (isObj(g) && g.type === "Feature" && isObj(g.geometry)) return g.geometry.type;
  return isObj(g) ? g.type : "";
}

/** Throws 400 if geomType(g) is not in `allowed`. */
export function requireTypes(g: any, allowed: string[], label: string): void {
  const t = geomType(g);
  if (!allowed.includes(t)) {
    throw new ApiError("GEOMETRY_ERROR", `${label} must be one of: ${allowed.join(", ")} (got ${t || "unknown"})`, 400, { allowed, got: t });
  }
}

/** Run a Turf call; any throw becomes a clean 400 (never a 500). */
export function runTurf<T>(fn: () => T): T {
  try { return fn(); }
  catch (e: any) {
    throw new ApiError("GEOMETRY_ERROR", e?.message ? String(e.message) : "Invalid geometry for this operation", 400);
  }
}

const inRange = (lng: unknown, lat: unknown): boolean =>
  typeof lng === "number" && typeof lat === "number" &&
  lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;

const OUT_OF_RANGE = "Coordinate out of range. Longitude must be within -180..180 and latitude within -90..90.";

/** Validate a single [lng, lat] position (the tuple input form). */
export function assertPositionInRange(pos: any): void {
  if (!Array.isArray(pos) || !inRange(pos[0], pos[1])) {
    throw new ApiError("VALIDATION_ERROR", OUT_OF_RANGE, 400, { coordinate: pos });
  }
}

/** Validate every position inside a GeoJSON Feature/FeatureCollection/Geometry. */
export function assertCoordsInRange(g: any): void {
  let bad: any = null;
  try {
    coordEach(g as any, (coord: any) => {
      if (bad === null && !inRange(coord?.[0], coord?.[1])) bad = coord;
    });
  } catch {
    // Structural problem (not a range issue) — let the endpoint's runTurf surface it.
    return;
  }
  if (bad !== null) throw new ApiError("VALIDATION_ERROR", OUT_OF_RANGE, 400, { coordinate: bad });
}

/** Validate either input form: a [lng,lat] tuple OR a GeoJSON object. */
export function assertPointInputInRange(v: any): void {
  if (Array.isArray(v)) assertPositionInRange(v);
  else assertCoordsInRange(v);
}

/** Validate a bbox tuple [minX, minY, maxX, maxY] as two [lng,lat] corners. */
export function assertBboxInRange(bb: any): void {
  if (!Array.isArray(bb) || bb.length < 4) return; // zod already shape-checks; nothing to do
  assertPositionInRange([bb[0], bb[1]]);
  assertPositionInRange([bb[2], bb[3]]);
}
