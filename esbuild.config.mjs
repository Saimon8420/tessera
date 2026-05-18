import { build } from "esbuild";
await build({ entryPoints: ["src/vercel.ts"], bundle: true, platform: "node", target: "node18", format: "cjs", outfile: "api/index.js", external: [] });
console.log("Bundled → api/index.js");
