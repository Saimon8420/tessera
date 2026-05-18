import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { ApiError } from "./errorHandler";
function make(where: "body" | "query", key: "body" | "query") {
  return (schema: ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    try { res.locals[key] = schema.parse(req[where] ?? {}); next(); }
    catch (e) {
      if (e instanceof ZodError) next(new ApiError("VALIDATION_ERROR", "Invalid request", 400, e.flatten().fieldErrors));
      else next(e);
    }
  };
}
export const validateBody = make("body", "body");
export const validateQuery = make("query", "query");
