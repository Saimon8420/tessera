import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
describe("openapi", () => {
  it("serves a valid OpenAPI 3.x document", async () => {
    const r = await request(buildApp()).get("/openapi.json");
    expect(r.status).toBe(200);
    expect(r.body.openapi).toMatch(/^3\./);
    expect(r.body.info.title).toContain("Tessera");
    expect(r.body.paths["/v1/measure"]).toBeTruthy();
    expect(r.body.paths["/v1/distance"]).toBeTruthy();
  });
});
