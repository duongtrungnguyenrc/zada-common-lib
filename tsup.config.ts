import { defineConfig, type Options } from "tsup";

import { name, version } from "./package.json";

export default defineConfig((overrideOptions) => {
  const isProd = overrideOptions.env?.NODE_ENV === "production";

  const common: Options = {
    entry: ["./src/**/*.{ts,js}", "!./src/**/*.test.{ts,js}"],
    clean: true,
    minify: isProd,
    sourcemap: !isProd,
    legacyOutput: true,
    bundle: false,
    splitting: false,
    define: {
      PACKAGE_NAME: `"${name}"`,
      PACKAGE_VERSION: `"${version}"`,
      __DEV__: `${!isProd}`,
    },
  };

  const esm: Options = {
    ...common,
    format: "esm",
  };

  const cjs: Options = {
    ...common,
    format: "cjs",
    outDir: "./dist/cjs",
  };

  const dts: Options = {
    entry: ["src/index.ts"],
    clean: false,
    dts: true,
    outDir: "./dist/types",
  };

  return [esm, cjs, dts];
});
