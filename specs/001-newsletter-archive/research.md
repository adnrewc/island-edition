# Research: Island Edition Newsletter Archive

## Decision: Eleventy for Static Site Generation
- **Rationale**: Eleventy outputs plain HTML/CSS suited for GitHub Pages, supports custom collections from the `.issues/` directory, and allows layout reuse aligned with the constitution's simplicity requirement.
- **Alternatives Considered**:
  - **Jekyll**: Native to GitHub Pages but harder to script custom HTML ingestion without Ruby plugins and would require Ruby toolchain.
  - **Astro**: Powerful component model but introduces more JavaScript tooling than necessary and risks exceeding static simplicity.

## Decision: Ingest Script to Build Issue Metadata
- **Rationale**: A dedicated Node script can parse each `.issues/*.html`, extract titles and inferred publication dates, and write front matter files consumed by Eleventy while leaving originals untouched (supporting archive integrity).
- **Alternatives Considered**:
  - **Manual front matter editing**: Error-prone for ~60 issues and increases maintenance burden.
  - **Runtime parsing in Eleventy templates**: Adds per-build complexity and makes metadata reuse harder across layouts or JSON APIs.

## Decision: Design System with CSS Custom Properties
- **Rationale**: Centralized tokens (colors, typography scale, spacing) ensure consistent blue theming and WCAG AA contrast compliance, satisfying the accessibility principle.
- **Alternatives Considered**:
  - **Utility framework (Tailwind)**: Speeds styling but bloats build tooling and risks unused CSS if purge misconfigured.
  - **Inline styles per page**: Violates consistency principle and complicates future updates.

## Decision: Automated Quality Gates
- **Rationale**: Combining html-validate, pa11y-ci, and linkinator in CI enforces the constitution's testable publishing pipeline, while Lighthouse CI checks performance budgets.
- **Alternatives Considered**:
  - **Manual QA only**: Cannot satisfy mandatory automated checks.
  - **Single combined validator**: No single tool covers HTML validity, accessibility, links, and performance simultaneously.

## Decision: SEO Enhancements via Structured Data & Sitemaps
- **Rationale**: Adding JSON-LD for articles, meta descriptions, and an automatically generated sitemap improves discoverability and meets spec's SEO requirement.
- **Alternatives Considered**:
  - **Basic meta tags only**: Provides minimal SEO benefit and misses search enhancements such as timeline snippets.
  - **Server-side rendering with dynamic schema**: Conflicts with static hosting constraint.
