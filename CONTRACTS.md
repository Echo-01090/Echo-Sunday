# Kitchen Set Shortlist Contracts

These contracts keep later phases additive. All browser-rendered products are normalized before reaching `ui.js`.

## Normalized product object

Every key is required and must never be omitted.

| Key | Type |
|---|---|
| `id` | string |
| `asin` | string |
| `title` | string |
| `imageUrl` | string |
| `amazonUrl` | string |
| `price` | number or null |
| `currency` | string |
| `material` | string |
| `size` | string |
| `pieceCount` | number or null |
| `colorOptions` | string[] |
| `rating` | number or null |
| `reviewCount` | number or null |
| `boughtLastMonthText` | string |
| `boughtLastMonthLowerBound` | number or null |
| `availability` | string |
| `deliverySummary` | string |
| `score` | number or null |
| `rank` | number or null |
| `reasons` | string[] |
| `dataConfidence` | string |

Missing text uses `""`, missing numbers use `null`, and missing lists use `[]`. The renderer displays **Not provided** for missing values.

## DOM IDs used by JavaScript

- `search-form`
- `query`
- `min-price`
- `max-price`
- `submit-button`
- `status`
- `results`

## Route contracts

`POST /api/products/search` accepts `{ query: string, minPrice: number, maxPrice: number }` and returns `{ items: Product[], retrievedAt: string, marketplace: string, notice: string }`.

There is no public product-detail route. Phase 2 enriches the bounded server-side Firecrawl Search schema rather than adding browser-triggered per-product requests.

Errors use `{ error: { code: string, message: string } }`.

The search route is implemented in Phase 1. It is same-origin, server-only at the provider boundary, and never returns the Firecrawl credential.

## Ranking

Weights are price `0.3333`, rating `0.3333`, and popularity `0.3334`. Sort by unrounded total score, then break ties by higher rating, lower price, and original stable source position.

## DO NOT CHANGE WITHOUT ASKING

- The normalized product keys, types, never-omit rule, and missing-value rules above.
- DOM IDs listed above.
- UI exports: `setBusy(isBusy)`, `setStatus(message)`, `showError(message)`, `showEmpty(message)`, `renderList(items)`, `clearResults()`.
- Source export: one object named `source` with async methods `load(params)`, `detail(id)`, `save(record)`, and `list()`.
- `source.detail(id)` returns a sample product during Phase 0; after sample-state testing it throws `Separate detail loading is not used in this project.` because enrichment remains server-side.
- Search and error route request/response shapes above, including the rule that no public detail route exists.
- Ranking weights and tie-break order above.

Any extension must be deliberate, documented here first, and verified against older rendering behavior.
