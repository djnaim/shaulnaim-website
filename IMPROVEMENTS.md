# Autonomous Site-Improvement Loop — Doctrine & Ledger

> This file is the operating manual. Every cycle READS this first (rules + ledger),
> runs ONE improvement, then appends its result to the ledger at the bottom.

## Mission
Take the Shaul Naim site ("The Song-Poster" for Shirei Eretz Yisrael, at `~/Desktop/shaulnaim-website`,
served at http://localhost:8747) to genuinely **world-class, Awwwards Site-of-the-Day quality**. The owner
said it still looks amateur — treat that as ground truth and push hard. Every cycle must leave the site
**strictly better** than before. Quality compounds: small, verified, cumulative gains beat risky rewrites.

## Deadline
Started 2026-07-09 14:47. **HARD STOP 2026-07-09 19:47** (5 hours). At the top of EVERY cycle run
`date "+%H:%M"`; if it is 19:47 or later, do one final polish + commit + `git push origin dev`, write a
closing ledger summary, and END the loop by calling `ScheduleWakeup` with `stop:true`. Otherwise continue.

## The cycle (ONE focused, high-impact improvement — never a reckless rewrite)
1. **Server** — ensure http://localhost:8747 answers 200; if not, `(python3 -m http.server 8747 &)`.
2. **Observe** — render with headless Chrome + Playwright (`channel:'chrome'`, module at
   `/Users/orennaim/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`). Screenshot every section + a
   detail/album/single page, desktop **1440** AND mobile **390**, both languages, reveal all `.reveal`,
   capture the karaoke mid-ignite. **Read the images yourself** (vision) — do not critique blind.
3. **Critique** at a brutal world-class bar. Rotate the LENS each cycle (list below) so you never fixate.
   Optionally spawn ONE independent critic agent (general-purpose) on the screenshots for an outside eye
   and the single highest-leverage flaw + concrete fix.
4. **Decide** the single highest-impact change available now. Bold moves early, finer polish later.
5. **Implement** with craft.
6. **Verify** — re-render; confirm **zero console errors**, **WCAG AA** computed contrast holds, **no
   horizontal scroll**, mobile intact, and **no regression** vs the previous screenshots. If it looks worse
   or breaks anything → **REVERT** (`git checkout -- <files>`) and log why. NEVER leave the site broken.
7. **Refresh** — bump the `?v=` asset version across the HTML files; reload the Safari localhost:8747 tab
   (AppleScript, target the tab whose URL contains 8747) so the owner watches progress live.
8. **Log + commit** — append one ledger line below; commit the accepted change to `dev` (clear message).
   `git push origin dev` every ~5 accepted commits (batch pushes to limit Vercel preview builds).
9. **Schedule** — call `ScheduleWakeup` (~90s delay, same `/loop` directive) unless past the deadline.

## Lens rotation (cycle through; don't repeat a lens until the list is exhausted)
hero impact · typography & type scale · spacing / rhythm / whitespace · color depth & nuance ·
motion & micro-interactions · imagery & vector craft (you CANNOT shoot photos — elevate with SVG art,
patterns, ornament, texture, grain, composition) · layout & composition · the shows / albums / singles
components · detail-page craft · mobile experience · copy & microcopy · cohesion & finish ·
performance & accessibility · the ONE signature moment · negative space & restraint (remove an accessory).

## Guardrails (never violate)
- Stay on `dev`. Verify BEFORE every commit. Revert anything that regresses. Never leave it broken.
- Colors ONLY from `:root` tokens (the "Degel" foundation: Israeli flag = white #FFFFFF + flag blue #0038B8 + navy #0A1E4A (WCAG-verified). Token names unchanged; --gold now = white hero field, --pom/--tek = flag blue, --ink = navy). Don't break the foundation
  without a deliberate, logged reason AND re-verified contrast.
- Keep the Song-Poster identity + the Israeli / heritage soul. Keep the karaoke signature, the multi-page
  architecture (show/single/album pages, no modal), and accessibility intact.
- **ACUM**: NEVER put a copyrighted song lyric as site text. Public-domain / liturgical / original only.
- No em dashes in visual copy. No horizontal scroll. Mobile must always work. Respect reduced-motion.
- **Respect this ledger** — do not undo accepted good work; do not oscillate between two states.
- One coherent change per cycle. Ambition in service of quality, never recklessness.

## Critic queue (outside-eye findings — work these high-value items across cycles)
- **HARNESS FIX (do first):** fullPage screenshots miss `loading="lazy"` images, so critics see false "empty frames." Before any fullPage capture, scroll the page top→bottom to trigger lazy loads (or screenshot per-section after scrollIntoView). Verify images actually render before trusting an "empty" critique.
- **Kill center-alignment (biggest real win):** every section is the same centered stamp (kicker / centered H2 / centered sub). Flush section headers to the leading edge (`text-align:start`, right in RTL); build an asymmetric grid; make the scarlet **thread load-bearing** and hang the ordinal medallions ON it. The Shows module is already the strongest section — use it as the template for the others.
- **Vary section vertical rhythm** (alternate generous vs tighter padding) so the scroll has cadence, not a metronome.
- **Hero:** paint the karaoke AT-REST state so the concept reads before animation (first 2-3 words lit on load); collapse the 3 competing sub-lines (kicker / attribution / subtitle) into 2 clear tiers; let the headline own the viewport.
- **Motifs at section scale:** medallion on every section header, crop-marks framing every plate, thread visible throughout — make them the grammar, not easter eggs.
- **No empty frames ever:** every image slot needs a real "plate-not-yet-pressed" state (solid ink + embossed registration marks + a set glyph), never a 1px outline around nothing. Coming-soon single card must match the real cards' spec.

## Critic queue — round 2 (cycle-8 outside eye; work across cycles)
- **DEAD LEFT HALF (highest leverage):** flush-leading is right for FULL-WIDTH sections (hero, 3-up singles, shows table) but on sparse single-column sections (contact, gallery, about, albums) it leaves the whole left half empty = "mobile column stretched on desktop." Fix per section: contact = centered framed letterpress colophon plate; gallery = center the video OR give the left a job (oversized standfirst); albums/about = put an oversized ordinal medallion or pull-quote in the left column so the asymmetry looks chosen. [contact done #8]
- **HERO LAST LINE CLIPPED (real bug):** final word "יַחַד" has its foot cut by the line box and the "תהילים קל״ג" attribution is jammed against it. Raise marquee line-height (~0.98 -> ~1.14) or add padding-bottom so feet/nikud clear; retune wrap so line 3 carries two words; give attribution more top gap.
- **ABOUT crop-mark collides with caption:** bottom-left registration tick overlaps the credit; move caption down or lift the tick.
- **SINGLES baseline breaks on wrap:** card A's 2-line title drops its year row out of alignment with the others; give the title row a fixed 2-line min-height.
- **MOTIF DRIFT:** standardize the kicker rule (always pomegranate, fixed length) + text on EVERY header (About has none); unify singles bare-letter ordinals with the shows brass-ring + pom-letter medallion.

## Ledger (append one line per cycle: `#N HH:MM · lens · change · verdict[kept/reverted]`)
- (cycles are appended below)
- #1 14:53 · color depth (hero) · flat gold field to a golden-hour radial gradient (--gold to new --gold-deep #C6871A) + crisper ignite halo; ink AA 4.87 min, no scroll, no errors · KEPT
- #2 14:58 · layout / anti-template · flushed ALL section headers to the leading edge (consistent with the strong Shows module) + pom thread-tick on each eyebrow tying it to the scarlet edge; no regressions · KEPT
- #3 15:05 · hero signature + hierarchy · karaoke now paints an AT-REST state (first 3 words stay lit so the sing-along concept reads statically / in OG previews) + demoted attribution to a tucked serif-italic citation (2 clear tiers, not 3 competing lines) · KEPT
- #4 15:10 · cohesion · the colophon (contact) content was still centered under a now-flushed header (a cycle-2 side effect); flushed buttons / imprint / social to the leading edge so the whole colophon aligns to the thread + seal · KEPT
- #5 15:16 · mobile nav · replaced the crowded 128px 3-row wrap with a proper hamburger menu (JS-injected in app.js + detail.js, a11y: aria-expanded, Esc / link-tap close); mobile bar 128->68px, desktop unchanged, no errors · KEPT
- #6 15:22 · gallery density + composition · enlarged the single video (460->620px) and flushed the grid to the leading edge so it commands the tekhelet dusk field and aligns with the flushed header, instead of floating small-centered · KEPT
- #7 15:27 · cohesion · music Spotify embed was still centered under a flushed header (same mismatch as the colophon); flushed it to the leading edge so header + embed align (right edges match at 1270px) · KEPT
- #8 15:33 · composition (critic round-2 #1) · rebuilt the colophon as a CENTERED framed letterpress plate (brass double-rule) instead of flush-right with a dead left half; the void becomes a deliberate object. Refines #4 for contact per the fresh outside eye · KEPT
- #9 15:41 · finish bug (critic round-2 #2) · hero marquee last word foot + nikud were clipped by a too-tight line-height (.98); raised to 1.12 + padding-block-end and nudged max size 150->144 so it sets as 2 clean lines, plus attribution clearance (6->16px) · KEPT
- ** USER PIVOT 15:45 · COLOR FOUNDATION -> Israeli flag ("Degel") · white background + flag blue #0038B8 + navy #0A1E4A, replacing the gold "Shemesh al Ha.aretz". Hero = white field with the Psalm igniting in flag blue; singles/gallery/contact = flag-blue/navy with white; all pairs AA/AAA (8.6-16.2), no errors. Loop continues on this palette. · KEPT
- ** USER 15:53 · (a) COLOR CONSISTENCY (no exceptions): every value now flows through the flag foundation - all theme-color metas to #0038B8, remapped stray warm/off rgba literals, video bg to navy. (b) 3D: cursor-driven perspective tilt on album/single/video plates (matrix3d + Z-lift + flag-blue depth shadow; disabled on touch / reduced-motion). AA/AAA holds, no errors, no h-scroll. · KEPT
- ** FIX 15:58 · the GALLERY was a garish full-bleed flag-blue #0038B8 wall (owner: "ugliest ever") — flag blue is an ACCENT not a field: gallery -> navy (--ink), video centered (kills the dead-left half), detail hue-tek/euc deepened to non-neon blues. No saturated flag-blue full fields remain anywhere. · KEPT
- ** 20-AGENT AUDIT 16:10 · ran a 20-agent full-site audit (Workflow w48p241oq). Verdict: "ambitious but not yet world-class, dragged by systemic breaks." Top-10 punch list logged; blockers being worked below.
- #10 16:20 · audit blockers batch (color-law + a11y) · (1) ABOUT PORTRAIT was still a GOLD duotone off the Degel palette -> re-duotoned COOL navy #0A1E4A -> white. (2) SECTION EYEBROWS were --brass #7C90C6 (~3.2:1) or flag-blue-on-navy (~1.3:1, invisible) -> flag-blue #0038B8 on WHITE fields (9.3:1), WHITE on NAVY fields (16.2:1). (3) SHOWS sat on periwinkle --stone-2 (a forbidden 3rd field) -> WHITE. (4) FAUX-ITALIC Hebrew (Hebrew has no italic) killed on quote/attribution/album-sub/show-lead/toc-desc -> upright. (5) STICKY-NAV guillotine -> section scroll-margin-top:96px. (6) meta text --brass -> --stone-soft (8.6:1). Verified: 0 console errors, all pairs AA/AAA, no h-scroll desktop+mobile · KEPT
- ** SIGNATURE 16:22 · WAVING ISRAELI FLAG (user: "create an israeli flag inside the website... insane crazy") · integrated flag.js (2-agent build: 3D mass-spring Verlet cloth, warped 11:8 texture w/ Magen David, per-vertex-normal fold shading, gold pole+finial, transparent bg, reduced-motion static frame, IntersectionObserver pause, destroy()) as the crowning seal atop the navy colophon (white field pops on navy). Standalone israeli-flag.html also delivered. Verified painted (85k blue/217k white/gold pole px), 0 errors, mobile clean · KEPT
- ** USER 16:27 · MOVE FLAG TO HERO · owner: "the flag need to be in the front main page" -> moved the waving Israeli flag from the colophon to the TOP OF THE HERO, flying above the nameplate (blue stripes + Magen David + gold pole read cleanly on the white paper field; white flag-field faintly registers against the paper texture). Sized min(320px,62vw). Verified: 0 errors, no h-scroll desktop 1440 + mobile 390, flag painted · KEPT
- ** CI FIX 16:35 · owner flagged the Compliance Gate (scripts/preflight) was RED on every push. Fixed all 5 errors: (1) em dashes U+2014 in style.css:2,9 (+flag.js) -> hyphens; (2) app.js lost LYRICS_LICENSED when lyrics moved to detail.js -> re-added const LYRICS_LICENSED=false (ACUM gate); (3) index.html JSON-LD missing byArtist -> added a MusicRecording w/ byArtist=Shaul Naim; (4) accessibility.html brand link was navy-on-navy 1:1 (inline color:var(--text)) -> #FFFFFF. Gate now PASSES locally (4/4, 1 stale non-blocking modal warning). · KEPT
- #11 16:34 · hero signature (audit #3) · the karaoke rested as a uniform flag-blue SLAB (all 9 words held lit 2.8s) with unlit words a 1.3:1 ghost. Rebuilt: whole Psalm rests in readable NAVY (15:1), a 2-word flag-blue highlight TRAVELS across it (sing-along ball), then loops; marquee gets symmetric padding-inline + line-height clearance so no edge clip. Verified 0 errors, travelling window never all-lit, mobile clean · KEPT
- ** FLAG FIX 16:50 · owner caught the hero flag COLLAPSED into a twisted rag (wind lull + gravity). Root cause: billow force 150*dpr vs horizontal 44*dpr vs gravity 62*dpr -> gravity beat the weak horizontal pull, cloth lost tension and folded; perspective made it narrow. Fix in flag.js: gravity 62->30, horizontal wind 44->118 (steady, dominates gravity), billow 150->64 (gentle roll), gust floor raised so never dead-calm; PLUS a hard anti-collapse envelope clamp (min 55% extension, Y/Z bounds) so it can NEVER fold into a rag. Verified: flag width steady ~0.79 across 16 frames over 6s (was collapsing), 0 errors · KEPT
