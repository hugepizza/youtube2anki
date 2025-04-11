import { ping } from "~actions/_index"
import { addNote } from "~actions/card"
import openAIClient from "~gpt"
import { getAnkiConfig } from "~store/anki"
import { gptAutoBackAudio, gptEnable, gptModel, gptPrompt } from "~store/gpt"
import { MessageAction, type Task } from "~types"

const taskQueue: Task[] = []
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
    if (!task) {
      return
    }
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
  try {
    await ping()
  } catch (err) {
    throw new Error("AnkiConnect Add-on is not running")
  }
  switch (task.action) {
    case MessageAction.AddCard:
      try {
        const { deck, tag } = await getAnkiConfig()
        const front = task.front
        let back = task.front
        let audioFile: Buffer | undefined
        const aiEnable = await gptEnable()
        const audioEnable = await gptAutoBackAudio()
        if (aiEnable) {
          back = await generateBack(front)
        }
        if (aiEnable && audioEnable) {
          const bf = await generateAudioMedia(front)
          audioFile = Buffer.from(bf)
        }
        await addNote(deck, front, back, { tags: [tag] }, audioFile)
        break
      } catch (error) {
        throw error
      }
    case MessageAction.AddComplatedCard:
      try {
        const { deck, tag } = await getAnkiConfig()
        const audioEnable = await gptAutoBackAudio()
        let audioFile: Buffer | undefined
        if (audioEnable) {
          const bf = await generateAudioMedia(task.front)
          audioFile = Buffer.from(bf)
        }
        await addNote(
          deck,
          task.front,
          task.back || "",
          { tags: [tag] },
          audioFile
        )
        break
      } catch (error) {
        throw error
      }
  }
}

async function generateBack(front: string) {
  const modelName = await gptModel()
  const prompt = await gptPrompt()
  const client = await openAIClient()
  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: front }
      ],
      model: modelName
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
