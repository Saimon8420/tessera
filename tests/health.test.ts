import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app";
describe("health", () => {
  it("returns ok", async () => {
    const res = await request(buildApp()).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("Tessera");
  });
  it("unknown route → JSON 404", async () => {
    const res = await request(buildApp()).get("/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
