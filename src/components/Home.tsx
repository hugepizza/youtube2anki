import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import { ping } from "~actions/_index"
import { deckNames } from "~actions/deck"

const storage = new Storage({ area: "local" })

export default function Home() {
  const [decks, setDecks] = useState<string[]>([])
  const [ankiEnable, setAnkiEnable] = useState(false)
  const [deck, setDeck] = useState("")
  const [tag, setTag] = useState("")

  const [sk, setSk] = useState("")
  const [url, setUrl] = useState("")
  const [modelName, setModelName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [enable, setEnable] = useState("")

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
        storage.getItem("deck").then((deck) => {
          setDeck(deck)
        })
        storage.getItem("tag").then((tag) => setTag(tag))

        storage.getItem("gpt-sk").then((sk) => setSk(sk))
        storage.getItem("gpt-url").then((url) => setUrl(url))
        storage
          .getItem("gpt-modelName")
          .then((modelName) => setModelName(modelName))
        storage.getItem("gpt-prompt").then((prompt) => setPrompt(prompt))
        storage.getItem("gpt-enable").then((enable) => setEnable(enable))
      })
  }, [])
  if (!ankiEnable) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <span>Anki-Connect Add-on is not working on localhost:8765</span>
        <a
          href="https://foosoft.net/projects/anki-connect/"
          target="_blank"
          className="link-primary text-sm">
          What is Anki-Connect Add-on?
        </a>
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
              storage.setItem("deck", e.target.value)
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
                storage.setItem("tag", e.currentTarget.value)
                setTag(e.currentTarget.value)
              }}
            />
          </p>
        </div>
      </div>

      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="checkbox"
          onChange={(e) => {
            const v = e.currentTarget.checked === true ? "true" : ""
            setEnable(v)
            storage.setItem("gpt-enable", v)
          }}
          checked={enable === "true"}
        />
        <span className="pl-2 select-none">Generate content by ChatGPT</span>
      </label>
      <div
        className={`flex flex-col space-y-1 ${
          enable === "true" ? "" : "hidden"
        }`}>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Base URL</span>
          <input
            className="input input-bordered input-sm"
            placeholder="https://api.example.com/v1"
            type="text"
            onChange={(e) => {
              setUrl(e.currentTarget.value)
              storage.setItem("gpt-url", e.currentTarget.value)
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
              storage.setItem("gpt-sk", e.currentTarget.value)
            }}
            value={sk}></input>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Modal</span>
          <select
            className="select select-bordered w-full select-sm"
            defaultValue={modelName}
            onChange={(e) => {
              setModelName(e.target.value)
              storage.setItem("gpt-modelName", e.currentTarget.value)
            }}>
            <option>gpt-3.5-turbo</option>
            <option>gpt-4</option>
          </select>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-400 text-sm">Custom Prompt</span>
          <textarea
            className="textarea textarea-bordered"
            placeholder="translate it to Chinese"
            onChange={(e) => {
              setPrompt(e.currentTarget.value)
              storage.setItem("gpt-prompt", e.currentTarget.value)
            }}
            value={prompt}></textarea>
        </div>
      </div>
    </div>
  )
}
