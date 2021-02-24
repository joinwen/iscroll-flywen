import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import pkg from "./package.json";
export default [
  {
    input: "src/index.js",
    output: {
      file: pkg.browser,
      name: "iscrollFlywen",
      format: "umd",
      sourcemap: "inline",
    },
    plugins: [resolve(), commonjs(), babel({ babelHelpers: "bundled" })],
  },
  {
    input: "src/index.js",
    output: [
      {
        file: pkg.main,
        format: "cjs",
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
  },
];
