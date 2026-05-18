import { describe, it, expect } from "vitest";
import { asGeoJSON, runTurf, geomType, requireTypes } from "../src/lib/geojson";
import { ApiError } from "../src/middleware/errorHandler";

const pt = { type: "Point", coordinates: [0, 0] };
const feat = { type: "Feature", geometry: pt, properties: {} };

describe("geojson helpers", () => {
  it("asGeoJSON passes a valid object through", () => {
    expect(asGeoJSON(pt)).toBe(pt);
  });
  it("asGeoJSON rejects non-objects", () => {
    expect(() => asGeoJSON(42)).toThrow(ApiError);
    expect(() => asGeoJSON(null)).toThrow(ApiError);
    expect(() => asGeoJSON([1, 2])).toThrow(ApiError);
  });
  it("geomType unwraps Feature geometry", () => {
    expect(geomType(feat)).toBe("Point");
    expect(geomType(pt)).toBe("Point");
  });
  it("requireTypes throws 400 for disallowed type", () => {
    try { requireTypes(pt, ["Polygon"], "x"); expect.unreachable(); }
    catch (e: any) { expect(e).toBeInstanceOf(ApiError); expect(e.status).toBe(400); }
  });
  it("runTurf converts a Turf throw into a 400 ApiError", () => {
    try { runTurf(() => { throw new Error("boom"); }); expect.unreachable(); }
    catch (e: any) { expect(e).toBeInstanceOf(ApiError); expect(e.code).toBe("GEOMETRY_ERROR"); expect(e.status).toBe(400); }
  });
});
