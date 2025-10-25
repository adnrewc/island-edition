#!/usr/bin/env node

/**
 * Cache remote images referenced in `.issues/*.html` locally and rewrite the
 * HTML files to point at the cached copies. This guarantees the archive
 * remains self-contained.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const ISSUES_DIR = path.resolve(ROOT, '.issues');
const ASSET_ROOT = path.resolve(ROOT, 'site', 'src', 'assets', 'images', 'issues');
const MANIFEST_PATH = path.resolve(ROOT, 'site', 'scripts', 'image-cache-manifest.json');

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function encodeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function loadManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function saveManifest(manifest) {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function extensionFromContentType(contentType) {
  if (!contentType) return '';
  const [type, subtype] = contentType.split('/');
  if (type !== 'image' || !subtype) return '';
  const cleanSubtype = subtype.split(';')[0];
  if (!cleanSubtype) return '';
  if (cleanSubtype === 'jpeg') return '.jpg';
  return `.${cleanSubtype}`;
}

async function downloadImage(remoteUrl, destDir, baseName) {
  const response = await fetch(remoteUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Failed to download ${remoteUrl}: ${response.status} ${response.statusText}`);
  }

  let ext = path.extname(baseName);
  let nameWithoutExt = ext ? baseName.slice(0, -ext.length) : baseName;
  if (!nameWithoutExt) {
    nameWithoutExt = 'image';
  }

  if (!ext) {
    ext = extensionFromContentType(response.headers.get('content-type')) || '.img';
  }

  await mkdir(destDir, { recursive: true });

  let candidateName = `${nameWithoutExt}${ext}`;
  let candidatePath = path.join(destDir, candidateName);
  let counter = 1;
  while (await fileExists(candidatePath)) {
    candidateName = `${nameWithoutExt}-${counter}${ext}`;
    candidatePath = path.join(destDir, candidateName);
    counter += 1;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(candidatePath, buffer);

  return candidatePath;
}

async function ensureLocalAsset(remoteUrl, slug, manifest) {
  const existing = manifest[remoteUrl];
  if (existing) {
    const filePath = path.resolve(ROOT, 'site', existing.localPath.replace(/^\/+/, ''));
    if (await fileExists(filePath)) {
      return existing.localPath;
    }
  }

  const urlObj = new URL(remoteUrl);
  const originalName = path.basename(urlObj.pathname).split('?')[0];
  const baseName = originalName || 'image';
  const destDir = path.join(ASSET_ROOT, slug);

  let downloadedPath;
  try {
    downloadedPath = await downloadImage(remoteUrl, destDir, baseName);
  } catch (error) {
    console.warn(`[cache-images] Failed to download ${remoteUrl}: ${error.message}`);
    return remoteUrl;
  }

  const finalFileName = path.basename(downloadedPath);
  const localPath = `/assets/images/issues/${slug}/${finalFileName}`;

  manifest[remoteUrl] = {
    localPath,
    fetchedAt: new Date().toISOString()
  };

  return localPath;
}

async function processIssue(fileName, manifest) {
  const filePath = path.join(ISSUES_DIR, fileName);
  const slug = path.basename(fileName, path.extname(fileName));
  const html = await readFile(filePath, 'utf8');

  const attrRegex = /src\s*=\s*(['"])([^'"]+)\1/gi;
  const matches = [];
  let match;
  while ((match = attrRegex.exec(html)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      quote: match[1],
      rawValue: match[2],
      fullMatch: match[0]
    });
  }

  if (!matches.length) {
    return false;
  }

  let updated = false;
  let lastIndex = 0;
  const output = [];

  for (const item of matches) {
    output.push(html.slice(lastIndex, item.start));
    const decoded = decodeHtml(item.rawValue);
    if (!/^https?:\/\//i.test(decoded)) {
      output.push(item.fullMatch);
      lastIndex = item.end;
      continue;
    }

    const localPath = await ensureLocalAsset(decoded, slug, manifest);
    if (localPath !== decoded) {
      updated = true;
    }
    const encodedLocal = encodeHtml(localPath);
    output.push(`src=${item.quote}${encodedLocal}${item.quote}`);
    lastIndex = item.end;
  }

  output.push(html.slice(lastIndex));

  if (updated) {
    await writeFile(filePath, output.join(''), 'utf8');
  }

  return updated;
}

async function run() {
  const manifest = await loadManifest();
  const entries = await readdir(ISSUES_DIR, { withFileTypes: true });
  const htmlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.html'));

  let updatedCount = 0;
  for (const entry of htmlFiles) {
    const updated = await processIssue(entry.name, manifest);
    if (updated) {
      updatedCount += 1;
      console.log(`[cache-images] Updated ${entry.name}`);
    }
  }

  await saveManifest(manifest);
  console.log(`[cache-images] Completed. Updated ${updatedCount} issue(s).`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
