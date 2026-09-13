import { config } from "./config.js";
import { source } from "./source.js";
import { clearResults, renderList, setBusy, setStatus, showEmpty, showError } from "./ui.js";

const form = document.querySelector("#search-form");
const demoButtons = document.querySelectorAll("[data-demo-state]");

function readParams() {
  const formData = new FormData(form);
  const minPrice = String(formData.get("minPrice") ?? "").trim();
  const maxPrice = String(formData.get("maxPrice") ?? "").trim();
  return {
    query: String(formData.get("query") ?? "").trim(),
    minPrice: minPrice === "" ? Number.NaN : Number(minPrice),
    maxPrice: maxPrice === "" ? Number.NaN : Number(maxPrice)
  };
}

function validate(params) {
  if (params.query.length < 2) return "Enter a search phrase with at least 2 characters.";
  if (params.query.length > config.maximumQueryLength) return `Keep the search phrase under ${config.maximumQueryLength} characters.`;
  if (!Number.isFinite(params.minPrice) || !Number.isFinite(params.maxPrice) || params.minPrice < 0 || params.maxPrice < 0) return "Enter valid prices of zero or more.";
  if (params.minPrice > params.maxPrice) return "Minimum price cannot be greater than maximum price.";
  return "";
}

async function runSearch() {
  const params = readParams();
  const validationMessage = validate(params);
  if (validationMessage) {
    clearResults();
    showError(validationMessage);
    return;
  }

  setBusy(true);
  setStatus("Comparing sample kitchen sets…");
  clearResults();
  try {
    const items = await source.load(params);
    if (!items.length) {
      showEmpty("No sample products match that price range. Try widening your budget.");
      return;
    }
    renderList(items);
    setStatus(`${items.length} sample ${items.length === 1 ? "match" : "matches"} found. ${config.availabilityNotice}`);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Something went wrong while preparing the shortlist.");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

demoButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const state = button.dataset.demoState;
    if (state === "results") await runSearch();
    if (state === "empty") {
      clearResults();
      showEmpty("No sample products match that price range. Try widening your budget.");
    }
    if (state === "error") {
      clearResults();
      showError("Sample preview: product information could not be loaded. Please try again.");
    }
  });
});

runSearch();
