import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
	rules: {
		"@typescript-eslint/no-unused-expressions": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-explicit-any": "off"
	}
  }
];