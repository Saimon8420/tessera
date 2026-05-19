import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

// A jagged line with many near-collinear points.
const line = { type: "LineString", coordinates: [
  [0,0],[1,0.01],[2,-0.01],[3,0.02],[4,0],[5,0.01],[6,0],[7,-0.02],[8,0],[9,0.01],[10,0],
]};

describe("simplify", () => {
  it("reduces vertex count with a coarse tolerance", async () => {
    const r = await post("/v1/simplify", { geojson: line, options: { tolerance: 0.1 } });
    expect(r.status).toBe(200);
    expect(r.body.data.verticesAfter).toBeLessThan(r.body.data.verticesBefore);
  });
  it("garbage geometry → 400", async () => {
    const r = await post("/v1/simplify", { geojson: { type: "LineString", coordinates: "x" } });
    expect(r.status).toBe(400);
  });
});
