import { state, visibleStalls } from "./state.js";
import { describe } from "./api.js";

const template = document.querySelector("#stall-template");
const list = document.querySelector(".vendor-list");
const filters = document.querySelector(".filters"); // module scope: main.js has its own
const count = document.querySelector(".filter-count");
const savedCount = document.querySelector(".saved-count");
const search = document.querySelector("#vendor-search");
const errorText = document.querySelector(".load-error p");
const retry = document.querySelector(".load-error button");

function rating(stall) {
  if (!stall.reviewCount) return "no reviews yet";
  return `★ ${stall.rating} · ${stall.reviewCount} ${stall.reviewCount === 1 ? "review" : "reviews"}`;
}

function message(text) {
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text; // textContent: their words stay text
  return li;
}

// Data in, element out
function card(stall) {
  const li = template.content.firstElementChild.cloneNode(true);
  li.dataset.id = stall.id;
  li.dataset.tag = stall.tag;

  const article = li.querySelector(".vendor-card");
  article.classList.toggle("featured", Boolean(stall.featured));
  article.classList.toggle("sold-out", Boolean(stall.soldOut)); // Boolean: a missing key is undefined, and toggle(name, undefined) flips

  li.querySelector(".tag").textContent = stall.tag;
  li.querySelector("h3").textContent = stall.name;
  li.querySelector(".blurb").textContent = stall.blurb;
  li.querySelector(".price").textContent = stall.price === 0 ? "free" : `from €${stall.price}`;
  li.querySelector(".rating").textContent = rating(stall);
  li.querySelector(".badge").hidden = !stall.soldOut;

  const isSaved = state.saved.has(stall.id);
  const save = li.querySelector(".save");
  save.setAttribute("aria-pressed", String(isSaved));
  save.setAttribute("aria-label", `Save ${stall.name}`);
  save.textContent = isSaved ? "♥" : "♡";
  return li;
}

// Draws everything that depends on state. Safe to call any number of times.
export function render() {
  const visible = visibleStalls();
  const total = state.stalls.length;

  list.setAttribute("aria-busy", String(state.status === "loading"));
  if (visible.length) {
    list.replaceChildren(...visible.map(card));
  } else if (state.status === "loading") {
    list.replaceChildren(message("Loading the vendors…"));
  } else if (state.status === "error") {
    list.replaceChildren();
  } else if (total === 0) {
    list.replaceChildren(message("No stalls yet. Come back closer to the night."));
  } else {
    list.replaceChildren(message(`No stall matches “${state.query}”.`));
  }

  // the alert stays in the page; only its text changes, so it's announced
  errorText.textContent = state.status === "error"
    ? `We couldn't load the vendors: ${describe(state.error)}.`
    : "";
  retry.hidden = state.status !== "error";

  for (const button of filters.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === state.tag));
  }
  if (state.status === "loading") count.textContent = "Loading the vendors…";
  else if (state.status === "error") count.textContent = "";
  else count.textContent = visible.length === total ? `${total} stalls` : `${visible.length} of ${total} stalls`;
  savedCount.textContent = state.saved.size ? `♥ ${state.saved.size} saved` : "";

  // Controls are part of the page too: draw them from state
  // (only when different: rewriting the box you're typing in can move the cursor)
  if (search.value !== state.query) search.value = state.query;
}
