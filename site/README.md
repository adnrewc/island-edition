# Island Edition Archive Site

This project builds the static Island Edition newsletter archive using Eleventy and the shared constitution quality gates.

## Prerequisites

- Node.js 20.x
- npm 10.x
- Source newsletter HTML files in `.issues/`

## Install

```bash
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run ingest` | Parse `.issues/` HTML into Eleventy-ready data/templates |
| `npm run dev` | Run Eleventy dev server with live reload (includes ingest) |
| `npm run build` | Generate production static site into `_site/` |
| `npm run lint:html` | Validate rendered HTML with html-validate |
| `npm run lint:a11y` | Run pa11y-ci accessibility suite |
| `npm run lint:links` | Scan for broken links with linkinator |
| `npm run test:lighthouse` | Execute Lighthouse CI profile |

## Quality Gates

1. Run `npm run build`
2. Execute `npm run lint:html`
3. Execute `npm run lint:a11y`
4. Execute `npm run lint:links`
5. Run `npm run test:lighthouse`

All gates must pass before deploying to GitHub Pages.
