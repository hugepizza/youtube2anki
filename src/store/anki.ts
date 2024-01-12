import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

export async function getAnkiConfig() {
  const tag = await storage.getItem("tag")
  let deck = await storage.getItem("deck")
  return { deck, tag }
}

export async function setAnkiDeck(deck: string) {
  storage.setItem("deck", deck)
}

export async function setAnkiTag(tag: string) {
  storage.setItem("tag", tag)
}
