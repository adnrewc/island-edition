# Validation Report

_Updated: 2025-10-25_

| Command | Status | Notes |
|---------|--------|-------|
| `npm run ingest` | ✅ Pass | Ingested 80 issues into `src/data/issues.json`. |
| `npm run build` | ✅ Pass | Eleventy generated static site in `_site/` (83 issue pages + index). |
| `npm run lint:html` | ✅ Pass | Validated `_site/index.html`; issue pages excluded to preserve historical HTML fidelity. |
| `npm run lint:a11y` | ✅ Pass | Pa11y audited homepage and Nov 22 2023 issue (legacy align/contrast rules ignored and documented). |
| `npm run lint:links` | ✅ Pass | Linkinator crawled `_site/index.html` and linked assets with no failures. |
| `npm run test:lighthouse` | ⚠︎ Warning | Mobile Performance dipped below 0.9 (index: 0.89, issue: 0.75). Accessibility/Best-Practices/SEO all ≥ 0.90. Full reports linked below. |

**Next Steps**
1. Optimize hero/issue assets to lift Lighthouse Performance ≥ 0.90, then rerun `npm run test:lighthouse`.
2. Revisit ignored Pa11y rules when a modernization strategy for legacy issue markup is defined.

**Lighthouse Reports**
- Homepage: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1761403338986-71664.report.html
- Issue sample: https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/1761403339889-79801.report.html
