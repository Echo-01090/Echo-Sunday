"use strict";

const { PREFERENCE_LABELS, rankBooks } = require("./ranking");

const FIELDS = [
  "key", "title", "author_name", "cover_i", "first_publish_year", "subject", "edition_count", "language", "ebook_access", "ebook_count_i", "has_fulltext", "public_scan_b", "number_of_pages_median", "ratings_count", "want_to_read_count", "already_read_count", "currently_reading_count"
].join(",");

function error(code, message) {
  return { error: { code, message } };
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeBook(doc) {
  const workKey = typeof doc.key === "string" && /^\/works\/OL\d+W$/.test(doc.key) ? doc.key : "";
  if (!workKey || !doc.title) return null;
  const coverId = finiteNumber(doc.cover_i, null);
  const firstPublishYear = finiteNumber(doc.first_publish_year, null);
  const pageCount = finiteNumber(doc.number_of_pages_median, null);
  return {
    id: workKey.slice("/works/".length), workKey, title: String(doc.title),
    author: Array.isArray(doc.author_name) && doc.author_name[0] ? String(doc.author_name[0]) : "",
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "",
    openLibraryUrl: `https://openlibrary.org${workKey}`,
    firstPublishYear, subjects: Array.isArray(doc.subject) ? doc.subject.filter((value) => typeof value === "string").slice(0, 8) : [],
    editionCount: finiteNumber(doc.edition_count), languages: Array.isArray(doc.language) ? doc.language.filter((value) => typeof value === "string").slice(0, 8) : [],
    ebookAccess: typeof doc.ebook_access === "string" ? doc.ebook_access : "", ebookCount: finiteNumber(doc.ebook_count_i),
    hasFulltext: Boolean(doc.has_fulltext), pageCount, ratingsCount: finiteNumber(doc.ratings_count),
    readingLogCount: finiteNumber(doc.want_to_read_count) + finiteNumber(doc.already_read_count) + finiteNumber(doc.currently_reading_count),
    score: null, rank: null, reasons: [], dataConfidence: "low"
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json(error("method_not_allowed", "Use POST for book recommendations."));
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => key !== "goal" && key !== "preferences")) return response.status(400).json(error("invalid_request", "Send a reading goal and optional preferences."));
  const goal = typeof body.goal === "string" ? body.goal.trim() : "";
  const preferences = Array.isArray(body.preferences) ? body.preferences : [];
  if (goal.length < 3 || goal.length > 280 || preferences.some((value) => typeof value !== "string" || !Object.hasOwn(PREFERENCE_LABELS, value))) return response.status(400).json(error("invalid_request", "Use a 3–280 character reading goal and valid preferences."));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const params = new URLSearchParams({ q: goal, fields: FIELDS, limit: "25" });
    const upstream = await fetch(`https://openlibrary.org/search.json?${params}`, { headers: { "User-Agent": "Echo-Sunday-Book-Decision-Tool" }, signal: controller.signal });
    if (!upstream.ok) return response.status(502).json(error("upstream_failure", "Open Library could not return book results right now."));
    const payload = await upstream.json();
    if (!payload || !Array.isArray(payload.docs)) return response.status(502).json(error("upstream_failure", "Open Library returned an unexpected response."));
    const unique = new Map();
    payload.docs.map(normalizeBook).filter(Boolean).forEach((book) => unique.set(book.id, book));
    const items = rankBooks([...unique.values()], goal, preferences);
    return response.status(200).json({ items, retrievedAt: new Date().toISOString(), source: "Open Library", notice: "Book metadata can be incomplete or change. Confirm reading and ebook access on Open Library." });
  } catch (caught) {
    return response.status(502).json(error("upstream_failure", caught && caught.name === "AbortError" ? "Open Library took too long to respond. Please try again." : "Open Library could not return book results right now."));
  } finally {
    clearTimeout(timeout);
  }
};
