import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

export async function getAnkiConfig() {
  const tag = await storage.getItem("tag")
  const tags = tag && tag.trim() != "" ? { tags: [tag] } : undefined
  let deck = await storage.getItem("deck")
  return { deck, tags }
}
