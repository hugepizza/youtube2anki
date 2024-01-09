import OpenAI from "openai"

import { Storage } from "@plasmohq/storage"

import { addNote } from "~actions/card"
import { deckNames } from "~actions/deck"
import { MessageAction, type Task } from "~types"

const taskQueue: Task[] = []
const storage = new Storage({ area: "local" })
setInterval(processTasks, 1000)

let inprogress = false

function taskCount() {
  return taskQueue.length
}

export function addTask(task: Task) {
  return taskQueue.push(task)
}

async function processTasks() {
  console.log("processTasks ", inprogress, taskQueue.length)
  if (!inprogress && taskQueue.length > 0) {
    console.log("processTasks get")
    const task = taskQueue.shift()
    try {
      inprogress = true
      await execute(task)
      await taskResult("success", "")
    } catch (error) {
      console.log("err", error)
      await taskResult("fail", error.toString())
    } finally {
      inprogress = false
    }
  }
}

async function execute(task: Task) {
  switch (task.action) {
    case MessageAction.AddCard:
      try {
        const front = task.data
        const tag = await storage.getItem("tag")
        const tags = tag && tag.trim() != "" ? { tags: [tag] } : undefined
        let deck = await storage.getItem("deck")
        let back = task.data
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
          const bf = await generateAudioMedia(front)
          audioFile = Buffer.from(bf)
        }
        await addNote(deck, front, back, tags, audioFile)
      } catch (error) {
        throw error
      }
  }
}

async function openAIClient() {
  const sk = await storage.getItem("gpt-sk")
  const url = await storage.getItem("gpt-url")
  const client = new OpenAI({
    baseURL: url || undefined,
    apiKey: sk || "sk-",
    dangerouslyAllowBrowser: true
  })
  return client
}

async function generateBack(front: string) {
  const modelName = await storage.getItem("gpt-modelName")
  const prompt = await storage.getItem("gpt-prompt")
  const client = await openAIClient()
  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: prompt || "translate it to Chinese" },
        { role: "user", content: front }
      ],
      model: modelName || "gpt-3.5-turbo"
    })
    return chatCompletion.choices[0].message.content
  } catch (error) {
    console.log(error)
    throw new Error("gpt request failed, " + error)
  }
}

async function generateAudioMedia(front: string) {
  const client = await openAIClient()
  try {
    const media = await client.audio.speech.create({
      input: front,
      voice: "alloy",
      model: "tts-1",
      response_format: "mp3"
    })
    return await media.arrayBuffer()
  } catch (error) {
    console.log(error)
    throw new Error("gpt audio request failed, " + error)
  }
}

async function taskResult(result: "success" | "fail", message: string) {
  await chrome.tabs.sendMessage((await getCurrentTab()).id, {
    action: MessageAction.TaskResult,
    data: {
      action: MessageAction.TaskResult,
      result,
      message: message,
      taskCount: taskCount()
    }
  })
}

async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(queryOptions)
  return tab
}
