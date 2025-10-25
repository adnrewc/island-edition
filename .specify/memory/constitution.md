<!--
Sync Impact Report
Version change: N/A -> 1.0.0
Modified principles: Added initial five core principles
Added sections: Archive Content Standards, Quality & Testing Workflow
Removed sections: None
Templates requiring updates:
- OK .specify/templates/plan-template.md - Constitution Check aligns with principles
- OK .specify/templates/spec-template.md - Requirements structure supports UX/testing mandates
- OK .specify/templates/tasks-template.md - Task phases cover testing and UX obligations
Follow-up TODOs: None
-->

# Island Edition Constitution

## Core Principles

### I. Static Site Simplicity
Island Edition MUST remain a pure static site compatible with GitHub Pages. Author content in HTML, Markdown, or JSON that can be transformed without server-side runtimes. Build steps MAY use tooling locally, but the published output MUST be static assets that load without client-side bundlers or frameworks dependent on Node services at run time.

### II. Archived Content Integrity
The archive MUST faithfully represent the original newsletters. Preserve wording, typography, and embedded media references unless broken assets jeopardize accessibility. Any edits for clarity or layout MUST be documented in commit messages. Every newsletter page MUST surface its original publication date and include a disclaimer that outbound links may no longer work.

### III. Testable Publishing Pipeline
Every change to the site MUST include automated checks: HTML validation, accessibility linting for new templates, and link integrity scans with explicit allow-lists for known historical dead links. Tests MUST run via GitHub Actions on pull requests before merge. Manual spot checks MAY supplement automation but never replace required validations.

### IV. Consistent & Accessible Experience
Main and issue pages MUST share a consistent visual system: reused typography scale, color palette with WCAG AA contrast, and responsive layouts for mobile and desktop. Navigation MUST expose the project overview, archive index, and individual issues with accessible link text. Any interactive elements MUST be keyboard accessible and screen-reader friendly.

### V. Performance & Hosting Discipline
The site MUST respect free GitHub Pages limits: keep total bundle size minimal, optimize images (<= 500 KB per image where possible), and avoid blocking scripts. Pages MUST achieve a Lighthouse performance score >= 90 on mobile using GitHub Pages hosting. Preload critical CSS and defer non-essential assets to preserve fast first render times.

## Archive Content Standards

The homepage MUST explain Island Edition's purpose, launch date, end date, and reason for pausing distribution in the opening section, followed by a chronologically ordered archive index. Archive listings MUST include issue titles, publication dates, and lead-in descriptions where available. Individual issue pages MUST place the publication date and link disclaimer ahead of the original content. Store original HTML sources in `.issues/` and render published versions into the site's `issues/` directory so the historical snapshot is retained alongside the public copy.

## Quality & Testing Workflow

All work MUST follow a branch-based workflow with peer review or self-review checklists referencing this constitution. Pull requests MUST document how code quality, UX consistency, and performance budgets were validated. CI MUST run html5validator (or equivalent), accessibility audits (e.g., pa11y), and link checkers with retry logic for transient failures. After deployment, spot-test the GitHub Pages site to confirm uploads preserve typography, navigation, and page metadata.

## Governance

This constitution supersedes conflicting guidance within the repository. Amendments require consensus during a documented review and MUST include updates to supporting templates or checklists. Constitution changes follow semantic versioning: MAJOR for removals or redefinitions, MINOR for added principles or directives, PATCH for clarifications. Compliance reviews occur at project kick-off, before merging sizeable features, and during quarterly maintenance cadences. Non-compliance blocks merges until resolved or an exception is recorded with remediation steps and deadlines.

**Version**: 1.0.0 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
