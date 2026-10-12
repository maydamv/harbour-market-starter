// Prices in the visitor's currency (issue #7). The server's prices stay in
// euros: converting is display only, always from the euro price, so
// switching back and forth never converts twice.
import { state } from "./state.js";
import { getJSON } from "./api.js";

export const CURRENCIES = ["EUR", "GBP", "USD", "CHF"];

const RATES_URL = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP,USD,CHF";
const RATES_KEY = "harbour-rates";

const select = document.querySelector("#currency");
const note = document.querySelector(".rates-note");

// "2026-10-09" → "9 October". The date has no time, so read it as UTC.
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

const today = () => new Date().toDateString();

export function price(euros) {
  if (euros === 0) return "free";
  // until the rates are here (or if they never come), everything is in euros
  const rate = state.currency === "EUR" ? 1 : state.rates?.[state.currency];
  const currency = rate ? state.currency : "EUR";
  const format = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "EUR" ? 0 : 2, // euro prices are whole
  });
  return `from ${format.format(euros * (rate ?? 1))}`;
}

export function renderCurrency() {
  select.disabled = state.ratesStatus === "loading";
  select.closest(".currency").hidden = state.ratesStatus === "error";
  if (select.value !== state.currency) select.value = state.currency;
  note.textContent = state.ratesStatus === "ready" ? `Rates of ${day.format(new Date(state.rates.date))}` : "";
}

// At most one request a day: the rates are kept with the day they were fetched.
async function loadRates() {
  try {
    const cached = JSON.parse(localStorage.getItem(RATES_KEY));
    if (cached?.fetchedOn === today()) return cached.rates;
  } catch {
    // broken cache: fetch again
  }
  const body = await getJSON(RATES_URL);
  const rates = { date: body.date, ...body.rates };
  localStorage.setItem(RATES_KEY, JSON.stringify({ fetchedOn: today(), rates }));
  return rates;
}

export async function setupCurrency(update) {
  select.addEventListener("change", () => {
    state.currency = select.value;
    update();
  });

  try {
    state.rates = await loadRates();
    state.ratesStatus = "ready";
  } catch (error) {
    console.error(error);
    state.ratesStatus = "error"; // price() falls back to euros; the choice is kept for next time
  }
  update();
}
