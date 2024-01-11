import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { toast, ToastContainer } from "react-toastify"

import { parseXML } from "~kits"
import { MessageAction, type caption, type TaskResult } from "~types"

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
      />

      <div className="flex flex-grow w-full">
        <div className="flex flex-col">
          <CaptionLines captions={caption} time={time} />
          <div className="flex flex-row space-x-4 justify-end">
            <div className="flex flex-col">
              <button className="btn" onClick={handleForceUpdate}>
                Reload
              </button>
              <span className="text-base">
                Reload after changing videos
              </span>
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
  removeSelectedText
}: {
  selectedText: string
  position: number[]
  removeSelectedText: () => void
}) {
  if (!selectedText) {
    return <></>
  }
  return (
    <div
      className="join absolute bg-white"
      style={{ top: position[0], left: position[1] }}>
      <div className="tooltip " data-tip="make a card">
        <button
          className="btn border-none btn-lg join-item hover:bg-gray-200"
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
          card
        </button>
      </div>

      <button
        className="btn border-none btn-lg join-item hover:bg-gray-200"
        onClick={() => {
          removeSelectedText()
          document.getSelection().removeAllRanges()
        }}>
        trans
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

export default PlasmoOverlay
