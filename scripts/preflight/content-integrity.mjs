// ============================================================
//  Preflight check: content-integrity.mjs
//   - No em dashes anywhere (visual char or HTML entities).
//   - og:image + twitter:image must be absolute https URLs.
//   - <html> must declare lang and dir.
// ============================================================
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Em-dash forms: U+2014 (em dash) and U+2013 (en dash), plus their HTML
// entities. The dash characters themselves are built from char codes so this
// source file contains zero literal dashes (honoring the site-wide ban even
// inside the scanner). The original ASCII hyphen is allowed.
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH_NEEDLES = [
  { needle: EM_DASH, label: 'em dash (U+2014)' },
  { needle: EN_DASH, label: 'en dash (U+2013)' },
  { needle: '&mdash;', label: '&mdash;' },
  { needle: '&ndash;', label: '&ndash;' },
  { needle: '&#8212;', label: '&#8212;' },
  { needle: '&#8211;', label: '&#8211;' },
  { needle: '&#x2014;', label: '&#x2014;' },
  { needle: '&#x2013;', label: '&#x2013;' },
];

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

export async function checkContentIntegrity(root) {
  const errors = [];
  const warnings = [];

  const read = async (rel) => {
    try {
      return await readFile(join(root, rel), 'utf8');
    } catch {
      return null;
    }
  };

  // ---- 1. Em-dash scan ----
  const scanFiles = ['index.html', 'app.js', 'style.css', 'releases.js', 'accessibility.html'];
  for (const f of scanFiles) {
    const c = await read(f);
    if (c == null) {
      errors.push(`${f}: required file not found (em-dash scan).`);
      continue;
    }
    for (const { needle, label } of EM_DASH_NEEDLES) {
      let idx = c.indexOf(needle);
      while (idx !== -1) {
        errors.push(`${f}:${lineOf(c, idx)}: contains ${label}. Em dashes are banned site-wide.`);
        idx = c.indexOf(needle, idx + needle.length);
      }
    }
  }

  // ---- 2. og:image + twitter:image must be absolute https ----
  const indexHtml = await read('index.html');
  if (indexHtml == null) {
    errors.push('index.html not found, cannot verify OG/Twitter image URLs.');
  } else {
    const ogMatch = indexHtml.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    const twMatch = indexHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);

    if (!ogMatch) {
      errors.push('index.html: og:image meta tag is missing.');
    } else if (!/^https:\/\//i.test(ogMatch[1])) {
      errors.push(`index.html: og:image must be an absolute https URL (found "${ogMatch[1]}").`);
    }

    if (!twMatch) {
      errors.push('index.html: twitter:image meta tag is missing.');
    } else if (!/^https:\/\//i.test(twMatch[1])) {
      errors.push(`index.html: twitter:image must be an absolute https URL (found "${twMatch[1]}").`);
    }

    // ---- 3. <html> must have lang and dir ----
    const htmlTag = indexHtml.match(/<html\b[^>]*>/i);
    if (!htmlTag) {
      errors.push('index.html: no <html> tag found.');
    } else {
      if (!/\blang\s*=/.test(htmlTag[0])) errors.push('index.html: <html> is missing a lang attribute.');
      if (!/\bdir\s*=/.test(htmlTag[0])) errors.push('index.html: <html> is missing a dir attribute.');
    }
  }

  return { name: 'Content Integrity (em dash, OG, lang/dir)', errors, warnings };
}
