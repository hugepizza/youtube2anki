export const youtubejs = `
var isFastForwad = false
var timestamp = 0
var videoElement = document.querySelector("video")

videoElement && videoElement.addEventListener("pause", pauseEvent)
videoElement && videoElement.addEventListener("play", playEvent)

// update video element
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.method == "historyStateUpdated_guyu") {
    videoElement = document.querySelector("video")
    videoElement && videoElement.addEventListener("pause", pauseEvent)
    videoElement && videoElement.addEventListener("play", playEvent)
    sendResponse(null)
  }
})

function pauseEvent() {
  isFastForwad = false
  timestamp = new Date().getTime()
  waitForTerminateInPeriod(translate, 50)
}

function translate() {
  console.log("tigger!!")
}

// action will be excute if no TERMINATE signal has been received in PERIOD of time
function waitForTerminateInPeriod(action, period) {
  setTimeout(() => {
    if (!isFastForwad) {
      action()
    }
  }, period)
}
`
