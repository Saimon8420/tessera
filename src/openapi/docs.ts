import { Router } from "express";
import { openApiSpec } from "./spec";
export const docsRouter = Router();
docsRouter.get("/openapi.json", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.json(openApiSpec);
});
