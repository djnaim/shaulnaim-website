// ============================================================
//  shaulnaim.com - Compliance Gate (preflight orchestrator)
//  Modeled on Buildda's scripts/preflight/index.ts + critical.ts.
//  Runs every modular check, prints a colored report, and exits 1 if ANY
//  check reports an error (warnings do not fail the gate).
//
//  Usage: npm run preflight   (== node scripts/preflight/index.mjs)
// ============================================================
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { checkLegalCompliance } from './legal-compliance.mjs';
import { checkContentIntegrity } from './content-integrity.mjs';
import { checkSyntax } from './syntax.mjs';
import { checkAccessibility } from './accessibility.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// repo root is two levels up from scripts/preflight/
const ROOT = resolve(__dirname, '..', '..');

const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const BAR = '='.repeat(60);

function fmt(ms) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function printHeader() {
  console.log('\n' + BAR);
  console.log(`${C.cyan}${C.bright}  COMPLIANCE GATE  ::  shaulnaim.com${C.reset}`);
  console.log(BAR);
  console.log('\nRunning all compliance + accessibility checks before deploy...\n');
}

async function runCheck(label, fn) {
  process.stdout.write(`  ${C.blue}>${C.reset} ${label}... `);
  const start = Date.now();
  let result;
  try {
    result = await fn(ROOT);
  } catch (err) {
    result = { name: label, errors: [`check threw: ${err.message}`], warnings: [] };
  }
  const duration = Date.now() - start;
  const ec = result.errors.length;
  const wc = result.warnings.length;
  if (ec === 0 && wc === 0) {
    console.log(`${C.green}OK${C.reset} (${fmt(duration)})`);
  } else if (ec === 0) {
    console.log(`${C.yellow}WARN${C.reset} ${wc} warning(s) (${fmt(duration)})`);
  } else {
    console.log(`${C.red}FAIL${C.reset} ${ec} error(s), ${wc} warning(s) (${fmt(duration)})`);
  }
  return { ...result, duration, errors: result.errors, warnings: result.warnings };
}

async function main() {
  printHeader();

  const results = [];
  results.push(await runCheck('Legal Compliance (ACUM + credits)', checkLegalCompliance));
  results.push(await runCheck('Content Integrity (em dash, OG, lang/dir)', checkContentIntegrity));
  results.push(await runCheck('Syntax (node --check + HTML parse)', checkSyntax));
  results.push(await runCheck('Accessibility (axe-core WCAG 2.0 AA)', checkAccessibility));

  // ---- Detailed report ----
  console.log('\n' + BAR);
  console.log(`${C.bright}  SUMMARY${C.reset}`);
  console.log(BAR + '\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const r of results) {
    const passed = r.errors.length === 0;
    const status = passed ? `${C.green}PASS${C.reset}` : `${C.red}FAIL${C.reset}`;
    console.log(`  ${status}  ${r.name}`);
    for (const e of r.errors) {
      console.log(`        ${C.red}x${C.reset} ${e}`);
    }
    for (const w of r.warnings) {
      console.log(`        ${C.yellow}!${C.reset} ${w}`);
    }
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
  }

  console.log('\n' + '-'.repeat(60));

  if (totalErrors === 0) {
    console.log(`\n  ${C.green}${C.bright}COMPLIANCE GATE PASSED${C.reset}`);
    console.log(`    ${totalWarnings} warning(s) to review.\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${C.red}${C.bright}COMPLIANCE GATE FAILED${C.reset}`);
    console.log(`    ${totalErrors} error(s), ${totalWarnings} warning(s).`);
    console.log(`  ${C.dim}Fix the errors above before deploying.${C.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Compliance gate crashed:', err);
  process.exit(1);
});
