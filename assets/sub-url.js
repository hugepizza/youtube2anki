window.addEventListener(
  "yt-navigate-finish",
  () => {
    console.log("sent in injected script yt-navigate-finish")
    // Wait for player data to be ready
    const checkPlayerData = setInterval(() => {
      const player = document.querySelector("#movie_player")
      if (player && player.getVideoData && player.getPlayerResponse) {
        clearInterval(checkPlayerData)
        getCaptions()
      }
    }, 100)

    // Clear interval after 5 seconds if player data is not ready
    setTimeout(() => {
      clearInterval(checkPlayerData)
    }, 5000)
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

function getCaptions() {
  const player = document.querySelector("#movie_player")
  if (player && player.getVideoData) {
    const videoData = player.getVideoData()
    const videoId = videoData.video_id

    // Get captions from player's internal data
    const playerData = player.getPlayerResponse()
    if (playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
      const subsUrls =
        playerData.captions.playerCaptionsTracklistRenderer.captionTracks.map(
          (track) => track.baseUrl
        )
      window.postMessage({ action: "captionUrls", data: subsUrls })
    }
  }
}
