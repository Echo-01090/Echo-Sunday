# Kitchen Set Shortlist

Kitchen Set Shortlist is a small product-comparison website for US Amazon shoppers. A shopper provides a kitchen-utensil-set search phrase and budget, then receives a clear shortlist based on general Amazon.com availability signals.

## Phase 1 status

Phase 1 uses a same-origin serverless route to run one bounded Firecrawl Search after a shopper submits the form. The route accepts only Amazon.com product URLs, normalizes a fixed product shape, and filters missing prices, out-of-range prices, and explicit unavailability. The Firecrawl credential remains server-side.

Set the exact server environment variable `FIRECRAWL_API_KEY` in Vercel Production. Do not place the key in browser code or Git-tracked files.

To use the Phase 0 sample fallback without provider calls, set `sampleMode` to `true` in `config.js`. Sample mode also restores the state-preview controls and initial sample search.

## Run locally

Serve this directory with any static HTTP server, then open its local URL. ES modules and `fetch()` mean opening `index.html` directly from disk is not supported.

For example, if Python is installed:

```text
python -m http.server 4173
```

## Phases

- **Phase 0:** sample-data foundation and deployment smoke test.
- **Phase 1:** live Amazon discovery through a validated, bounded Firecrawl Search route, with eligibility filtering.
- **Phase 2:** deterministic top-five ranking, richer bounded extraction, and final polish.

See `CONTRACTS.md` before changing names or shapes, and run every item in `CHECKS.md` at each phase checkpoint.

## Deployment

The intended publishing path is GitHub to Vercel. Import the repository into Vercel as a static project with no build command and the repository root as the output directory.
