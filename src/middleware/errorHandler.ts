import type { NextFunction, Request, Response } from "express";
export class ApiError extends Error {
  code: string; status: number; details?: unknown;
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message); this.code = code; this.status = status; this.details = details;
  }
}
export const httpError = (code: string, message: string, status = 400, details?: unknown) =>
  new ApiError(code, message, status, details);
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof SyntaxError && "body" in (err as any)) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } }); return;
  }
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } }); return;
  }
  res.status(500).json({ error: { code: "INTERNAL", message: "Internal server error" } });
}
