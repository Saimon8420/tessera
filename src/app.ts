import express from "express";
import path from "node:path";
import { api } from "./routes";
import { rateLimit } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { docsRouter } from "./openapi/docs";

export function buildApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/v1", rateLimit, api);
  app.use(docsRouter);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Resource not found" } });
  });
  app.use(errorHandler);
  return app;
}
export const app = buildApp();
export default app;
