// ============================================================
//  Preflight check: legal-compliance.mjs
//  Modeled on Buildda's scripts/preflight/legal-compliance.ts.
//  Guards the two P0 legal tracks for shaulnaim.com:
//   1. ACUM / music-rights: lyrics MUST stay disabled (LYRICS_LICENSED = false)
//      until the owner confirms ACUM lyric rights. No false license claim may
//      be printed anywhere unless an explicit PREFLIGHT_ALLOW_LICENSE_CLAIM
//      marker is present.
//   2. Composer / lyricist credits must be present (releases.js composer fields
//      + index.html JSON-LD byArtist).
// ============================================================
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Strings that would falsely claim an ACUM (or any) lyric license. We scan
// case-insensitively. An explicit PREFLIGHT_ALLOW_LICENSE_CLAIM marker anywhere
// in the repo files lets a real, confirmed claim through (owner action only).
const LICENSE_CLAIM_PATTERNS = [
  /licensed\s+by\s+acum/i,
  /acum\s+licensed/i,
  /licensed\s+under\s+acum/i,
  /ברישיון\s+אקום/, // "ברישיון אקום"
  /מורשה\s+על\s+ידי\s+אקום/, // "מורשה על ידי אקום"
  /בכפוף\s+לרישיון/, // "בכפוף לרישיון"
];

const ALLOW_MARKER = 'PREFLIGHT_ALLOW_LICENSE_CLAIM';

export async function checkLegalCompliance(root) {
  const errors = [];
  const warnings = [];

  const read = async (rel) => {
    try {
      return await readFile(join(root, rel), 'utf8');
    } catch {
      return null;
    }
  };

  // ---- 1a. Lyrics gate: LYRICS_LICENSED must be present AND false ----
  const appJs = await read('app.js');
  if (appJs == null) {
    errors.push('app.js not found, cannot verify the lyrics license gate.');
  } else {
    const falseMatch = /\bLYRICS_LICENSED\s*=\s*false\b/.test(appJs);
    const anyMatch = /\bLYRICS_LICENSED\b/.test(appJs);
    if (!anyMatch) {
      errors.push('app.js is missing the LYRICS_LICENSED flag (lyrics must stay gated OFF until ACUM rights are confirmed).');
    } else if (!falseMatch) {
      errors.push('app.js does not set LYRICS_LICENSED = false. Lyrics display must stay disabled until ACUM lyric rights are confirmed by the owner.');
    }
  }

  // ---- 1b. No false license-claim strings anywhere ----
  const scanFiles = ['index.html', 'app.js', 'releases.js', 'accessibility.html', 'style.css'];
  const contents = {};
  for (const f of scanFiles) contents[f] = await read(f);

  const allowMarkerPresent = Object.values(contents).some(
    (c) => c != null && c.includes(ALLOW_MARKER),
  );

  for (const f of scanFiles) {
    const c = contents[f];
    if (c == null) continue;
    for (const pat of LICENSE_CLAIM_PATTERNS) {
      const m = c.match(pat);
      if (m && !allowMarkerPresent) {
        errors.push(`${f}: false ACUM/license claim found ("${m[0]}"). Remove it, or add a ${ALLOW_MARKER} marker only after the owner confirms the license is real.`);
      }
    }
  }

  // ---- 2a. Composer credits present in releases.js ----
  const releasesJs = await read('releases.js');
  if (releasesJs == null) {
    errors.push('releases.js not found, cannot verify composer credits.');
  } else {
    // Strip JS comments first so doc comments (which mention status: "released"
    // as an example) do not inflate the released-single count.
    const code = releasesJs
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    // Every released single must carry a composer credit. We count released
    // entries (status "released") and composer: fields.
    const releasedCount = (code.match(/status:\s*["']released["']/g) || []).length;
    const composerCount = (code.match(/\bcomposer\s*:/g) || []).length;
    if (composerCount === 0) {
      errors.push('releases.js has no composer credits. Composer/lyricist credits must be present on every released cover.');
    } else if (releasedCount > 0 && composerCount < releasedCount) {
      errors.push(`releases.js: ${composerCount} composer credit(s) for ${releasedCount} released single(s). Every released cover needs an accurate composer credit.`);
    }
  }

  // ---- 2b. JSON-LD byArtist present in index.html ----
  const indexHtml = contents['index.html'];
  if (indexHtml == null) {
    errors.push('index.html not found, cannot verify JSON-LD byArtist credits.');
  } else if (!/"byArtist"\s*:/.test(indexHtml)) {
    errors.push('index.html JSON-LD is missing a byArtist credit on the MusicRecording schema.');
  }

  return { name: 'Legal Compliance (ACUM + credits)', errors, warnings };
}
