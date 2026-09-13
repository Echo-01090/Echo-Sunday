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
    const items = await readSamples();
    return items
      .filter((item) => item.price >= params.minPrice && item.price <= params.maxPrice)
      .slice(0, config.candidateLimit);
  },

  async detail(id) {
    const items = await readSamples();
    return items.find((item) => item.id === id) ?? null;
  },

  async save() {
    throw new Error("Saving is not used in this project.");
  },

  async list() {
    return [];
  }
});
