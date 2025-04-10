import { Zap } from "lucide-react"
import { useEffect, useState } from "react"

import { ping } from "~actions/_index"
import { deckNames } from "~actions/deck"
import { getAnkiConfig, setAnkiDeck, setAnkiTag } from "~store/anki"
import {
  gptAutoBackAudio,
  gptBaseUrl,
  gptEnable,
  gptModel,
  gptPrompt,
  gptSecretKey,
  gptTranslatePrompt,
  setGPTAutoBackAudio,
  setGPTBaseUrl,
  setGPTEnable,
  setGPTModel,
  setGPTPrompt,
  setGPTSecretKey,
  setGPTTranslatePrompt
} from "~store/gpt"

export default function Home() {
  const [decks, setDecks] = useState<string[]>([])
  const [ankiEnable, setAnkiEnable] = useState(false)
  const [deck, setDeck] = useState("")
  const [tag, setTag] = useState("")

  const [sk, setSk] = useState("")
  const [url, setUrl] = useState("")
  const [modelName, setModelName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [translatePrompt, setTranslatePrompt] = useState("")
  const [enable, setEnable] = useState(false)
  const [audio, setAudio] = useState(false)

  useEffect(() => {
    let pingSuccess = false
    ping()
      .then(() => {
        pingSuccess = true
        setAnkiEnable(true)
      })
      .catch((err) => {
        setAnkiEnable(false)
      })
      .finally(() => {
        console.log("pingSuccess", pingSuccess)
        if (pingSuccess) {
          deckNames().then((resp) => {
            setDecks(resp.result)
          })
        }
        getAnkiConfig().then(({ deck, tag }) => {
          setDeck(deck)
          setTag(tag)
        })

        gptSecretKey().then((sk) => setSk(sk))
        gptBaseUrl().then((url) => setUrl(url))
        gptModel().then((modelName) => setModelName(modelName))
        gptPrompt().then((prompt) => setPrompt(prompt))
        gptTranslatePrompt().then((tprompt) => setTranslatePrompt(tprompt))
        gptEnable().then((enable) => setEnable(enable))
        gptAutoBackAudio().then((audio) => setAudio(audio))
      })
  }, [])
  if (!ankiEnable) {
    return (
      <div className="w-full flex flex-row items-center justify-center gap-2">
        <Zap className="w-4 h-4" />
        <span>AI Powered Translation is coming soon!</span>
      </div>
    )
  }
  return (
    <div className="w-full p-4 space-y-1">
      <div className="flex flex-row w-full space-x-1">
        <div className="w-1/2">
          <span className="text-sm text-gray-400">Deck:</span>
          <select
            className="select select-bordered w-full select-sm"
            onChange={(e) => {
              setAnkiDeck(e.target.value)
              setDeck(e.target.value)
            }}
            value={deck}>
            {decks.map((ele) => (
              <option key={ele}>{ele}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="text-sm text-gray-400">Tag:</span>
          <p className="text-base-400 text-sm">
            <input
              className="input input-sm input-bordered"
              placeholder={tag}
              value={tag}
              onChange={(e) => {
                setAnkiTag(e.currentTarget.value)
                setTag(e.currentTarget.value)
              }}
            />
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-gray-400 text-sm">Base URL</span>
        <input
          className="input input-bordered input-sm"
          placeholder="https://api.example.com/v1"
          type="text"
          onChange={(e) => {
            setUrl(e.currentTarget.value)
            setGPTBaseUrl(e.currentTarget.value)
          }}
          value={url}></input>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 text-sm">* Secret Key</span>
        <input
          className="input input-bordered input-sm"
          placeholder="sk-xxx"
          type="text"
          onChange={(e) => {
            setSk(e.currentTarget.value)
            setGPTSecretKey(e.currentTarget.value)
          }}
          value={sk}></input>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 text-sm">Model</span>
        <select
          className="select select-bordered w-full select-sm"
          onChange={(e) => {
            setModelName(e.currentTarget.value)
            setGPTModel(e.currentTarget.value)
          }}
          value={modelName}>
          <option>gpt-3.5-turbo</option>
          <option>gpt-4</option>
        </select>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-400 text-sm">Translate Prompt</span>
        <textarea
          className="textarea textarea-bordered"
          placeholder="translate it to Chinese"
          onChange={(e) => {
            setTranslatePrompt(e.currentTarget.value)
            setGPTTranslatePrompt(e.currentTarget.value)
          }}
          value={translatePrompt}></textarea>
      </div>

      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="checkbox"
          onChange={(e) => {
            const v = e.currentTarget.checked
            setEnable(v)
            setGPTEnable(v)
          }}
          checked={enable}
        />
        <span className="pl-2 select-none">Generate Card Back by ChatGPT</span>
      </label>
      <div className={`flex flex-col space-y-1 ${enable ? "" : "hidden"}`}>
        <label className="flex items-center cursor-pointer pl-8">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            onChange={(e) => {
              const v = e.currentTarget.checked
              setAudio(v)
              setGPTAutoBackAudio(v)
            }}
            checked={audio}
          />
          <span className="pl-2 select-none">
            Use TTS Model to Generate Audio
          </span>
        </label>
        <div className="flex flex-col pl-8">
          <span className="text-gray-400 text-sm">Generate Back Prompt</span>
          <textarea
            className="textarea textarea-bordered"
            placeholder="translate it to Chinese"
            onChange={(e) => {
              setPrompt(e.currentTarget.value)
              setGPTPrompt(e.currentTarget.value)
            }}
            value={prompt}></textarea>
        </div>
      </div>
    </div>
  )
}
