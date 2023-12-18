export {}

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "captionsUrl") {
    console.log("bg get ")
    chrome.runtime.sendMessage({
      action: "captionsUrlPopup",
      data: message.data
    })
  }
})
