import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const post = (p: string, b: object) => request(buildApp()).post(p).send(b);

const poly = { type: "Polygon", coordinates: [[[0,0],[4,0],[4,4],[0,4],[0,0]]] };
const inside = { type: "Point", coordinates: [2, 2] };
const outside = { type: "Point", coordinates: [9, 9] };

describe("relates", () => {
  it("point-in-polygon true", async () => {
    const r = await post("/v1/relates", { a: poly, b: inside, op: "point-in-polygon" });
    expect(r.status).toBe(200);
    expect(r.body.data.result).toBe(true);
  });
  it("point-in-polygon false", async () => {
    const r = await post("/v1/relates", { a: poly, b: outside, op: "point-in-polygon" });
    expect(r.body.data.result).toBe(false);
  });
  it("full predicate set: disjoint true for far-apart", async () => {
    const r = await post("/v1/relates", { a: poly, b: outside });
    expect(r.body.data.disjoint).toBe(true);
    expect(r.body.data.intersects).toBe(false);
  });
  it("unknown op → 400", async () => {
    const r = await post("/v1/relates", { a: poly, b: inside, op: "bogus" });
    expect(r.status).toBe(400);
  });
});
