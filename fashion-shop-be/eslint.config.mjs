import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["{src,prisma}/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {},
  },
];
