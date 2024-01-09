import { addTask } from "~backgrounds/queue"
import { MessageAction } from "~types"

export {}
chrome.runtime.onMessage.addListener(
  async function (message, sender, sendResponse) {
    if (message.action === MessageAction.AddCard) {
      const count = addTask({ action: message.action, data: message.data })
      sendResponse({ count })
    }
  }
)
