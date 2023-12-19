import { parseXML } from "~kits"
import type { caption } from "~types"

export {}

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)
let videoTime: number = 0
let videoTitle = ""
let captionData: caption[] = []

chrome.runtime.onMessage.addListener(
  async function (message, sender, sendResponse) {
    if (message.action === "captionsUrl") {
      console.log("bg get captionsUrl, " + message.data)
      await fetch(message.data, { method: "GET" })
        .then((resp) => resp.text())
        .then(async (xmlString) => {
          return await parseXML(xmlString)
        })
        .then((texts) => {
          captionData = texts
        })
        .catch((err) => console.error(err))
    } else if (message.action === "timeChange") {
      console.log("bg get timeChange, " + message.data)
      videoTime = message.data
    } else if (message.action === "videoTitle") {
      videoTitle = message.data
      console.log("bg get videoTitle, " + message.data)
    } else if (message.action === "getState") {
      sendResponse({
        state: {
          videoTime,
          videoTitle,
          captionData: findNearestCaptions(captionData, videoTime)
        }
      })
    }
  }
)

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
