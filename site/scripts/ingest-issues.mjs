import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ISSUES_DIR = resolve(ROOT, '.issues');
const DATA_DIR = resolve(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = resolve(DATA_DIR, 'issues.json');

async function loadIssueFiles() {
  try {
    const entries = await readdir(ISSUES_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.html')
      .map((entry) => resolve(ISSUES_DIR, entry.name));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Missing .issues directory at ${ISSUES_DIR}`);
    }
    throw error;
  }
}

function deriveSlug(filePath) {
  return basename(filePath, '.html');
}

function extractTitle(root, fallback) {
  const titleEl = root.querySelector('title');
  if (titleEl && titleEl.text.trim()) {
    return titleEl.text.trim();
  }
  const heading = root.querySelector('h1');
  if (heading && heading.text.trim()) {
    return heading.text.trim();
  }
  return fallback;
}

function extractSummary(root) {
  const firstParagraph = root.querySelector('p');
  if (!firstParagraph) {
    return null;
  }
  const text = firstParagraph.text.trim().replace(/\\s+/g, ' ');
  if (text.length === 0) {
    return null;
  }
  return text.length > 200 ? `${text.slice(0, 197)}…` : text;
}

function extractPublishedOn(root) {
  const timeEl = root.querySelector('time[datetime]');
  if (timeEl) {
    return timeEl.getAttribute('datetime');
  }
  const metaDate = root.querySelector('meta[name=\"date\"]');
  if (metaDate && metaDate.getAttribute('content')) {
    return metaDate.getAttribute('content');
  }
  return null;
}

function inferDateFromSlug(slug) {
  const normalized = slug.replace(/-/g, ' ');
  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return null;
}

async function buildIssueRecord(filePath) {
  const html = await readFile(filePath, 'utf8');
  const dom = parse(html);
  const slug = deriveSlug(filePath);
  const publishedOn = extractPublishedOn(dom) ?? inferDateFromSlug(slug);
  const body = dom.querySelector('body');
  const contentHtml = body ? body.innerHTML : html;
  return {
    slug,
    title: extractTitle(dom, slug),
    summary: extractSummary(dom),
    content_html: contentHtml,
    published_on: publishedOn,
    year: publishedOn ? publishedOn.slice(0, 4) : null,
    source_path: `.issues/${basename(filePath)}`
  };
}

async function ingest() {
  const issueFiles = await loadIssueFiles();
  const issues = [];

  for (const filePath of issueFiles) {
    const record = await buildIssueRecord(filePath);
    issues.push(record);
  }

  issues.sort((a, b) => {
    if (a.published_on && b.published_on) {
      return a.published_on < b.published_on ? 1 : -1;
    }
    if (a.published_on) return -1;
    if (b.published_on) return 1;
    return a.slug < b.slug ? 1 : -1;
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify({ issues }, null, 2));
  console.log(`Ingested ${issues.length} issues to ${OUTPUT_FILE}`);
}

ingest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
