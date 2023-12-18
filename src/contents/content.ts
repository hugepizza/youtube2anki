import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.youtube.com/*"]
}

// get url
function inject() {
  var elem = document.createElement("script")
  elem.type = "text/javascript"
  elem.setAttribute("src", chrome.runtime.getURL("assets/sub-url.js"))
  document.body.appendChild(elem)
}
// switch caption on
const cc = document.querySelector(".ytp-subtitles-button") as HTMLButtonElement
cc.click()

// observer video progress
const observer = new MutationObserver((mutations) => {
  // ytp-time-current
  mutations.forEach((mutation) => {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      console.log("change", mutation.target.textContent)
      if (mutation.target.textContent) {
        const [minutes, seconds] = mutation.target.textContent
          .split(":")
          .map(Number)
        const totalSeconds = minutes * 60 + seconds
        console.log("content send timeChange, " + totalSeconds)
        chrome.runtime.sendMessage({
          action: "timeChange",
          data: totalSeconds
        })
      }
    }
  })
})
const obConfig = { childList: true, characterData: true, subtree: true }
observer.observe(document.querySelector(".ytp-time-current") as Node, obConfig)

// get title
chrome.runtime.sendMessage({
  action: "videoTitle",
  data: document
    .querySelector("head > meta:nth-child(56)")
    .getAttribute("content")
})

inject()

// get caption file url
setTimeout(() => {
  const container = document.querySelector("#subsUrl")
  console.log(123)

  if (container) {
    console.log("content sent", container.getAttribute("data-sub-url"))

    chrome.runtime.sendMessage({
      action: "captionsUrl",
      data: container.getAttribute("data-sub-url")
    })
  }
}, 2000)
