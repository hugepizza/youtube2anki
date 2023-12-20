import { useAtom, useAtomValue } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useEffect, useState } from "react"

import { ping } from "~actions/_index"
import { addNote } from "~actions/card"
import { deckNames } from "~actions/deck"
import useGPT from "~hooks/useGPT"
import type { caption } from "~types"

export const deckAtom = atomWithStorage("desk", "", window.localStorage, {
  getOnInit: true
})

export const tagAtom = atomWithStorage("tag", "", window.localStorage, {
  getOnInit: true
})

export default function Home() {
  console.log("render")

  const [currentDeck, setCurrentDeck] = useAtom(deckAtom)
  const [tag, setTag] = useAtom(tagAtom)

  const [captionData, setCaptionData] = useState<caption[]>([])
  const [, setTime] = useState(0)
  const [title, setTitle] = useState("")

  const [decks, setDecks] = useState<string[]>([])
  const [selected, setselected] = useState("")
  const [info, setInfo] = useState("caption file not found")

  const [loading, setLoading] = useState(false)
  const [ankiEnable, setAnkiEnable] = useState(false)

  const [forceUpdate, setForceUpdate] = useState(false)
  const handleForceUpdate = async () => {
    setLoading(true)
    await refresh()
    setTimeout(() => {
      setForceUpdate((prevState) => !prevState)
      setLoading(false)
    }, 5000)
  }

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
            if (resp.result.length > 0) {
              if (!currentDeck) {
                setCurrentDeck(resp.result[0])
              } else if (resp.result.findIndex((n) => currentDeck === n) < 0) {
                setCurrentDeck(resp.result[0])
              } else {
                setCurrentDeck(currentDeck)
              }
            }
          })
          chrome.runtime.sendMessage(
            { action: "getState" },
            function (response) {
              var state = response.state
              console.log("Popup received message state:", state)
              setTime(state.videoTime)
              setTitle(state.videoTitle)
              setCaptionData(state.captionData)
              setInfo("caption file mounted")
            }
          )
        }
      })
  }, [forceUpdate])

  const getSelectedText = () => {
    let text = ""
    if (window.getSelection) {
      let text = window.getSelection().toString()
      setselected(text)
    } else if (
      document.getSelection() &&
      document.getSelection().type !== "Control"
    )
      return text
  }

  const handleMouseUp = () => {
    const text = getSelectedText()
    if (text) {
      console.log(text)
      setselected(text)
    }
  }
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <span className=" items-center loading loading-dots loading-lg"></span>
        <span>Loading the currently playing video...</span>
        <span className="text-sm text">
          If subtitles and title are not consistent, attempt to reopen the
          plugin popup.
        </span>
      </div>
    )
  }
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
    <div className="w-full p-4" onMouseUp={handleMouseUp}>
      <div className="flex flex-row items-center space-x-1 justify-between">
        <span className="text-primary text-2xl">{title}</span>
        <div className="flex flex-col items-center">
          <button className="btn btn-circle btn-sm" onClick={handleForceUpdate}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
          <span className="text-sm">{"reload"}</span>
        </div>
      </div>
      <div className="flex flex-row w-full space-x-1">
        <div className="w-1/2">
          <span className="text-sm text-gray-400">Deck:</span>
          <select
            className="select select-bordered w-full select-sm"
            onChange={(e) => setCurrentDeck(e.target.value)}
            defaultValue={currentDeck}>
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
              placeholder="set a tag"
              value={tag || ""}
              onChange={(e) => setTag(e.currentTarget.value.trim())}
            />
          </p>
        </div>
      </div>
      <CaptionLines captions={captionData} />
      <div className="flex flex-row space-x-1 items-end">
        <SaveButton
          deck={currentDeck}
          text={selected}
          setInfo={setInfo}
          info={info}
        />
        <p className="justify-end text-gray-400 text-sm">
          *select text then click SAVE
        </p>
      </div>

      <div className="fixed bottom-2 right-2">
        <>{info}</>
      </div>
    </div>
  )
}

function CaptionLines({ captions }: { captions: caption[] }) {
  if (!captions || captions.length === 0) {
    return <></>
  }
  return (
    <div className="flex flex-col w-full space-y-1 bg-secondary p-2 rounded-lg my-2">
      {Math.floor(captions[0].start / 60).toFixed(0)}
      {":"}
      {(captions[0].start % 60).toString().padStart(2, "0")}
      {"~"}
      {Math.floor(captions[captions.length - 1].start / 60).toFixed(0)}
      {":"}
      {(captions[captions.length - 1].start % 60).toString().padStart(2, "0")}
      {captions.map((e) => (
        <div key={e.start} className="flex flex-row w-full space-x-1">
          <div className="select-text">{e.content}</div>
        </div>
      ))}
    </div>
  )
}

function SaveButton({
  deck,
  text,
  info,
  setInfo
}: {
  deck: string
  text: string
  info: string
  setInfo: (e: string) => void
}) {
  const { generateBack } = useGPT()
  const tag = useAtomValue(tagAtom)
  const [requesting, setRequesting] = useState(false)
  return (
    <div className="flex flex-row">
      <button
        className={`btn btn-primary btn-sm ${requesting ? "btn-disabled" : ""}`}
        onClick={async () => {
          if (text.trim() === "") {
            return
          }
          setRequesting(true)
          const prevInfo = info
          let err = false
          try {
            const back = await generateBack(text)
            await addNote(
              deck,
              text,
              back,
              tag && tag.trim() != "" ? { tags: [tag] } : undefined
            )
            setInfo("saved!")
          } catch (error) {
            err = true
            setInfo("error occured," + error)
          } finally {
            setRequesting(false)
            setTimeout(
              () => {
                setInfo(prevInfo)
              },
              err ? 5000 : 2000
            )
          }
        }}>
        SAVE
      </button>
    </div>
  )
}

async function refresh() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      window.location.reload()
    }
  })
}
