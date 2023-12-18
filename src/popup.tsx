import { useEffect, useRef, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import "./style.css"

import { atom, useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { addNote } from "~actions/card"
import { deckNames } from "~actions/deck"

function parseXML(xmlString: string) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, "text/xml")
  const texts = Array.from(xmlDoc.getElementsByTagName("text"))
  const captions = texts.map((text) => ({
    start: parseInt(text.getAttribute("start"), 10),
    duration: text.getAttribute("dur"),
    content: text.textContent.replaceAll("&#39;", "'")
  }))
  console.log("captions", captions)

  return captions
}
type caption = {
  start: number
  duration: string
  content: string
}
function IndexPopup() {
  const [decks, setDesks] = useState<string[]>([])
  const [currentDeck, setCurrentDeck] = useState("")
  const [videoTitle, setVideoTitle] = useState("111")
  const [tag, setTag] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [selected, setselected] = useState("")
  const [info, setInfo] = useState("")
  const [time, setTime] = useState(1379)
  const [captionData, setCaptionData] = useState<caption[]>([])

  useEffect(() => {
    chrome.runtime.onMessage.addListener(async (e) => {
      if (e.action === "captionsUrlPopup") {
        console.log("pop get ", e.data)
        const url = e.data as string
        if (!url.startsWith("https://")) {
          setInfo(
            "get caption url failed, make sure one caption is set, " + url
          )
          return
        }
        console.log("set local")
        localStorage.setItem("captionUrl", url)
      }
    })
  }, [])

  useEffect(() => {
    const captionUrl = localStorage.getItem("captionUrl")
    console.log("captionUrl", captionUrl)
    if (captionUrl) {
      fetch(captionUrl, { method: "GET" })
        .then((resp) => resp.text())
        .then((xmlString) => parseXML(xmlString))
        .then((texts) => {
          console.log("sssss")
          console.log(
            texts.filter((e) => e.start > time - 5 && e.start < time + 5)
          )

          setCaptionData(
            texts.filter((e) => e.start > time - 5 && e.start < time + 5)
          )
          setInfo("caption file is mounted")
        })
    }
  }, [])

  useEffect(() => {
    deckNames().then((resp) => {
      setDesks(resp.result)
      if (resp.result.length > 0) {
        setCurrentDeck(resp.result[0])
      }
    })
  }, [])

  const getSelectedText = () => {
    let text = ""
    if (window.getSelection) {
      text = window.getSelection().toString()
    } else if (
      document.getSelection() &&
      document.getSelection().type !== "Control"
    ) {
      text = document.getSelection().toString()
    }
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
      className="w-[600px] h-[400px] p-4  text-base  select-none"
      onMouseUp={handleMouseUp}>
      <h1>
        <span className="text-base-400">current video</span> {videoTitle}
      </h1>
      <p className="text-base-400 text-sm">
        * video title will be set in tag list, or you can{" "}
        <a className="underline">customize tags</a>
      </p>
      {/* <p>tag1 tag2</p> */}
      <h1 className="text-lg">save to</h1>
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
      <CaptionLines captions={captionData} />
      <SaveButton
        deck={currentDeck}
        text={selected}
        setInfo={setInfo}
        info={info}
      />
      {/* <button
        className={`btn btn-primary btn-sm`}
        onClick={() => {
          addNote(currentDeck, selected, {
            tags: ["title"]
          }).then(() => {
            setInfo("saved to anki")
          })
        }}>
        Add
      </button> */}
      <div className="text-gray-500 text-sm">
        * select text then click buttom Add
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
      {captions.map((e) => (
        <div className="flex flex-row w-full space-x-1">
          <div className="w-12 text-gray-500">
            {(e.start / 60).toFixed(0)}:
            {(e.start % 60).toString().padStart(2, "0")}
          </div>
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
              tags: ["title"]
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
