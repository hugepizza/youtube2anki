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
        const front = message.data
        const tag = await storage.getItem("tag")
        const tags = tag && tag.trim() != "" ? { tags: [tag] } : undefined
        let deck = await storage.getItem("deck")
        let back = message.data
        let audioFile: Buffer | undefined
        if (!deck) {
          const decks = await deckNames()
          if (decks.result.length === 0) {
            throw new Error("no deck")
          }
          deck = decks[0]
        }
        const aiEnable = await storage.getItem("gpt-enable")
        const audio = await storage.getItem("gpt-audio")
        console.log("deck", deck)
        console.log("tag", tag)
        console.log("gpt-enable", aiEnable)

        if (aiEnable) {
          back = await generateBack(front)
        }
        if (audio) {
          const data = await generateAudioMedia(front)
          audioFile = Buffer.from(data)
        }
        await addNote(deck, front, back, tags, audioFile)
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

async function generateAudioMedia(front: string) {
  const sk = await storage.getItem("gpt-sk")
  const url = await storage.getItem("gpt-url")
  const modelName = await storage.getItem("gpt-modelName")
  const prompt = await storage.getItem("gpt-prompt")
  const client = new OpenAI({
    baseURL: url || undefined,
    apiKey: sk || "sk-",
    dangerouslyAllowBrowser: true
  })
  const media = await client.audio.speech.create({
    input: front,
    voice: "alloy",
    model: "tts-1",
    response_format: "mp3"
  })
  return await media.arrayBuffer()
}
