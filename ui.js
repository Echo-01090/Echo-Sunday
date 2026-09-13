import { config } from "./config.js";

const statusElement = document.querySelector("#status");
const resultsElement = document.querySelector("#results");
const submitButton = document.querySelector("#submit-button");

export function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.setAttribute("aria-busy", String(isBusy));
  submitButton.querySelector("span:first-child").textContent = isBusy ? "Building shortlist…" : "Find My Top 5";
}

export function setStatus(message) {
  statusElement.dataset.kind = "status";
  statusElement.textContent = message;
}

export function showError(message) {
  statusElement.dataset.kind = "error";
  statusElement.textContent = message;
}

export function showEmpty(message) {
  statusElement.dataset.kind = "empty";
  statusElement.textContent = message;
}

export function clearResults() {
  resultsElement.replaceChildren();
}

function displayText(value) {
  return value === "" || value === null || value === undefined ? config.fallbackText : String(value);
}

function detail(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "detail";
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = displayText(value);
  wrapper.append(term, description);
  return wrapper;
}

function createCard(item, index) {
  const card = document.createElement("article");
  card.className = "product-card";

  const rank = document.createElement("span");
  rank.className = "rank-badge";
  rank.textContent = `#${item.rank ?? index + 1}`;
  rank.setAttribute("aria-label", `Rank ${item.rank ?? index + 1}`);

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";
  if (item.imageUrl) {
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = "lazy";
    imageWrap.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "Image not provided";
    imageWrap.append(placeholder);
  }

  const body = document.createElement("div");
  body.className = "product-body";
  const title = document.createElement("h3");
  title.className = "product-title";
  title.textContent = item.title;

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = item.price === null ? config.fallbackText : new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency }).format(item.price);
  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = item.rating === null ? "Rating not provided" : `★ ${item.rating.toFixed(1)}`;
  priceRow.append(price, rating);

  const details = document.createElement("dl");
  details.className = "details";
  details.append(
    detail("Material", item.material),
    detail("Set size", item.pieceCount === null ? null : `${item.pieceCount} pieces`),
    detail("Size", item.size),
    detail("Colors", item.colorOptions.length ? item.colorOptions.join(", ") : null),
    detail("Recent signal", item.boughtLastMonthText),
    detail("Availability", item.availability)
  );

  const why = document.createElement("div");
  why.className = "why";
  const whyTitle = document.createElement("strong");
  whyTitle.textContent = "Why this ranked here";
  const whyCopy = document.createElement("p");
  whyCopy.textContent = item.reasons.length ? item.reasons.join(" ") : "Ranking evidence is not provided yet.";
  why.append(whyTitle, whyCopy);

  const link = document.createElement("a");
  link.className = "amazon-link";
  link.href = item.amazonUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = "<span>View on Amazon</span><span aria-hidden=\"true\">↗</span>";

  body.append(title, priceRow, details, why, link);
  card.append(rank, imageWrap, body);
  return card;
}

export function renderList(items) {
  clearResults();
  const fragment = document.createDocumentFragment();
  items.slice(0, config.finalistLimit).forEach((item, index) => fragment.append(createCard(item, index)));
  resultsElement.append(fragment);
}
