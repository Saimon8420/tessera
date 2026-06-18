import { Router } from "express";
import { CATALOG, UNITS } from "../lib/catalog";
import { ok } from "../lib/format";
export const reference = Router();
reference.get("/", (_req, res) => res.json(ok(CATALOG)));
reference.get("/units", (_req, res) => res.json(ok(UNITS)));
