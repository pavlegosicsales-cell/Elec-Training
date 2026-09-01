# Elec Training

Rebuild of the home and contact pages for [Elec Training](https://elec.training/), a City and Guilds approved electrical training centre (centre number 012036) running electrician courses for adult learners across the UK.

Static site. No framework, no build step, no dependencies.

## Files

| File | What it is |
|---|---|
| `index.html` | Home page |
| `contact.html` | Contact page with the four step enquiry wizard |
| `privacy.html` | Privacy policy, UK GDPR |
| `styles.css` | Whole design system |
| `main.js` | Mobile nav, scroll reveals, FAQ accordion, both forms |
| `shader.js` | WebGL background on the courses section |
| `images/` | Logo, centre photography, press logos |
| `context.md` | Client brief: services, pricing, brand, social proof |
| `research/` | Site teardown and the raw scrapes the copy came from |

## Design

The design system is ported from the Gordon Electrical reference build, with the palette remapped to the Elec Training logo. Navy and blue carry the structure (gradients, trays, washes, footer); red is the accent, used for eyebrow chips, price figures and the placement guarantee.

- Navy `#13326b` · Blue `#0066cc` · Red `#ed1c24` · Off white `#fafbfc`
- Fustat (headings) and Plus Jakarta Sans (body), via Google Fonts
- Fluid type throughout with `clamp()`, so there are no typographic breakpoints

Copy and section structure follow the live elec.training site: real course pricing with ex and inc VAT, their own FAQ answers, and real Trustpilot reviews.

## Notes for anyone picking this up

- **`main.js` line 7:** `ENDPOINT` is empty. Paste the Google Apps Script URL there to wire up both forms. Until then, submissions are logged to the console so the forms stay testable.
- **The FAQ accordion does not use the `grid-template-rows: 0fr` trick.** That collapses to zero height in some engines, which leaves the answer invisible while the panel reports itself open. It animates an explicit height measured in `main.js` instead.
- **`body` uses `overflow-x: clip`, not `hidden`.** `hidden` makes `overflow-y` compute to `auto`, which turns the body into a scroll container and silently breaks every `position: sticky` descendant.
- Images below the fold are lazy loaded and every `<img>` carries `width` and `height` so nothing shifts as the page loads.
- The shader is adapted from Paper Shaders (Apache-2.0). The attribution comment in `shader.js` needs to stay.

## Running it

Any static server works:

```bash
python -m http.server 8777
```
