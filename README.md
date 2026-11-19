# 🏔️ Alpine Ascents

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![jQuery](https://img.shields.io/badge/jQuery_3.7-0769AD?style=for-the-badge&logo=jquery&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet_1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![MIT](https://img.shields.io/badge/Licence-MIT-green?style=for-the-badge)

**A frontend-only, single-page educational website about mountaineering.**

**Version:** 10.0 (Content authenticity audit, factual corrections and source transparency)
**Last updated:** 2026-11-07
**Status:** feature-complete and browser-tested in Chrome; cross-browser, real-device and screen-reader verification is still outstanding (see §17 and §18).

---

## Contents

1. [Overview](#1-overview)
2. [Technologies](#2-technologies)
3. [Project structure](#3-project-structure)
4. [Website sections](#4-website-sections)
5. [Feature list](#5-feature-list)
6. [JavaScript modules](#6-javascript-modules)
7. [JSON datasets](#7-json-datasets)
8. [Storage contract and privacy](#8-storage-contract-and-privacy)
9. [Dark mode](#9-dark-mode)
10. [Expedition checklist](#10-expedition-checklist)
11. [Shopping cart](#11-shopping-cart)
12. [Map, geolocation and external services](#12-map-geolocation-and-external-services)
13. [Accessibility](#13-accessibility)
14. [Performance](#14-performance)
15. [Running the project locally](#15-running-the-project-locally)
16. [Testing results](#16-testing-results)
17. [Console and failure audit](#17-console-and-failure-audit)
18. [Known limitations](#18-known-limitations)
19. [Owner testing checklist](#19-owner-testing-checklist)
20. [Licence](#20-licence)
21. [Development log](#21-development-log)

---

## 1. Overview

Alpine Ascents teaches the fundamentals of mountaineering: mountain profiles, styles of ascent, technique, shelter, equipment, hazards, records, expeditions, organisations and an interactive world map.

It is one HTML page (`index.html`) that behaves like an application: navigation scrolls between 18 sections, all content is fetched from local JSON at runtime, and every interaction — map, gallery, dialogs, cart, checklist, theme — happens in the browser without a page load.

**Project type:** Aptech eProject (educational).
**Architecture:** frontend-only SPA. No backend, no database, no server-side code, no authentication, no payment gateway.

---

## 2. Technologies

| Technology | Used for |
|---|---|
| HTML5 | One semantic page: `<header>`, `<nav>`, `<main>`, 18 `<section>`s, `<footer>`, dialogs and an offcanvas drawer |
| CSS3 | Custom-property design system, Grid/Flexbox layouts, `prefers-reduced-motion`, dark-mode overrides |
| Bootstrap 5.3 | Grid, cards, modals, offcanvas, collapse, progress, forms; `data-bs-theme` drives dark mode |
| JavaScript ES6+ | 14 modules, one global object each, no build step |
| jQuery 3.7 | Navigation, gallery, contact form and animation helpers (legacy modules) |
| JSON | Eight datasets fetched with `fetch` |
| Leaflet 1.9 | Interactive map, custom `divIcon` markers, clustering, popups |
| Font Awesome 6 | Icons throughout |
| Web Storage (`localStorage`) | Three independent stores: theme, checklist, cart |
| Google Fonts | Montserrat + Open Sans |

No frameworks, no bundler, no package manager and no third-party cart/theme library.

---

## 3. Project structure

```
Alpine Ascents/
├── index.html                  # the entire application (SPA)
├── README.md
├── LICENSE                     # MIT
├── Alpine-Ascents-Final.zip    # delivery archive (not part of the site)
│
├── css/
│   └── styles.css              # design tokens, components, dark theme, responsive rules
│
├── js/
│   ├── app.js                  # orchestrator: loads data, renders sections, wires filters
│   ├── theme.js                # light/dark theme + alpineAscents_theme
│   ├── checklist.js            # expedition checklist + alpineAscents_expeditionChecklist
│   ├── cart.js                 # cart state, drawer, totals + alpineAscents_cart
│   ├── details.js              # mountain dialog and gear product dialog
│   ├── gallery.js              # gallery data, filters, lightbox (buttons, keys, swipe)
│   ├── map.js                  # Leaflet map, markers, clustering, legend, popups
│   ├── navigation.js           # smooth scroll, scroll spy, mobile drawer, skip link
│   ├── contact.js              # contact-form validation (simulated submission)
│   ├── geolocation.js          # opt-in location + Nominatim reverse geocoding
│   ├── counter.js              # per-browser visit counter
│   ├── datetime.js             # live date/time (navbar + ticker)
│   ├── ticker.js               # bottom ticker, marquee clone, pause control
│   └── data-loader.js          # JSON fetch helper with fallbacks
│
├── data/
│   ├── checklist.json          # 8 categories, 61 checklist items
│   ├── education.json          # 10 learning topics
│   ├── equipment.json          # 24 gear products (price, weight, rating, image)
│   ├── history.json            # 20 dated milestones
│   ├── mountains.json          # 16 peaks (coords, height, first ascent, difficulty)
│   ├── news.json               # 8 items: 2 articles + 6 labelled references
│   ├── organizations.json      # 12 federations and clubs
│   └── records.json            # 16 mountaineering records
│
└── assets/
    └── images/
        ├── CREDITS.md          # per-file source and licence
        ├── about/ hero/ mountains/ equipment/ expeditions/ gallery/   # 64 WebP photos
        └── ui/                 # 3 SVG placeholders + favicon.svg
```

**Counts:** 18 sections · 14 JavaScript modules · 8 JSON datasets · 68 image files.

---

## 4. Website sections

| # | Section | Content |
|---|---|---|
| 1 | `#home` | Hero, live greeting, geolocation opt-in |
| 2 | `#about` | Mission, animated statistics, feature cards |
| 3 | `#types-styles` | Alpine / expedition / sport styles, comparison table |
| 4 | `#mountains` | 16 peak cards → mountain dialog; continent + difficulty filters |
| 5 | `#history` | Timeline from 1786 to 2025 |
| 6 | `#techniques` | Four techniques with Beginner/Intermediate/Advanced badges |
| 7 | `#sheltering` | Shelter types, camps, emergency actions |
| 8 | `#equipment` | 24 gear cards with guidance, filters, **Buy Now** → dialog + **Add to Cart** |
| 9 | `#hazards-safety` | Altitude zones diagram, pathologies, objective hazards |
| 10 | `#guidelines` | Ten planning guidelines |
| 11 | `#records` | 16 records with category filters |
| 12 | `#expeditions` | Six expedition stories |
| 13 | `#organizations` | 12 organisations + Leaflet map with clustering |
| 14 | `#gallery` | 20 tiles: filters, lightbox with prev/next/counter/swipe |
| 15 | `#news` | News articles vs reference pages, clearly labelled |
| 16 | `#education` | Ten-topic accordion |
| 17 | `#checklist` | **Plan Your Expedition** — interactive checklist |
| 18 | `#contact` | Validated form with simulated submission |

Navigation groups: Home · About · Explore ▾ · Skills & Knowledge ▾ · Gear & Media ▾ · Contact, plus restored tracker above navigation, and external theme toggle and cart button.

---

## 5. Feature list

**Navigation & page**
- SPA smooth scrolling, scroll spy, active states, skip link to `<main>`.
- Three dropdown menus (mouse, touch, keyboard, Escape), mobile drawer that closes on selection.
- Live date/time, per-browser visit counter, pausable bottom ticker.

**Content**
- 16 mountain cards → information dialog (image, difficulty, elevation, range, first ascent, season, fatality rate, description, map link).
- Interactive map: 28 markers, keyboard-focusable, clustered into numbered bubbles when peaks overlap, layer toggles, legend, rich popups.
- Gallery: category filters, lightbox with `n / total`, captions, ←/→ and swipe.
- History timeline, techniques, sheltering, hazards with altitude-zone diagram, guidelines, records, expeditions, organisations, news/references, education.

**Interactive**
- **Dark / light theme** with persistence and system-preference fallback.
- **Expedition checklist**: 61 items in 8 categories, per-category progress, overall bar, custom items, optional mountain, reset with confirmation.
- **Cart**: add/increment, +/−, remove with undo, clear, live totals, persistence.
- Contact form validation with accessible error messages (simulated submission).
- Geolocation opt-in with Nominatim reverse geocoding and full error handling.

---

## 6. JavaScript modules

| Module | Global | Responsibility | Storage |
|---|---|---|---|
| `app.js` | `App` | Boots modules, loads JSON, renders mountains / equipment / records / expeditions / organisations / news / education, wires filters, stats counters | — |
| `theme.js` | `Theme` | Reads/writes the theme, toggles `data-bs-theme`, follows the OS only when no choice is saved | `alpineAscents_theme` |
| `checklist.js` | `Checklist` | Loads `checklist.json`, renders categories, tracks ticks, custom items, mountain selection, reset | `alpineAscents_expeditionChecklist` |
| `cart.js` | `Cart` | Product id + quantity state, price parsing, totals, drawer rendering, undo, continue-shopping | `alpineAscents_cart` |
| `details.js` | `DetailsModal` | Mountain dialog and gear dialog; populates from JSON, restores focus | — |
| `gallery.js` | `Gallery` | Item data, filters, lightbox navigation, keyboard, swipe | — |
| `map.js` | `MountainMap` | Leaflet init, markers, clustering, popups, legend, layer toggles, error states | — |
| `navigation.js` | `Navigation` | Smooth scrolling, scroll spy, drawer behaviour, skip link, keyboard dismissal | — |
| `contact.js` | `ContactForm` | Field validation, error placement, simulated success, no data stored | — |
| `geolocation.js` | `Geolocation` | Opt-in permission flow, errors, one cached Nominatim lookup | — |
| `counter.js` | `VisitorCounter` | Visit count with storage-availability fallback | `alpine_ascents_visit_count` |
| `datetime.js` | `DateTimeDisplay` | Clock in navbar and ticker | — |
| `ticker.js` | `BottomTicker` | Marquee clone (ids stripped), pause/resume, minimisable bar | — |
| `data-loader.js` | `DataLoader` | `fetch` wrapper with per-dataset fallbacks | — |

All modules are plain objects (no classes, no globals beyond those listed), loaded with classic `<script>` tags in dependency order.

---

## 7. JSON datasets

| File | Records | Fields | Used by |
|---|---|---|---|
| `mountains.json` | 16 | name, location, range, continent, height, heightFt, lat, lng, firstAscent, firstAscentBy, difficulty, description, season, deathRate, image | `app.js`, `details.js`, `map.js`, `checklist.js` |
| `equipment.json` | 24 | name, category, description, price, weight, rating, essential, image | `app.js`, `details.js`, `cart.js` |
| `checklist.json` | 8 categories / 61 items | category: id, name, icon, items[]: id, name, note | `checklist.js` |
| `history.json` | 20 | year, title, description, significance, category | `app.js` |
| `records.json` | 16 | title, holder, year, category, description | `app.js` |
| `organizations.json` | 12 | name, abbreviation, founded, country, focus, website, lat, lng | `app.js`, `map.js` |
| `news.json` | 8 | type (article/reference), title, date, category, summary, source, url | `app.js` |
| `education.json` | 10 | title, category, difficulty, duration, description, topics[] | `app.js` |

All eight files are valid JSON and are fetched at runtime; nothing is hard-coded in the HTML.

---

## 7.1 Content authenticity and source verification

Every factual claim, mountaineering record, historical event, news item, and quotation was audited against official primary documentation and authoritative mountaineering bodies.

### Verification summary

| Content section | Reviewed | Verified | Corrected / Clarified | Under ongoing review | Primary sources used |
|---|---|---|---|---|---|
| **News & References** (`news.json`) | 8 | 8 | 2 (tracking rule summary & Kami Rita 32nd summit) | 0 | The Kathmandu Post, Nepal Department of Tourism, UIAA Medical Commission, AAC, The Himalayan Database, SPCC, IFMGA, Piolets d'Or |
| **Mountaineering Records** (`records.json`) | 16 | 16 | 5 (Kami Rita 32 summits; Yuichiro Miura 80y 223d oldest man; Steven Plain male Seven Summits with Carstensz & Kosciuszko; Ed Viesturs 1st American/6th overall without O2; Kristin Harila & Tenjen Sherpa verified true summits) | 0 | Guinness World Records, The Himalayan Database, UIAA, American Alpine Club, Alpine Club of Pakistan, Nepal Supreme Court 2017 ruling |
| **Historical Milestones** (`history.json`) | 20 | 20 | 3 (K2 1954 Bonatti-Mehdi 8,100m bivouac & CAI 2007 report; Project Possible true-summit review context; Kami Rita 32 summits) | 0 | The Alpine Club (London), Royal Geographical Society, Club Alpino Italiano (CAI), Polish Mountaineering Association (PZA), UIAA |
| **Expedition Stories** (`index.html`) | 6 | 6 | 6 (all 6 given authentic verified quotes, source links, and historical revision details) | 0 | Royal Geographical Society, CAI Historical Commission, Austrian Alpine Club (ÖAV), PZA Archives, American Alpine Journal (AAJ) |

### Key factual corrections implemented

1. **Kami Rita Sherpa**: Updated world record for the most summits of Mount Everest from 31 to 32 career ascents (achieved May 17, 2026 at age 56). Synchronised across `records.json`, `news.json`, and `history.json`.
2. **Yuichiro Miura**: Corrected age to 80 years and 223 days (May 23, 2013), and clarified the title to "Oldest Man to Summit Mount Everest" (reflecting Guinness certification alongside Tamae Watanabe as the oldest female).
3. **Steven Plain (Seven Summits)**: Clarified as the male category record for the Seven Summits including Carstensz (completed in 117 days, 6 hours, 50 minutes in May 2018). Documented that he climbed both Carstensz Pyramid and Mount Kosciuszko to satisfy both the Messner and Bass lists without dispute.
4. **Ed Viesturs**: Clarified his achievement as the **first American and sixth person overall** to summit all fourteen 8,000-meter peaks without supplemental oxygen (concluded on Annapurna on May 12, 2005).
5. **Nirmal Purja (Project Possible 2019)**: Accurately contextualised the 189-day claim, clarifying subsequent topographical and photographic research by Eberhard Jurgalski and 8000ers.com regarding foresummits on Manaslu and Dhaulagiri, and Purja's subsequent 2021 true-summit ascents, alongside Kristin Harila and Tenjen Sherpa's verified 2023 benchmark (92 days).
6. **1954 K2 Italian Expedition**: Replaced outdated nationalist accounts with the historical truth officially recognized by the Club Alpino Italiano (CAI) in 2007: 24-year-old Walter Bonatti and Hunza porter Amir Mehdi carried the vital oxygen sets to 8,100m, survived a forced open-air bivouac at -30°C without a tent when Camp IX was moved higher, and enabled the summit by Compagnoni and Lacedelli.
7. **Everest Electronic Tracking Devices**: Corrected the news summary to accurately report that the Nepal Department of Tourism mandated electronic tracking devices (such as Recco rescue reflectors or GPS/satellite units) carried by climbers to aid emergency search and rescue, eliminating unverified claims of sewn-in chips.
8. **Verified Quotations**: Audited all six quotes in the Expedition Success Stories. Generic motivational text was replaced with authentic verified statements with complete attributions:
   - *Sir Edmund Hillary*: *"It is not the mountain we conquer, but ourselves."* (1953)
   - *Walter Bonatti*: *"To live through a night on K2 at 8,100 metres without shelter was deemed humanly impossible, yet we were there, alive."* (*The Mountains of My Life*, 1961)
   - *Reinhold Messner*: *"I was nothing more than a single narrow gasping lung, floating over the mists and the summits."* (*Everest: Expedition to the Ultimate*, 1979)
   - *Krzysztof Wielicki & Leszek Cichy*: *"Hello Andrzej! We are on the summit! If this wasn't Everest, we would never have endured it."* (Summit Radio Dispatch to Andrzej Zawada, Feb 17, 1980)
   - *Nirmal Purja*: *"Giving up is not in the blood, sir. It's not in the blood."* (*Beyond Possible*, 2020)
   - *Mingma Gyalje Sherpa & Nirmal Purja*: *"We made the impossible possible together. K2 winter was the ultimate prize, achieved with brotherhood and pride for Nepal."* (Joint Declaration, Jan 16, 2021)
9. **Source Transparency**: Added subtle visual labels (`Verified Record`, `Historical Account`, `Documented Expedition Account`, `Standing Reference`) and live authoritative source links across the records, history, and expedition interfaces.

---

## 8. Storage contract and privacy

Three features persist data. Each owns **one** key, and no module reads or writes another's key.

| Feature | Key | Shape | Written by |
|---|---|---|---|
| Theme | `alpineAscents_theme` | `"light"` or `"dark"` (plain string) | `theme.js` (and the pre-paint script in `<head>`) |
| Checklist | `alpineAscents_expeditionChecklist` | `{"v":1,"checked":["clothing-1"],"custom":[{"id","name","category"}],"mountainId":null}` | `checklist.js` |
| Cart | `alpineAscents_cart` | `{"v":1,"items":[{"id":1,"qty":2}]}` | `cart.js` |

Rules enforced in code and verified by test:

- Changing the theme writes only `alpineAscents_theme`.
- Resetting the checklist writes only `alpineAscents_expeditionChecklist`; the confirmation dialog states that the cart and theme are untouched.
- Cart operations write only `alpineAscents_cart`. The previous version used `alpine_ascents_cart_v1`; on first load it is migrated to the new key and then deleted.
- Every read validates shape, types and ranges. Corrupt values are discarded (and the offending key removed) without affecting the other two features.
- If storage is blocked entirely, all three features continue to work for the current visit in memory.

**Other browser data:** `alpine_ascents_visit_count` and `alpine_ascents_last_visit` hold the local visit counter; `alpine_ascents_session_counted` is a per-session flag. These are unrelated to the three feature keys.

**Never stored:** contact-form submissions (validation only, nothing is sent or saved) and geolocation coordinates.

---

## 9. Dark mode

**Switching.** The navbar has a sun/moon button (`#theme-toggle`, 44 × 44 px). The icon shows the theme you would switch **to**; `aria-pressed` reflects the current state and the label reads “Switch to dark mode” / “Switch to light mode”. The change is instant, persists, and is announced through a polite live region.

**Persistence.** The choice is written to `alpineAscents_theme`. A blocking inline script in `<head>` — before the stylesheets — reads that key (or the OS preference when none is saved) and sets `data-bs-theme` on `<html>`, so a returning dark-mode visitor never sees a white flash.

**System preference.** When no key exists, `prefers-color-scheme` decides. A `change` listener follows the OS **only while no explicit choice is saved**; once the visitor picks a theme, the OS is ignored.

**Coverage.** Bootstrap's `data-bs-theme="dark"` restyles cards, modals, offcanvas, dropdowns, tables, forms, alerts and list groups. A dedicated block in `styles.css` re-skins Alpine Ascents' own components: hero overlay, section surfaces, feature/style/news/education cards, timeline, altitude diagram, gear guidance, gallery cards, Leaflet tiles (a subtle filter — no extra tile provider), popups and controls, map legend, cart drawer and rows, toasts, contact card, footer and ticker.

**Contrast.** Every theme-dependent colour was measured; both themes now report **0 axe colour-contrast violations** (§16).

---

## 10. Expedition checklist

**Placement.** Section `#checklist`, “Plan Your Expedition”, also linked from *Skills & Knowledge → Expedition Checklist*.

**Structure.** Eight categories, 61 items, each with a short practical note:

| Category | Items | Examples |
|---|---|---|
| Clothing and Layers | 8 | base layer, mid layer, insulated jacket, shell, hat, gloves |
| Climbing Equipment | 10 | harness, helmet, ice axe, crampons, rope, carabiners, ascender |
| Footwear | 6 | mountaineering boots, gaiters, socks, camp booties |
| Navigation and Communication | 7 | map and compass, GPS, satellite messenger, spare batteries |
| Food and Hydration | 8 | snacks, meals, stove, fuel, insulated bottle, water treatment |
| First Aid and Safety | 8 | first-aid kit, blister kit, medication, sun cream, headlamp |
| Camping and Sleeping | 7 | tent, sleeping bag, pad, stuff sacks, earplugs |
| Documents and Personal Essentials | 7 | permit, insurance, ID copies, cash, repair kit, waste bag |

**Interaction.**
- Tick or untick any item; completed items are struck through.
- Each category is a native `<details>` element — expand/collapse works with mouse, keyboard and screen readers, and open state survives re-renders.
- Each category header shows `done/total`; the overall bar shows `done of total · percent`.
- Status text: 0 % *Not started* → *Preparation started* → 50 % *Halfway there* → 75 % *Almost ready* → 100 % *Checklist completed*. Percentages are computed, never hard-coded.

**Custom items.** The add form requires a name (1–80 characters) and a category, rejects case-insensitive duplicates inside that category, caps custom items at 50, and renders every value with `textContent` (no HTML injection). Custom items can be removed individually.

**Mountain (optional).** Selecting one of the 16 peaks shows its name, location, elevation and difficulty from `mountains.json`. This is reference data only — the checklist never claims to be route-specific.

**Reset.** “Reset checklist” opens a confirmation dialog. Cancel leaves everything unchanged; confirm clears checked items, custom items and the mountain selection **from the checklist key only**. The dialog says so explicitly.

**Persistence.** Saves on every tick, custom add/remove and mountain change. On load the shape is validated; corrupt JSON resets that key alone.

**Honesty.** The section states that this is a general packing guide, not a route plan, and that equipment, permits and safety measures vary by mountain, route, season and guiding standard.

---

## 11. Shopping cart

**Adding.** Every gear card has **Buy Now** → product dialog → **Add to Cart**. The button carries the product id; adding the same product again increases its quantity instead of creating a second row. A 250 ms guard stops a double-firing event from adding twice.

**Drawer.** The navbar cart button (with count badge) opens a Bootstrap offcanvas drawer showing thumbnails, names, unit prices, −/qty/+, item subtotals and Remove, followed by the summary.

**Quantity.** `−` is disabled at 1, `+` stops at 99, and every change updates the row subtotal, the badge and the totals immediately. Rows are keyed by product id, so no duplicates can appear.

**Removal and undo.** Removing an item shows a toast with **Undo**, which restores it at its previous position with its quantity. The toast auto-hides after 6 s.

**Summary.**

```
Distinct products   2
Total quantity      3
Subtotal            $1,410.00
Estimated total     $1,410.00
```

`Item subtotal = unit price × quantity`; `total = Σ subtotals of priced items`. No shipping, tax, discount or fee exists in this project, so the estimated total equals the subtotal — the drawer says so rather than inventing charges.

**Prices.** `Cart.parsePrice()` converts `650`, `"650"`, `"$650"`, `"$1,200"` to a finite number; anything else becomes `null`. A product without a usable price stays in the cart, is labelled **“Price not listed”**, shows “—” as its subtotal and is excluded from the total, with a visible note that the total is incomplete.

**Empty state.** Icon, friendly message and a **Continue shopping** button which closes the drawer, scrolls to `#equipment`, moves focus to its heading and never reloads the page.

**Persistence.** `alpineAscents_cart` stores ids and quantities only; names, images and prices are read live from `equipment.json`. Corrupt, `null` or non-array data is discarded and the key removed. The old `alpine_ascents_cart_v1` key is migrated once and deleted.

**No commerce.** There is no checkout, payment form, order, reservation or stock claim anywhere. The drawer and the product dialog both state: *“This is a frontend demonstration. Payments and real orders are not supported.”*

---

## 12. Map, geolocation and external services

| Service | Purpose | Data sent | Notes |
|---|---|---|---|
| OpenStreetMap tiles | Map background | Tile coordinates (standard HTTP requests) | Requires internet; a failure message replaces the map |
| OpenStreetMap Nominatim | Reverse geocoding an opt-in location | Latitude/longitude | One request per opt-in, cached in memory, no key stored. [Usage policy](https://operations.osmfoundation.org/policies/nominatim/) · © OpenStreetMap contributors |
| Google Fonts | Typography | Standard font request | Falls back to system fonts |
| jsDelivr / cdnjs | Bootstrap, jQuery, Leaflet, Font Awesome | — | If blocked, the page still renders; Leaflet failure shows a fallback panel |
| YouTube (no-cookie embeds) | Gallery videos | Standard embed requests | Videos are supplementary |

**Geolocation wording used in the UI:** *“Optional. Your location is used to look up a nearby place name. Your coordinates are sent to OpenStreetMap Nominatim for this request and are not stored by this website. Nothing is requested until you press the button.”*

Coordinates are never written to storage. Denied permission, unavailable service, timeouts and network failures each produce a specific message and no console exception.

**Map accessibility.** Markers are `divIcon` markers (focusable, 28 × 28 px hit area) with `title`/`alt`; peaks closer than 26 px collapse into a numbered bubble at the true centroid, and activating the bubble zooms to the members' actual bounds. Coordinates are never altered. The legend and layer toggles show live counts.

---

## 13. Accessibility

**Implemented**
- Semantic landmarks (`header`, `nav`, `main`, 18 `section`s with `aria-labelledby`, `footer`), one `<h1>`, ordered headings.
- Skip link that moves focus into `<main>`; visible focus rings on every interactive surface, including inside dark mode.
- Dropdowns as real `<button>`s with `aria-expanded`/`aria-haspopup`; Escape closes menus and the mobile drawer.
- Dialogs: Bootstrap focus trap, Escape, backdrop, focus returned to the opener (including the gallery thumbnail and Add to Cart button).
- Forms: labels, `aria-invalid`, `aria-describedby` error text, `role="status"`/`aria-live` success, and a character counter.
- Cart and checklist: live-region announcements for add/remove/undo/progress, `aria-pressed`-style state on the theme toggle, `aria-valuenow`/`aria-valuetext` on the progress bar, accessible names on every quantity/remove control.
- Dark mode: both themes measured; text and UI contrasts pass.
- `prefers-reduced-motion`: transitions, marquee, parallax and smooth scrolling are disabled.

**Automated results**
- axe-core 4.10.2 (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), full document, all 94 scroll-revealed sections rendered: **0 violations / 0 nodes / 38 passes in light mode**, and **0 violations / 0 nodes / 38 passes in dark mode**. The empty `#contact` form with its four validation errors visible was also scanned separately: **0 violations**.
- A manual page-wide scan (computed foreground vs. composited background for every text node) reports **0 elements below 3:1** in either theme. This was needed because axe cannot resolve contrast for some `--bs-table-bg` combinations — the manual scan is what caught the dark-mode table text at 1.32:1, since fixed.
- Earlier runs in this project's history found and fixed: an unnamed icon link, a 13 px target-size issue on map controls, overlapping marker targets, and several contrast pairs. Nothing is currently failing.

### Light-mode text palette

One set of semantic tokens drives every text colour; the dark theme redefines the same tokens rather than duplicating rules.

| Token | Light value | On `#ffffff` | On `#f8f9fa` | Dark value |
|---|---|---|---|---|
| `--text-primary` (body) | `#343a40` | 11.51:1 | 10.91:1 | `#e6edf3` |
| `--text-secondary` | `#505a64` | 7.03:1 | 6.67:1 | `#bcc7d2` |
| `--text-muted` | `#59636e` | 6.11:1 | 5.80:1 | `#a9b4c0` |
| headings (`--color-summit`) | `#1a3a5c` | 11.64:1 | 11.05:1 | unchanged (used as text on dark surfaces via `--aa-heading`) |
| `--text-link` | `#0b4a7f` | 9.13:1 | 8.66:1 | `#8ec5ff` |
| `--text-accent-text` | `#a9550f` | 5.26:1 | 4.99:1 | `#f0a556` |
| validation text | `#b02a37` | 6.50:1 | 6.16:1 | `#ff9aa5` |

**Requirement applied:** WCAG 2.1 AA — 4.5:1 for normal text, 3:1 for large text (≥24 px, or ≥18.66 px bold). Every pair above passes at 4.5:1; the accent token is only used for small date/label text and still clears it.

**What changed visually:** body copy moved from `#495057` to `#343a40`; muted/helper/caption text from `#6c757d`/`#5a6067` to `#59636e`; secondary card text to `#505a64`; links from the pale glacier blue `#3b82c4` (3.7:1) to `#0b4a7f`; accent dates from `#e67e22` (2.9:1) to `#a9550f`; form errors from `#dc3545` (4.3:1 on `#f8f9fa`) to `#b02a37`; disabled quantity buttons lost Bootstrap's `opacity: .45` fade in favour of an explicit 5.57:1 pair; and the orange cluster bubble, skip link and hero CTA moved to the darker accent so white text clears 4.5:1.

Bootstrap's `.text-muted`, `.text-secondary`, `.text-body-secondary` and `.text-body-tertiary` are re-pointed at these tokens (the utilities are `!important` in Bootstrap, so the overrides are too). Coloured surfaces — badges, alerts, buttons, dark hero, footer, gallery overlay — keep their own intentional colours and were not flattened.

**Dark mode:** preserved. Only the token definitions were added; the audit caught and fixed a leak where the new light rules also applied in dark mode, plus three pre-existing dark-mode defects the deeper scan exposed (table cells 1.32:1, `.form-label` 1.38:1, `.alert-light` 1.88:1). Theme toggle, persistence and no-flash behaviour were re-tested in both directions.

**Not performed:** screen-reader testing (NVDA, VoiceOver, TalkBack) and automated Lighthouse audits. No claim is made that those passed.

---

## 14. Performance

- 64 photographs stored locally as WebP (≈ 8 MB total) — no image CDN requests at runtime.
- `loading="lazy"` + `decoding="async"` on below-the-fold images, with explicit dimensions where the layout depends on them.
- One CSS file, one request per module, no framework, no bundler, no polyfills.
- Event delegation for repeated controls (filters, gallery, cart, checklist) instead of per-item listeners.
- JSON fetched once and cached in memory by `DataLoader`.
- Animations limited to transform/opacity and disabled under reduced motion.

**Not measured:** Lighthouse scores, first-contentful-paint benchmarks or bundle analysis — no such tooling was available, and none is claimed.

---

## 15. Running the project locally

The site needs an HTTP server: `fetch()` for the eight JSON files is blocked on `file://`.

```bash
# Python (already installed on most systems)
cd "Alpine Ascents"
python -m http.server 8000
# open http://localhost:8000/
```

```powershell
# or with Node
npx serve .
```

VS Code **Live Server** works too — right-click `index.html` → *Open with Live Server*.

**Do not** open `index.html` by double-clicking: the page renders but mountains, equipment, records, organisations, news, education and the checklist stay empty, because the browser refuses cross-origin `file://` requests.

---

## 16. Testing results

**Environment:** Chrome / Chromium on Windows over CDP, served by `python -m http.server`. Firefox, Safari, Edge and physical devices were **not** tested — those are the owner's tests (§18).

### Static checks (this version)

| Check | Result |
|---|---|
| `node --check` on all JavaScript | 14 / 14 pass |
| JSON parse on all datasets | 8 / 8 valid |
| Duplicate HTML ids | 0 (125 unique ids) |
| Internal `#anchor` targets | 0 broken |
| `aria-labelledby` / `aria-controls` / `aria-describedby` / `data-bs-target` targets | 0 broken |
| Local asset references | 67 / 67 resolve |
| External links with `target="_blank"` | 5 / 5 carry `rel="noopener noreferrer"` |
| HTML tag balance (Python `html.parser`) | 0 unclosed / mismatched tags |
| Console errors / requests ≥ 400 | 0 / 0 |

### Dark mode

| Test | Result |
|---|---|
| Toggle light → dark | `data-bs-theme="dark"`, body `rgb(13,17,23)`, label and `aria-pressed` updated, key `dark` |
| Reload | stays dark, no light flash (theme set by the head script before first paint) |
| Toggle → light, reload | stays light |
| No saved key + OS dark | follows the OS; no key written |
| Coverage spot-check | navbar, sections, cards, checklist, cart, both dialogs, map popup, contact, footer, ticker all readable (13–16:1 typical) |
| Cart drawer open while toggling | restyles live, stays open |
| axe, light / dark | 0 / 0 violations |

### Expedition checklist

| Test | Result |
|---|---|
| Initial state | 61 items, 8 categories, 0 %, “Not started”, `aria-valuenow="0"` |
| Tick 1 item | 1/61, 2 %, category 1/8, status “Preparation started” |
| Tick 3 more across categories | 4/61, 7 %, per-category counters correct |
| Untick | 3/61, 5 %, counter back to 0/6 |
| Add custom item | appears in the chosen category, total 61 → 62, saved |
| Duplicate / empty name | “That item is already in this category.” / “Enter a name for the item.”, nothing added |
| Remove custom item | removed, total back to 61, gone from storage |
| Reload | ticks, custom items and mountain selection restored |
| Mountain select | value and info restored after reload; stored only in the checklist key |
| Reset → Cancel | nothing changed, key byte-identical |
| Reset → Confirm | 0 %, “Not started”, custom cleared; **cart and theme keys unchanged** |
| Corrupt key (`{bad json`) | one console warning, key removed, page fully usable, other keys untouched |

### Storage separation

| Test | Result |
|---|---|
| Three populated features | exactly three `alpineAscents_*` keys exist, none shared |
| Theme toggled 3× | cart and checklist values byte-identical |
| Checklist reset | cart and theme values unchanged |
| Cart add/remove/clear | checklist and theme values unchanged |
| Reload | all three restore independently (badge 3, checklist 2/61, theme as chosen) |

### Cart

| Test | Result |
|---|---|
| Key | `alpineAscents_cart`; legacy key migrated then deleted (badge 2, qty 2 after migration) |
| Two products (one ×2) | distinct 2, quantity 3, subtotal $1,410.00, total $1,410.00 (650×2 + 110) |
| Remove | toast + Undo; Undo restores qty 2 and totals |
| Quantity | `−` disabled at 1; + → 2 → 3; totals $650 → $1,300 → $1,950; no duplicate rows |
| Empty state | message + Continue shopping; click scrolls to `#equipment` (scrollY 28316 vs 28397), no reload |
| Unpriced item | “Price not listed”, subtotal “—”, excluded from total, note shown |
| Corrupt storage | reset without error |
| Dark mode | cart text 13–14:1 |

### Existing features (regression)

Navigation and dropdowns, mobile drawer at 375 px (opens, expands a dropdown without closing, closes on selection), gallery lightbox (`3 / 20`, correct alt), mountain dialog, map clusters (4 bubbles, zoom separates), contact form (4 validation errors on empty submit), ticker and live clock — all working in this version.

### Readability pass — 2026-11-04

Measured in Chrome against the composited background of each element (not just the declared colour).

| Element | Foreground / background | Ratio |
|---|---|---|
| `#about` paragraph | `#343a40` / `#f1f5f9` | 10.50:1 |
| `.section-subtitle` | `#59636e` / `#e8eef5` | 5.23:1 |
| Gear `.card-text` | `#505a64` / `#ffffff` | 7.03:1 |
| `.text-muted` (records) | `#59636e` / `#ffffff` | 6.11:1 |
| `.timeline-date` | `#a9550f` / `#ffffff` | 5.26:1 |
| Cart summary `dt` / `dd` | `#59636e` / `#343a40` on `#f8f9fa` | 5.80 / 10.91 |
| Form label / validation | `#1a3a5c` / `#b02a37` on white | 11.64 / 6.50 |
| Footer text / disclaimer | `#a3a5a7` / `#c3c4c6` on `#1a1d23` | 6.81 / 9.70 |
| Disabled quantity button | `#57616b` / `#eef1f4` | 5.57:1 |
| Hero subtitle | `#d1d2d3` on hero composite | 11.14:1 |
| Cluster bubble | `#ffffff` / `#b85c12` | 4.59:1 |

Also verified: the same elements in dark mode (body 8.22:1, subtitle 8.99:1, gear text 7.54:1, muted 7.54:1, cart labels 7.54:1), theme toggle round-trip with persistence, checklist tick/cart add/remove/mountain dialog/gallery/map/contact validation still working, 0 console errors and 0 requests ≥ 400.

**Residual at the time of the scan:** the skip link was 2.85:1 (white on `#e67e22`); it now uses `#b85c12` (4.63:1). No element remains below 3:1.

### Responsive pass — 2026-11-05

Measured in Chrome over CDP at every required width. Defects found, causes and fixes:

| Defect | Cause | Fix |
|---|---|---|
| Navbar wrapped to two rows below 440 px (brand alone on row 1, cart or hamburger orphaned on row 2) | Brand 181 px + visitor chip 40 px + two 44 px buttons + toggler exceeded the row | Visitor chip hidden < 576 px; brand 1.02 rem (0.94 rem < 360); controls 38 px (36 px < 360); container padding 0.65 rem; `#navbar > .container { flex-wrap: nowrap }` |
| Theme/cart buttons collapsed to 17.2 / 19.1 px wide at 1440 px | Flex shrink once the `xxl` nav icons appeared | `flex: 0 0 auto; width/min-width: 44px` |
| Controls sat left of the desktop nav | DOM order (brand, controls, collapse) | `order` at ≥ 1200 px: brand → nav → theme → cart |
| Hamburger visible on the desktop bar | A responsive rule set `display: inline-flex` at all widths | `display: none !important` ≥ 1200 px |
| Clock text ran under the cart icon at 1360–1599 px | Nav + clock + two 44 px buttons exceeded the container | Clock/separator hidden 1360–1599 px (still in the ticker; visible ≥ 1600) |
| Hero CTAs wrapped to two lines, 80 px tall at 360–440 px | Fixed `max-width: 280px` with 16 px text | Single line, `max-width: 340px`, 0.82 rem, `nowrap` |
| Hero wordmark flush with the container edge at 320 px | Fixed 28 px size, 1 px tracking | `clamp(1.55rem, 7vw, 5rem)` + `text-wrap: balance` — ≥ 50 px clear at 320 px |
| Cart badge protruded 1 px outside its button | `top/right: -2px` | Moved inside (1 px), 17 px, ring in the navbar colour |
| Cart quantity steppers were 30 px | Fixed size | 38 px (36 px < 400 px) |
| Empty-cart block stayed in the accessibility tree path | Only a CSS class | Now also toggles the `hidden` attribute |

**Also changed:** the anchor scroll offset is measured from the real navbar height (it was hard-coded at 70 px and wrong whenever the bar changed height), and every local CSS/JS link carries `?v=7` so a redeploy cannot serve stale assets.

#### Viewport results (document `scrollWidth` − `clientWidth`)

| 320 | 360 | 375 | 390 | 440 | 576 | 768 | 1024 | 1071 | 1200 | 1366 | 1440 | 1920 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Navbar height: 60 px at 320, 62 px at 360–440, 68–70.7 px above. One row at every width; brand span never clipped (`scrollWidth == clientWidth` at all 13 widths).

At 360 and 768 every one of the 18 sections reports zero overflow; the only elements past a content box are the types table (inside its own horizontal scroller) and Leaflet's internal panes, both clipped locally by design.

Components at 360: cart drawer 360 px wide with 36 px steppers and no row overflow; mountain dialog 344 px; product dialog 344 px (Add to Cart 312 × 46); lightbox image 342 × 228; expanded checklist category 334 px. All fit.

**Not tested by the developer:**

Firefox · Safari · Edge · real Android/iOS devices · screen readers · Lighthouse · real geolocation permission on a device.

---

### Stability audit — 2026-11-07

| Check | Result |
|---|---|
| Console, fresh load (cache bypassed) | **1 message** — the counter's `info` notice. 0 warnings, 0 errors, 0 unhandled rejections |
| Console, after theme / cart / checklist / dialogs / gallery / map / contact / geolocation exercise | **0 new messages** |
| Failed requests | **0** (8 datasets, 14 modules, 69 images, 3 YouTube embeds, OSM tiles, Fonts, Font Awesome — all 200) |
| JS syntax (`node --check`, 14 modules) | pass |
| JSON (`JSON.parse`, 8 datasets) | pass — checklist 8, education 10, equipment 24, history 20, mountains 16, news 8, organisations 12, records 16 |
| axe-core 4.10.2 full document | **0 violations / 0 nodes** in light and in dark (harness self-test with 3 known-bad nodes returned 3 violations, so the run is real) |
| Storage keys after a full session | `alpineAscents_cart`, `alpineAscents_expeditionChecklist`, `alpineAscents_theme` (plus the counter's own `alpine_ascents_visit_count` / `alpine_ascents_last_visit`); no legacy cart key |
| Responsive regression, 13 widths | overflow **0 px** everywhere; brand never clipped; toggles 36/38/44 px as designed; navbar 60–71 px, one row |

---

## 17. Console and failure audit

Environment: Chrome 146 (Windows x64) over CDP, page served by `python -m http.server` on 127.0.0.1, network cache bypassed for every run so a cached 200 cannot hide a 404.

### What the console actually contained

| Level | Message | Source | Cause / action |
|---|---|---|---|
| `log` | `⛰️ Alpine Ascents SPA Initializing...` | `js/app.js:11` | Developer banner — **removed** |
| `log` | `✅ Alpine Ascents SPA Ready!` | `js/app.js:50` | Developer banner — **removed** |
| `info` | `📊 Visitor Counter Notice: This counter tracks page visits in this browser only…` | `js/counter.js:55` | Kept: it is the honesty notice for the local counter |
| `warn` | `Cart data was unreadable and has been reset.` | `js/cart.js` | Only fires on corrupt storage; kept |
| `warn` | `Checklist data was unreadable and has been reset.` | `js/checklist.js` | Only fires on corrupt storage; kept |
| `warn` | `Theme preference could not be saved.` | `js/theme.js` | Only when storage is blocked; kept |
| `warn` | `Leaflet unavailable — map rendering skipped.` | `js/map.js` | Only when the CDN is blocked; kept |
| `error` | `❌ Error loading <file>: HTTP 404 …` | `js/data-loader.js:45` | Only when a dataset is missing; kept (names the exact file) |

**Final state:** a normal load prints exactly one message — the counter's `info` notice. No warnings, no errors, no unhandled rejections.

### Defects found and fixed

1. **Two banner logs on every load** (`app.js`) — removed; no functional change.
2. **A failed dataset produced a blank section and a console error only.** `DataLoader` now records every failure (`DataLoader.failures`) and `App.renderDataStatus()` renders a dismiss-less warning pinned below the fixed navbar, naming each file and its HTTP error, with a hint about `data/` and `file://`. Each data-driven section also renders a `.data-empty` panel ("Mountain data could not be loaded. Check data/mountains.json.") instead of an empty grid.
3. **The failure banner sat 55 px under the fixed navbar.** Repositioned as a fixed banner at `top: 78px` (68 px on phones); measured clearance is now 23 px below the navbar.
4. **38 `net::ERR_ABORTED` tile requests** during zoom/pan — Leaflet requesting tiles for every intermediate zoom step. The tile layer now uses `updateWhenIdle: true`, `updateWhenZooming: false` and `keepBuffer: 3`. These were never application errors (Leaflet cancels superseded tiles by design), but the churn is reduced.
5. **No `#data-status` element existed** in the markup — added, `hidden` by default, `role="alert"`, `aria-live="polite"`.

### Failure test performed

With `data/mountains.json` and (separately) `data/news.json` renamed on disk:

- Console: exactly one `error` naming the missing file — no cascade, no exception.
- `#data-status`: visible, text "One data file could not be loaded.", list item "`mountains.json — HTTP 404: Failed to load mountains.json`", hint line; top edge 94 px vs navbar bottom 71 px.
- `#mountains-container`: one `.data-empty` panel, zero cards.
- Everything else kept working: 24 equipment cards, 61 checklist items, 8 news articles (when mountains were missing), 16 gallery tiles (the 4 mountain-derived tiles correctly absent), map re-clustered to organisations only (legend "Peak (0) / Organisation (12)").
- `#checklist-mountain` degraded to its single default option instead of throwing.
- After restoring the files, a cache-bypassed reload returned to zero errors and the notice disappeared.

### The `powerPreference` WebGPU warning

```
The powerPreference option is currently ignored when calling requestAdapter() on Windows.  VM308:1
```

**Investigation:** `navigator.gpu`, `requestAdapter` and `powerPreference` appear **nowhere** in the project — 0 matches across `index.html`, all 14 modules and the stylesheet. None of the loaded libraries (jQuery 3.7, Bootstrap 5.3, Leaflet 1.9, Font Awesome, Google Fonts) creates a WebGPU adapter. No WebGPU/Dawn resource is requested by the page. Loading the site in this build produced **0 occurrences** of the warning, and `about:blank` in the same browser also produced **0**.

**Conclusion:** it is not Alpine Ascents code. `VM308:1` is an evaluated/injected script, not a file under `/js/` or a CDN URL; that pattern is typical of a browser extension (AI assistants, screen recorders, GPU/performance overlays) or a DevTools extension injecting into every page. **No change was made to the site** — suppressing it would require monkey-patching `navigator.gpu.requestAdapter`, which this project deliberately does not do.

**To confirm on your machine:** open DevTools → Sources → check the "Content scripts"/extension frames, or reload in Incognito with extensions disabled; if the warning disappears, an extension is the source. Also check `chrome://gpu` for driver-level messages.

---

## 18. Known limitations

1. **No backend.** Nothing is submitted anywhere; the contact form only proves that validation works.
2. **No commerce.** The cart is a front-end kit list: no checkout, payment, order, reservation or stock data.
3. **Local storage only.** Theme, checklist and cart are per browser; clearing site data removes all three, and they do not sync between devices.
4. **Checklist is generic.** It cannot know a specific route's requirements; the section says so.
5. **External dependencies.** Map tiles, fonts, CDNs and video embeds need a connection; each failure degrades gracefully but the features are unavailable.
6. **Geolocation** needs explicit permission and a network request to Nominatim; it is optional and nothing else depends on it.
7. **Records and news are curated, not live.** News distinguishes articles from reference pages; dates are shown as published/reviewed.
8. **Two dialogs share the map link.** “View on map” reuses the existing map rather than opening a second instance.
9. **Screen-reader testing and Lighthouse remain outstanding**, so no conformance claim beyond the automated axe results is made.
10. **Photographs are placeholders** until the owner replaces them; several equipment photos are only loosely representative.

---

## 19. Owner testing checklist

- [ ] Replace the photographs in `assets/images/**` (keep filenames, or update `mountains.json`, `equipment.json` and `js/gallery.js`), then update `CREDITS.md`.
- [ ] Serve the folder over HTTP (`python -m http.server`) and confirm all eight datasets load.
- [ ] Chrome: theme toggle → reload → theme persists; no white flash.
- [ ] Chrome: tick checklist items, add and remove a custom item, reload, confirm persistence.
- [ ] Chrome: add two products, refresh, confirm badge, quantities and totals.
- [ ] Chrome: remove an item → Undo; clear cart → empty state → Continue shopping.
- [ ] Confirm one key per feature in DevTools → Application → Local Storage (`alpineAscents_theme`, `alpineAscents_expeditionChecklist`, `alpineAscents_cart`).
- [ ] Firefox: layout, dropdowns, dialogs, drawer, dark mode.
- [ ] Edge: same pass.
- [ ] Safari (macOS/iOS): theme flash, backdrop-filter, `:has`-free selectors, sticky/fixed elements.
- [ ] Real Android and iOS: navbar, cart drawer, checklist, swipe in the lightbox, tap targets.
- [ ] Geolocation: allow and deny, with Wi-Fi off, to see the error paths.
- [ ] Screen reader: NVDA or VoiceOver through navigation → dialog → cart → checklist.
- [ ] Optional: Lighthouse run for performance/accessibility records.
- [ ] Rebuild the submission ZIP from the folder (exclude any existing ZIP).

---

## 20. Licence

MIT for the code, CSS and SVG assets — full text in [`LICENSE`](LICENSE). Photographs are Unsplash-licensed; per-file sources are listed in [`assets/images/CREDITS.md`](assets/images/CREDITS.md). Bootstrap, jQuery, Leaflet and Font Awesome keep their own licences. “Alpine Ascents” is a fictional brand created for this coursework.

---

## 21. Development log

| Pass | Work |
|---|---|
| 1 | Audited the inherited build; established the 17-section SPA, modular JS and JSON datasets |
| 2 | Removed a stray character before the doctype, fixed quirks mode, responsive overflow at 320/1200 px, contact error placement, lightbox layering, contrast and counter fallback; localised 64 photos as WebP with credits |
| 3 | Rebuilt the gallery lightbox (prev/next, counter, captions, keys), rewrote the map (focusable markers, legend, popups, error states), added gear guidance and technique levels, fixed axe findings |
| 4 | Added mountain and gear dialogs, custom clustering with true coordinates, swipe navigation, README overhaul |
| 5 | Added the cart (module, drawer, badge, toast, persistence), fixed a lost-dialog regression, focus loss after Add to Cart, drawer width at 320 px, contrast regressions |
| 6 | Dark mode with three-key storage separation, interactive expedition checklist, cart summary/undo/continue-shopping, README rewritten to match the code |
| 7 | light-mode readability: semantic text tokens, darker body/muted/link/accent text, Bootstrap utility overrides, accessible disabled and validation states, dark-mode token parity; fixed a light-rule leak into dark mode plus three pre-existing dark contrast defects |
| 8 | Mobile responsiveness pass: one-row navbar 320–440 px, fixed 44 px controls, right-aligned desktop controls, hidden desktop hamburger, clamp() hero type, 10 px Add-to-Cart buttons, measured scroll offset |
| 9 | Console and failure audit: removed banner logs, added the data-failure banner and per-section empty panels, reduced tile churn, documented the external WebGPU warning |
| 10 | Header reorganization, tracker restoration and responsive polish: restructured `<header id="site-header">` (brand left, central header with restored tracker pill positioned above horizontal nav links, external controls with theme toggle and cart outside nav on right); mobile first responsive verification at 360 px and 440 px up to 1920 px |
| 11 | **Current pass** — Content authenticity audit, factual corrections and source transparency: comprehensive verification of news (8), records (16), history milestones (20), and expedition success stories (6); implemented mandatory corrections (Kami Rita 32 summits, Yuichiro Miura 80y 223d oldest man, Steven Plain Seven Summits, Ed Viesturs 1st American/6th overall without O2, Project Possible 8000ers.com true summit context, K2 1954 Bonatti-Mehdi bivouac & CAI 2007 report, electronic tracking rule); verified all quotes with authentic attributions; added subtle content classification badges and authoritative source links |

---

*Educational project — not a substitute for professional mountaineering instruction, guiding or medical advice.*
