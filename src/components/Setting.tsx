import { AlertCircle, Brain, Zap } from "lucide-react"
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

import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"

export default function Setting() {
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
      <div className="w-full flex flex-col items-center justify-center gap-1">
        <div className="flex flex-row items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Anki is not connected</span>
        </div>

        <p>
          <a
            className="text-sm text-blue-500 underline"
            href="https://ankiweb.net/shared/info/2055492159"
            target="_blank">
            Learn more
          </a>
        </p>
      </div>
    )
  }
  return (
    <div className="w-full p-4 gap-3 flex flex-col">
      <div className="w-full grid gap-2">
        <Label className="w-full">Deck</Label>
        <Select
          value={deck}
          onValueChange={(v) => {
            setDeck(v)
            setAnkiDeck(v)
          }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a deck" />
          </SelectTrigger>
          <SelectContent>
            {decks.map((ele) => (
              <SelectItem key={ele} value={ele}>
                {ele}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full grid gap-2">
        <Label className="w-full">Card Tag</Label>
        <Input
          value={tag}
          onChange={(e) => {
            setTag(e.currentTarget.value)
            setAnkiTag(e.currentTarget.value)
          }}
        />
      </div>

      <div className="h-2" />
      <div className="w-full flex flex-row items-center gap-2">
        <Label
          className={`w-full flex flex-row items-center gap-2 duration-300 ${
            enable ? "text-red-500" : "text-gray-500"
          }`}>
          <Brain className={`w-4 h-4`} />{" "}
          <span className="text-sm">
            Enable AI-powered card back generation
          </span>
        </Label>
        <Switch
          checked={enable}
          onCheckedChange={(v) => {
            setEnable(v)
            setGPTEnable(v)
          }}
        />
      </div>
      {enable && (
        <>
          <div className="w-full grid gap-2">
            <Label className="w-full">Base URL (optional)</Label>
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.currentTarget.value)
                setGPTBaseUrl(e.currentTarget.value)
              }}
            />
          </div>
          <div className="w-full grid gap-2">
            <Label className="w-full">Secret Key</Label>
            <Input
              value={sk}
              onChange={(e) => {
                setSk(e.currentTarget.value)
                setGPTSecretKey(e.currentTarget.value)
              }}
            />
          </div>
          <div className="w-full grid gap-2">
            <Label className="w-full">Model</Label>
            <Select
              value={modelName}
              onValueChange={(v) => {
                setModelName(v)
                setGPTModel(v)
              }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                <SelectItem value="gpt-4">gpt-4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full grid gap-2">
            <Label className="w-full">Translate Prompt</Label>
            <Textarea
              value={translatePrompt}
              onChange={(e) => {
                setTranslatePrompt(e.currentTarget.value)
                setGPTTranslatePrompt(e.currentTarget.value)
              }}
            />
          </div>
          <div className="w-full grid gap-2">
            <Label className="w-full">Generate Audio</Label>
            <Switch
              checked={audio}
              onCheckedChange={(v) => {
                setAudio(v)
                setGPTAutoBackAudio(v)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
