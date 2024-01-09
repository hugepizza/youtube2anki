import cssText from "data-text:./style.css"
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
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    inject()
    window.addEventListener(
      "message",
      (e) => {
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
      },
      false
    )
    const videoElement = document.querySelector(
      ".video-stream"
    ) as HTMLVideoElement
    if (videoElement) {
      videoElement.addEventListener("pause", () => {
        setVisible(true)
      })
      videoElement.addEventListener("play", () => {
        setVisible(false)
      })
      videoElement.addEventListener("timeupdate", (e) => {
        const ele = document.querySelector(".video-stream") as HTMLVideoElement
        setTime(ele.currentTime)
      })
    }

    chrome.runtime.onMessage.addListener(
      async function (message, sender, sendResponse) {
        if (message.action === MessageAction.TaskResult) {
          console.log(MessageAction.TaskResult)
          const result = message.data as TaskResult
          if (result) {
            if (result.result === "success") {
              toast.success(
                `task success, ${result.taskCount} tasks in progress`
              )
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
    )
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

      <div className="flex flex-grow w-full">
        <div className="flex flex-col">
          <CaptionLines captions={caption} time={time} />
          <div className="flex flex-row space-x-4 justify-end">
            <div className="flex flex-col">
              <button
                className="btn btn-lg text-2xl bg-[#5F6F52] text-[#A9B388]"
                onClick={handleForceUpdate}>
                Reload
              </button>
              <span className="text-base">Reload after changing videos</span>
            </div>
            <div className="flex flex-col">
              <button
                className={`btn btn-lg text-2xl bg-[#5F6F52] text-[#A9B388] ${
                  requesting ? "btn-disabled" : ""
                }`}
                onClick={async () => {
                  const text = window.getSelection().toString()
                  if (text.trim() === "") {
                    return
                  }
                  chrome.runtime.sendMessage(
                    {
                      action: MessageAction.AddCard,
                      data: text
                    },
                    (resp) => {
                      toast.success(
                        `task added, ${resp.count} tasks in progress`
                      )
                    }
                  )
                }}>
                Make Card
              </button>
              <span className="text-base">Make a card from selected text</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Fetching({}) {
  return (
    <>
      <span className=" items-center loading loading-dots loading-lg"></span>
      <span>Loading the currently playing video...</span>
      <span className="text-sm text">
        If subtitles and title are not consistent, attempt to reopen the plugin
        popup.
      </span>
    </>
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
    <div className="flex flex-col w-full space-y-1 bg-secondary p-2 rounded-lg my-2">
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

async function refresh() {
  // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: () => {
  //     window.location.reload()
  //   }
  // })
  window.location.reload()
}

export default PlasmoOverlay
