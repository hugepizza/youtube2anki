import cssText from "data-text:~style.css"
import { IdCard, Import, Languages, RefreshCcw } from "lucide-react"
import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast, ToastContainer } from "react-toastify"

import { Storage } from "@plasmohq/storage"

import { Button } from "~components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "~components/ui/tooltip"
import openAIClient from "~gpt"
import { parseXML } from "~kits"
import { cn } from "~lib/utils"
import { gptEnable, gptModel, gptPrompt, gptTranslatePrompt } from "~store/gpt"
import { MessageAction, type caption, type TaskResult } from "~types"

const storage = new Storage({ area: "local" })
export const config: PlasmoCSConfig = {
  matches: ["https://*.youtube.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
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
  const [secondaryCaption, setSecondaryCaption] = useState<caption[]>([])
  const [time, setTime] = useState<number>(0)
  const [visible, setVisible] = useState(false)
  const [gptEnableState, setGPTEnableState] = useState(false)
  const [translatedText, setTranslatedText] = useState("")

  const [translationVisible, setTranslationVisible] = useState(false)
  const [makeCardVisible, setMakeCardVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [translateStatus, setTranslateStatus] = useState<
    "done" | "requesting" | "error"
  >("done")
  useEffect(() => {
    gptEnable().then((enable) => {
      setGPTEnableState(enable)
    })
  }, [])

  const translate = useCallback(async (text: string) => {
    setTranslateStatus("requesting")
    const modelName = await gptModel()
    const prompt = await gptPrompt()
    const client = await openAIClient()
    try {
      const chatCompletion = await client.chat.completions.create({
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: text }
        ],
        model: modelName
      })
      const result = chatCompletion.choices[0].message.content
      setTranslateStatus("done")
      setTranslatedText(result)
      return result
    } catch (err) {
      setTranslateStatus("error")
      return text
    }
  }, [])
  useEffect(() => {
    console.log("injecting")
    inject()
  }, [])

  useEffect(() => {
    const captionListiner: (e: MessageEvent<any>) => any = (
      e: MessageEvent<any>
    ) => {
      if (e.data.action === MessageAction.CaptionUrls) {
        console.log("captionUrls triggered", e.data.data)
        if (!Array.isArray(e.data.data)) {
          return
        }
        if (e.data.data.length === 0) {
          return
        }
        console.log("captionUrls triggered", e.data.data)
        let captionUrl = e.data.data.find((url) => {
          const urlObj = new URL(url)
          const lang = urlObj.searchParams.get("lang")
          return lang === "en"
        })
        if (!captionUrl) {
          captionUrl = e.data.data[0]
        }

        fetch(captionUrl, { method: "GET" })
          .then((resp) => resp.text())
          .then((xmlString) => {
            parseXML(xmlString).then((resp) => {
              setCaption(resp)
            })
          })
          .catch((err) => console.error(err))

        let secondaryCaptionUrl = e.data.data.find((url) => {
          const urlObj = new URL(url)
          const lang = urlObj.searchParams.get("lang")
          return lang === "zh-CN"
        })
        if (secondaryCaptionUrl) {
          fetch(secondaryCaptionUrl, { method: "GET" })
            .then((resp) => resp.text())
            .then((xmlString) => {
              parseXML(xmlString).then((resp) => {
                setSecondaryCaption(resp)
              })
            })
            .catch((err) => console.error(err))
        }
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
            toast.success(
              `Card task success, ${
                result.taskCount > 0
                  ? `${result.taskCount} cards in progress`
                  : "no cards in progress"
              } `
            )
          } else {
            toast.error(`Card task failed, ${result.message}`, {
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

  const handleForceUpdate = async () => {
    window.location.reload()
  }

  const handleMakeCard = async (text: string) => {
    console.log("card text", text)
    chrome.runtime.sendMessage(
      {
        action: MessageAction.AddCard,
        data: text
      },
      (resp) => {
        toast.success(`Task added, ${resp.count} cards in progress`)
      }
    )
    document.getSelection().removeAllRanges()
  }
  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed top-4 left-4 p-4 text-base flex flex-row  rounded-lg w-[50vw]",
        visible ? "" : "hidden",
        caption.length > 0 ? "bg-white border-2 border-gray-300" : "bg-red-100"
      )}>
      <ToastContainer
        autoClose={1000}
        position="top-right"
        theme="light"
        toastClassName="bg-white text-2xl"
        toastStyle={{ color: "black" }}
      />

      <div className="flex flex-grow w-full">
        <div className="flex flex-col w-full">
          <CaptionLines captions={caption} time={time} />
          <div className="flex flex-row space-x-4 justify-between">
            <div className="flex flex-row gap-2">
              {gptEnableState && (
                <Button
                  // className="opacity-0"
                  variant="ghost"
                  onClick={async () => {
                    setTranslationVisible(true)
                    const text = document.getSelection().toString()
                    await translate(text)
                  }}>
                  <Languages
                    className={`${caption.length === 0 ? "opacity-0" : ""}`}
                    style={{ width: "16px", height: "16px" }}
                  />
                </Button>
              )}
              <TooltipProvider delayDuration={50}>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      // className="opacity-0"
                      variant="ghost"
                      onClick={async (e) => {
                        const text = document.getSelection().toString()
                        await handleMakeCard(text)
                      }}>
                      <Import
                        className={`${caption.length === 0 ? "opacity-0" : ""}`}
                        style={{ width: "16px", height: "16px" }}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-lg">
                    Add a card to Anki
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider delayDuration={50}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    className={`${
                      caption.length > 0 ? "" : "hover:bg-red-300"
                    }`}
                    onClick={handleForceUpdate}>
                    <RefreshCcw
                      style={{ color: "red", width: "16px", height: "16px" }}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-lg">
                  Refresh the video if captions are not loaded correctly
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TranslationSection
            visible={translationVisible}
            setVisible={setTranslationVisible}
            text={translatedText}
            translateStatus={translateStatus}
          />
        </div>
      </div>
    </div>
  )
}

function TranslationSection({
  visible,
  setVisible,
  text,
  translateStatus
}: {
  visible: boolean
  setVisible: (visible: boolean) => void
  text: string
  translateStatus: "done" | "requesting" | "error"
}) {
  if (translateStatus === "requesting") {
    return (
      <div className="flex flex-col w-full transition-all duration-300 rounded-lg mt-2 max-h-[500px]">
        <div className="py-2 px-4 bg-gray-100 rounded-lg w-full text-2xl flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span>Translating...</span>
        </div>
      </div>
    )
  }
  if (translateStatus === "error") {
    return (
      <div className="flex flex-col w-full transition-all duration-300 rounded-lg mt-2 max-h-[500px]">
        <div className="py-2 px-4 bg-red-50 rounded-lg w-full text-2xl flex items-center justify-center text-red-500">
          <span>Translation failed</span>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`flex flex-col w-full transition-all duration-300 rounded-lg mt-2 ${
        visible
          ? "max-h-[500px] opacity-100"
          : "max-h-0 opacity-0 overflow-hidden"
      }`}>
      <div className="py-2 px-4 bg-gray-100 rounded-lg w-full text-2xl break-words whitespace-normal max-w-full overflow-x-hidden">
        {text}
      </div>
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
  const showCaptions = findNearestCaptions(captions, time)
  const currentIdx = showCaptions.findLastIndex((e) => e.start <= time)
  if (showCaptions.length === 0) {
    return (
      <div className="select-none text-red-500 text-2xl text-red font-semibold my-2">
        Captions not found
      </div>
    )
  }
  return (
    <div className="flex flex-col w-full space-y-1 p-2 rounded-lg my-2 text-2xl">
      <div className="flex flex-row justify-between select-none">
        <div>
          {" "}
          {`${Math.floor(showCaptions[0].start / 60).toFixed(0)}:${(
            showCaptions[0].start % 60
          )
            .toString()
            .padStart(2, "0")}`}
          {" - "}
          {`${Math.floor(
            showCaptions[showCaptions.length - 1].start / 60
          ).toFixed(0)}:${(showCaptions[showCaptions.length - 1].start % 60)
            .toString()
            .padStart(2, "0")}`}
        </div>
      </div>
      {showCaptions.map((e, i) => (
        <div key={i} className="flex flex-row w-full space-x-2">
          <button
            className={`bg-white hover:text-red-500 hover:shadow-lg hover:bg-gray-100 rounded-full p-2 duration-100 self-start ${
              i === currentIdx ? "text-red-500" : ""
            }`}
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
            <div className="flex-1">
              <div className="text-red-500 rounded-md px-2 mx-[-4px]">
                {e.content}
              </div>
            </div>
          ) : (
            <div className="flex-1">{e.content}</div>
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

export default PlasmoOverlay
