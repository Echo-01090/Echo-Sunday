# Book Decision Tool Contracts

All browser-rendered books are normalized before reaching `ui.js`.

## Normalized book object

Every key is required and must never be omitted.

| Key | Type |
|---|---|
| `id`, `workKey`, `title`, `author`, `coverUrl`, `openLibraryUrl`, `ebookAccess`, `dataConfidence` | string |
| `firstPublishYear`, `pageCount`, `score`, `rank` | number or null |
| `subjects`, `languages`, `reasons` | string[] |
| `editionCount`, `ebookCount`, `ratingsCount`, `readingLogCount` | number |
| `hasFulltext` | boolean |

Missing text uses `""`, missing nullable numbers use `null`, missing counts use `0`, and missing lists use `[]`. The renderer displays **Not provided** for missing values.

## DOM IDs used by JavaScript

- `search-form`
- `goal`
- `submit-button`
- `status`
- `results`

## Route contracts

`POST /api/books/recommend` accepts `{ goal: string, preferences: string[] }` and returns `{ items: Book[], retrievedAt: string, source: string, notice: string }`.

Allowed preferences are `popular`, `recent`, `classic`, `short`, and `ebook`. There is no public book-detail route. Errors use `{ error: { code: string, message: string } }`.

The route calls Open Library server-side. No API key is required or returned to the browser.

## Ranking

Topic relevance contributes 45% of a score. The selected preferences share the remaining 55% equally; `popular` is the default. Ties use higher edition count, more recent first-publication year, then source order. Only five finalists are returned.

## DO NOT CHANGE WITHOUT ASKING

- The normalized book keys, types, never-omit rule, and missing-value rules above.
- DOM IDs listed above.
- UI exports: `setBusy(isBusy)`, `setStatus(message)`, `showError(message)`, `showEmpty(message)`, `renderList(items)`, `clearResults()`.
- Source export: one object named `source` with async methods `load(params)`, `detail(id)`, `save(record)`, and `list()`.
- `source.detail(id)` throws `Separate detail loading is not used in this project.`
- Search and error route request/response shapes above, including the rule that no public detail route exists.
- Ranking weights and tie-break order above.
