# Kitchen Set Shortlist - Technical Guidelines, Guardrails, and Permissions

**Project:** Kitchen Set Shortlist

**Category:** Accounts plus live APIs, without end-user accounts

**Audience:** Codex and the student
**Purpose:** Keep the three-phase build secure, understandable, inexpensive to test, and resistant to later-phase rewrites.

---

## 1. Core build philosophy

Optimize for:

1. one small, fixed stack;
2. named seams between input, data access, and rendering;
3. natural-language operation through Codex;
4. small observable phases;
5. additive changes rather than rewrites;
6. stable data contracts;
7. least-privilege permissions;
8. bounded external API usage;
9. public acceptance testing after each checkpoint.

Codex handles routine implementation and commands. The student focuses on intent, inspection, testing, and judgment.

---

## 2. Approved stack

Use only:

- HTML;
- CSS with custom properties;
- plain browser JavaScript using ES modules;
- Vercel serverless Node.js API routes;
- the built-in `fetch` and `URL`/`URLSearchParams` APIs;
- Firecrawl Search and Scrape capabilities through its REST API;
- Git and GitHub;
- Vercel.

No frontend framework, CSS framework, bundler, UI library, state library, linter, test runner, or database is required for the MVP. Do not install a package when a standard platform API is sufficient.

### Why Firecrawl is used

Firecrawl officially documents Amazon product discovery and structured product-page extraction. The preferred MVP flow uses Firecrawl Search restricted to `amazon.com`, with bounded scrape options and a product JSON schema. This gives the project one provider for discovery and extraction while keeping ranking deterministic in project code.

Firecrawl's ordinary Search/Scrape flow provides general US-facing Amazon.com content; it does not guarantee ZIP-specific stock or delivery. Do not use Interact to set a delivery address in this MVP. Keep Firecrawl behind the project's own normalized route so the interface does not depend on provider-specific fields.

Reference documentation:

- <https://docs.firecrawl.dev/developer-guides/common-sites/amazon>
- <https://docs.firecrawl.dev/api-reference/endpoint/search>
- <https://docs.firecrawl.dev/api-reference/endpoint/scrape>

Provider responses and terms can change. Recheck the documentation before implementing Phase 1 and record any contract difference before coding.

---

## 3. Phase map

### Phase 0 - Foundation and deployment smoke test

- Sample data only.
- No packages, API route, API key, or live product data.
- Create stable file, UI, source, configuration, and data contracts.
- Publish the foundation to Vercel.

### Phase 1 - Live Amazon search and filtering

- Add `POST /api/products/search`.
- Connect only the inside of `source.load(params)` to the same-origin route.
- Validate query and price range twice: frontend for usability, backend for trust.
- Normalize and limit the provider response.

### Phase 2 - Ranking, detail enrichment, and polish

- Add deterministic ranking.
- Expand the bounded Firecrawl JSON schema for richer evidence while keeping the result-page cap unchanged.
- Enrich only within the same restricted candidate set.
- Complete responsive and reliability behavior without adding technology.

---

## 4. Required foundation structure

Create exactly this foundation in Phase 0:

```text
index.html          Markup only
style.css           All visual styling
app.js              Event and workflow wiring only
ui.js               Every visible state and renderer
source.js           The browser's only data-entry point
config.js           Public, non-secret tunable values
data/sample.json    Hand-written products in the final shape
CONTRACTS.md        Stable names, shapes, and DOM IDs
CHECKS.md           Fast cumulative regression checklist
README.md           Purpose, local use, phases, and deployment
.gitignore          Secret, dependency, and OS exclusions
```

Phase 1 may add only what is needed for the live integration:

```text
api/products/search.js    Validated Firecrawl search/extraction proxy
package.json              Only if Vercel/runtime configuration requires it
```

Create `.gitignore` first. It must contain at least:

```gitignore
.env
.env.local
node_modules
.DS_Store
```

Do not put API keys, example keys, copied provider responses, or user search inputs in committed files.

---

## 5. Module boundaries

### `index.html`

May contain:

- semantic markup;
- labels and controls;
- one status region;
- one results region;
- the ES-module entry script.

Must not contain inline JavaScript, inline CSS, product data, or secrets.

### `app.js`

Owns workflow wiring only:

- reads submitted values;
- performs friendly first-pass validation;
- calls `source` methods;
- calls exported `ui` functions;
- coordinates busy/success/error flow.

It must not call `fetch`, render HTML, alter `innerHTML`, or contain provider-specific field names.

### `ui.js`

Owns every visible state. Export these exact functions from Phase 0:

```js
setBusy(isBusy)
setStatus(message)
showError(message)
showEmpty(message)
renderList(items)
clearResults()
```

`renderList(items)` receives only normalized product objects. It must not fetch, score products, inspect Firecrawl fields, or read environment variables.

### `source.js`

The browser's only data-entry point. Export one object named `source` with these permanent async methods:

```js
source.load(params)
source.detail(id)
source.save(record)
source.list()
```

Phase 0 behavior:

- `load` returns normalized sample products.
- `detail` returns one normalized sample product only while demonstrating Phase 0 states.
- `save` throws `Saving is not used in this project.`
- `list` returns `[]`.

Phase 1 changes only the inside of `load` so it calls the same-origin search route. After sample-state testing, `detail` throws `Separate detail loading is not used in this project.` Phase 2 enriches the bounded server response rather than adding browser-side provider calls. Do not expose Firecrawl URLs or its API key here.

### `config.js`

Export one frozen public configuration object. It should hold values such as:

- sample-data path;
- same-origin route paths;
- maximum query length;
- candidate limit;
- finalist limit of five;
- Firecrawl result-page limit of ten;
- maximum accepted Firecrawl credits for one action, if the current API exposes enforceable credit controls;
- request timeout;
- scoring weights;
- feature flags for sample/live mode;
- user-facing fallback text.

No secret belongs in `config.js`. A value is not public merely because it is configurable.

---

## 6. Protected contracts

`CONTRACTS.md` must record:

1. every key and type in the normalized product object;
2. the rule that keys are never omitted;
3. missing-value rules: `""`, `null`, or `[]`;
4. all DOM IDs used by JavaScript;
5. the six `ui.js` function names;
6. the four `source.js` method names;
7. route request/response shapes;
8. scoring weights and tie-break order;
9. a heading named **DO NOT CHANGE WITHOUT ASKING** containing all protected names and shapes.

Codex must stop and ask before changing anything under that heading. It may extend an object only after updating the contract deliberately and proving older rendering remains safe.

---

## 7. Frontend and backend responsibilities

### Frontend may

- collect query and price inputs;
- perform usability validation;
- call same-origin project routes through `source.js`;
- render normalized products and readable states;
- open original Amazon links.

### Frontend must not

- contain or receive `FIRECRAWL_API_KEY`;
- call Firecrawl or Amazon directly;
- interpret raw provider responses;
- claim that missing values are known;
- claim ZIP-specific or exact-delivery availability;
- calculate provider availability independently.

### Backend may

- validate untrusted inputs;
- read `FIRECRAWL_API_KEY`;
- call the approved Firecrawl Search endpoint with bounded scrape options;
- filter, score, normalize, and limit responses;
- return safe structured errors;
- apply timeouts and bounded retries.

### Backend must not

- log secrets or full request URLs containing the key;
- return raw provider responses;
- persist search phrases;
- accept a caller-supplied provider URL;
- fetch arbitrary URLs;
- scrape Amazon directly outside the approved Firecrawl request;
- exceed the per-action request cap.

---

## 8. API contracts

### `POST /api/products/search`

Request:

```json
{
  "query": "silicone kitchen utensil set",
  "minPrice": 20,
  "maxPrice": 60
}
```

Validation:

- JSON body only;
- `query` trimmed, 2 to the configured maximum characters;
- finite numeric prices greater than or equal to zero;
- `minPrice <= maxPrice`;
- reject unexpected methods with 405;
- return readable 400 errors for invalid input.

Provider request:

- `POST https://api.firecrawl.dev/v2/search`;
- `query` combines the validated phrase with the required kitchen-utensil-set context;
- `sources` contains web results only;
- `includeDomains` contains only `amazon.com`;
- `country` is `US` and `location` is a general United States search context;
- `limit` is at most ten;
- `ignoreInvalidURLs` is true;
- `scrapeOptions` requests only main content and a tightly scoped product JSON schema;
- scrape location uses country `US` and language `en-US`;
- the Bearer API key is added only on the server;
- apply the configured timeout.

The schema should request only fields needed by the product contract. Firecrawl JSON extraction may use provider-managed extraction internally, but the project must not call a separate LLM or use generated prose for ranking.

Success response:

```json
{
  "items": [],
  "retrievedAt": "2026-09-13T00:00:00.000Z",
  "marketplace": "Amazon.com (US)",
  "notice": "Availability is general. Confirm final price, stock, and delivery on Amazon."
}
```

Do not echo the query unnecessarily in logs, and do not persist it.

### No separate public detail route

This MVP does not expose a browser-callable product-detail route. Phase 2 enriches the server-side JSON schema used by the bounded Search flow. This prevents the browser from triggering unbounded per-product requests and keeps one user action within one controlled provider operation.

### Error response

All project routes use a small stable shape:

```json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Product information is temporarily unavailable. Please try again."
  }
}
```

Never include a stack trace, API key, full upstream URL, raw body, or internal exception in a public response.

---

## 9. Data normalization rules

- Normalize Firecrawl results on the server before data reaches `source.js`.
- Deduplicate by ASIN before filtering and ranking.
- Prefer a clean Amazon product URL supplied by the provider.
- Require a numeric price for eligibility.
- Keep displayed currency fixed to USD for the Amazon.com MVP.
- Preserve a provider's explicit recent-purchase phrase and separately parse a conservative numeric lower bound.
- Support common suffixes such as `K+` and `M+`; unrecognized text remains visible but produces `null` numeric popularity.
- Never substitute review count for units sold.
- Material, size, piece count, and colors may come only from Firecrawl's structured extraction of visible Amazon product-page evidence.
- Do not use title guessing when structured data contradicts it.
- If a field is unavailable, use the contract's missing value and show **Not provided**.
- Strip markup and limit text lengths before returning data.
- Allow only `https:` image and product URLs from expected Amazon/provider hosts; otherwise use a safe placeholder or blank value.

---

## 10. Ranking implementation

Keep the scoring functions pure and deterministic. Given the same candidates, they must return the same order.

### Component scores

- **Price:** normalize qualifying prices within the candidate set, with the lowest price receiving the highest score.
- **Rating:** `rating / 5`, clamped from 0 to 1.
- **Popularity:** divide the parsed lower-bound value by the largest parsed value in the candidate set, clamped from 0 to 1.

If all candidates share one component value, give them equal full credit for that component. A missing rating or parsed popularity receives zero and creates a low-data-confidence note.

### Total

```text
total =
  priceScore * 0.3333 +
  ratingScore * 0.3333 +
  popularityScore * 0.3334
```

Multiply by 100 and round only for display. Sort using the unrounded value. Break ties by:

1. higher rating;
2. lower price;
3. original stable source position.

Explanations must cite facts already present on the card, for example: good relative price, strong rating, or high recent-purchase signal. Do not make a separate LLM call for explanations or ranking.

---

## 11. API usage and cost guardrails

- Use at most one Firecrawl Search operation per user action.
- Set the Search result limit to ten or fewer; never scrape more than ten Amazon result pages per action.
- In Phase 2, enrich only the same bounded candidate set by expanding the schema; do not add per-card browser calls.
- Never auto-paginate.
- Do not run background searches.
- Disable the submit button while a request is active.
- Use one bounded retry only for a clearly transient 429 or 5xx response, respecting `Retry-After` where practical.
- Do not retry validation or authentication failures.
- Put timeouts and result limits in configuration.
- During development, prefer sample mode for UI work and reserve live calls for integration acceptance tests.
- Report the Firecrawl operation count, result-page count, and returned `creditsUsed` after each live test when available.

If the current Firecrawl plan cannot support the acceptance tests, stop and explain the quota/cost constraint. Do not silently switch providers, use Interact, or implement a custom scraper.

---

## 12. Secret and privacy rules

Use the server-side environment variable:

```text
FIRECRAWL_API_KEY
```

### Local

Store it in `.env.local`. The file must be ignored before the key is added.

### Vercel

Add it in the selected project's environment-variable settings and redeploy when necessary.

### Never

- hard-code the key;
- put it in browser JavaScript, HTML, sample JSON, documentation examples, screenshots, or commits;
- print it or a URL containing it;
- return it to the browser;
- send it to any service other than the approved provider.

Treat search phrases as transient user input. Do not persist them, add analytics around them, or place them in server logs.

---

## 13. UI and accessibility rules

- Use a clear, harmonious palette defined with CSS custom properties at `:root`.
- Maintain readable contrast and visible keyboard focus.
- Use semantic labels for every input.
- Use an `aria-live` status region for loading, empty, and error messages.
- Put the rank badge in the upper-left of each card without covering the product image or text.
- Provide useful image alt text based on the title; use an empty alt value for purely decorative placeholders.
- Do not communicate rank or availability through color alone.
- Keep animation unnecessary; respect reduced-motion preferences if any transition is added.
- Include a 375px mobile breakpoint and test normal laptop width.
- Disable the action control while loading and always re-enable it in a `finally` path.
- External Amazon links open in a new tab with `rel="noopener noreferrer"`.

---

## 14. Cumulative regression checklist

`CHECKS.md` begins with a numbered checklist runnable by hand in about three minutes:

1. Page loads with no console errors.
2. Main action produces results.
3. Empty state is visible when no products qualify.
4. Error state is a readable sentence.
5. Busy state appears and clears after success and failure.
6. Layout works at 375px.
7. Keyboard labels and focus are usable.
8. No secret exists in a Git-tracked file or browser response.
9. Missing product fields show **Not provided**.
10. Amazon links open safely in new tabs.

At the end of each phase, add its new checks without removing or weakening earlier checks. Codex must run the full list before every checkpoint.

---

## 15. Codex guard prompt for every phase

Before changing anything:

1. Read `ProjectGuideline.md`, `TechnicalGuideline.md`, `CONTRACTS.md`, and `CHECKS.md` when present.
2. State the requested phase and the smallest expected file changes.
3. State whether the work changes anything under **DO NOT CHANGE WITHOUT ASKING**.
4. If it does, stop and explain the proposed contract change before editing.

Then implement only that phase, additively. New browser-side data access goes through an existing `source.js` method. New visible states go through `ui.js`. New public tunables go in `config.js`. Secrets remain server-side.

When finished, run the full regression checklist, add phase-specific checks, report every pass/fail result, list changed files and dependencies, report provider-call usage, identify unresolved data gaps, and stop. Do not continue to the next phase.

---

## 16. Git, GitHub, and Vercel rules

After a phase passes:

1. create the phase's meaningful Git checkpoint;
2. push it to the selected GitHub repository;
3. wait for Vercel to redeploy;
4. test the public URL, not only localhost;
5. continue only when the public version passes.

Do not repeat the first-time Vercel import for later phases. Do not commit a failing phase merely to move forward.

Before every commit, inspect tracked files and the staged diff for credentials, copied raw API responses, and unrelated user changes.

---

## 17. Permission principles

Use least privilege.

| Permission | Preferred scope | Reason |
|---|---|---|
| Project-folder edits | Current task/folder | Build files only |
| Localhost browser | Allow once | Test one local origin |
| Firecrawl/internet access | Allow once | Current integration test |
| Package access | Allow once, only if required | Avoid unnecessary dependencies |
| `.git` metadata | Current repository | Phase checkpoint |
| GitHub control | Current conversation and selected repository | Publish checkpoints |
| Vercel GitHub App | Selected repository only | Limit repository access |
| Vercel project settings | Selected project only | Add one environment variable |
| Screen/accessibility control | Only when required on a trusted machine | Broad visibility/control |

Default to **Allow once**. Use conversation-level permission only when several supervised actions are required. Avoid **Always allow** for this workshop. Close unrelated sensitive windows before granting screen access.

---

## 18. Failure recovery order

When something fails:

1. identify one observable symptom;
2. reproduce it with the smallest safe input;
3. inspect the matching boundary: UI, source, project route, or provider;
4. change one thing;
5. retest the symptom;
6. rerun the cumulative checks;
7. restore the last good Git checkpoint only if a targeted fix is not practical;
8. reduce polish before reducing the core learning objective.

Do not respond to one error by reorganizing the whole repository, replacing the stack, or adding another provider.

---

## 19. Global exclusion list

Unless a later approved specification explicitly changes scope, do not add:

- React, Next.js, Vue, or another framework;
- Tailwind or another CSS framework;
- TypeScript, a bundler, or a build system;
- database, authentication, or persistent user data;
- payments, checkout, or order actions;
- direct Amazon scraping or browser automation;
- a second product-data provider, or Firecrawl Crawl/Interact/Agent features outside the approved Search flow;
- separate project LLM calls, chat, agents, RAG, embeddings, or vector storage;
- automated pagination, batch searches, background jobs, or alerts;
- analytics or advertising trackers;
- Docker or custom CI/CD;
- elaborate animation or a large design system.

If an excluded component appears necessary, Codex must stop and explain why. It must not add the component on its own.

---

## 20. Preflight before Phase 1

Before connecting live data:

- confirm a Firecrawl key exists without displaying it;
- confirm the account's remaining search quota and expected cost;
- recheck current Amazon Search and Product API fields;
- test one small kitchen-utensil-set keyword search in the general US context;
- confirm whether material, size, piece count, colors, popularity, and availability are present for representative kitchen sets;
- record unavailable fields as data gaps rather than expanding the stack;
- confirm `.env.local` is ignored;
- confirm the Vercel environment variable uses the exact name `FIRECRAWL_API_KEY`;
- confirm the public endpoint cannot exceed configured request limits;
- keep sample mode available for UI development and recovery.

If live provider access is unavailable, stop at the Phase 1 gate. Do not present sample data as live data.
