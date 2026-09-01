# Site Teardown: Gordon Electrical (rebuild)

**URL:** https://gordon-electrical.vercel.app/
**Source:** https://github.com/pavlegosicsales-cell/Gordon-Electrical.git — full source cloned, so this teardown is from source, not inference.
**Built by:** This same 3-skill pipeline. Its CSS header states the design system was *"ported 1:1 from the Electrical Trades College reference build"*.
**Platform:** Static hand-written HTML/CSS/JS on Vercel. No framework, no build step, no npm.
**Date analyzed:** 2026-09-01

> **Role in this project:** this is the INSPO. Clone its design, layout, effects and component system 1:1, and swap only the colour palette to Elec Training navy/red. Structure and copy come from the current elec.training site.

## Tech Stack (Confirmed from Source)

| Technology | Evidence | Purpose |
|---|---|---|
| Plain HTML/CSS/JS | `index.html` 892 ln, `contact.html` 325, `privacy.html` 224, `styles.css` 1457, `main.js` 276, `shader.js` 356 | Entire site. No dependencies. |
| Google Fonts | `@import` line 8 of styles.css | Fustat (headings) + Plus Jakarta Sans (body) |
| WebGL "Neuro Noise" shader | `shader.js`, adapted from Paper Shaders (Apache-2.0) via 21st.dev Shader Builder | Decorative animated background on the Services section only |
| CSS `@property` | `--beam-angle` declaration | Enables the animated conic-gradient beam on buttons |
| Google Apps Script | `ENDPOINT` const in main.js, filled by Skill 03 | Form backend, `mode: no-cors` POST |

**No** GSAP, no Lenis, no jQuery, no IntersectionObserver, no carousel library. Every effect is CSS or about ten lines of vanilla JS. Very cloneable.

## Design System

### Colours (Gordon's — being REPLACED)

| Role | Token | Gordon value |
|---|---|---|
| Primary | `--navy` | `#00619b` |
| Primary deep | `--navy-deep` | `#01466f` |
| Footer / gradient text | `--indigo` | `#0072b5` |
| Blue | `--blue` | `#0f93d4` |
| Brand blue (exact logo) | `--blue-bright` | `#007bc1` |
| Blue mid | `--blue-mid` | `#29a3e0` |
| Blue light | `--blue-light` | `#63c2ef` |
| Blue pale | `--blue-pale` | `#9ad8f6` |
| Card tray bg | `--blue-tray` | `rgba(219,238,250,0.72)` |
| Focus ring only | `--gold` | `#ffc629` |
| Black / White | `--black` / `--white` | `#000000` / `#ffffff` |
| Grey section bg | `--grey-bg` | `#f8f8f8` |
| Body text | `--text` | `rgba(0,0,0,0.8)` |
| Muted text | `--text-muted` | `#686868` |
| Eyebrow text | `--text-eyebrow` | `rgba(0,0,0,0.62)` |
| Hairline | `--line` | `#e9eff2` |

### Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Headings | Fustat | 400–800 | see clamps below |
| Body | Plus Jakarta Sans | 400–700 + italic | 16px / 500 / line-height 1.55 |

Fluid type, all `clamp()`:

- `h1` — `clamp(2.375rem, 1.2rem + 5.2vw, 5rem)`, 700, lh 1.16, **centred**
- `h2` — `clamp(2.25rem, 1.3rem + 4.2vw, 4.5rem)`, 700, lh 1.06, **centred**
- `h3` — `clamp(1.75rem, 1.1rem + 2.6vw, 3.125rem)`, 500, lh 1.2, letter-spacing `-0.03em`
- `h4` — `clamp(1.375rem, 1rem + 1.4vw, 2.25rem)`, 500
- `h5` — `clamp(1.375rem, 1.05rem + 1vw, 1.75rem)`, 500
- `h6` — `1.25rem`, 600

### Layout tokens

    --container:    1320px
    --radius-card:  20px
    --radius-tray:  24px
    --radius-pill:  399px
    --ease:         cubic-bezier(0.16, 1, 0.3, 1)

Section rhythm: `.section { padding: 100px 20px }`, alternating `--white` / `--grey-bg`.

**Critical CSS note (already solved in source, keep it):** body uses `overflow-x: clip`, NOT `hidden`. `hidden` makes `overflow-y` compute to `auto`, turning body into a scroll container and silently breaking every `position: sticky` descendant.

## Effects Breakdown

| Effect | Implementation | Complexity | Cloneable? |
|---|---|---|---|
| Scroll reveal | `.reveal` opacity 0 + translateY 50px, then `.is-in` transitions over 1.1s. Plain scroll listener + rAF, deliberately NOT IntersectionObserver (IO misreports in preview panes). `data-delay="1..4"` gives 0.1–0.4s stagger. | Low | Yes |
| Button pulse beam | `@property --beam-angle` animating a conic-gradient on `::before` inset -3px, plus a drop-shadow halo travelling with it. 3.2s linear infinite. No JS. | Low | Yes |
| Hero gradient + blobs | `radial-gradient(125% 125% at 50% 10%, white 40%, blue-bright 100%)` plus two `filter: blur(90px)` radial blobs at 0.35 opacity. | Low | Yes |
| Marquee pills | Three stacked rows, translateX 0 to -50% at 34s/46s, alternating direction. Content duplicated twice. Edge fade via `mask-image`. | Low | Yes |
| Dial / node cluster | Three concentric bordered circles plus five absolutely positioned 42px circular photo nodes. Purely static CSS — looks like a diagram, is just border-radius. | Low | Yes |
| WebGL Neuro Noise | Full-width canvas behind Services, white scrim gradient over it for legibility. Pauses off-screen and on tab hide, honours `prefers-reduced-motion` with a single static frame. | Med | Yes — copy shader.js as-is |
| Frosted service cards | Cards over the shader get translucent background plus backdrop blur. | Low | Yes |
| FAQ accordion | Class toggle, closes siblings, maintains `aria-expanded`. | Low | Yes |
| Contact wizard | Four panels, choice cards auto-advance after 220ms, dot progress, honeypot field. | Low | Yes |

## Implementation Details

### The pulse beam — best effect-to-effort ratio on the site

    @property --beam-angle { syntax:"<angle>"; initial-value:0deg; inherits:false; }

    .btn--beam { position:relative; overflow:visible;
      --beam-colour:#fff; --beam-glow:rgba(154,216,246,.95); }

    .btn--beam::before {
      content:""; position:absolute; inset:-3px; border-radius:inherit;
      background: conic-gradient(from var(--beam-angle),
        transparent 0deg, transparent 215deg,
        var(--beam-glow) 285deg, var(--beam-colour) 320deg,
        var(--beam-colour) 336deg, var(--beam-glow) 352deg, transparent 360deg);
      filter: drop-shadow(0 0 8px var(--beam-glow));
      z-index:0; pointer-events:none;
    }

    .btn--beam .btn__inner { position:relative; z-index:1; }   /* label above beam */

    @keyframes beam-spin { to { --beam-angle:360deg; } }

The reveal: it looks like a library effect (the framer-motion "pulse beams" idea). It is one rotating conic gradient. The halo travels *with* the beam via `drop-shadow` rather than being a second element, which keeps it out of the page stacking context.

### Button anatomy — two nested elements, always

`.btn` is a 1px-padded gradient pill (the "border"); `.btn__inner` is the real gradient pill inside it. That 1px reveal is what gives the button its lit edge.

    .btn        { padding:1px; border-radius:48px;
                  background:linear-gradient(180deg, var(--blue-light) 22%, var(--blue) 81%); }
    .btn__inner { padding:12px 32px; min-height:44px; border-radius:var(--radius-pill);
                  background:linear-gradient(180deg, var(--blue-bright) 0%, var(--blue-mid) 69%);
                  box-shadow:inset 0 4px 5px rgba(0,90,150,.02);
                  font-size:1.125rem; font-weight:600; }
    .btn:hover  { transform:translateY(-2px); filter:saturate(1.12); }

Modifiers: `.btn--chip` adds a white circular arrow chip, `.btn--beam` adds the beam, `.btn--light` is for navy backgrounds.

### Hero card row — the tray / hcard pattern

Reused everywhere (`.vtray` does the same for images). A tinted rounded outer tray with 10px padding holds a white inner card at 14px radius. The inner card gets a `.hcard__wash` — a 220px bottom-anchored gradient from transparent to pale blue at 0.38 opacity. Three cards: identity text, rating stat plus three marquees, dial plus text.

### Scroll reveal

    const limit = window.innerHeight - 60;
    // on scroll (rAF-throttled), for each un-revealed .reveal:
    // if (rect.top < limit && rect.bottom > 0) -> add class "is-in", splice out of array

Elements are spliced out once revealed, so the array shrinks to empty and the handler costs nothing after first paint. Fires on scroll, resize, load, immediately, and again at 300ms.

## Page Structure (clone this order)

### index.html

1. **Topbar** — phone, email, licence number
2. **Nav** — logo, six links, `btn--chip btn--beam` CTA, burger; separate `.nav__mobile` panel
3. **Hero** — eyebrow chip (licence), centred h1, sub, CTA plus "or call", then a three-card `.tray` row
4. **Quick enquiry** — inline form, `padding-top:0` so it tucks under the hero
5. **About** (grey) — `.sec-head` two-column (h3 left, lead plus button right) and two image trays
6. **Services** (shader) — same `.sec-head`, then nine `.course` cards with icon, title, description, three tags
7. **Process** (grey) — three numbered steps
8. **Reviews** (white) — `.sec-head` plus review cards (avatar letter, name, five stars, body)
9. **Our Work** (grey) — nine `.vtray` image cards with captions
10. **Areas** (white) — two columns: eyebrow, h3, lead, tag list, CTA, plus image
11. **FAQ** (grey) — accordion left, image right
12. **Footer** — navy, two glow blobs, big CTA h2, contact row, logo plus links, social, divider, legal line with licence

### contact.html

1. Topbar and nav, identical
2. `.page-hero` — eyebrow plus h1
3. **Wizard** (grey) — four steps, dots, step counter:
   - Step 1: service choice cards, eight options, auto-advance
   - Step 2: suburb text plus property type select
   - Step 3: timing choice cards, four options
   - Step 4: name*, phone*, email*, message, plus honeypot `.hp`
   - Done panel `#wizDone`
4. **Details** (white) — Phone / Email / Based in cards
5. Footer

## Assets Needed to Recreate

Already in place at `images/scraped/` (79 files from elec.training) and `../Elec Training images/` (Facebook exports, five Unsplash shots, transparent PNG logo).

| Slot | Count | Source |
|---|---|---|
| Logo, dark and white | 2 | `slazzer-preview-7t6tk.png` is the cut-out PNG; a white version still needs making |
| Hero dial nodes | 5 | Small square crops of training/classroom shots |
| About images | 2 | Centre exterior (`front-of-building.jpg`) plus a workshop shot |
| Service card icons | 7–9 | Inline SVG, hand-drawn — no files needed |
| Our Work grid | 9 | Facebook job and classroom photos |
| Areas image | 1 | Building exterior or a map graphic |
| FAQ image | 1 | Workshop or tutor shot |
| Favicon | 1 | Derive from logo |

## Build Plan

### Stack

Match it exactly: static `index.html`, `contact.html`, `privacy.html`, `styles.css`, `main.js`, `shader.js`. No npm, no framework. Deploy static.

### Porting order

1. Copy `styles.css` wholesale, then remap the `:root` colour block only.
2. Copy `main.js` and `shader.js` as-is. The shader colour uniforms need retinting — see `U.colors` around line 227.
3. Rebuild `index.html` section by section, keeping every class name, swapping Gordon's copy for Elec Training's.
4. Rebuild `contact.html` wizard with Elec Training's course and timing options.
5. Wire the form with Skill 03.

### Palette remap for Elec Training

| Gordon token | Gordon | Elec Training |
|---|---|---|
| `--navy` | `#00619b` | `#13326B` (their navy) |
| `--navy-deep` | `#01466f` | `#0C2350` |
| `--indigo` | `#0072b5` | `#1B4293` |
| `--blue-bright` | `#007bc1` | `#0066CC` (their blue) |
| `--blue` | `#0f93d4` | `#0F7ADB` |
| `--blue-mid` | `#29a3e0` | `#2E8FE8` |
| `--blue-light` | `#63c2ef` | `#6BB4F2` |
| `--blue-pale` | `#9ad8f6` | `#A9D3F9` |
| `--blue-tray` | `rgba(219,238,250,.72)` | `rgba(222,236,252,.72)` |
| `--grey-bg` | `#f8f8f8` | `#FAFBFC` (theirs) |
| `--line` | `#e9eff2` | `#D1D8E2` (theirs) |
| *new* | — | `--red: #ED1C24` (their accent) |

**The one real design decision:** Gordon's design is monochrome blue — every gradient, tray, wash and button is one hue. Elec Training's brand adds red `#ED1C24`. Red cannot carry the gradient system without fighting the navy. Recommended split, matching how elec.training already uses it:

- Buttons, trays, washes, blobs, shader and footer stay in the **navy/blue family** (structural)
- Red is reserved for: the eyebrow chip icon fill, price figures, urgency and limited-places flags, the guaranteed-placement badge, and hover/underline accents

That keeps the inspo's look intact while reading unmistakably as Elec Training.

## Notes

- **Licensing:** the shader is Apache-2.0 (Paper Shaders). The attribution comment is already in `shader.js` — keep it.
- **Accessibility is already handled** — skip link, `aria-expanded`, `aria-current`, aria-labels, focus management in the wizard, and `prefers-reduced-motion` on beam, marquee, reveal and shader. Do not regress any of it.
- **Reveals confirmed working** on the live deploy: 8 of 40 revealed at scrollY 1700 on a 1280x720 viewport.
- `main.js` guards a missing `ENDPOINT` by logging the payload, so forms are testable before Skill 03 runs.
- Gordon's `images/` has both a flat set and `site/` plus `reference/` subfolders. The flat set is what the HTML actually references.
- Gordon's h1 and h2 are **centred**, h3 is left-aligned. That contrast is a big part of the look — keep it.
