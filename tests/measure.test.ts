import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

// ~1° x 1° polygon near the equator.
const square = { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };

describe("measure", () => {
  it("computes area, centroid & bbox for a polygon", async () => {
    const r = await post("/v1/measure", { geojson: square });
    expect(r.status).toBe(200);
    // 1°x1° near equator ≈ 1.23e10 m² (~12,300 km²). Loose bound.
    expect(r.body.data.area_m2).toBeGreaterThan(1.2e10);
    expect(r.body.data.area_m2).toBeLessThan(1.25e10);
    expect(r.body.data.bbox).toEqual([0, 0, 1, 1]);
    expect(r.body.data.centroid.geometry.coordinates[0]).toBeCloseTo(0.5, 5);
  });
  it("garbage geometry → 400, not 500", async () => {
    const r = await post("/v1/measure", { geojson: { type: "Polygon", coordinates: "nope" } });
    expect(r.status).toBe(400);
  });
  it("missing geojson → 400", async () => {
    const r = await post("/v1/measure", {});
    expect(r.status).toBe(400);
  });
});
