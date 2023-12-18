import { baseUrl } from "./_index";

export async function deckNames() {
  return fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deckNames", version: 6 })
  })
    .then((resp) => resp.json())
    .then((resp) => resp as { result: string[] })
}
