#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findTsFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findTsFiles(res)));
    } else if (entry.isFile() && res.endsWith('.ts')) {
      files.push(res);
    }
  }
  return files;
}

async function main() {
  const suggestionsPath = path.resolve(process.cwd(), '.playwright', 'healer-suggestions.json');
  if (!fs.existsSync(suggestionsPath)) {
    console.error('No healer suggestions file found at', suggestionsPath);
    process.exit(1);
  }

  let suggestions;
  try {
    suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse healer suggestions:', e);
    process.exit(1);
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    console.error('No suggestions to process.');
    process.exit(0);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const patches = [];

  const dryRun = process.argv.includes('--dry');

  for (const suggestion of suggestions) {
    const url = suggestion.url || '/';
    const selectors = Array.isArray(suggestion.selectors) ? suggestion.selectors : [];
    if (selectors.length === 0) continue;

    const failing = selectors[0];
    console.log('Processing suggestion for URL:', url);
    try {
      if (url.startsWith('http')) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      } else {
        // attempt to navigate relative to baseURL if provided
        const base = process.env.BASE_URL || process.env.PW_BASE_URL || 'http://localhost:3000';
        await page.goto(new URL(url, base).href, { waitUntil: 'domcontentloaded' });
      }
    } catch (e) {
      console.warn('Failed to navigate to', url, e?.message || e);
    }

    // If any selector in the original list now matches, skip
    let workingSelector = null;
    for (const sel of selectors) {
      try {
        const cnt = await page.locator(sel).count();
        if (cnt > 0) {
          workingSelector = sel;
          console.log('Selector from suggestion is now working:', sel);
          break;
        }
      } catch {
        // ignore invalid selector
      }
    }

    if (workingSelector) continue; // nothing to patch

    // generate candidate transformations
    const candidates = new Set();
    // simple transforms
    candidates.add(failing.replace(/>\s*/g, ' '));
    candidates.add(failing.replace(/\bdiv\b/g, '').trim());
    // last token class or id
    const tokens = failing.split(/\s*>\s*|\s+/).filter(Boolean);
    const last = tokens[tokens.length - 1] || '';
    if (last.startsWith('.')) candidates.add(last);
    if (last.startsWith('#')) candidates.add(last);
    if (!last.startsWith('.') && !last.startsWith('#')) candidates.add('.' + last);

    // search DOM for elements with classes similar to last token
    try {
      const classCandidates = await page.evaluate((lastToken) => {
        if (!lastToken) return [];
        const candidates = new Set();
        const token = lastToken.replace(/^[.#]/, '');
        for (const el of Array.from(document.querySelectorAll('*'))) {
          for (const c of el.classList || []) {
            if (c.includes(token) || token.includes(c)) candidates.add('.' + c);
          }
          if (el.id && el.id.includes(token)) candidates.add('#' + el.id);
        }
        return Array.from(candidates).slice(0, 20);
      }, last);
      for (const c of classCandidates) candidates.add(c);
    } catch (e) {
      // ignore
    }

    // try candidates
    let found = null;
    for (const cand of candidates) {
      try {
        const cnt = await page.locator(cand).count();
        if (cnt > 0) {
          found = cand;
          console.log('Found working candidate selector:', cand);
          break;
        }
      } catch {
        // invalid selector syntax, ignore
      }
    }

    if (!found) {
      console.log('No alternative selector found for', failing);
      continue;
    }

    // apply patches: search TS files in tests/page-objects and replace occurrences of failing selector string
    const pageObjectsDir = path.resolve(process.cwd(), 'tests', 'page-objects');
    const tsFiles = fs.existsSync(pageObjectsDir) ? await findTsFiles(pageObjectsDir) : [];

    for (const file of tsFiles) {
      const src = fs.readFileSync(file, 'utf8');
      // match quoted string using a safe regex literal
      const quotedRe = /(['"])(.*?)\1/g;
      let updated = src;
      let didPatch = false;
      for (const match of src.matchAll(quotedRe)) {
        const full = match[0];
        const quote = full[0];
        const inner = full.slice(1, -1);
        if (inner === failing) {
          const replacement = quote + found + quote;
          updated = updated.replace(full, replacement);
          didPatch = true;
        }
      }
      if (didPatch) {
        if (dryRun) {
          console.log(`[dry] Would patch ${file}: ${failing} -> ${found}`);
        } else {
          fs.writeFileSync(file, updated, 'utf8');
          console.log(`Patched ${file}: ${failing} -> ${found}`);
        }
        patches.push({ file, original: failing, replacement: found, ts: new Date().toISOString() });
      }
    }
  }

  await browser.close();

  if (patches.length > 0) {
    const out = path.resolve(process.cwd(), '.playwright', 'healer-patches.json');
    if (dryRun) {
      console.log(`[dry] Would write patches to ${out}`);
      console.log(JSON.stringify(patches, null, 2));
    } else {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(patches, null, 2), 'utf8');
      console.log('Wrote patches to', out);
    }
  } else {
    console.log('No patches applied.');
  }
}

main().catch((e) => {
  console.error('Healer script failed:', e);
  process.exit(1);
});
