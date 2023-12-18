// import { atom, useAtom } from "jotai"
// import type { PlasmoCSConfig } from "plasmo"

// export const config: PlasmoCSConfig = {
//   matches: ["https://*.youtube.com/*"]
// }

// let subsUrl = ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;

// export const store: string[] = []
// window.addEventListener("load", () => {
//   const cc = document.querySelector(
//     ".ytp-subtitles-button"
//   ) as HTMLButtonElement
//   cc.click()

//   const observer = new MutationObserver((mutations) => {
//     mutations.forEach((mutation) => {
//       if (mutation.type === "childList" || mutation.type === "characterData") {
//         store.push(mutation.target.textContent)
//         console.log(mergeDuplicateSentences(store).split(" "))
//         chrome.runtime.sendMessage({
//           action: "captions",
//           data: mergeDuplicateSentences(store).split(" ")
//         })
//       }
//     })
//   })

//   const config = { childList: true, characterData: true, subtree: true }
//   const retryGetCaptionsContainer = () => {
//     if (document.querySelector(".captions-text")) {
//       observer.observe(document.querySelector(".captions-text") as Node, config)

//       // check if cc is off
//       setInterval(() => {
//         if (!document.querySelector(".captions-text")) {
//           retryGetCaptionsContainer()
//         }
//       })
//     } else {
//       setTimeout(retryGetCaptionsContainer, 1000)
//     }
//   }

//   retryGetCaptionsContainer()

//   const play = document.querySelector(".ytp-play-button") as HTMLButtonElement

//   const button = document.createElement("button")
//   button.setAttribute("text", "nichilema")
//   button.textContent = "xxx"
//   button.style.height = "100px"
//   button.style.width = "100px"
//   button.style.position = "fixed"
//   button.style.top = "10px"
//   button.style.left = "10px"
//   button.onclick = (e) => {
//     play.click()
//   }
//   document.body.appendChild(button)
// })

// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//   alert("content")
// })

// function mergeDuplicateSentences(sentences: string[]): string {
//   // Initialize an empty string for the merged sentence.
//   let mergedSentence = ""

//   // Keep track of the previous sentence for comparison.
//   let previousSentence = ""

//   // Iterate over the sentences.
//   for (const sentence of sentences) {
//     // Check if the current sentence starts with the previous sentence.
//     if (sentence.startsWith(previousSentence)) {
//       // If it does, merge the remaining part of the current sentence to the previous sentence.
//       previousSentence += sentence.substring(previousSentence.length)
//     } else {
//       // If not, add the previous sentence (if not empty) to the merged sentence and update the current sentence as the new "previous".
//       if (previousSentence.length > 0) {
//         mergedSentence += " " + previousSentence
//       }
//       previousSentence = sentence
//     }
//   }
//   // Add the last "previous sentence" (if not empty) to the merged sentence.
//   if (previousSentence.length > 0) {
//     mergedSentence += " " + previousSentence
//   }
//   return mergedSentence.trim() // Remove leading and trailing whitespace.
// }
