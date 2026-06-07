import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const [baselineInput, candidateDir, mode] = process.argv.slice(2);

if (!baselineInput || !candidateDir) {
  console.error('Usage: node tools/compare-builds.mjs <baseline-directory|manifest.json> <candidate-directory|manifest.json> [--write-manifest]');
  process.exit(2);
}

const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.txt',
  '.xml',
]);

async function listFiles(root, directory = root) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, absolutePath));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolutePath));
    }
  }

  return files.sort();
}

function normalizeText(relativePath, content) {
  if (relativePath === 'search.xml') {
    const entries = [...content.matchAll(/  <entry>[\s\S]*?  <\/entry>/g)];
    if (entries.length > 0) {
      const firstEntry = entries[0];
      const lastEntry = entries.at(-1);
      const prefix = content.slice(0, firstEntry.index);
      const suffix = content.slice(lastEntry.index + lastEntry[0].length);
      return `${prefix}${entries.map(match => match[0]).sort().join('\n')}${suffix}`;
    }
  }

  if (path.extname(relativePath) !== '.html') {
    return content;
  }

  const normalized = content
    .replace(/<meta name="generator" content="Hexo [^"]+">/g, '<meta name="generator" content="Hexo">')
    .replace(/<time[^>]*datetime="[^"]*"[^>]*>/g, match => match.replace(/datetime="[^"]*"/, 'datetime=""'))
    .replace(/postUpdate: '[^']*'/g, "postUpdate: ''")
    .replace(/data-lastPushDate="[^"]*"/g, 'data-lastPushDate=""');

  return relativePath === 'tags/index.html'
    ? normalized.replace(/color: rgb\(\d+, \d+, \d+\)/g, 'color: rgb()')
    : normalized;
}

function digest(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function buildManifest(root) {
  const manifest = {};
  for (const relativePath of await listFiles(root)) {
    const content = await fs.readFile(path.join(root, relativePath));
    const extension = path.extname(relativePath);
    const normalized = textExtensions.has(extension)
      ? normalizeText(relativePath, content.toString('utf8'))
      : content;
    manifest[relativePath] = digest(normalized);
  }
  return manifest;
}

if (mode === '--write-manifest') {
  const manifest = await buildManifest(baselineInput);
  await fs.writeFile(candidateDir, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(manifest).length} entries to ${candidateDir}.`);
  process.exit(0);
}

const baselineStat = await fs.stat(baselineInput);
const baselineManifest = baselineStat.isDirectory()
  ? await buildManifest(baselineInput)
  : JSON.parse(await fs.readFile(baselineInput, 'utf8'));
const candidateManifest = await buildManifest(candidateDir);
const baselineFiles = Object.keys(baselineManifest).sort();
const candidateFiles = Object.keys(candidateManifest).sort();
const baselineSet = new Set(baselineFiles);
const candidateSet = new Set(candidateFiles);
const missing = baselineFiles.filter(file => !candidateSet.has(file));
const added = candidateFiles.filter(file => !baselineSet.has(file));
const changed = [];

for (const relativePath of baselineFiles.filter(file => candidateSet.has(file))) {
  if (baselineManifest[relativePath] !== candidateManifest[relativePath]) {
    changed.push(relativePath);
  }
}

if (missing.length || added.length || changed.length) {
  console.error(JSON.stringify({ missing, added, changed }, null, 2));
  process.exit(1);
}

console.log(`Builds match: ${baselineFiles.length} generated files compared.`);
