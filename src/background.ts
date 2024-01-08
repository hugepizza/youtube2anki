import OpenAI from "openai"

import { Storage } from "@plasmohq/storage"

import { addNote } from "~actions/card"
import { deckNames } from "~actions/deck"

export {}
const storage = new Storage({ area: "local" })
chrome.runtime.onMessage.addListener(
  async function (message, sender, sendResponse) {
    if (message.action === "AddCard") {
      try {
        const tag = await storage.getItem("tag")
        let deck = await storage.getItem("deck")
        console.log("deck1", deck)
        let back = message.data
        if (!deck) {
          const decks = await deckNames()
          if (decks.result.length === 0) {
            throw new Error("no deck")
          }
          deck = decks[0]
        }
        const aiEnable = await storage.getItem("gpt-enable")
        console.log("deck", deck)
        console.log("tag", tag)
        console.log("gpt-enable", aiEnable)

        if (aiEnable) {
          back = await generateBack(message.data)
        }

        await addNote(
          deck,
          message.data,
          back,
          tag && tag.trim() != "" ? { tags: [tag] } : undefined
        )
        sendResponse({ result: true })
      } catch (error) {
        sendResponse({ result: false, reason: error.toString() })
      }
    }
  }
)

async function generateBack(front: string) {
  const sk = await storage.getItem("gpt-sk")
  const url = await storage.getItem("gpt-url")
  const modelName = await storage.getItem("gpt-modelName")
  const prompt = await storage.getItem("gpt-prompt")
  const client = new OpenAI({
    baseURL: url || undefined,
    apiKey: sk || "sk-",
    dangerouslyAllowBrowser: true
  })
  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: prompt || "translate it to Chinese" },
      { role: "user", content: front }
    ],
    model: modelName || "gpt-3.5-turbo"
  })
  return chatCompletion.choices[0].message.content
}
