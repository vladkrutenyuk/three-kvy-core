import fs from "fs";
import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"; // для работы с CommonJS
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

export default {
	input: ["src/addons/index.ts", "src/addons/rapier-physics/index.ts"],
	output: [
		{
			dir: "addons",
			format: "esm",
            entryFileNames: "[name].js", // [name] берет путь из input
			preserveModules: true, // сохраняем структуру каталогов
			preserveModulesRoot: "src/addons",
			sourcemap: true,
		},
	],
	plugins: [
		resolve(),
		typescript({
			tsconfig: "./tsconfig.addons.json",
			declarationDir: "addons",
			declaration: true,
		}),
		terser(), // минификация (если нужно)
	],
	external: ["three", "@vladkrutenyuk/three-kvy-core"], // Исключаем зависимости
};
