import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef, useState } from "react"
import { toast, ToastContainer } from "react-toastify"

import { Storage } from "@plasmohq/storage"

import openAIClient from "~gpt"
import { parseXML } from "~kits"
import { gptModel, gptTranslatePrompt } from "~store/gpt"
import { MessageAction, type caption, type TaskResult } from "~types"

const storage = new Storage({ area: "local" })
export const config: PlasmoCSConfig = {
  matches: ["https://*.youtube.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function inject() {
  var elem = document.createElement("script")
  elem.type = "text/javascript"
  elem.setAttribute("src", chrome.runtime.getURL("assets/sub-url.js"))
  document.body.appendChild(elem)
}

const PlasmoOverlay = () => {
  const [caption, setCaption] = useState<caption[]>([])
  const [time, setTime] = useState<number>(0)
  const [visible, setVisible] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [menuPosition, setMenuPosition] = useState([0, 0])
  const [translationVisible, setTranslationVisible] = useState(false)
  const [translationPosition, setTranslationPosition] = useState([0, 0])

  useEffect(() => {
    inject()
  }, [])

  useEffect(() => {
    const captionListiner: (e: MessageEvent<any>) => any = (
      e: MessageEvent<any>
    ) => {
      if (e.data.action === "captionUrl") {
        console.log("get captionUrl", e.data.data)
        fetch(e.data.data, { method: "GET" })
          .then((resp) => resp.text())
          .then((xmlString) => {
            parseXML(xmlString).then((resp) => {
              setCaption(resp)
            })
          })
          .catch((err) => console.error(err))
      }
    }
    window.addEventListener("message", captionListiner, false)
    return () => {
      window.removeEventListener("message", captionListiner, false)
    }
  }, [])

  useEffect(() => {
    const listener = async function (message, sender, sendResponse) {
      if (message.action === MessageAction.TaskResult) {
        console.log(MessageAction.TaskResult)
        const result = message.data as TaskResult
        if (result) {
          if (result.result === "success") {
            toast.success(`task success, ${result.taskCount} tasks in progress`)
          } else {
            toast.error(`task failed, ${result.message}`, {
              autoClose: 3000,
              style: { color: "red" }
            })
          }
        }
        sendResponse()
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    const pauseListener: (e: Event) => any = () => {
      setVisible(true)
    }
    const playListener: (e: Event) => any = () => {
      setVisible(false)
    }
    const timeUpdateListener: (e: Event) => any = (e) => {
      const ele = document.querySelector(".video-stream") as HTMLVideoElement
      setTime(ele.currentTime)
    }
    const videoElement = document.querySelector(
      ".video-stream"
    ) as HTMLVideoElement
    if (videoElement) {
      videoElement.addEventListener("pause", pauseListener)
      videoElement.addEventListener("play", playListener)
      videoElement.addEventListener("timeupdate", timeUpdateListener)
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("pause", pauseListener)
        videoElement.removeEventListener("play", playListener)
        videoElement.removeEventListener("timeupdate", timeUpdateListener)
      }
    }
  }, [])

  useEffect(() => {
    const handleSelection = (e) => {
      const selection = document.getSelection()
      const selectedText = selection.toString()
      if (selectedText.trim()) {
        const range = selection.getRangeAt(0)
        console.log("x", e.clientX)
        console.log("y", e.clientY)

        const { top, left } = range.getBoundingClientRect()
        console.log(range.getBoundingClientRect())
        console.log(top)
        console.log(left)
        setSelectedText(selectedText.trim())
        setMenuPosition([e.clientY, e.clientX])
        setTranslationPosition([e.clientY, e.clientX])
      } else {
        setSelectedText("")
      }
    }
    document.addEventListener("mouseup", handleSelection)
    return () => {
      document.removeEventListener("mouseup", handleSelection)
    }
  }, [])

  const handleForceUpdate = async () => {
    window.location.reload()
  }

  return (
    <div
      className={`fixed top-0 left-0 p-4 flex flex-row text-[24px] bg-[#FFF2D8] ${
        visible ? "" : "hidden"
      }`}>
      <ToastContainer
        autoClose={1000}
        position="top-right"
        theme="light"
        toastClassName="bg-white text-2xl"
        toastStyle={{ color: "black" }}
      />
      <ContextMenu
        selectedText={selectedText}
        position={menuPosition}
        removeSelectedText={() => setSelectedText("")}
        setTranslationVisible={setTranslationVisible}
      />

      <OutsideClickHandler
        onOutsideClick={() => {
          setTimeout(() => {
            if (translationVisible) {
              setTranslationVisible(false)
              console.log("tv off")

              setTranslationPosition([0, 0])
              setSelectedText("")
              document.getSelection().removeAllRanges()
            }
          }, 10)
        }}>
        <Transation
          visible={translationVisible}
          text={selectedText}
          position={translationPosition}
        />
      </OutsideClickHandler>

      <div className="flex flex-grow w-full">
        <div className="flex flex-col">
          <CaptionLines captions={caption} time={time} />
          <div className="flex flex-row space-x-4 justify-end">
            <div className="flex flex-col">
              <button className="btn" onClick={handleForceUpdate}>
                Reload
              </button>
              <span className="text-base">Reload after changing videos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContextMenu({
  selectedText,
  position,
  removeSelectedText,
  setTranslationVisible
}: {
  selectedText: string
  position: number[]
  removeSelectedText: () => void
  setTranslationVisible: (v: boolean) => void
}) {
  if (!selectedText) {
    return <></>
  }
  return (
    <div
      className="join absolute bg-white"
      style={{ top: position[0], left: position[1] }}>
      <div className="tooltip" data-tip="make a card">
        <button
          className="btn border-none btn-md join-item hover:bg-gray-200"
          onClick={() => {
            chrome.runtime.sendMessage(
              {
                action: MessageAction.AddCard,
                data: selectedText
              },
              (resp) => {
                toast.success(`task added, ${resp.count} tasks in progress`)
              }
            )
            document.getSelection().removeAllRanges()
            removeSelectedText()
          }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-6 h-6">
            <path
              fillRule="evenodd"
              d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 4H9.621a1.5 1.5 0 0 1-1.06-.44L7.439 2.44A1.5 1.5 0 0 0 6.38 2H3.5ZM8 6a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8 6Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <button
        className="btn border-none btn-md join-item hover:bg-gray-200"
        onClick={() => {
          setTranslationVisible(true)
          console.log("tv on")
        }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-6 h-6">
          <path
            fillRule="evenodd"
            d="M11 5a.75.75 0 0 1 .688.452l3.25 7.5a.75.75 0 1 1-1.376.596L12.89 12H9.109l-.67 1.548a.75.75 0 1 1-1.377-.596l3.25-7.5A.75.75 0 0 1 11 5Zm-1.24 5.5h2.48L11 7.636 9.76 10.5ZM5 1a.75.75 0 0 1 .75.75v1.261a25.27 25.27 0 0 1 2.598.211.75.75 0 1 1-.2 1.487c-.22-.03-.44-.056-.662-.08A12.939 12.939 0 0 1 5.92 8.058c.237.304.488.595.752.873a.75.75 0 0 1-1.086 1.035A13.075 13.075 0 0 1 5 9.307a13.068 13.068 0 0 1-2.841 2.546.75.75 0 0 1-.827-1.252A11.566 11.566 0 0 0 4.08 8.057a12.991 12.991 0 0 1-.554-.938.75.75 0 1 1 1.323-.707c.049.09.099.181.15.271.388-.68.708-1.405.952-2.164a23.941 23.941 0 0 0-4.1.19.75.75 0 0 1-.2-1.487c.853-.114 1.72-.185 2.598-.211V1.75A.75.75 0 0 1 5 1Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

function CaptionLines({
  captions,
  time
}: {
  captions: caption[]
  time: number
}) {
  if (!captions || captions.length === 0) {
    return <>Captions not found</>
  }
  const showCaptions = findNearestCaptions(captions, time)
  const currentIdx = showCaptions.findLastIndex((e) => e.start <= time)

  return (
    <div className="flex flex-col w-full space-y-1 p-2 rounded-lg my-2">
      <span className="text-pink-300">Select Any Text</span>
      <br />
      {Math.floor(showCaptions[0].start / 60).toFixed(0)}
      {":"}
      {(showCaptions[0].start % 60).toString().padStart(2, "0")}
      {"~"}
      {Math.floor(showCaptions[showCaptions.length - 1].start / 60).toFixed(0)}
      {":"}
      {(showCaptions[showCaptions.length - 1].start % 60)
        .toString()
        .padStart(2, "0")}
      {showCaptions.map((e, i) => (
        <div
          key={e.start}
          className="flex flex-row w-full space-x-2 items-center">
          <button
            className="btn btn-square btn-sm"
            onClick={() => {
              window.postMessage({
                action: MessageAction.AdjustProgress,
                data: e.start
              })
            }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-6 h-6">
              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
            </svg>
          </button>

          {i === currentIdx ? (
            <div className="flex justify-center items-center">
              <div className="bg-[#B99470] rounded-md px-2 mx-[-4px]">
                {e.content}
              </div>
            </div>
          ) : (
            <div>{e.content}</div>
          )}
        </div>
      ))}
    </div>
  )
}

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
function Transation({
  visible,
  text,
  position
}: {
  visible: boolean
  text: string
  position: number[]
}) {
  const [result, setResult] = useState<string>("")
  const [status, setStatus] = useState<"done" | "requesting" | "error">("done")
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (visible && text) {
          setStatus("requesting")
          const client = await openAIClient()
          const model = await gptModel()
          const prompt = await gptTranslatePrompt()

          try {
            const resp = await client.chat.completions.create({
              stream: true,
              messages: [
                {
                  role: "system",
                  content: prompt
                },
                { role: "user", content: text }
              ],
              model: model
            })
            for await (const chunk of resp) {
              if (chunk.choices[0]?.delta?.content) {
                setResult(
                  (prev) => prev + chunk.choices[0]?.delta?.content || ""
                )
              }
            }
            setStatus("done")
          } catch (err) {
            setResult(err.toString())
            setStatus("error")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    setResult("")
    fetchData()
  }, [visible, text])
  if (!visible || !text) {
    return <></>
  }
  return (
    <div
      id="transation"
      className={`card rounded-lg shadow-lg absolute bg-white px-2 py-4 text-2xl space-y-2 min-w-[300px] `}
      style={{ top: position[0], left: position[1] }}>
      <div className="card rounded-lg bg-gray-100 p-4">{text}</div>
      <div className="card rounded-lg bg-gray-100 p-4">
        {result ? (
          result
        ) : (
          <span className="loading loading-dots loading-xs"></span>
        )}
      </div>
      {status === "done" && (
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault()
            chrome.runtime.sendMessage(
              {
                action: MessageAction.AddComplatedCard,
                data: {
                  front: text,
                  back: result
                }
              },
              (resp) => {
                toast.success(`task added, ${resp.count} tasks in progress`)
              }
            )
          }}>
          Add a Card
        </button>
      )}
    </div>
  )
}

const OutsideClickHandler = ({ onOutsideClick, children }) => {
  const wrapperRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("event", event)
      console.log("wrapperRef", wrapperRef.current)

      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        onOutsideClick()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onOutsideClick])
  return (
    <div className="z-10" ref={wrapperRef}>
      {children}
    </div>
  )
}

export default PlasmoOverlay
