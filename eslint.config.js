import pluginSecurity from "eslint-plugin-security";

export default [
  pluginSecurity.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        caches: "readonly",
        self: "readonly",
        event: "readonly",
      },
    },
    rules: {},
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.mjs"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
];
