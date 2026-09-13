import { config } from "./config.js";

const statusElement = document.querySelector("#status");
const resultsElement = document.querySelector("#results");
const submitButton = document.querySelector("#submit-button");

export function setBusy(isBusy) { submitButton.disabled = isBusy; submitButton.setAttribute("aria-busy", String(isBusy)); submitButton.querySelector("span:first-child").textContent = isBusy ? "Building shortlist…" : "Find My Top 5"; }
export function setStatus(message) { statusElement.dataset.kind = "status"; statusElement.textContent = message; }
export function showError(message) { statusElement.dataset.kind = "error"; statusElement.textContent = message; }
export function showEmpty(message) { statusElement.dataset.kind = "empty"; statusElement.textContent = message; }
export function clearResults() { resultsElement.replaceChildren(); }

function displayText(value) { return value === "" || value === null || value === undefined ? config.fallbackText : String(value); }
function detail(label, value) { const wrapper = document.createElement("div"); wrapper.className = "detail"; const term = document.createElement("dt"); term.textContent = label; const description = document.createElement("dd"); description.textContent = displayText(value); wrapper.append(term, description); return wrapper; }

function createCard(item, index) {
  const card = document.createElement("article"); card.className = "product-card";
  const rank = document.createElement("span"); rank.className = "rank-badge"; rank.textContent = `#${item.rank ?? index + 1}`; rank.setAttribute("aria-label", `Rank ${item.rank ?? index + 1}`);
  const imageWrap = document.createElement("div"); imageWrap.className = "product-image-wrap";
  if (item.coverUrl) { const image = document.createElement("img"); image.className = "product-image"; image.src = item.coverUrl; image.alt = `Cover of ${item.title}`; image.loading = "lazy"; imageWrap.append(image); } else { const placeholder = document.createElement("span"); placeholder.className = "image-placeholder"; placeholder.textContent = "Cover not provided"; imageWrap.append(placeholder); }
  const body = document.createElement("div"); body.className = "product-body";
  const title = document.createElement("h3"); title.className = "product-title"; title.textContent = item.title;
  const byline = document.createElement("p"); byline.className = "byline"; byline.textContent = item.author ? `By ${item.author}` : "Author not provided";
  const scoreRow = document.createElement("div"); scoreRow.className = "score-row"; const score = document.createElement("strong"); score.textContent = item.score === null ? "Score not provided" : `${Math.round(item.score * 100)}% match`; const confidence = document.createElement("span"); confidence.textContent = `${displayText(item.dataConfidence)} evidence confidence`; scoreRow.append(score, confidence);
  const details = document.createElement("dl"); details.className = "details"; details.append(detail("First published", item.firstPublishYear), detail("Editions", item.editionCount || null), detail("Subjects", item.subjects.length ? item.subjects.slice(0, 3).join(", ") : null), detail("Languages", item.languages.length ? item.languages.join(", ") : null), detail("Ebook access", item.ebookAccess), detail("Median pages", item.pageCount), detail("Reading logs", item.readingLogCount || null));
  const why = document.createElement("div"); why.className = "why"; const whyTitle = document.createElement("strong"); whyTitle.textContent = "Why we recommend it"; const whyList = document.createElement("ul"); (item.reasons.length ? item.reasons : ["Ranking evidence is not provided."]).forEach((reason) => { const listItem = document.createElement("li"); listItem.textContent = reason; whyList.append(listItem); }); why.append(whyTitle, whyList);
  const link = document.createElement("a"); link.className = "book-link"; link.href = item.openLibraryUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.innerHTML = "<span>View on Open Library</span><span aria-hidden=\"true\">↗</span>";
  body.append(title, byline, scoreRow, details, why, link); card.append(rank, imageWrap, body); return card;
}

export function renderList(items) { clearResults(); const fragment = document.createDocumentFragment(); items.slice(0, config.finalistLimit).forEach((item, index) => fragment.append(createCard(item, index))); resultsElement.append(fragment); }
