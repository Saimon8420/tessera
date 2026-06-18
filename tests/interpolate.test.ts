import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

const cloud = [[0, 0], [4, 0], [4, 4], [0, 4], [2, 2], [1, 3], [3, 1]];

describe("interpolate", () => {
  it("tin builds a FeatureCollection of triangles", async () => {
    const r = await post("/v1/interpolate", { points: cloud, method: "tin" });
    expect(r.status).toBe(200);
    expect(r.body.data.type).toBe("FeatureCollection");
    expect(r.body.data.features.length).toBeGreaterThan(0);
    expect(r.body.data.features[0].geometry.type).toBe("Polygon");
  });
  it("voronoi builds cells within a bbox", async () => {
    const r = await post("/v1/interpolate", { points: cloud, method: "voronoi", options: { bbox: [-1, -1, 5, 5] } });
    expect(r.status).toBe(200);
    expect(r.body.data.type).toBe("FeatureCollection");
  });
  it("unknown method → 400", async () => {
    const r = await post("/v1/interpolate", { points: cloud, method: "magic" });
    expect(r.status).toBe(400);
  });
  it("idw with a tiny cellSize over a wide extent → 400, not a crash", async () => {
    const fc = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { v: 1 }, geometry: { type: "Point", coordinates: [0, 0] } },
        { type: "Feature", properties: { v: 2 }, geometry: { type: "Point", coordinates: [80, 0] } },
        { type: "Feature", properties: { v: 3 }, geometry: { type: "Point", coordinates: [80, 80] } },
        { type: "Feature", properties: { v: 4 }, geometry: { type: "Point", coordinates: [0, 80] } },
      ],
    };
    const r = await post("/v1/interpolate", { points: fc, method: "idw", options: { property: "v", cellSize: 0.5 } });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("idw with the [[lng,lat],…] array points form → 400 with clarifying message", async () => {
    const r = await post("/v1/interpolate", { points: cloud, method: "idw", options: { property: "v" } });
    expect(r.status).toBe(400);
    expect(r.body.error.message).toMatch(/FeatureCollection<Point>/);
  });
  it("idw with a FeatureCollection<Point> and a sane cellSize succeeds", async () => {
    const fc = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { v: 1 }, geometry: { type: "Point", coordinates: [0, 0] } },
        { type: "Feature", properties: { v: 2 }, geometry: { type: "Point", coordinates: [4, 0] } },
        { type: "Feature", properties: { v: 3 }, geometry: { type: "Point", coordinates: [4, 4] } },
        { type: "Feature", properties: { v: 4 }, geometry: { type: "Point", coordinates: [0, 4] } },
      ],
    };
    const r = await post("/v1/interpolate", { points: fc, method: "idw", options: { property: "v", cellSize: 25 } });
    expect(r.status).toBe(200);
    expect(r.body.data.type).toBe("FeatureCollection");
  });
});
