// The only file the HTML loads. It wires events to state and starts the page.
import { state, toggleSaved } from "./state.js";
import { save, load } from "./storage.js";
import { render } from "./render.js";
import { setupMenu } from "./menu.js";
import { setupTickets } from "./tickets.js";
import { getJSON } from "./api.js";
import { setupCurrency } from "./currency.js";

const filters = document.querySelector(".filters");
const list = document.querySelector(".vendor-list");
const statusLine = document.querySelector(".status");

async function loadStalls() {
  state.status = "loading";
  render();
  try {
    state.stalls = await getJSON("/stalls");
    state.status = "ready";
  } catch (error) {
    console.error(error);
    state.status = "error";
    state.error = error;
  }
  render();
}

// Every change goes through here: draw, then remember
function update() {
  render();
  save();
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.tag = button.dataset.filter;
  update();
});

document.querySelector("#vendor-search").addEventListener("input", (event) => {
  state.query = event.target.value;
  update();
});

// The cards are redrawn all the time: one listener on the list hears every ♡
list.addEventListener("click", (event) => {
  const button = event.target.closest(".save");
  if (!button) return;
  toggleSaved(button.closest(".stall").dataset.id);
  update();
});

document.querySelector(".load-error button").addEventListener("click", () => {
  statusLine.focus(); // the button hides itself, so focus needs somewhere to go
  loadStalls();
});

setupMenu();
setupTickets();
load();
setupCurrency(update); // not awaited: the rates and the stalls load side by side
await loadStalls();
