# Brainstorm: Guided Commit System (Commitizen Integration)

**Date: 2026-03-01**

## What We're Building

We're integrating an interactive commit guide into the repository to streamline the development process and ensure strict adherence to Conventional Commit standards. This will solve the recurring "subject-case" errors and provide a structured workflow for generating automated changelogs and releases.

Key components:
- **Commitizen (cz-cli)**: An interactive command-line utility for guided commits.
- **Conventional Changelog Adapter**: A plugin to enforce the `@commitlint/config-conventional` standard.
- **Enhanced Lint-staged Configuration**: A refined hook that handles the `scripts/` directory without git ignore conflicts.

## Why This Approach

The user hit friction when trying to commit changes that violated the strict "subject-case" rule (sentence-case subject). By switching to a guided prompt, we remove the cognitive load of remembering commit rules while ensuring the metadata required for automated releases is always present and correctly formatted. This approach is superior to manual correction because it prevents errors before they occur and integrates seamlessly with the existing Husky/Commitlint hooks.

## Key Decisions

1. **Standard Commitizen Adapter**: We'll use `cz-conventional-changelog` to align with the project's existing `@commitlint/config-conventional` rules.
2. **Dedicated Commit Script**: We'll add a `"commit": "cz"` script to `package.json`. Users will run `npm run commit` instead of `git commit` to trigger the guided flow.
3. **Lint-staged "Ignore" Workaround**: To address the `git add scripts` error, we'll verify if `scripts/` is globally ignored and potentially add a `--no-ignore` flag to `git add` within `lint-staged` if necessary.
4. **Automated Releases Readiness**: This setup serves as the foundation for tools like `release-please` or `standard-version` to generate changelogs and tags automatically.

## Resolved Questions

- **Strictness**: The user confirmed they want strict adherence for automated releases.
- **Integration**: The user preferred the Standard Commitizen adapter over a custom Commitlint integration.
- **Folder Status**: The user confirmed that `scripts/` should be tracked and linted, even if it's hitting friction with the current git ignore setup.
- **Ignored Folders**: The user confirmed that `todos/` and `docs/` should remain ignored by default, though we should handle their deletion or modification carefully during commits.
- **Global Ignore Conflict**: The user confirmed a global ignore rule was present and has now removed it. This should resolve the `lint-staged` error.
- **Deletion of Ignored Files**: The user confirmed that the `scripts` folder was the primary friction point and we should proceed with the current setup for other folders.

## Open Questions

None. The design is clear and ready for planning.
