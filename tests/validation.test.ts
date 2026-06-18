import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

const dhaka = [90.4125, 23.8103];
const chittagong = [91.7832, 22.3569];

describe("out-of-range coordinate validation", () => {
  it("measure with a Polygon containing latitude 200 → 400", async () => {
    const badPoly = { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 200], [0, 1], [0, 0]]] };
    const r = await post("/v1/measure", { geojson: badPoly });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("distance between with from:[0,200] (tuple form) → 400", async () => {
    const r = await post("/v1/distance", { from: [0, 200], to: [0, 0] });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("distance with to:[181,0] (longitude out of range) → 400", async () => {
    const r = await post("/v1/distance", { from: [0, 0], to: [181, 0] });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("buffer with geojson Point [0,200] → 400", async () => {
    const r = await post("/v1/buffer", { geojson: { type: "Point", coordinates: [0, 200] }, radius: 100 });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("hull with points:[[0,0],[10,0],[0,200]] (tuple-array form) → 400", async () => {
    const r = await post("/v1/hull", { points: [[0, 0], [10, 0], [0, 200]] });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("overlay intersect where polygon a has a lat of 95 → 400", async () => {
    const badA = { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 95], [0, 2], [0, 0]]] };
    const b = { type: "Polygon", coordinates: [[[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]] };
    const r = await post("/v1/overlay", { op: "intersect", a: badA, b });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("interpolate method:tin with points including [0,200] → 400", async () => {
    const r = await post("/v1/interpolate", { points: [[0, 0], [4, 0], [4, 4], [0, 200]], method: "tin" });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("positive control: distance Dhaka → Chittagong succeeds (valid global coords not blocked)", async () => {
    const r = await post("/v1/distance", { from: dhaka, to: chittagong });
    expect(r.status).toBe(200);
    expect(typeof r.body.data.distance).toBe("number");
  });

  it("positive control: measure a valid small polygon succeeds", async () => {
    const square = { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] };
    const r = await post("/v1/measure", { geojson: square });
    expect(r.status).toBe(200);
    expect(typeof r.body.data.area_m2).toBe("number");
  });
});
