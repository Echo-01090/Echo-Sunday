"use strict";

const PREFERENCE_LABELS = Object.freeze({
  popular: "widely read",
  recent: "recently published",
  classic: "a classic",
  short: "shorter",
  ebook: "available as an ebook"
});

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "book", "for", "from", "i", "in", "into", "is", "it", "me", "my", "of", "on", "or", "that", "the", "to", "with", "you"
]);

function clamp(value) {
  return Math.max(0, Math.min(1, value));
}

function keywords(goal) {
  return String(goal || "")
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g)
    ?.filter((word) => !STOP_WORDS.has(word)) || [];
}

function textRelevance(book, terms) {
  if (!terms.length) return 0.5;
  const searchable = [book.title, book.author, ...(book.subjects || [])].join(" ").toLowerCase();
  return clamp(terms.filter((term) => searchable.includes(term)).length / terms.length);
}

function popularity(book) {
  const signal = (book.editionCount * 10) + book.readingLogCount + book.ratingsCount;
  return clamp(Math.log10(signal + 1) / 5);
}

function recent(book) {
  if (!book.firstPublishYear) return 0;
  return clamp((book.firstPublishYear - 1950) / (new Date().getFullYear() - 1950));
}

function classic(book) {
  if (!book.firstPublishYear) return 0;
  return clamp((1980 - book.firstPublishYear) / 100);
}

function shorter(book) {
  if (!book.pageCount) return 0;
  return clamp((500 - book.pageCount) / 400);
}

function ebook(book) {
  return book.ebookAccess === "public" || book.ebookAccess === "borrowable" ? 1 : 0;
}

function preferenceScore(book, preference) {
  if (preference === "popular") return popularity(book);
  if (preference === "recent") return recent(book);
  if (preference === "classic") return classic(book);
  if (preference === "short") return shorter(book);
  if (preference === "ebook") return ebook(book);
  return 0;
}

function reasonsFor(book, terms, preferences) {
  const reasons = [];
  const matchingTerms = terms.filter((term) => [book.title, book.author, ...(book.subjects || [])].join(" ").toLowerCase().includes(term));
  if (matchingTerms.length) reasons.push(`Matches your goal through ${matchingTerms.slice(0, 3).join(", ")}.`);
  if (preferences.includes("popular") && book.editionCount) reasons.push(`${book.editionCount.toLocaleString()} recorded edition${book.editionCount === 1 ? "" : "s"}.`);
  if (preferences.includes("recent") && book.firstPublishYear) reasons.push(`First published in ${book.firstPublishYear}.`);
  if (preferences.includes("classic") && book.firstPublishYear && book.firstPublishYear <= 1980) reasons.push(`A classic first published in ${book.firstPublishYear}.`);
  if (preferences.includes("short") && book.pageCount) reasons.push(`Median edition length is ${book.pageCount} pages.`);
  if (preferences.includes("ebook") && ebook(book)) reasons.push(`Open Library marks ebook access as ${book.ebookAccess}.`);
  if (!reasons.length) reasons.push("Selected from Open Library results for your reading goal.");
  return reasons.slice(0, 3);
}

function confidenceFor(book) {
  const facts = [book.author, book.firstPublishYear, book.subjects.length, book.editionCount, book.languages.length].filter(Boolean).length;
  return facts >= 4 ? "high" : facts >= 2 ? "medium" : "low";
}

function rankBooks(books, goal, requestedPreferences) {
  const terms = keywords(goal);
  const preferences = requestedPreferences.length ? requestedPreferences : ["popular"];
  const preferenceWeight = 0.55 / preferences.length;

  return books
    .map((book, sourceIndex) => {
      const score = (textRelevance(book, terms) * 0.45) + preferences.reduce((total, preference) => total + (preferenceScore(book, preference) * preferenceWeight), 0);
      return { ...book, score, reasons: reasonsFor(book, terms, preferences), dataConfidence: confidenceFor(book), sourceIndex };
    })
    .sort((left, right) => right.score - left.score || right.editionCount - left.editionCount || (right.firstPublishYear || 0) - (left.firstPublishYear || 0) || left.sourceIndex - right.sourceIndex)
    .slice(0, 5)
    .map(({ sourceIndex, ...book }, index) => ({ ...book, rank: index + 1 }));
}

module.exports = { PREFERENCE_LABELS, rankBooks };
