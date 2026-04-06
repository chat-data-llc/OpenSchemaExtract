import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts"],
  format: ["esm", "cjs"],
  dts: {
    resolve: true,
    compilerOptions: {
      incremental: false,
    },
  },
  clean: true,
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".js",
    };
  },
});
