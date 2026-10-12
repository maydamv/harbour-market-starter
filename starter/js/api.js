// Every request to the Harbour Market API goes through this module.
// The rest of the app imports these functions and never calls fetch() itself.
// The signatures are here; the bodies are yours (Lecture 8, Act 2).

// Your own market on the course server: put your GitHub username in the URL
// (lower case). The control page: https://harbour-api.lopin.me
export const API = "https://harbour-api.lopin.me/maydamv/api";

// An Error for a 4xx/5xx response, carrying the status and the parsed error
// body, so callers can tell a 404 from a 422 and read body.fields.
export class HttpError extends Error {
  constructor(response, body) {
    super(`${response.status} ${body?.message ?? response.statusText}`);
    this.name = "HttpError";
    this.status = response.status;
    this.body = body;
  }
}

// One request, JSON in and out. `path` is relative to API: request("GET", "/stalls").
// Resolves with the parsed body (null for a 204); rejects with an HttpError
// for 4xx/5xx, and lets network errors and aborts through.
export async function request(method, path, data, options = {}) {
  const init = { ...options, method, headers: { ...options.headers } };
  if (data !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(data);
  }

  const response = await fetch(API + path, init);

  if (!response.ok) {
    // an error body that isn't JSON is no reason to hide the status
    const body = await response.json().catch((error) => {
      if (error.name === "AbortError") throw error;
      return null;
    });
    throw new HttpError(response, body);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const getJSON = (path, options) => request("GET", path, undefined, options);
export const postJSON = (path, data, options) => request("POST", path, data, options);

// A short sentence for people; the error itself goes to the console.
export function describe(error) {
  if (error instanceof HttpError) return `the server answered ${error.status}`;
  if (error.name === "TypeError") return "no connection";
  if (error.name === "AbortError") return "the request was cancelled";
  return "something went wrong";
}
