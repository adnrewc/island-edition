# Data Model: Island Edition Newsletter Archive

## NewsletterIssue
- **Description**: Represents a single newsletter issue displayed in the archive.
- **Fields**:
  - `slug` (string, required): URL-friendly identifier derived from filename (e.g., `wednesday-november-22-2023`).
  - `title` (string, required): Issue headline extracted from the HTML `<title>` or main heading.
  - `published_on` (ISO date string, required): Publication date surfaced on issue pages.
  - `summary` (string, optional): Short teaser text used in archive listings (first paragraph fallback).
  - `content_html` (string, required): Sanitized body HTML rendered from `.issues/` source.
  - `hero_image` (string, optional): Path to hero image optimized for the archive design.
  - `source_path` (string, required): Relative path to the original `.issues/` file for auditability.
  - `link_health_notes` (array of strings, optional): Documented exceptions for known-dead outbound links.

## ArchiveIndex
- **Description**: Aggregated collection powering the homepage archive list.
- **Fields**:
  - `issues` (array<NewsletterIssue>, required): Issues sorted descending by `published_on`.
  - `total_count` (integer, required): Number of issues displayed.
  - `groupings` (array of objects, optional): Year or thematic buckets for optional filtering (`{ label, issues }`).

## SiteMeta
- **Description**: Global metadata used for SEO and templating.
- **Fields**:
  - `site_title` (string, required): Displayed in `<title>` and headers (e.g., "Island Edition Archive").
  - `tagline` (string, required): Supporting statement in hero section.
  - `description` (string, required): Meta description summarizing Island Edition history.
  - `author` (object, required):
    - `name` (string): "Andrew Chisholm".
    - `bio` (string): Short bio for structured data.
  - `timeline` (object, required):
    - `launch_year` (integer): 2022.
    - `sunset_month_year` (string): "November 2023".
    - `sunset_reason` (string): Narrative for homepage.
  - `social_image` (string, optional): OG/Twitter card image path.

## NavigationLink
- **Description**: Link metadata for primary navigation.
- **Fields**:
  - `label` (string, required): Link text.
  - `href` (string, required): URL path.
  - `aria_label` (string, optional): Accessibility label for assistive tech.
  - `is_external` (boolean, optional): Marks links opening in new tabs (e.g., social profiles).
