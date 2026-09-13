export const config = Object.freeze({
  sampleDataPath: "data/sample.json",
  searchRoute: "/api/products/search",
  detailRoute: "/api/products/detail",
  maximumQueryLength: 80,
  zipPattern: /^\d{5}$/,
  candidateLimit: 12,
  finalistLimit: 5,
  providerRequestLimit: 6,
  requestTimeoutMs: 8000,
  scoringWeights: Object.freeze({ price: 0.3333, rating: 0.3333, popularity: 0.3334 }),
  sampleMode: true,
  fallbackText: "Not provided",
  availabilityNotice: "Confirm final price and availability on Amazon."
});
