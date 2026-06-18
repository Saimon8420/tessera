import { Router } from "express";
import { CATALOG } from "../lib/catalog";
import { ok } from "../lib/format";
export const meta = Router();
meta.get("/", (_req, res) => res.json(ok({
  service: "Tessera",
  description: "Free public geospatial geometry API — measure, distance, buffer, overlay, relate, hull, simplify & interpolate GeoJSON.",
  version: "1.0.0",
  engine: "turf.js (@turf/turf)",
  endpoints: [
    "/v1/measure", "/v1/distance", "/v1/buffer", "/v1/overlay", "/v1/relates",
    "/v1/hull", "/v1/simplify", "/v1/interpolate",
    "/v1/reference", "/v1/reference/units", "/v1/meta", "/v1/health",
  ],
  operations: CATALOG,
})));
