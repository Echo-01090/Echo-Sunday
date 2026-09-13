export const config = Object.freeze({
  sampleDataPath: "data/sample.json",
  searchRoute: "/api/products/search",
  maximumQueryLength: 80,
  candidateLimit: 10,
  finalistLimit: 5,
  firecrawlResultPageLimit: 10,
  maximumFirecrawlCreditsPerAction: null,
  requestTimeoutMs: 30000,
  scoringWeights: Object.freeze({ price: 0.3333, rating: 0.3333, popularity: 0.3334 }),
  sampleMode: false,
  fallbackText: "Not provided",
  availabilityNotice: "Availability is general. Confirm final price, stock, and delivery on Amazon."
});
