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
