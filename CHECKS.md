# Cumulative Regression Checklist

1. Page loads with no console errors.
2. A valid reading goal produces at most five ranked books.
3. Empty, error, and busy states are readable and busy always clears.
4. Layout works at 375px; labels and keyboard focus are usable.
5. No secret exists in Git-tracked files or browser responses.
6. Missing book fields render as **Not provided**.
7. Open Library links open safely in new tabs.
8. `source.load(params)` makes one same-origin request per submission; page load makes none.
9. The route rejects non-POST requests, malformed bodies, invalid goal lengths, unknown keys, and invalid preferences.
10. The route makes one bounded Open Library Search request with no browser-held credential.
11. Returned books contain every normalized key and documented defaults.
12. Work keys, authors, covers, publication year, subjects, edition counts, language codes, ebook access, and reading metadata tolerate missing provider fields.
13. Five or fewer finalists are returned; ranks start at `#1` and match server score order.
14. Repeating ranking with identical normalized inputs is deterministic and does not mutate inputs.
15. Ranking reasons state only returned Open Library facts or matching terms.
16. The public endpoint has been tested from Vercel with a realistic reading goal.
