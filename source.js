import { config } from "./config.js";

let sampleCache = null;

async function readSamples() {
  if (sampleCache) return sampleCache;
  const response = await fetch(config.sampleDataPath);
  if (!response.ok) throw new Error("Sample products could not be loaded.");
  const payload = await response.json();
  sampleCache = payload.items;
  return sampleCache;
}

export const source = Object.freeze({
  async load(params) {
    if (config.sampleMode) {
      const items = await readSamples();
      return items
        .filter((item) => item.price >= params.minPrice && item.price <= params.maxPrice)
        .slice(0, config.candidateLimit);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch(config.searchRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Live product information could not be loaded.");
      }
      if (!payload || !Array.isArray(payload.items)) {
        throw new Error("The product service returned an unexpected response.");
      }
      return payload.items.slice(0, config.candidateLimit);
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("The live search took too long. Please try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  },

  async detail() {
    throw new Error("Separate detail loading is not used in this project.");
  },

  async save() {
    throw new Error("Saving is not used in this project.");
  },

  async list() {
    return [];
  }
});
