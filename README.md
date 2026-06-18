# Tessera

Free, public geospatial geometry REST API — measure, distance, buffer,
overlay, relate, hull, simplify, and interpolate GeoJSON. Powered by
[Turf.js](https://turfjs.org/). JSON in, JSON out, no API key required.

All geometry input/output is standard [GeoJSON](https://geojson.org/), so
every result round-trips straight into any map (Leaflet, Mapbox GL, QGIS,
geojson.io, ...).

Interactive API reference (Scalar docs): served at the root `/` of the
deployment.

## Base URL

```
https://<your-deployment>.vercel.app
```

All endpoints below are relative to this base URL.

## Quick start

```bash
curl -X POST https://<your-deployment>.vercel.app/v1/distance \
  -H "Content-Type: application/json" \
  -d '{"from": [-0.1278, 51.5074], "to": [2.3522, 48.8566]}'
```

```json
{
  "data": {
    "distance": 343.556535,
    "units": "kilometers",
    "bearing": 148.115617,
    "midpoint": {
      "type": "Feature",
      "properties": {},
      "geometry": { "type": "Point", "coordinates": [1.1466, 50.1886] }
    }
  },
  "inputs": {
    "op": "between",
    "from": [-0.1278, 51.5074],
    "to": [2.3522, 48.8566],
    "options": { "units": "kilometers" }
  }
}
```

Every successful response is wrapped in an envelope: `{ "data": { ... }, "inputs": { ... } }`,
where `inputs` echoes back the normalized request body (including any
defaults that were applied, like `units: "kilometers"`).

## Endpoints

### Compute

| Method | Path | Description | Example |
| --- | --- | --- | --- |
| POST | `/v1/measure` | Area, length, centroid, center of mass, bbox & point-on-feature for a geometry | `curl -X POST .../v1/measure -H "Content-Type: application/json" -d '{"geojson":{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}}'` |
| POST | `/v1/distance` | Distance, bearing & midpoint between two points, plus destination / along-line / nearest-point ops (`op`) | `curl -X POST .../v1/distance -H "Content-Type: application/json" -d '{"from":[-0.1278,51.5074],"to":[2.3522,48.8566]}'` |
| POST | `/v1/buffer` | Grow (or shrink, with a negative radius) any geometry by a radius | `curl -X POST .../v1/buffer -H "Content-Type: application/json" -d '{"geojson":{"type":"Point","coordinates":[0,0]},"radius":100}'` |
| POST | `/v1/overlay` | Union, intersect, difference, or bbox-clip two polygons | `curl -X POST .../v1/overlay -H "Content-Type: application/json" -d '{"op":"intersect","a":{"type":"Polygon","coordinates":[[[0,0],[2,0],[2,2],[0,2],[0,0]]]},"b":{"type":"Polygon","coordinates":[[[1,1],[3,1],[3,3],[1,3],[1,1]]]}}'` |
| POST | `/v1/relates` | Spatial predicates (contains, within, crosses, disjoint, intersects, overlap, touches, equal) + point-in-polygon | `curl -X POST .../v1/relates -H "Content-Type: application/json" -d '{"a":{"type":"Polygon","coordinates":[[[0,0],[4,0],[4,4],[0,4],[0,0]]]},"b":{"type":"Point","coordinates":[2,2]},"op":"point-in-polygon"}'` |
| POST | `/v1/hull` | Convex or concave hull of a point set | `curl -X POST .../v1/hull -H "Content-Type: application/json" -d '{"points":[[0,0],[4,0],[4,4],[0,4],[2,2]]}'` |
| POST | `/v1/simplify` | Douglas-Peucker line/polygon simplification (reports vertex count before/after) | `curl -X POST .../v1/simplify -H "Content-Type: application/json" -d '{"geojson":{"type":"LineString","coordinates":[[0,0],[1,0.01],[2,-0.01],[3,0]]},"options":{"tolerance":0.1}}'` |
| POST | `/v1/interpolate` | Build a TIN, Voronoi diagram, IDW grid, or isolines from a point cloud | `curl -X POST .../v1/interpolate -H "Content-Type: application/json" -d '{"points":[[0,0],[4,0],[4,4],[0,4],[2,2]],"method":"tin"}'` |

### Reference

| Method | Path | Description | Example |
| --- | --- | --- | --- |
| GET | `/v1/reference` | Full operation catalog — every endpoint's ops, accepted geometry types & notes | `curl .../v1/reference` |
| GET | `/v1/reference/units` | Supported unit strings | `curl .../v1/reference/units` |
| GET | `/v1/meta` | Service metadata — name, version, engine, endpoint list, operation catalog | `curl .../v1/meta` |
| GET | `/v1/health` | Health check | `curl .../v1/health` |

## Interpolate methods — a note on verification

`/v1/interpolate` supports four methods. All four run through Turf's real
engine and are wrapped so a bad input always yields a clean `400`, never a
crash — but they carry different levels of test coverage:

- **`tin`** and **`voronoi`** — fully covered by the automated test suite
  (known-answer assertions on the returned `FeatureCollection`).
- **`isolines`** and **`idw`** — exercised manually against Turf's
  `interpolate`/`isolines` functions (grid + contour generation both
  succeed with real point data) but not pinned down by a known-answer unit
  test. Treat their exact output as best-effort; the shape of the response
  (`FeatureCollection`) is stable, but Turf's interpolation/contouring
  internals are more sensitive to point density and `cellSize`/`breaks`
  choices than `tin`/`voronoi` are. Both require the `FeatureCollection<Point>`
  input form with a numeric field named by `property` on each point — the
  `[[lng,lat],…]` shorthand only works for `tin`/`voronoi`. Both also build a
  grid before computing, so it's capped at 250,000 cells; if you hit the cap,
  increase `cellSize` or narrow the point extent.

## Conventions

- All compute endpoints are **POST** with a JSON body (`Content-Type: application/json`).
- Reference/meta/health endpoints are **GET**.
- Every response is wrapped in an envelope: `{ "data": { ... }, "inputs": { ... } }`
  on success, `{ "error": { "code": "...", "message": "...", "details"?: ... } }` on failure.
- Malformed or wrong-type geometry always returns a `400` (`VALIDATION_ERROR`
  or `GEOMETRY_ERROR`) — never a `500`.
- All geometry accepted and returned is standard GeoJSON (`Feature`,
  `FeatureCollection`, or a bare `Geometry`), so results round-trip into any
  map.

## Units

The `options.units` field accepts:

- `kilometers` (default)
- `miles`
- `meters`
- `degrees`
- `radians`

## Rate limiting

Tessera applies a sliding-window rate limit per client IP when configured
with Upstash Redis. Without these env vars set, rate limiting is a no-op
(useful for local dev):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_PER_MINUTE=60
```

When rate-limited, requests receive `429` with
`{"error":{"code":"RATE_LIMITED","message":"Too many requests"}}`, alongside
`X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers.

## Engine

[`@turf/turf`](https://turfjs.org/) — the battle-tested JavaScript geospatial
analysis library. Tessera is a thin, validated HTTP wrapper around it: `zod`
validates the request envelope, and every Turf call is wrapped so malformed
geometry always resolves to a clean `400`.

## License

MIT — see [LICENSE](./LICENSE).
