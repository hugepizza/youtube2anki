import { baseUrl } from "./_index"

async function getEaseFactors(cards: string[]) {
  return await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getEaseFactors",
      version: 6,
      params: {
        cards: cards
      }
    })
  })
    .then((resp) => resp.json())
    .then((resp) => resp)
    .catch((err) => {
      console.log(err)
    })
}

export async function guiAddCards(
  deck: string,
  text: string,
  options?: { tags: string[] }
) {
  return await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "guiAddCards",
      version: 6,
      params: {
        note: {
          deckName: deck,
          modelName: "Basic",
          fields: {
            Front: text,
            Back: text
          },
          tags: options.tags
        }
      }
    })
  })
    .then((resp) => resp.json())
    .then((resp) => resp)
    .catch((err) => {
      console.log(err)
    })
}
export async function addNote(
  deck: string,
  text: string,
  back: string,
  options?: { tags: string[] }
) {
  return await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: deck,
          modelName: "Basic",
          fields: {
            Front: text,
            Back: back
          },
          options: {
            allowDuplicate: false,
            duplicateScope: "deck",
            duplicateScopeOptions: {
              deckName: deck,
              checkChildren: false,
              checkAllModels: false
            }
          },
          tags: options?.tags || []
        }
      }
    })
  })
    .then((resp) => resp.json())
    .then((resp) => {
      if (resp.error) {
        throw resp.error
      }
    })
    .catch((err) => {
      throw err
    })
}
