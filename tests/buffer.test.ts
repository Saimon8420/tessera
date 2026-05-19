import { describe, it, expect } from "vitest";
import request from "supertest";
import { booleanPointInPolygon } from "@turf/turf";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

describe("buffer", () => {
  it("buffering a point yields a polygon enclosing it", async () => {
    const r = await post("/v1/buffer", { geojson: { type: "Point", coordinates: [0, 0] }, radius: 100 });
    expect(r.status).toBe(200);
    const poly = r.body.data;
    expect(["Polygon", "MultiPolygon"]).toContain(poly.geometry.type);
    expect(booleanPointInPolygon([0, 0], poly)).toBe(true);
  });
  it("radius is required → 400", async () => {
    const r = await post("/v1/buffer", { geojson: { type: "Point", coordinates: [0, 0] } });
    expect(r.status).toBe(400);
  });
});
