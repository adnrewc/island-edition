---
description: "Task list for Island Edition newsletter archive implementation"
---

# Tasks: Island Edition Newsletter Archive

**Input**: Design artifacts from `/specs/001-newsletter-archive/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/site-structure.md  
**Tests**: Automated validators mandated by constitution (html-validate, pa11y-ci, linkinator, Lighthouse CI)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Eleventy project scaffolding, tooling, and documentation required for all subsequent work.

- [X] T001 Bootstrap Eleventy project dependencies and npm scripts in site/package.json
- [X] T002 Create Eleventy configuration entry point with passthrough copy defaults in site/.eleventy.js
- [X] T003 Document local setup and quality gates aligned with quickstart in site/README.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared data ingestion, layouts, design tokens, and CI tooling. All user stories depend on this phase.

- [X] T004 Implement newsletter ingest script to parse `.issues/*.html` into structured metadata in site/scripts/ingest-issues.mjs
- [X] T005 Generate Eleventy issues collection data file consumed by templates in site/src/data/issues.json
- [X] T006 [P] Create shared design tokens (colors, typography, spacing) in site/src/assets/css/tokens.css
- [X] T007 [P] Compose global base stylesheet with resets and typography scale in site/src/assets/css/base.css
- [X] T008 Build base layout with semantic shell, navigation slots, and footer in site/src/layouts/base.njk
- [X] T009 Author primary navigation component leveraging Eleventy Navigation plugin in site/src/includes/components/site-nav.njk
- [X] T010 Define SEO helper macros for meta tags and JSON-LD in site/src/includes/macros/seo.njk
- [X] T011 Configure HTML validity ruleset enforcing constitution gates in tests/html/html-validate.config.cjs
- [X] T012 Configure accessibility scenarios for homepage and issue sample in tests/accessibility/pa11y-ci.json
- [X] T013 Configure link checker with archive-safe allowlist in tests/links/linkinator.config.json
- [X] T014 Create CI workflow running ingest, build, validators, and Lighthouse in .github/workflows/ci.yml

---

## Phase 3: User Story 1 - Learn About Island Edition (Priority: P1) 🎯 MVP

**Goal**: Deliver a homepage that tells the Island Edition story (launch, mission, sunset) with blue visual identity.  
**Independent Test**: Load `/` locally; hero section communicates purpose, timeline, and retirement rationale; layout remains accessible and legible on mobile.

### Implementation for User Story 1

- [X] T015 [US1] Create site metadata data file with mission and timeline narrative in site/src/data/site.json
- [X] T016 [P] [US1] Build hero component with headline, CTA, and background styling in site/src/includes/components/hero.njk
- [X] T017 [US1] Assemble homepage content sections (hero, story, timeline) using base layout in site/src/pages/index.njk
- [X] T018 [P] [US1] Add responsive homepage styles extending tokens in site/src/assets/css/home.css
- [X] T019 [US1] Inject WebSite JSON-LD and meta tags for homepage SEO in site/src/pages/index.njk

---

## Phase 4: User Story 2 - Browse the Archive (Priority: P1)

**Goal**: Provide a chronological archive index with publication dates and teasers.  
**Independent Test**: From `/`, visitors can scroll the archive list, read titles/dates, and click into any issue.

### Implementation for User Story 2

- [X] T020 [US2] Extend ingest script to capture summaries and chronological sorting in site/scripts/ingest-issues.mjs
- [X] T021 [P] [US2] Create archive list component grouping issues by year in site/src/includes/components/archive-list.njk
- [X] T022 [US2] Render archive index beneath hero with accessible headings in site/src/pages/index.njk
- [X] T023 [P] [US2] Style archive cards and responsive grid in site/src/assets/css/archive.css
- [X] T024 [US2] Embed structured data (CollectionPage/BreadcrumbList) for archive section in site/src/pages/index.njk

---

## Phase 5: User Story 3 - Read an Archived Issue (Priority: P2)

**Goal**: Present each issue with publication date, disclaimer, and faithful newsletter content.  
**Independent Test**: Opening `/issues/{slug}/` shows date + disclaimer above original content; layout matches brand on desktop and mobile.

### Implementation for User Story 3

- [X] T025 [US3] Create issue layout with base shell, breadcrumb, and metadata slots in site/src/layouts/issue.njk
- [X] T026 [P] [US3] Implement reusable disclaimer component with note semantics in site/src/includes/components/disclaimer.njk
- [X] T027 [US3] Update ingest script to derive publication dates from filenames/front matter in site/scripts/ingest-issues.mjs
- [X] T028 [US3] Generate issue templates looping Eleventy collection output in site/src/issues/issue.njk
- [X] T029 [P] [US3] Add issue-specific typography and disclaimer styling in site/src/assets/css/issue.css
- [X] T030 [US3] Add canonical tags, social previews, and prev/next navigation in site/src/layouts/issue.njk

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Optimize performance, finalize SEO artifacts, and validate constitutional quality gates.

- [X] T031 Add Eleventy transforms for HTML minification and preload hints in site/.eleventy.js
- [X] T032 Generate sitemap and RSS feed templates for crawlers in site/src/pages/sitemap.njk
- [X] T033 Document known broken link exceptions captured during linkinator runs in tests/links/allowlist.json
- [X] T034 Run ingest, build, and validation scripts; capture results in docs/validation.md

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup → Foundational → User Story 1 → User Story 2 → User Story 3 → Polish (sequential for major milestones)

### User Story Dependencies
- User Story 1 (P1): Depends on Foundational assets; unlocks homepage narrative
- User Story 2 (P1): Depends on User Story 1 for shared homepage structure but can proceed in parallel once hero finalized
- User Story 3 (P2): Depends on ingest enhancements from Phases 2 and 4

### Within Each User Story
- Create/extend data sources before templating
- Template updates precede styling
- Styling can proceed in parallel once markup stable ([P] tasks)
- Meta/SEO enhancements follow content structure

---

## Parallel Execution Examples

```bash
# After Phase 2, run in parallel:
Task T016 (hero component) alongside T018 (responsive styles)

# During archive build:
Task T021 (archive component) alongside T023 (archive styles)

# During issue work:
Task T026 (disclaimer component) alongside T029 (issue styling)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup and Foundational phases.
2. Deliver homepage narrative (US1) and validate automated gates.
3. Deploy to share the Island Edition story even before archive pages are ready.

### Incremental Delivery
1. Merge MVP homepage.
2. Add archive listings (US2) and redeploy.
3. Finish issue detail experience (US3) and redeploy.

### Parallel Team Strategy
1. One contributor finalizes ingest/data pipeline while another builds hero components (post-Phase 2).
2. Split archive UI (T021–T023) and SEO enhancements (T024) across teammates.
3. Work disclaimers/styling (T026, T029) in parallel with metadata work (T030) for issue pages.
