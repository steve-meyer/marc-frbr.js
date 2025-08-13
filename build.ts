import * as esbuild from "esbuild";

// WORKERS

await esbuild.build({
  entryPoints: ["src/sorting/sort_partition.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "esm",
  outfile: "dist/sort_partition.js",
});

await esbuild.build({
  entryPoints: ["src/cluster/process_work_candidates.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "esm",
  outfile: "dist/process_work_candidates.js",
});

// MAIN FOR CLUSTERING

await esbuild.build({
  entryPoints: ["src/cluster/main.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  format: "esm",
  outfile: "dist/main.js",
});
