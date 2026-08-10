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
    // Build and audit scripts walk the repository tree: every path they hand to
    // fs is derived from a constant in the script or from a directory listing
    // under it, never from external input. The security plugin cannot see that
    // distinction, so it fires on every readdirSync/statSync in the directory
    // walkers and on every lookup keyed by a discovered name.
    files: ["scripts/**/*.js", "scripts/**/*.mjs"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
];
