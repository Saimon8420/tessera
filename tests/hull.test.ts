import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

// 4 corners + 1 interior point; convex hull should be the 4-corner square.
const pts = [[0, 0], [4, 0], [4, 4], [0, 4], [2, 2]];

describe("hull", () => {
  it("convex hull of a point cloud is a polygon", async () => {
    const r = await post("/v1/hull", { points: pts });
    expect(r.status).toBe(200);
    expect(r.body.data.geometry.type).toBe("Polygon");
    // convex hull ring has 5 coords (4 corners + closing point); interior point excluded
    expect(r.body.data.geometry.coordinates[0].length).toBe(5);
  });
  it("needs at least 3 points → 400", async () => {
    const r = await post("/v1/hull", { points: [[0, 0], [1, 1]] });
    expect(r.status).toBe(400);
  });
});
