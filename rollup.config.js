import fs from "fs";
import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"; // для работы с CommonJS
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

const _tsInput = "src/kvy.ts"; // Входной файл для сборки
const _fileName = "kvy"; // Базовое имя для всех файлов сборки

const _outputDir = "build"; // Директория для всех файлов сборки
const _externalDeps = ["three", "eventemitter3"]; // Внешние зависимости
const _globalVariableMappings = {
	three: "THREE",
	eventemitter3: "eventemitter3",
};
const _tsconfig = "./tsconfig.json";

const baseConfig = (format, min) => ({
	input: [_tsInput],
	output: {
		file: `${_outputDir}/${_fileName}.js`,
		format: format,
		entryFileNames: "[name].js", // Гарантирует расширение .js
		sourcemap: true,
	},
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: _tsconfig,
			declaration: true,
			declarationDir: `${_outputDir}`,
			emitDeclarationOnly: true,
			exclude: ["src/addons/**/*"]
		}),
		min && terser({ keep_classnames: false }),
	],
	external: _externalDeps,
});

const _namespace = "KVY"; // Название неймспейса, используемого в UMD и d.ts
const _npmModule = "@vladkrutenyuk/three-kvy-core"; 
export default [
	// ESM Configuration (non-minified)
	// baseConfig("esm"),
	baseConfig("esm", true),
	{
		input: `${_outputDir}/kvy.d.ts`,
		output: [
			{
				file: `${_outputDir}/${_fileName}.bundle.d.ts`,
				// format: "es",
				globals: _globalVariableMappings,
				banner: `declare namespace ${_namespace} {`,
				footer: `}
			  declare module "${_npmModule}" { export=${_namespace};}
			`,
			},
		],
		plugins: [dts({ compilerOptions: { declaration: false } })],
	},
];
