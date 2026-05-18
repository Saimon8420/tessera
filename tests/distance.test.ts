import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

const london = [-0.1278, 51.5074];
const paris = [2.3522, 48.8566];

describe("distance", () => {
  it("London → Paris ≈ 343 km", async () => {
    const r = await post("/v1/distance", { from: london, to: paris });
    expect(r.status).toBe(200);
    expect(r.body.data.distance).toBeCloseTo(343, -1);
    expect(typeof r.body.data.bearing).toBe("number");
    expect(r.body.data.midpoint.geometry.type).toBe("Point");
  });
  it("distance honours miles", async () => {
    const r = await post("/v1/distance", { from: london, to: paris, options: { units: "miles" } });
    expect(r.body.data.distance).toBeCloseTo(213, 0);
  });
  it("destination op returns a point ~111km north of origin", async () => {
    const r = await post("/v1/distance", { op: "destination", from: [0, 0], distance: 111, bearing: 0 });
    expect(r.status).toBe(200);
    expect(r.body.data.geometry.coordinates[1]).toBeCloseTo(1, 1);
  });
  it("nearest op picks the closest point", async () => {
    const r = await post("/v1/distance", { op: "nearest", point: [0, 0], points: [[10, 10], [1, 1], [40, 40]] });
    expect(r.body.data.nearest.geometry.coordinates).toEqual([1, 1]);
    expect(r.body.data.index).toBe(1);
  });
  it("between without from/to → 400", async () => {
    const r = await post("/v1/distance", { from: london });
    expect(r.status).toBe(400);
  });
});
