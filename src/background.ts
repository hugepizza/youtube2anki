import { addTask } from "~backgrounds/queue"
import { MessageAction } from "~types"

export {}
chrome.runtime.onMessage.addListener(
  async function (message, sender, sendResponse) {
    if (message.action === MessageAction.AddCard) {
      const count = addTask({ action: message.action, front: message.data })
      sendResponse({ count })
    } else if (message.action === MessageAction.AddComplatedCard) {
      const count = addTask({
        action: MessageAction.AddComplatedCard,
        front: message.data.front,
        back: message.data.back
      })
      sendResponse({ count })
    }
  }
)
