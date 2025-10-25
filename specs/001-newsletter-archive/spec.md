# Feature Specification: Island Edition Newsletter Archive

**Feature Branch**: `001-newsletter-archive`  
**Created**: 2025-10-25  
**Status**: Draft  
**Input**: User description: "Build static pages for email newsletter archive for Island Edition, which was a weekly email newsletter launched in 2022 by Andrew Chisholm, and ran until November 2023. The main page should be attractive, trying to align with the colours and layout of the later issues of the newsletter (blue). The pages should be SEO optimized. Each issue, as stated in the constitution, needs to updated to include the publication date and a disclaimer that it's archive copy and some links may be broken."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn About Island Edition (Priority: P1)

A curious visitor lands on the homepage to understand what Island Edition was, why it existed, and why it ended.

**Why this priority**: Clear storytelling on the homepage establishes credibility and context for the archive.

**Independent Test**: Load the homepage and confirm the hero section explains the newsletter timeline, mission, and closing rationale without requiring navigation elsewhere.

**Acceptance Scenarios**:

1. **Given** a new visitor on the homepage, **When** they read the hero and overview sections, **Then** they learn when Island Edition ran, what it covered, and why it stopped.
2. **Given** a new visitor on the homepage, **When** they scan the page on mobile, **Then** the copy and layout remain readable and aligned with the blue visual identity.

---

### User Story 2 - Browse the Archive (Priority: P1)

A reader wants to skim the list of past issues and pick one aligned with their interests or timeframe.

**Why this priority**: The archive list is the core purpose of the site and must be accessible immediately.

**Independent Test**: From the homepage, click through archive entries and confirm the list is chronological, clickable, and SEO-friendly with structured metadata.

**Acceptance Scenarios**:

1. **Given** the homepage archive section, **When** a visitor scrolls through the list, **Then** each issue displays a title, publication date, and short summary (if available) with consistent styling.
2. **Given** the archive list, **When** a visitor clicks an issue link, **Then** they navigate to the corresponding issue page with the correct content.

---

### User Story 3 - Read an Archived Issue (Priority: P2)

A returning subscriber opens a specific issue to revisit the original content and understand any caveats about link freshness.

**Why this priority**: Issue pages must preserve historic accuracy while setting expectations about link validity.

**Independent Test**: Open any issue page and confirm the original newsletter content renders correctly, the publication date is visible, and the broken-link disclaimer appears near the top.

**Acceptance Scenarios**:

1. **Given** an archived issue page, **When** it loads, **Then** the publication date appears above the newsletter content in human-readable format.
2. **Given** an archived issue page, **When** a reader views the header, **Then** they see a disclaimer explaining that outbound links may no longer work.

---

### Edge Cases

- Archive entry exists without a summary: display title and date only while maintaining layout spacing.
- Issue source HTML contains broken or insecure links: show disclaimer but allow the content to render without blocking the page.
- Issue lacks explicit publication date metadata: fall back to filename or directory naming, flag in content management notes.
- Homepage or issue page viewed on narrow screens (<360px wide): layout stacks gracefully without horizontal scrolling.
- Search engine crawlers hitting the site: metadata and sitemap still reference canonical static URLs without query parameters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST provide a homepage hero section summarizing Island Edition's origin (2022), conclusion (November 2023), and reason for winding down.
- **FR-002**: The homepage MUST display a chronological archive index listing every newsletter issue with title, publication date, and optional teaser copy.
- **FR-003**: Each issue page MUST prepend the original publication date and an archive disclaimer stating that links may be outdated or broken.
- **FR-004**: The site MUST preserve the original newsletter HTML content while updating styling to match the refreshed visual system.
- **FR-005**: All pages MUST be optimized for SEO with descriptive titles, meta descriptions, structured data where appropriate, and accessible semantic markup.
- **FR-006**: The build pipeline MUST generate static assets compatible with GitHub Pages and produce a sitemap plus robots directives for indexing.
- **FR-007**: Automated checks MUST validate HTML, accessibility, and link status with allowances for historically dead links noted in reports.

### Key Entities *(include if feature involves data)*

- **NewsletterIssue**: Represents a single archived issue with attributes: title, publication date, summary excerpt (optional), original HTML body, canonical slug, and link health notes.
- **ArchiveListing**: Collection structure used on the homepage containing ordered `NewsletterIssue` references plus pagination or grouping metadata if needed.
- **SiteMetadata**: Global attributes for SEO and storytelling, including site title, description, social preview imagery, author information, and timeline milestones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of archived issue pages display the publication date and disclaimer above the fold in both desktop and mobile views.
- **SC-002**: Lighthouse audits on the published GitHub Pages site score >= 90 for Performance, Accessibility, Best Practices, and SEO.
- **SC-003**: Link checking reports list zero unacknowledged broken links (all failures either fixed or documented with acceptable historical exceptions).
- **SC-004**: Organic search impressions for branded keywords ("Island Edition newsletter", "Island Edition archive") increase by at least 50% within three months of launch compared to baseline.
- **SC-005**: User testing with at least five participants finds that 100% can identify the newsletter's purpose and navigate to a chosen issue within 30 seconds.
