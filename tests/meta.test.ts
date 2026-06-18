import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
const get = (p: string) => request(buildApp()).get(p);

describe("meta + reference", () => {
  it("meta lists the service + endpoints", async () => {
    const r = await get("/v1/meta");
    expect(r.status).toBe(200);
    expect(r.body.data.service).toBe("Tessera");
    expect(r.body.data.endpoints).toContain("/v1/measure");
    expect(r.body.data.engine).toContain("turf");
  });
  it("reference lists the operation catalog", async () => {
    const r = await get("/v1/reference");
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.find((c: any) => c.endpoint === "/v1/measure")).toBeTruthy();
  });
  it("reference/units lists supported units", async () => {
    const r = await get("/v1/reference/units");
    expect(r.body.data).toContain("kilometers");
  });
});
