# shaulnaim.com

Official website for **Shaul Naim** (שאול נעים) - Israeli singer.

- Single-page, static, RTL Hebrew.
- Plays the "Ani Gitara" lyric video natively + embeds his Spotify.
- No build step. Deploy as static (Vercel / GitHub Pages).

## Edit
- `index.html` - content
- `style.css` - design
- `assets/` - cover, portrait, hero, video

## Deploy
Static site. On Vercel: import this repo, framework = "Other", output = root. Point `shaulnaim.com` at it.

## Compliance gate
Before the site can go live it must pass `scripts/preflight/index.mjs`. Run it locally:

```
npm run preflight
```

It exits 1 (and blocks deploy) if any check finds a violation. It checks:
- Legal / ACUM: lyrics stay gated until ACUM clears (LYRICS_LICENSED), credits present.
- Content integrity: no em dashes anywhere, og:image + twitter:image are absolute https, `<html>` has lang + dir.
- Syntax: `node --check` on the JS plus an HTML parse.
- Accessibility: axe-core (WCAG 2.0 A + AA) over the homepage, the homepage with a release modal open, and accessibility.html, plus static alt/title/skip-link/landmark assertions.

### CI enforcement
`.github/workflows/compliance-gate.yml` runs the same gate in GitHub Actions:
- On every push to `dev` (smoke check).
- On every pull request targeting `main` (going live).

The runner installs Google Chrome (axe needs a real browser over CDP) and runs on Node 22.

`main` is the public/live branch and is branch-protected: the `compliance-gate` status check is required, so a non-compliant change cannot be merged to `main` (and therefore cannot go live). Merging `dev` into `main` is "going live" and runs the gate first.

## Restore to live
The repo is intentionally held offline on `dev` while `main` serves a holding page. To put the full site back live:
1. Open a pull request from `dev` into `main`. The `compliance-gate` check runs automatically and must pass before the PR can merge.
2. Merge the PR (going live). Do NOT push site files to `main` directly; always go through a PR so the gate runs.
3. Re-enable GitHub Pages (or the host) on `main`.
4. Flip `LYRICS_LICENSED` to enable lyrics ONLY after ACUM has cleared the license. Until then the gate keeps lyrics gated.
