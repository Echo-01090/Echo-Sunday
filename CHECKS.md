# Cumulative Regression Checklist

Run this numbered checklist by hand in about three minutes.

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

## Phase 0 checks

11. Every required foundation file exists.
12. `.gitignore` excludes `.env`, `.env.local`, `node_modules`, and `.DS_Store`.
13. Sample cards use every normalized product key.
14. The preview-state controls exercise results, empty, and error states.
15. `app.js` contains workflow wiring only; visible DOM construction stays in `ui.js`.
16. Browser data access is contained in `source.js`.
17. Public tunables are contained in `config.js`.
18. The public deployment displays the Phase 0 smoke-test message.
19. The interface requests no ZIP code and makes no ZIP-specific availability claim.
20. The visible palette uses cobalt, teal, white, and coral without a black-and-yellow scheme.

## Phase 1 checks

21. `source.load(params)` makes exactly one same-origin request per submitted search in live mode.
22. Page load and sample-state previews do not trigger a live Firecrawl request.
23. The server rejects non-POST requests, malformed JSON, invalid query lengths, invalid prices, and reversed price ranges.
24. The Firecrawl key is read only from `FIRECRAWL_API_KEY` on the server and never appears in browser code or responses.
25. Firecrawl Search uses web results, `amazon.com`, US country/location, English-US scraping, and no more than five result pages.
26. One bounded retry is allowed only for HTTP 429 or 5xx responses; Crawl, Interact, Agent, and batch endpoints are not used.
27. Only public `https://www.amazon.com/` product URLs are accepted.
28. Products without a numeric price, outside the submitted price range, or explicitly unavailable are excluded.
29. The success body contains exactly `items`, `retrievedAt`, `marketplace`, and `notice`; errors use the protected error envelope.
30. Every returned product contains every normalized key with the documented missing-value defaults.
31. Empty and upstream-failure states remain readable, and the busy state always clears.
32. The public deployment performs one small live US search successfully with provider operation, result-page, and credit counts recorded during verification.

## Phase 2 checks

33. No more than five finalists are returned or rendered.
34. Rank badges are consecutive from `#1` and match server score order.
35. Price, rating, and popularity weights remain `0.3333`, `0.3333`, and `0.3334`.
36. Ranking sorts by unrounded score, then higher rating, lower price, and stable source position.
37. Repeating ranking with identical normalized inputs produces the same output without mutating the inputs.
38. Each finalist has factual price, rating, and popularity reasons, including explicit missing-evidence notes.
39. Score, review count, material, size, piece count, colors, availability, delivery, and confidence render when supplied.
40. The server tolerates incomplete individual Firecrawl results and ranks the remaining eligible candidates.
41. One submitted action uses one bounded Search operation and no more than ten scraped product pages.
42. The final public site passes desktop and 375px checks with loading, empty, error, focus, and keyboard behavior intact.
