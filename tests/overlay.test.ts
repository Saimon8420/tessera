import { describe, it, expect } from "vitest";
import request from "supertest";
import { area } from "@turf/turf";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

const sq = (x0: number, y0: number, x1: number, y1: number) =>
  ({ type: "Polygon", coordinates: [[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]] });
const A = sq(0, 0, 2, 2);
const B = sq(1, 1, 3, 3);

describe("overlay", () => {
  it("intersect of two overlapping squares is the 1x1 overlap", async () => {
    const r = await post("/v1/overlay", { op: "intersect", a: A, b: B });
    expect(r.status).toBe(200);
    expect(["Polygon", "MultiPolygon"]).toContain(r.body.data.geometry.type);
    // overlap is the unit square [1,1]-[2,2]
    expect(area(r.body.data)).toBeGreaterThan(0);
  });
  it("union area ≥ each input area", async () => {
    const r = await post("/v1/overlay", { op: "union", a: A, b: B });
    expect(area(r.body.data)).toBeGreaterThan(area(A as any));
  });
  it("rejects non-polygon input → 400", async () => {
    const r = await post("/v1/overlay", { op: "union", a: { type: "Point", coordinates: [0,0] }, b: B });
    expect(r.status).toBe(400);
  });
});
