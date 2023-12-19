import { useEffect, useState } from "react"

import "./style.css"

import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { ping } from "~actions/_index"
import { addNote } from "~actions/card"
import { deckNames } from "~actions/deck"
import type { caption } from "~types"

export const deckAtom = atomWithStorage("desk", "", window.localStorage, {
  getOnInit: true
})

export const tagAtom = atomWithStorage("tag", "", window.localStorage, {
  getOnInit: true
})

function IndexPopup() {
  const [currentDeck, setCurrentDeck] = useAtom(deckAtom)
  const [tag, setTag] = useAtom(tagAtom)

  const [captionData, setCaptionData] = useState<caption[]>([])
  const [time, setTime] = useState(0)
  const [title, setTitle] = useState("")

  const [decks, setDesks] = useState<string[]>([])
  const [selected, setselected] = useState("")
  const [info, setInfo] = useState("caption file not found")

  useEffect(() => {
    let pingSuccess = false
    ping()
      .then(() => (pingSuccess = true))
      .catch((err) => setInfo("anki connect port not found on localhost:8765"))
      .finally(() => {
        console.log("pingSuccess", pingSuccess)

        if (pingSuccess) {
          deckNames().then((resp) => {
            setDesks(resp.result)
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
  }, [])

  const getSelectedText = () => {
    CaptionLines
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

  return (
    <div
      className="w-[600px] h-[400px] p-4  text-base  "
      onMouseUp={handleMouseUp}>
      <h1>
        <span className="text-primary">{title}</span>
      </h1>
      <h1 className="text-lg">choose a deck</h1>
      <ol>
        {decks.map((ele) => (
          <li key={ele}>
            <div
              className="flex flex-row space-x-2"
              onClick={(e) => setCurrentDeck(ele)}>
              <div className="w-4">{currentDeck === ele ? "👉" : ""} </div>
              <div>{ele}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-base-400 text-sm">
        <input
          className="input input-sm input-bordered"
          placeholder="set a tag"
          value={tag}
          onChange={(e) => setTag(e.currentTarget.value.trim())}
        />
      </p>
      <CaptionLines captions={captionData} />
      <SaveButton
        tags={[tag]}
        deck={currentDeck}
        text={selected}
        setInfo={setInfo}
        info={info}
      />
      <div className="text-gray-500 text-sm">*select text then click SAVE</div>
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
  tags,
  info,
  setInfo
}: {
  deck: string
  text: string
  info: string
  setInfo: (e: string) => void
  tags?: string[]
}) {
  return (
    <div className="flex flex-row">
      <button
        className={`btn btn-primary btn-sm`}
        onClick={async () => {
          const prevInfo = info
          let err = false
          try {
            await addNote(deck, text, {
              tags
            })
            setInfo("saved!")
          } catch (error) {
            err = true
            setInfo("error occured," + error)
          } finally {
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

export default IndexPopup

function findNearestCaptions(
  captions: caption[],
  targetStart: number
): caption[] {
  const sortedCaptions = captions.sort((a, b) => a.start - b.start)
  let targetIndex = sortedCaptions.findIndex(
    (caption) => caption.start >= targetStart
  )

  if (targetIndex === -1) {
    targetIndex = sortedCaptions.length - 1
  }

  const startIdx = Math.max(0, targetIndex - 5)
  const endIdx = Math.min(sortedCaptions.length - 1, targetIndex + 5)

  return sortedCaptions.slice(startIdx, endIdx + 1)
}
