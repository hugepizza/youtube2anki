import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://*.youtube.com/*"]
}

// let subsUrl = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
function loadScript() {
  var elem = document.createElement("script")
  elem.type = "text/javascript"
  elem.setAttribute("src", chrome.runtime.getURL("assets/sub-url.js"))
  document.body.appendChild(elem)

  setTimeout(() => {
    const container = document.querySelector("#subsUrl")
    if (container) {
      console.log("content sent", container.getAttribute("data-sub-url"))

      chrome.runtime.sendMessage({
        action: "captionsUrl",
        data: container.getAttribute("data-sub-url")
      })
    }
  }, 1000)
}
setTimeout(loadScript, 3000)
