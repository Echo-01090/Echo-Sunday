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
- `zip-code`
- `min-price`
- `max-price`
- `submit-button`
- `status`
- `results`

## Route contracts

`POST /api/products/search` accepts `{ query: string, zipCode: string, minPrice: number, maxPrice: number }` and returns `{ items: Product[], retrievedAt: string, location: { zipCode: string }, notice: string }`.

`POST /api/products/detail` accepts `{ asin: string, zipCode: string }` and returns a normalized product object or a safe error.

Errors use `{ error: { code: string, message: string } }`.

Routes are documented now but are not implemented in Phase 0.

## Ranking

Weights are price `0.3333`, rating `0.3333`, and popularity `0.3334`. Sort by unrounded total score, then break ties by higher rating, lower price, and original stable source position.

## DO NOT CHANGE WITHOUT ASKING

- The normalized product keys, types, never-omit rule, and missing-value rules above.
- DOM IDs listed above.
- UI exports: `setBusy(isBusy)`, `setStatus(message)`, `showError(message)`, `showEmpty(message)`, `renderList(items)`, `clearResults()`.
- Source export: one object named `source` with async methods `load(params)`, `detail(id)`, `save(record)`, and `list()`.
- Search, detail, and error route request/response shapes above.
- Ranking weights and tie-break order above.

Any extension must be deliberate, documented here first, and verified against older rendering behavior.
