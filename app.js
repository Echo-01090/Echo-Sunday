import { config } from "./config.js";
import { source } from "./source.js";
import { clearResults, renderList, setBusy, setStatus, showEmpty, showError } from "./ui.js";

const form = document.querySelector("#search-form");

function readParams() {
  const formData = new FormData(form);
  return { goal: String(formData.get("goal") ?? "").trim(), preferences: formData.getAll("preferences").map(String) };
}

function validate(params) {
  return params.goal.length < 3 || params.goal.length > config.maximumGoalLength ? `Describe your reading goal in 3–${config.maximumGoalLength} characters.` : "";
}

async function runSearch() {
  const params = readParams();
  const validationMessage = validate(params);
  if (validationMessage) { clearResults(); showError(validationMessage); return; }
  setBusy(true);
  setStatus("Finding Open Library books and ranking your top five…");
  clearResults();
  try {
    const items = await source.load(params);
    if (!items.length) { showEmpty("No matching books were found. Try a broader reading goal or fewer preferences."); return; }
    renderList(items);
    setStatus(`Ranked ${items.length} book${items.length === 1 ? "" : "s"} from Open Library results retrieved ${new Date().toLocaleString()}. ${config.availabilityNotice}`);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Something went wrong while preparing recommendations.");
  } finally { setBusy(false); }
}

form.addEventListener("submit", (event) => { event.preventDefault(); runSearch(); });
clearResults();
setStatus("Describe a reading goal and choose priorities to get a ranked Open Library shortlist.");
