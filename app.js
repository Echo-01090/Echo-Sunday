import { config } from "./config.js";
import { source } from "./source.js";
import { clearResults, renderList, setBusy, setStatus, showEmpty, showError } from "./ui.js";

const form = document.querySelector("#search-form");
const demoButtons = document.querySelectorAll("[data-demo-state]");
const demoControls = document.querySelector(".demo-controls");

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
  setStatus(config.sampleMode ? "Comparing sample kitchen sets…" : "Searching current Amazon.com product pages…");
  clearResults();
  try {
    const items = await source.load(params);
    if (!items.length) {
      showEmpty(config.sampleMode ? "No sample products match that price range. Try widening your budget." : "No eligible Amazon products were found in that price range. Try widening your budget or changing the phrase.");
      return;
    }
    renderList(items);
    const mode = config.sampleMode ? "sample " : "ranked ";
    const retrieved = config.sampleMode ? "" : ` Retrieved ${new Date().toLocaleString()}.`;
    setStatus(`${items.length} ${mode}${items.length === 1 ? "finalist" : "finalists"} found.${retrieved} ${config.availabilityNotice}`);
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

demoControls.hidden = !config.sampleMode;

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

if (config.sampleMode) {
  runSearch();
} else {
  clearResults();
  setStatus("Enter a phrase and budget to search current Amazon.com product pages.");
}
