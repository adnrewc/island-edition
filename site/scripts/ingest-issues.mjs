import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { resolve, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const ISSUES_DIR = resolve(ROOT, '.issues');
const DATA_DIR = resolve(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = resolve(DATA_DIR, 'issues.json');
const SUBJECTS_FILE = resolve(DATA_DIR, 'subjects.json');

const MONTH_PATTERN =
  /(january|february|march|april|may|june|july|august|september|october|november|december)/i;

function parseDateString(candidate) {
  if (!candidate) return null;
  const normalized = candidate
    .replace(/\u00a0/g, ' ')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const lowercased = normalized.toLowerCase();
  const replacements = [
    ['sept', 'september'],
    ['sep', 'september'],
    ['jan', 'january'],
    ['feb', 'february'],
    ['mar', 'march'],
    ['apr', 'april'],
    ['aug', 'august'],
    ['oct', 'october'],
    ['nov', 'november'],
    ['dec', 'december']
  ];
  let working = lowercased;
  for (const [abbr, full] of replacements) {
    working = working.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
  }
  const match = working.match(
    new RegExp(`${MONTH_PATTERN.source}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,)?\\s+\\d{4}`, 'i')
  );
  if (!match) {
    return null;
  }
  const cleaned = match[0].replace(/(st|nd|rd|th)/gi, '').replace(/,/g, '');
  const parsed = Date.parse(cleaned);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

async function loadSubjects() {
  try {
    const raw = await readFile(SUBJECTS_FILE, 'utf8');
    const entries = JSON.parse(raw);
    return new Map(
      entries
        .filter((entry) => entry.date && entry.subject)
        .map((entry) => [entry.date, entry.subject])
    );
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Map();
    }
    throw error;
  }
}

function formatDateTitle(isoDate) {
  if (!isoDate) return null;
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

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
  const titleEl = root.querySelector('title');
  if (titleEl) {
    const parsed = parseDateString(titleEl.text);
    if (parsed) {
      return parsed;
    }
  }
  const heading = root.querySelector('h1');
  if (heading) {
    const parsed = parseDateString(heading.text);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

function inferDateFromSlug(slug) {
  const trimmed = slug.replace(/^\d+_?/, '');
  return parseDateString(trimmed);
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
  const subjects = await loadSubjects();

  for (const filePath of issueFiles) {
    const record = await buildIssueRecord(filePath);
    if (record.published_on && subjects.has(record.published_on)) {
      record.title = subjects.get(record.published_on);
    } else {
      const looksAuto =
        !record.title ||
        record.title === record.slug ||
        /[_]{1,}/.test(record.title) ||
        /^\d/.test(record.title);
      if (looksAuto) {
        const formatted = formatDateTitle(record.published_on);
        if (formatted) {
          record.title = formatted;
        }
      }
    }
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

  const groupedMap = new Map();
  for (const issue of issues) {
    const key = issue.year || 'Undated';
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key).push(issue);
  }

  const groups = Array.from(groupedMap.entries())
    .sort(([yearA], [yearB]) => {
      const numericA = Number.parseInt(yearA, 10);
      const numericB = Number.parseInt(yearB, 10);
      if (Number.isNaN(numericA) && Number.isNaN(numericB)) {
        return 0;
      }
      if (Number.isNaN(numericA)) {
        return 1;
      }
      if (Number.isNaN(numericB)) {
        return -1;
      }
      return numericB - numericA;
    })
    .map(([year, items]) => ({ year, items }));

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify({ issues, groups }, null, 2));
  console.log(`Ingested ${issues.length} issues to ${OUTPUT_FILE}`);
}

ingest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
