# Kitchen Set Shortlist - Master Project Guideline

**Audience:** A university student learning to build with Codex  
**Build mode:** One supervised phase at a time  
**Prerequisites:** Codex, GitHub, Vercel, and a SerpApi account/API key  
**Deployment:** GitHub and Vercel  
**MVP target:** A live website that searches Amazon.com for kitchen utensil sets, applies a US ZIP code and price range, and explains a ranked top-five shortlist.

---

## 1. Project goal

Build a small product-comparison website for US Amazon shoppers who feel overwhelmed by similar kitchen utensil sets.

The completed MVP lets a shopper:

- enter a kitchen-utensil-set search phrase;
- enter a five-digit US ZIP code;
- set a minimum and maximum price in US dollars;
- request current Amazon.com search results through a server-side API route;
- exclude results outside the price range and results reported as unavailable;
- receive up to five ranked recommendations;
- understand the ranking through visible evidence;
- open the original Amazon listing in a new tab;
- use the site at normal laptop and phone widths.

This is a fixed comparison workflow, not an autonomous shopping agent. The student directs Codex, tests observable behavior, and publishes a working checkpoint after each phase.

---

## 2. MVP pitch

**Kitchen Set Shortlist helps US Amazon shoppers turn a crowded search for kitchen utensil sets into five understandable choices. A shopper supplies a search phrase, ZIP code, and budget; the site checks current listings, removes unsuitable products, and ranks the remaining options by price, rating, and recent-purchase evidence.**

---

## 3. Jobs-to-be-Done statement

> When I face many similar kitchen utensil sets online, I want to quickly compare trustworthy choices within my budget and delivery area, so I can confidently make a good-value purchase without spending hours researching individual listings.

- **Functional job:** Find and compare suitable kitchen utensil sets.
- **Emotional job:** Feel confident instead of overwhelmed.
- **Social job:** Make a sensible purchase that is easy to justify to myself or others.

The statement remains solution-agnostic: it describes the shopper's situation, motivation, and desired progress rather than naming this website.

---

## 4. Primary user and scope

### Primary user

A shopper using Amazon.com in the United States who wants a practical kitchen utensil set at an acceptable price and does not want to inspect many listings manually.

### Included in the MVP

- Amazon.com only.
- Kitchen utensil sets only.
- One search at a time.
- One five-digit US ZIP code per search.
- One user-defined minimum and maximum price.
- Up to five recommendations.
- Current product data supplied by SerpApi.
- Evidence-based, deterministic ranking without an LLM.
- Direct links to Amazon for final verification and purchase.

### Important product truth

The website is a research aid, not the seller. Prices, stock, variants, discounts, and delivery information can change. Show a retrieval timestamp and tell the user to confirm final details on Amazon. Never claim an exact delivery promise unless the provider explicitly returned it.

---

## 5. Required page layout

### A. Header

- Product name: **Kitchen Set Shortlist**
- One short subtitle explaining the benefit.

### B. Search panel

Required controls:

- Search phrase, with an example such as `silicone kitchen utensil set`.
- US ZIP code.
- Minimum price in USD.
- Maximum price in USD.
- Primary button: **Find My Top 5**.

Show short privacy text explaining that only the ZIP code, not a full address, is requested.

### C. Status area

One shared status area above the results must show:

- idle guidance;
- validation messages;
- loading state;
- retrieval timestamp;
- empty state;
- readable API or network errors.

### D. Results area

Show up to five cards in recommendation order. Each card must include:

- rank badge `#1` through `#5` in the upper-left corner;
- product image;
- product title;
- current price;
- material, when supplied;
- star rating;
- recent-purchase signal, such as `1K+ bought in past month`, when supplied;
- size, when applicable;
- number of tools/pieces in the set, when supplied;
- color choices, when supplied;
- availability or delivery evidence returned for the selected ZIP;
- a short **Why this ranked here** explanation;
- **View on Amazon** link opening in a new tab.

Use **Not provided** for a missing scalar field and an equivalent clear label for a missing list. Do not infer product facts from an image or invent values.

---

## 6. Ranking rules

### Eligibility gates

A product may enter the ranked list only when:

1. it has an ASIN or stable product identifier;
2. it has a valid Amazon product URL;
3. it has a numeric current price;
4. its price is within the user's inclusive minimum/maximum range;
5. it was returned for the selected ZIP and is not explicitly marked unavailable or out of stock.

The UI must still tell the shopper to confirm final availability on Amazon.

### Starting score

Use a transparent score from 0 to 100 with equal starting weights:

| Component | Weight | Meaning |
|---|---:|---|
| Price | 33.33% | Lower qualifying prices score higher within the candidate set. |
| Rating | 33.33% | Higher star ratings score higher. |
| Popularity | 33.34% | A larger numeric recent-purchase signal scores higher. |

Rules:

- Convert every component to a 0-to-1 value before applying its weight.
- Parse only explicit popularity text returned by the provider; do not treat review count as sales count.
- Missing rating or popularity evidence receives zero for that component and a visible low-data-confidence note.
- If every candidate has the same value for a component, give every candidate the same full component score.
- Break a tied total score by higher rating, then lower price, then stable source order.
- Keep the calculation in one documented function so weights can be changed later without rewriting the UI.

Every card should explain the strongest available reasons for its position in plain language. Explanations must be generated from the normalized data and score components, not invented by an AI model.

---

## 7. Normalized product shape

Every product passed to the renderer must use this stable shape:

```js
{
  id: "ASIN-or-stable-id",
  asin: "B000000000",
  title: "Product title",
  imageUrl: "https://...",
  amazonUrl: "https://www.amazon.com/...",
  price: 29.99,
  currency: "USD",
  material: "Silicone",
  size: "",
  pieceCount: null,
  colorOptions: [],
  rating: 4.6,
  reviewCount: 2400,
  boughtLastMonthText: "1K+ bought in past month",
  boughtLastMonthLowerBound: 1000,
  availability: "Available for selected ZIP",
  deliverySummary: "",
  score: 87.4,
  rank: 1,
  reasons: [],
  dataConfidence: "high"
}
```

Never omit keys. Use `""` for missing text, `null` for missing numbers, and `[]` for missing lists.

---

## 8. Build phases

Codex receives this entire document but implements only the phase explicitly requested. Each phase ends at a stop gate.

## PHASE 0 - Foundation and deployment smoke test

### Goal

Prove the complete publishing path and create stable seams that later phases can extend without rewriting working code.

### Build

Create the foundation described in `TechnicalGuideline.md`, including:

- `.gitignore` first;
- `index.html`;
- `style.css`;
- `app.js`;
- `ui.js`;
- `source.js`;
- `config.js`;
- `data/sample.json`;
- `CONTRACTS.md`;
- `CHECKS.md`;
- `README.md`.

Use sample product data only. Do not call SerpApi, create an API route, or request an API key in this phase. The page should demonstrate all visible states using the sample source.

Suggested smoke-test copy:

> **Your Kitchen Shortlist Is Ready to Begin.**  
> Codex -> GitHub -> Vercel: ALIVE

### Acceptance criteria

1. Every required foundation file exists.
2. `.gitignore` contains `.env`, `.env.local`, `node_modules`, and `.DS_Store` before any secret exists.
3. The sample action renders normalized product cards.
4. Busy, status, empty, and error states have each been visibly exercised.
5. `app.js` performs wiring only and does not render or fetch directly.
6. `ui.js` owns visible state and rendering.
7. `source.js` is the browser's only data-entry point.
8. Tunable public values live in `config.js`.
9. The layout is usable at 375px wide.
10. The local page has no console errors.
11. A Git checkpoint is created and pushed.
12. The public Vercel URL works in another browser.

### Suggested commit

`Phase 0 - foundation and deployment smoke test`

### STOP GATE

Do not begin Phase 1 until the public page works and every Phase 0 acceptance criterion has been reported as pass or fail.

---

## PHASE 1 - Live Amazon search and eligibility filtering

### Goal

Replace the sample implementation inside `source.load(params)` with a live server-side search while preserving all Phase 0 contracts and visible states.

### Required behavior

1. User enters a search phrase, ZIP code, minimum price, and maximum price.
2. Frontend validates presence and basic formats.
3. `source.load(params)` sends one same-origin request to `POST /api/products/search`.
4. The server validates all inputs again.
5. The server reads `SERPAPI_KEY` from its environment.
6. The server calls the SerpApi Amazon Search API for `amazon.com`, using the search phrase and `delivery_zip`.
7. The server normalizes the provider response and returns only the fields the frontend needs.
8. Products without a numeric price, outside the inclusive price range, or explicitly unavailable are excluded.
9. The page renders the qualifying results with basic evidence.
10. Existing sample mode remains available only as a documented development fallback, controlled by configuration.

### Limits

- One search request per button press.
- No automatic pagination in this phase.
- Maximum candidate count comes from `config.js`.
- Ignore sponsored-result status for ranking; do not give sponsored items a scoring advantage.
- No product-detail enrichment yet.
- No direct browser request to SerpApi or Amazon.
- No raw provider response returned to the browser.

### Acceptance criteria

1. All Phase 0 checks still pass.
2. Valid inputs produce current Amazon.com search results.
3. The request includes the supplied five-digit ZIP as `delivery_zip`.
4. Invalid ZIP, blank query, invalid prices, and minimum greater than maximum receive readable messages.
5. Products outside the price range do not appear.
6. Explicitly unavailable products do not appear.
7. A valid search with no qualifying results shows the empty state.
8. Missing or invalid `SERPAPI_KEY` shows a safe, retryable error.
9. The key never appears in browser code, Git, logs, or JSON responses.
10. Provider failure or timeout does not produce a blank page.
11. Result cards link to valid Amazon pages in new tabs using `noopener noreferrer`.
12. Production validation passes and the public Vercel version works.

### Suggested commit

`Phase 1 - live Amazon search and filters`

### STOP GATE

Report files changed, API requests used per search, dependencies added, checks performed, and unresolved data gaps. Stop before Phase 2.

---

## PHASE 2 - Top-five ranking, detail enrichment, and polish

### Goal

Turn the qualifying live results into a clear, evidence-based shortlist and finish the MVP without adding a new technology.

### Required behavior

1. Calculate the documented price, rating, and popularity scores.
2. Select no more than five finalists.
3. Retrieve product details only for those finalists, with a hard maximum of five detail requests per user search.
4. Normalize available material, size, piece count, color choices, availability, and delivery evidence.
5. Render final cards in score order with rank badges and factual explanations.
6. Display **Not provided** when a field is absent.
7. Show the retrieval time and a reminder to confirm final price and availability on Amazon.
8. Finish responsive, keyboard, focus, loading, empty, and error behavior.

### API-usage guardrail

A completed search may use at most:

- one Amazon Search API request; and
- five Amazon Product detail requests.

Therefore, the maximum is six provider requests per user action. Do not retry automatically more than once, paginate automatically, or enrich products outside the five finalists.

### Acceptance criteria

1. All earlier checks still pass.
2. No more than five final cards appear.
3. Rank badges run consecutively from `#1`.
4. The same normalized inputs always produce the same ranking.
5. Price, rating, and popularity each use the documented weights.
6. Missing evidence is labeled and never invented.
7. Each card has a concise, data-grounded ranking explanation.
8. Material, size, piece count, and colors appear when the provider supplies them.
9. One failed detail request does not cancel other finalists.
10. Provider usage never exceeds six requests per user action.
11. The interface remains usable at 375px and normal laptop width.
12. Buttons disable while working and re-enable after success or failure.
13. Keyboard focus and labels are understandable.
14. No secret is exposed.
15. Production validation passes and the public Vercel version works.

### Suggested commit

`Phase 2 - ranked top five and product details`

### STOP GATE

Run the complete regression checklist, report every acceptance result, list missing provider fields observed during testing, and stop. The MVP is complete only when the public version passes.

---

## 9. Error-handling rules

Handle at minimum:

- blank or overly long search phrase;
- malformed ZIP code;
- missing, negative, or non-numeric price;
- minimum price greater than maximum price;
- no qualifying products;
- missing price, rating, popularity, image, or product detail;
- missing API key;
- provider authentication, rate-limit, timeout, and non-200 errors;
- malformed provider response;
- one or more failed detail requests;
- frontend network failure;
- Amazon data changing between search and click-through.

The application must never fail into a blank page or show a stack trace/raw provider response to the shopper.

---

## 10. Explicitly out of scope

Do not add:

- Taobao, Pinduoduo, or another marketplace;
- categories other than kitchen utensil sets;
- login, accounts, profiles, or saved searches;
- database or persistent history;
- shopping cart, checkout, payment, or order placement;
- affiliate monetization unless separately approved;
- exact stock counts or guaranteed delivery dates;
- price tracking, scheduled jobs, alerts, or email;
- LLM calls, review summarization, chat, RAG, or agents;
- Firecrawl or direct Amazon scraping;
- browser automation;
- a frontend framework, CSS framework, or design system;
- analytics, Docker, or custom CI/CD;
- elaborate animation.

If Codex believes an excluded item is required, it must stop and explain why instead of adding it.

---

## 11. Codex operating instructions

### Before editing

1. Read this entire file and `TechnicalGuideline.md`.
2. Read `CONTRACTS.md` and `CHECKS.md` when they exist.
3. Inspect the repository and identify the current phase.
4. State the smallest expected file changes.
5. State whether the request would alter a protected contract.
6. If a protected contract must change, stop and ask before editing.

### While editing

- Implement only the named phase.
- Work additively and preserve previously passed behavior.
- Keep data access inside `source.js` on the browser side and server-side API routes behind it.
- Keep visible state inside `ui.js`.
- Put tunable public values in `config.js`.
- Add the minimum dependencies.
- Keep secrets server-side.
- Do not redesign while debugging.

### If something fails

Use this sequence:

1. Observe one symptom.
2. Reproduce it.
3. Identify the smallest likely cause.
4. Change one thing.
5. Retest that symptom and the regression checklist.

### After editing

Codex should:

1. run the project locally;
2. run available syntax/build validation;
3. execute the current phase acceptance criteria;
4. rerun all earlier regression checks;
5. inspect tracked files for secret leakage;
6. report files changed, dependencies, tests, API-call count, and unresolved issues;
7. create the requested Git checkpoint and push only after the phase works;
8. test the deployed Vercel URL;
9. stop at the phase gate.

The student should not need to type routine terminal commands manually.

---

## 12. Definition of done

Another shopper can open the public URL without coaching, enter a kitchen-utensil-set query, five-digit US ZIP code, and price range, then receive up to five ranked products with understandable evidence and working Amazon links. The experience remains honest about missing data and changing marketplace conditions, works on laptop and phone widths, and exposes no credentials.

