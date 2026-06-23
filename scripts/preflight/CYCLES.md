# Compliance gate - cycle log

Append-only record of autonomous cycles working on the shaulnaim.com compliance gate.
All work is on `dev`. The public `main` branch (holding page) is never edited directly.

## Cycle 23 - 2026-06-23

Goal: enforce the gate in CI so the site cannot go live non-compliant.

- Workflow added: `.github/workflows/compliance-gate.yml`. Triggers on push to `dev`
  and on pull_request targeting `main`. Job `compliance-gate` on ubuntu-latest:
  checkout, setup-node (Node 22, stable global WebSocket so accessibility.mjs runs
  unchanged), install Google Chrome via `browser-actions/setup-chrome@v1`, export
  `CHROME_PATH`, relax `kernel.apparmor_restrict_unprivileged_userns` so Chrome's
  sandbox launches on the runner (the gate spawns Chrome without --no-sandbox by
  design), then `node scripts/preflight/index.mjs`. No `npm ci` (no package-lock,
  axe is vendored, gate has no npm deps). The step fails the job on non-zero exit.
- VERIFIED green CI run: run id 28046383966, workflow "Compliance Gate", head sha
  2e4216304d01890d8163e7ef72c687fec284d322, conclusion = success, all steps
  including "Run compliance gate" passed in CI.
  (First run 28046309978 FAILED: "Chrome did not report a DevTools port" because
  ubuntu-24.04 blocks unprivileged user namespaces; fixed by relaxing the sysctl,
  not by editing accessibility.mjs.)
- Branch protection on `main` (GET-confirmed):
  required_status_checks.contexts = ["compliance-gate"], strict = true,
  enforce_admins = false (owner can still override in a real emergency),
  required_pull_request_reviews.required_approving_review_count = 0,
  restrictions = null.
- README updated: "Compliance gate" section (what it checks, `npm run preflight`,
  main protected, merging dev into main = going live runs the gate) plus
  "Restore to live" steps (PR dev into main, re-enable Pages, flip
  LYRICS_LICENSED only after ACUM clears).
- Branch confirm for all file commits: dev. Local `npm run preflight` exits 0.
  node --check clean on both index.mjs and accessibility.mjs. Em-dash scan clean
  across the workflow + README + this log.

LAW-PROTECTION STATUS: ENFORCED. The compliance gate (legal/ACUM + axe WCAG2AA +
content-integrity + syntax) now runs automatically in GitHub Actions and is a
required status check on the protected `main` branch. Going live means merging
`dev` into `main` via a pull request; that PR cannot merge unless the
`compliance-gate` check passes. A non-compliant change (em dash, ACUM/lyrics not
cleared, axe violation, broken syntax, missing alt/title/skip-link) therefore
blocks the PR and cannot reach the live branch. Direct pushes of site files to
`main` are not done; the holding page stays put until a gated PR merges.
