window.addEventListener(
  "load",
  () => {
    const subsUrl =
      ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer
        .captionTracks[0].baseUrl
    console.log("send in inject")
    window.postMessage({ action: "captionUrl", data: subsUrl })
  },
  false
)

window.addEventListener(
  "message",
  (e) => {
    if (e.data.action === "adjustProgress") {
      console.log(e.data.action, e.data.data)
      if (!isNaN(e.data.data)) {
        const videoElement = document.querySelector(".video-stream")
        if (videoElement) {
          console.log("adjust")
          videoElement.currentTime = e.data.data
          videoElement.play()
        }
      }
    }
  },
  false
)
