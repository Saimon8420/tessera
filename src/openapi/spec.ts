const jsonBody = (example: Record<string, unknown>) => ({
  required: true,
  content: { "application/json": { schema: { type: "object" }, example } },
});
const looseResponse = (description: string) => ({
  description, content: { "application/json": { schema: { type: "object" } } },
});
const sq = { type: "Polygon", coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] };

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Tessera API",
    version: "1.0.0",
    description: "Free public geospatial geometry API — measure, distance, buffer, overlay, relate, hull, simplify & interpolate GeoJSON. Powered by Turf.js. No API key. Send GeoJSON, get GeoJSON back.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/v1/measure": { post: { summary: "Area, length, centroid, bbox of a geometry", tags: ["Measure"], requestBody: jsonBody({ geojson: sq }), responses: { "200": looseResponse("Measurements") } } },
    "/v1/distance": { post: { summary: "Distance, bearing, destination, along, nearest", tags: ["Distance"], requestBody: jsonBody({ from: [-0.1278, 51.5074], to: [2.3522, 48.8566] }), responses: { "200": looseResponse("Distance result") } } },
    "/v1/buffer": { post: { summary: "Buffer a geometry by a radius", tags: ["Buffer"], requestBody: jsonBody({ geojson: { type: "Point", coordinates: [0, 0] }, radius: 100 }), responses: { "200": looseResponse("Buffered geometry") } } },
    "/v1/overlay": { post: { summary: "Union, intersect, difference, bbox-clip of polygons", tags: ["Overlay"], requestBody: jsonBody({ op: "intersect", a: sq, b: { type: "Polygon", coordinates: [[[0.5,0.5],[1.5,0.5],[1.5,1.5],[0.5,1.5],[0.5,0.5]]] } }), responses: { "200": looseResponse("Overlay geometry") } } },
    "/v1/relates": { post: { summary: "Spatial predicates + point-in-polygon", tags: ["Relates"], requestBody: jsonBody({ a: sq, b: { type: "Point", coordinates: [0.5, 0.5] }, op: "point-in-polygon" }), responses: { "200": looseResponse("Predicate booleans") } } },
    "/v1/hull": { post: { summary: "Convex & concave hull of a point set", tags: ["Hull"], requestBody: jsonBody({ points: [[0,0],[4,0],[4,4],[0,4],[2,2]] }), responses: { "200": looseResponse("Hull polygon") } } },
    "/v1/simplify": { post: { summary: "Douglas-Peucker simplify", tags: ["Simplify"], requestBody: jsonBody({ geojson: { type: "LineString", coordinates: [[0,0],[1,0.1],[2,-0.1],[3,0]] }, options: { tolerance: 0.1 } }), responses: { "200": looseResponse("Simplified geometry") } } },
    "/v1/interpolate": { post: { summary: "TIN, Voronoi, isolines, IDW from points", tags: ["Interpolate"], requestBody: jsonBody({ points: [[0,0],[4,0],[4,4],[0,4],[2,2]], method: "tin" }), responses: { "200": looseResponse("Interpolated surface") } } },
    "/v1/reference": { get: { summary: "Operation catalog", tags: ["Meta"], responses: { "200": looseResponse("Catalog") } } },
    "/v1/meta": { get: { summary: "Service metadata", tags: ["Meta"], responses: { "200": looseResponse("Service info") } } },
    "/v1/health": { get: { summary: "Liveness", tags: ["Meta"], responses: { "200": looseResponse("ok") } } },
  },
};
