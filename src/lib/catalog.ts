export const UNITS = ["kilometers", "miles", "meters", "degrees", "radians"] as const;

export const CATALOG = [
  { endpoint: "/v1/measure", ops: ["area", "length", "centroid", "centerOfMass", "bbox", "pointOnFeature"], acceptedTypes: ["Feature", "FeatureCollection", "Geometry"], notes: "area only for (Multi)Polygon; length for lines & polygon rings." },
  { endpoint: "/v1/distance", ops: ["between", "destination", "along", "nearest"], acceptedTypes: ["Point", "[lng,lat]", "LineString", "Point[]"], notes: "geodesic; honours units." },
  { endpoint: "/v1/buffer", ops: ["buffer"], acceptedTypes: ["any Geometry/Feature"], notes: "radius may be negative to shrink polygons; steps controls smoothness." },
  { endpoint: "/v1/overlay", ops: ["union", "intersect", "difference", "bbox-clip"], acceptedTypes: ["Polygon", "MultiPolygon"], notes: "two-polygon boolean ops; bbox-clip takes a [minX,minY,maxX,maxY]." },
  { endpoint: "/v1/relates", ops: ["contains", "within", "crosses", "disjoint", "intersects", "overlap", "touches", "equal", "point-in-polygon"], acceptedTypes: ["any two Features/Geometries"], notes: "omit op to get every predicate; unsupported type pairs report null." },
  { endpoint: "/v1/hull", ops: ["convex", "concave"], acceptedTypes: ["Point[]", "FeatureCollection<Point>"], notes: "concave needs maxEdge (+ units)." },
  { endpoint: "/v1/simplify", ops: ["simplify"], acceptedTypes: ["LineString", "Polygon", "Multi*"], notes: "Douglas-Peucker; reports vertex count before/after." },
  { endpoint: "/v1/interpolate", ops: ["tin", "voronoi", "isolines", "idw"], acceptedTypes: ["Point[]", "FeatureCollection<Point>"], notes: "isolines & idw require the FeatureCollection<Point> form with a numeric `property` on each point (the [[lng,lat],…] shorthand only works for tin/voronoi); their grids are capped at 250,000 cells — increase cellSize if you hit the cap." },
];
