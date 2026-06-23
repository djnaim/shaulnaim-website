// ============================================================
//  Preflight check: syntax.mjs
//   - node --check on app.js + releases.js (real parser, spawned).
//   - Basic HTML structural parse on index.html + accessibility.html.
// ============================================================
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

function nodeCheck(file) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (code) => resolve({ code, stderr: stderr.trim() }));
    p.on('error', (err) => resolve({ code: 1, stderr: String(err) }));
  });
}

// Lightweight HTML well-formedness check: confirms a single <html> root, a
// <head> and <body>, balanced tag depth for the major block elements, and no
// obviously unterminated tags. This is a structural sanity check (not a full
// validator) matching the spec's "basic HTML parse".
function basicHtmlCheck(file, html) {
  const problems = [];
  if (!/<!doctype html>/i.test(html)) problems.push(`${file}: missing <!DOCTYPE html>.`);
  if (!/<html\b/i.test(html)) problems.push(`${file}: missing <html> tag.`);
  if (!/<\/html>/i.test(html)) problems.push(`${file}: missing closing </html>.`);
  if (!/<head\b/i.test(html) || !/<\/head>/i.test(html)) problems.push(`${file}: missing <head>...</head>.`);
  if (!/<body\b/i.test(html) || !/<\/body>/i.test(html)) problems.push(`${file}: missing <body>...</body>.`);

  // Balance check for a few container tags that must nest cleanly.
  for (const tag of ['html', 'head', 'body', 'main', 'footer']) {
    const open = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    // <footer> and <main> may appear 0 or more times; require open===close.
    if (open !== close) {
      problems.push(`${file}: unbalanced <${tag}> tags (${open} open, ${close} close).`);
    }
  }

  // Unterminated script tags would break the page entirely.
  const scriptOpen = (html.match(/<script\b/gi) || []).length;
  const scriptClose = (html.match(/<\/script>/gi) || []).length;
  if (scriptOpen !== scriptClose) {
    problems.push(`${file}: unbalanced <script> tags (${scriptOpen} open, ${scriptClose} close).`);
  }

  return problems;
}

export async function checkSyntax(root) {
  const errors = [];
  const warnings = [];

  // ---- JS: node --check ----
  for (const jsFile of ['app.js', 'releases.js']) {
    const full = join(root, jsFile);
    const { code, stderr } = await nodeCheck(full);
    if (code !== 0) {
      errors.push(`${jsFile}: node --check failed.\n${stderr}`);
    }
  }

  // ---- HTML: basic parse ----
  for (const htmlFile of ['index.html', 'accessibility.html']) {
    let html;
    try {
      html = await readFile(join(root, htmlFile), 'utf8');
    } catch {
      errors.push(`${htmlFile}: not found (HTML parse check).`);
      continue;
    }
    errors.push(...basicHtmlCheck(htmlFile, html));
  }

  return { name: 'Syntax (node --check + HTML parse)', errors, warnings };
}
