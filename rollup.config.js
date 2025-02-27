import fs from "fs";
import path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"; // для работы с CommonJS
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
import alias from "@rollup/plugin-alias";

const _namespace = "KVY"; // Название неймспейса, используемого в UMD и d.ts
const _tsInput = "src/index.ts"; // Входной файл для сборки
const _fileName = "index"; // Базовое имя для всех файлов сборки
const _npmModule = "@vladkrutenyuk/game-world"; // Базовое имя для всех файлов сборки
const _outputDir = "dist"; // Директория для всех файлов сборки
const _externalDeps = ["three", "eventemitter3"]; // Внешние зависимости
const _globalVariableMappings = {
	three: "THREE",
	eventemitter3: "eventemitter3",
};
const _tsconfig = "./tsconfig.build.json";

const baseConfig = (format, min) => ({
	input: [_tsInput],
	output: {
		file: `${_outputDir}/${format}/${_fileName}.${min ? "min." : ""}js`,
		// dir: `${_outputDir}`,
		format: format,
		// preserveModules: true, // Сохраняет структуру модулей
		entryFileNames: "[name].js", // Гарантирует расширение .js
	},
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: _tsconfig,
			declaration: true,
			declarationDir: `${_outputDir}`,
			emitDeclarationOnly: true,
		}),
		min && terser({ keep_classnames: false }),
	],
	external: _externalDeps,
});

// esmConfigMin.plugins.push(terser({ keep_classnames: false }));
// esmConfigMin.output.file = `${_outputDir}/esm/${_fileName}.esm.min.js`

// const umd = baseConfig("umd");
// umd.output = { ...umd.output, name: _namespace, globals: _globalVariableMappings };

const umdMin = baseConfig("umd", true);
umdMin.output = { ...umdMin.output, name: _namespace, globals: {three: "THREE"} };
umdMin.external = ["three"];

export default [
	// ESM Configuration (non-minified)
	baseConfig("esm"),
	baseConfig("esm", true),
	// umd,
	umdMin,
	//  // Сборка каждого аддона в отдельный файл
	//  ...getAddonEntries().map((addonPath) => ({
	// 	input: addonPath,
	// 	output: {
	// 	  file: `${_outputDir}/esm/addons/${path.basename(addonPath, ".ts")}.js`,
	// 	  format: "esm",
	// 	},
	// 	plugins: [
	// 	  resolve(),
	// 	  typescript({
	// 		tsconfig: _tsconfig,
	// 	  }),
	// 	  terser(),
	// 	],
	// 	external: _externalDeps,
	//   })),
	// Bundle all TypeScript types into a single .d.ts file
	// {
	// 	input: `${_outputDir}/esm/index.d.ts`,
	// 	output: [
	// 		{
	// 			file: `${_outputDir}/umd/${_fileName}.umd.d.ts`,
	// 			// format: "es",
	// 			globals: _globalVariableMappings,
	// 			banner: `declare namespace ${_namespace} {`,
	// 			footer: `}
	// 		  declare module "${_npmModule}" { export=${_namespace};}
	// 		`,
	// 		},
	// 	],
	// 	plugins: [dts({compilerOptions: {declaration: false}})],
	// },
	{
		input: `${_outputDir}/esm/index.d.ts`,
		output: [
			{
				file: `${_outputDir}/umd/${_fileName}.umd.d.ts`,
				// format: "es",
				globals: _globalVariableMappings,
				banner: `declare namespace ${_namespace} {`,
				footer: `}
			  declare module "${_npmModule}" { export=${_namespace};}
			`,
			},
		],
		plugins: [dts({compilerOptions: {declaration: false}})],
	},
];
