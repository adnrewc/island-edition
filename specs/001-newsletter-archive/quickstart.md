# Quickstart: Island Edition Newsletter Archive

## Prerequisites
- Node.js 20.x
- npm 10.x
- Access to the existing `.issues/` HTML directory (already in repo root)

## Setup
1. `cd site`
2. `npm install`

## Local Development
1. Run the ingest script to generate Eleventy issue templates and metadata:
   ```bash
   npm run ingest
   ```
2. Start the Eleventy dev server with live reload:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:8080` to review the homepage and issue pages.

## Build
```bash
npm run build
```
Build output is emitted to `site/_site/`, ready for GitHub Pages deployment.

## Quality Gates (CI mirrors these)
```bash
npm run lint:html      # html-validate
npm run lint:a11y      # pa11y-ci
npm run lint:links     # linkinator with allowlist
npm run test:lighthouse
```

## Deployment
1. Push the branch; GitHub Actions workflow (`.github/workflows/ci.yml`) runs validations.
2. On merge to `main`, GitHub Pages deploys from the `site/_site/` artifact (or designated branch depending on Pages configuration).
3. Validate the live site against the performance budgets using the included Lighthouse job output.
