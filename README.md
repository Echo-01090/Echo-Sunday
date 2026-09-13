# Book Decision Tool

Book Decision Tool turns a natural-language reading goal and a few priorities into a concise, personalized shortlist of up to five books. It keeps the original decision-tool interaction while using the official Open Library Search API for live metadata.

## Current data flow

One form submission makes one same-origin request to `/api/books/recommend`. The server requests up to 25 Open Library work records, normalizes incomplete metadata, and ranks five finalists by topic relevance plus selected priorities: popular, recent, classic, shorter, and ebook availability.

No Firecrawl credential or other runtime API key is required. An existing `FIRECRAWL_API_KEY` in Vercel may remain unused, but the application does not read it.

## Run locally

Serve this directory with a static server to view the client. The `/api` route is provided by Vercel when deployed.

```text
python -m http.server 4173
```

## Deployment

This project is deployed from the existing GitHub repository to the existing Vercel project. See `CONTRACTS.md` before changing data shapes and run `CHECKS.md` after changes.
