import { config } from "./config.js";

export const source = Object.freeze({
  async load(params) {
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
      if (!response.ok) throw new Error(payload?.error?.message || "Book recommendations could not be loaded.");
      if (!payload || !Array.isArray(payload.items)) throw new Error("The book service returned an unexpected response.");
      return payload.items.slice(0, config.candidateLimit);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("The book search took too long. Please try again.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  },

  async detail() { throw new Error("Separate detail loading is not used in this project."); },
  async save() { throw new Error("Saving is not used in this project."); },
  async list() { return []; }
});
