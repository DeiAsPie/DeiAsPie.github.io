---
title: "feat: Automated Task Completion Audit"
type: feat
status: completed
date: 2026-03-01
---

# feat: Automated Task Completion Audit

## Overview

This plan outlines the creation of a Node.js script to automatically audit the implementation status of features and bug fixes tracked in `docs/plans/` and `docs/brainstorms/`. It will verify that all planned tasks (Acceptance Criteria) have been completed and that the plan's overall status reflects the actual progress.

## Problem Statement / Motivation

Currently, task completion is tracked manually via Markdown checkboxes and status fields in YAML front matter. There is no automated way to ensure that a plan marked as "completed" actually has all its tasks checked off, or to identify which "active" plans are stalled or partially implemented. This can lead to undocumented "dark debt" or forgotten requirements.

## Proposed Solution

A new script, `scripts/check_task_completion.js`, will be implemented to:
1.  Scan the `docs/plans/` and `docs/brainstorms/` directories (even if git-ignored).
2.  Parse the YAML front matter using `gray-matter`.
3.  Extract and count total and completed Markdown checkboxes (`- [ ]`, `- [x]`).
4.  Report discrepancies, such as:
    -   Plans marked as `completed` with unchecked boxes.
    -   Plans marked as `active` with 0% progress (potential stalls).
    -   Brainstorms that have not been promoted to a plan or implemented.
5.  Integrate this audit into the `npm run lint:content` or a new `npm run audit:tasks` command.

## Technical Considerations

-   **Parsing**: Use `gray-matter` for front matter and a robust regex (or a lightweight markdown parser) for checkbox extraction.
-   **File Discovery**: Use `glob` or `fs.readdirSync` with explicit path handling, as these directories are in `.gitignore`.
-   **Reporting**: Provide a clean, tabular summary of status across all tracked items.
-   **Verification**: (Optional/Future) Search the source tree for references to plan titles or unique IDs to confirm implementation.

## System-Wide Impact

-   **Interaction graph**: This is a standalone maintenance script. It interacts with the filesystem but does not affect the Hugo site build or production behavior.
-   **Error propagation**: The script should exit with a non-zero code if it finds "completed" plans with "incomplete" tasks in a CI environment.
-   **State lifecycle risks**: No persistent state; it performs a read-only audit of documentation.
-   **API surface parity**: N/A.
-   **Integration test scenarios**: Test against a set of mock plans with varying completion levels and statuses.

## Acceptance Criteria

- [x] New script `scripts/check_task_completion.js` created.
- [x] Correctly parses `status` from `docs/plans/*.md`.
- [x] Correctly counts `- [x]` vs `- [ ]` in "Acceptance Criteria" or "Phases" sections.
- [x] Identifies plans marked `completed` but having `[ ]` (unchecked boxes).
- [x] Summarizes completion percentage for `active` plans.
- [x] New `npm run audit:tasks` script added to `package.json`.
- [x] Script provides a clear, high-signal output to stdout.

## Success Metrics

-   Elimination of "completed" plans that have forgotten/unchecked tasks.
-   Faster identification of stalled projects.

## Dependencies & Risks

-   **Dependency**: `gray-matter` (already present in the project).
-   **Risk**: If developers use highly non-standard formatting for checkboxes, the parser might miss them.

## Sources & References

-   **Institutional Patterns**: `scripts/check_content_quality.js` (existing validation logic).
-   **Documentation**: `docs/plans/` directory structure.
-   **Best Practices**: Automated auditing of documentation-as-code.
