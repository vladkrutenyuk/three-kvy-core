import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import dts from "rollup-plugin-dts";

const _namespace = "KVY"; // Название неймспейса, используемого в UMD и d.ts
const _tsInput = "src/index.ts"; // Входной файл для сборки
const _fileName = "kvy"; // Базовое имя для всех файлов сборки
const _npmModule = "@vladkrutenyuk/game-world"; // Базовое имя для всех файлов сборки
const _outputDir = "dist"; // Директория для всех файлов сборки
const _externalDeps = ["three"]; // Внешние зависимости
const _globalVariableMappings = {
	three: "THREE", // Глобальная переменная для 'three'
};
const _tsconfig = "./tsconfig.build.json";

export default [
	// ESM Configuration (non-minified)
	{
		input: _tsInput,
		output: {
			file: `${_outputDir}/esm/index.js`,
			format: "esm",
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig: _tsconfig,
				declaration: true,
				declarationDir: `${_outputDir}`,
				emitDeclarationOnly: true, // Сборка только деклараций
			}),
		],
		external: _externalDeps,
	},
	// ESM Configuration (minified)
	{
		input: _tsInput,
		output: {
			file: `${_outputDir}/esm/index.min.js`,
			format: "esm",
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig: _tsconfig,
				declaration: false,
				emitDeclarationOnly: false,
			}),
			terser(),
		],
		external: _externalDeps,
	},
	// UMD Configuration (non-minified)
	{
		input: _tsInput,
		output: {
			file: `${_outputDir}/umd/${_fileName}.umd.js`,
			format: "umd",
			name: _namespace,
			globals: _globalVariableMappings,
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig: _tsconfig,
				declaration: false, // Убедитесь, что декларации типов не генерируются здесь
				emitDeclarationOnly: false,
			}),
		],
		external: _externalDeps,
	},
	// UMD Configuration (minified)
	{
		input: _tsInput,
		output: {
			file: `${_outputDir}/umd/${_fileName}.umd.min.js`,
			format: "umd",
			name: _namespace,
			globals: _globalVariableMappings,
		},
		plugins: [
			resolve(),
			typescript({
				tsconfig: _tsconfig,
				declaration: false,
				emitDeclarationOnly: false,
			}),
			terser(),
		],
		external: _externalDeps,
	},
	// Bundle all TypeScript types into a single .d.ts file
	{
		input: `${_outputDir}/esm/index.d.ts`,
		output: [
			{
				file: `${_outputDir}/umd/${_fileName}.umd.d.ts`,
				format: "es",
				globals: _globalVariableMappings,
				banner: `declare namespace ${_namespace} {`,
				footer: `}
			  declare module "${_npmModule}" { export=${_namespace};}
			`,
			},
		],
		plugins: [dts()],
	},
];
