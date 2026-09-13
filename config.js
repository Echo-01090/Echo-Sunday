export const config = Object.freeze({
  sampleDataPath: "data/sample.json",
  searchRoute: "/api/books/recommend",
  maximumGoalLength: 280,
  candidateLimit: 25,
  finalistLimit: 5,
  requestTimeoutMs: 18000,
  defaultPreferences: Object.freeze(["popular"]),
  fallbackText: "Not provided",
  availabilityNotice: "Book metadata can be incomplete or change. Confirm reading and ebook access on Open Library."
});
