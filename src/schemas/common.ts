import { z } from "zod";

export const unitEnum = z
  .enum(["kilometers", "miles", "meters", "degrees", "radians"])
  .optional()
  .default("kilometers");

// Loose GeoJSON envelope: must be an object with a string `type`.
// Deep coordinate validation is delegated to Turf (wrapped by runTurf → 400).
export const geojsonSchema = z
  .object({ type: z.string() })
  .passthrough();

// A [lng, lat] position OR a GeoJSON Point/Feature<Point>.
export const pointInput = z.union([
  z.tuple([z.number(), z.number()]),
  geojsonSchema,
]);
