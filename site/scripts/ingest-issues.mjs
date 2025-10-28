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

function toIsoDate(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return parseDateString(trimmed);
}

async function loadSubjects() {
  try {
    const raw = await readFile(SUBJECTS_FILE, 'utf8');
    const entries = JSON.parse(raw);
    return entries
      .filter((entry) => entry && entry.subject)
      .map((entry) => {
        const isoDate = toIsoDate(entry.date);
        const time = isoDate ? Date.parse(isoDate) : Number.NaN;
        return {
          rawDate: entry.date,
          isoDate,
          time,
          subject: entry.subject
        };
      });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
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

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function assignSubjectsToIssues(issues, subjectEntries) {
  if (!Array.isArray(subjectEntries) || subjectEntries.length === 0) {
    return 0;
  }

  const available = subjectEntries
    .filter((entry) => entry.isoDate && !Number.isNaN(entry.time))
    .map((entry) => ({ ...entry, used: false }))
    .sort((a, b) => a.time - b.time);

  const datedIssues = issues
    .map((issue) => {
      if (!issue.published_on) {
        return null;
      }
      const time = Date.parse(issue.published_on);
      if (Number.isNaN(time)) {
        return null;
      }
      return { issue, time };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);

  let assigned = 0;

  for (const item of datedIssues) {
    const futureCandidates = available.filter(
      (entry) => !entry.used && entry.time >= item.time
    );
    const pastCandidates = available.filter(
      (entry) => !entry.used && entry.time < item.time
    );

    const pickBest = (candidates) => {
      let best = null;
      for (const entry of candidates) {
        const diff = Math.abs(entry.time - item.time);
        if (!best || diff < best.diff) {
          best = { entry, diff };
          if (diff === 0) {
            break;
          }
        }
      }
      return best;
    };

    const best = pickBest(futureCandidates) ?? pickBest(pastCandidates);

    if (best) {
      const maxDiff = 5 * DAY_IN_MS;
      if (best.diff <= maxDiff) {
        item.issue.title = best.entry.subject;
        best.entry.used = true;
        assigned += 1;
      }
    }
  }

  return assigned;
}

function looksAutoGenerated(title, fallback) {
  if (!title) {
    return true;
  }
  if (fallback && title === fallback) {
    return true;
  }
  if (/[_]/.test(title) || /^\d/.test(title)) {
    return true;
  }
  return /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(title);
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function createSummaryFallback(issue) {
  if (issue.summary) {
    const cleaned = issue.summary.replace(/\s+/g, ' ').trim();
    if (cleaned) {
      const firstSentenceMatch = cleaned.match(/.*?(?:[.!?](?=\s)|$)/);
      if (firstSentenceMatch) {
        const sentence = firstSentenceMatch[0].trim();
        if (sentence && !looksAutoGenerated(sentence)) {
          return truncate(sentence, 90);
        }
      }
    }
  }

  if (issue.content_html) {
    const headingMatch = issue.content_html.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (headingMatch) {
      const text = headingMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text && !looksAutoGenerated(text)) {
        return truncate(text, 90);
      }
    }
  }

  return null;
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
  const subjectEntries = await loadSubjects();

  for (const filePath of issueFiles) {
    const record = await buildIssueRecord(filePath);
    issues.push(record);
  }

  assignSubjectsToIssues(issues, subjectEntries);

  for (const record of issues) {
    if (looksAutoGenerated(record.title, record.slug)) {
      const summaryFallback = createSummaryFallback(record);
      if (summaryFallback) {
        record.title = summaryFallback;
      } else {
        const formatted = formatDateTitle(record.published_on);
        if (formatted) {
          record.title = formatted;
        }
      }
    }
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
