const FIRECRAWL_SEARCH_URL = "https://api.firecrawl.dev/v2/search";
const { rankProducts } = require("./ranking.js");
const MAX_QUERY_LENGTH = 80;
const RESULT_PAGE_LIMIT = 10;
const FINALIST_LIMIT = 5;
const UPSTREAM_TIMEOUT_MS = 24000;
const NOTICE = "Availability is general. Confirm final price, stock, seller, and delivery on Amazon.";

const PRODUCT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    asin: { type: ["string", "null"], description: "The 10-character Amazon ASIN." },
    title: { type: ["string", "null"], description: "The product title." },
    imageUrl: { type: ["string", "null"], description: "The main product image HTTPS URL." },
    price: { type: ["number", "string", "null"], description: "The current one-time purchase price in US dollars, without a currency symbol." },
    material: { type: ["string", "null"], description: "The listed product material." },
    size: { type: ["string", "null"], description: "The selected or listed size." },
    pieceCount: { type: ["integer", "number", "string", "null"], description: "Number of utensils or pieces in the set." },
    colorOptions: { type: ["array", "null"], items: { type: "string" }, description: "Available color names." },
    rating: { type: ["number", "string", "null"], description: "Average rating out of five." },
    reviewCount: { type: ["integer", "number", "string", "null"], description: "Total rating or review count." },
    boughtLastMonthText: { type: ["string", "null"], description: "Exact visible bought-in-past-month text, if present." },
    availability: { type: ["string", "null"], description: "Current availability text." },
    deliverySummary: { type: ["string", "null"], description: "General delivery summary without a shopper-specific promise." }
  },
  required: ["asin", "title", "imageUrl", "price", "material", "size", "pieceCount", "colorOptions", "rating", "reviewCount", "boughtLastMonthText", "availability", "deliverySummary"]
};

function sendError(response, status, code, message) {
  response.status(status).json({ error: { code, message } });
}

function parseBody(request) {
  if (typeof request.body === "string") return JSON.parse(request.body);
  return request.body;
}

function validateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Send a JSON object.";
  const allowedKeys = new Set(["query", "minPrice", "maxPrice"]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) return "The request contains unsupported fields.";
  if (typeof body.query !== "string") return "Enter a search phrase.";
  const query = body.query.trim();
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) return `The search phrase must be 2 to ${MAX_QUERY_LENGTH} characters.`;
  if (!Number.isFinite(body.minPrice) || !Number.isFinite(body.maxPrice) || body.minPrice < 0 || body.maxPrice < 0) return "Enter valid prices of zero or more.";
  if (body.minPrice > body.maxPrice) return "Minimum price cannot be greater than maximum price.";
  return "";
}

function text(value, limit = 300) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function number(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function integer(value) {
  const parsed = number(value);
  return parsed === null ? null : Math.max(0, Math.trunc(parsed));
}

function lowerBound(value) {
  const normalized = text(value, 100).toLowerCase().replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*([km])?\+?/);
  if (!match) return null;
  const multiplier = match[2] === "m" ? 1000000 : match[2] === "k" ? 1000 : 1;
  return Math.floor(Number(match[1]) * multiplier);
}

function parseJsonExtraction(entry) {
  const candidate = entry?.json ?? entry?.data?.json;
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) return candidate;
  if (typeof candidate !== "string") return null;
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function acceptedAmazonUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "www.amazon.com") return null;
    const asinMatch = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    if (!asinMatch) return null;
    const asin = asinMatch[1].toUpperCase();
    return { asin, url: `https://www.amazon.com/dp/${asin}` };
  } catch {
    return null;
  }
}

function acceptedImageUrl(value) {
  try {
    const url = new URL(value);
    const allowed = url.hostname === "m.media-amazon.com" || url.hostname === "images-na.ssl-images-amazon.com";
    return url.protocol === "https:" && allowed ? url.href : "";
  } catch {
    return "";
  }
}

function isExplicitlyUnavailable(value) {
  const availability = text(value, 160).toLowerCase();
  return ["currently unavailable", "out of stock", "not available", "unavailable"].some((phrase) => availability.includes(phrase));
}

function normalize(entry, minPrice, maxPrice) {
  const urlData = acceptedAmazonUrl(entry?.url ?? entry?.metadata?.sourceURL ?? "");
  const extracted = parseJsonExtraction(entry);
  if (!urlData || !extracted) return null;

  const price = number(extracted.price);
  const availability = text(extracted.availability, 160);
  if (price === null || price < minPrice || price > maxPrice || isExplicitlyUnavailable(availability)) return null;

  const suppliedAsin = text(extracted.asin, 20).toUpperCase();
  const asin = /^[A-Z0-9]{10}$/.test(suppliedAsin) ? suppliedAsin : urlData.asin;
  if (asin !== urlData.asin) return null;
  const rating = number(extracted.rating);
  const reviewCount = integer(extracted.reviewCount);
  const boughtLastMonthText = text(extracted.boughtLastMonthText, 100);
  const colorOptions = Array.isArray(extracted.colorOptions)
    ? extracted.colorOptions.map((value) => text(value, 60)).filter(Boolean).slice(0, 12)
    : [];
  const evidenceCount = [rating, reviewCount, boughtLastMonthText, availability].filter((value) => value !== null && value !== "").length;

  return {
    id: asin,
    asin,
    title: text(extracted.title, 240),
    imageUrl: acceptedImageUrl(extracted.imageUrl),
    amazonUrl: urlData.url,
    price: Math.round(price * 100) / 100,
    currency: "USD",
    material: text(extracted.material, 120),
    size: text(extracted.size, 100),
    pieceCount: integer(extracted.pieceCount),
    colorOptions,
    rating: rating === null || rating < 0 || rating > 5 ? null : rating,
    reviewCount,
    boughtLastMonthText,
    boughtLastMonthLowerBound: lowerBound(boughtLastMonthText),
    availability,
    deliverySummary: text(extracted.deliverySummary, 180),
    score: null,
    rank: null,
    reasons: [],
    dataConfidence: evidenceCount >= 3 ? "medium" : "low"
  };
}

function retryDelay(headers) {
  const raw = headers.get("retry-after");
  if (!raw) return 250;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.min(1500, Math.max(0, seconds * 1000));
  const dateDelay = Date.parse(raw) - Date.now();
  return Number.isFinite(dateDelay) ? Math.min(1500, Math.max(0, dateDelay)) : 250;
}

async function callFirecrawl(apiKey, payload) {
  let attempts = 0;
  while (attempts < 2) {
    attempts += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(FIRECRAWL_SEARCH_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if ((response.status === 429 || response.status >= 500) && attempts === 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay(response.headers)));
      continue;
    }
    return { response, attempts };
  }
  throw new Error("Firecrawl retry limit reached.");
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendError(response, 405, "METHOD_NOT_ALLOWED", "Use POST for product searches.");
  }
  if (!String(request.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
    return sendError(response, 415, "UNSUPPORTED_MEDIA_TYPE", "Send the request as JSON.");
  }

  let body;
  try {
    body = parseBody(request);
  } catch {
    return sendError(response, 400, "INVALID_JSON", "The request body is not valid JSON.");
  }
  const validationMessage = validateInput(body);
  if (validationMessage) return sendError(response, 400, "INVALID_REQUEST", validationMessage);

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return sendError(response, 503, "CONFIGURATION_ERROR", "Live product search is not configured.");

  const query = body.query.trim();
  const firecrawlRequest = {
    query: `${query} kitchen utensil set site:amazon.com/dp`,
    limit: RESULT_PAGE_LIMIT,
    sources: ["web"],
    includeDomains: ["amazon.com"],
    country: "US",
    location: "United States",
    timeout: UPSTREAM_TIMEOUT_MS,
    ignoreInvalidURLs: true,
    scrapeOptions: {
      formats: [{
        type: "json",
        prompt: "Extract only visible facts for this Amazon product page. Use the current one-time purchase price, not a list price, coupon, monthly payment, or price range. Preserve the visible material, size, piece count, color choices, availability, delivery, rating, review count, and bought-in-past-month evidence. Use null when a fact is absent.",
        schema: PRODUCT_SCHEMA
      }],
      onlyMainContent: true,
      location: { country: "US", languages: ["en-US"] },
      removeBase64Images: true,
      blockAds: true
    }
  };

  let upstream;
  try {
    upstream = await callFirecrawl(apiKey, firecrawlRequest);
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return sendError(response, 502, timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE", timedOut ? "The live product search timed out. Please try again." : "The live product service is temporarily unavailable.");
  }

  if (!upstream.response.ok) {
    const status = upstream.response.status;
    const code = status === 401 || status === 403 ? "UPSTREAM_AUTHENTICATION_FAILED" : status === 429 ? "UPSTREAM_RATE_LIMITED" : "UPSTREAM_UNAVAILABLE";
    const message = status === 429 ? "The live product service is busy. Please try again shortly." : "The live product service could not complete this search.";
    return sendError(response, status === 429 ? 429 : 502, code, message);
  }

  let payload;
  try {
    payload = await upstream.response.json();
  } catch {
    return sendError(response, 502, "INVALID_UPSTREAM_RESPONSE", "The live product service returned an invalid response.");
  }
  const webResults = Array.isArray(payload?.data?.web) ? payload.data.web : [];
  const seen = new Set();
  const candidates = webResults
    .map((entry) => normalize(entry, body.minPrice, body.maxPrice))
    .filter((item) => item && !seen.has(item.asin) && seen.add(item.asin))
    .slice(0, RESULT_PAGE_LIMIT);
  const items = rankProducts(candidates, FINALIST_LIMIT);

  response.setHeader("X-Firecrawl-Operations", String(upstream.attempts));
  response.setHeader("X-Firecrawl-Result-Pages", String(webResults.length));
  response.setHeader("X-Firecrawl-Credits-Used", String(Number.isFinite(payload?.creditsUsed) ? payload.creditsUsed : "unknown"));
  return response.status(200).json({
    items,
    retrievedAt: new Date().toISOString(),
    marketplace: "Amazon.com (US)",
    notice: NOTICE
  });
};
