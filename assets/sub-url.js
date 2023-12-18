window.addEventListener(
  "load",
  () => {
    const subsUrl =
      ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer
        .captionTracks[0].baseUrl
    console.log("send in inject")
    window.postMessage({ action: "captionUrl", data: subsUrl })
    // window.postMessage(123)
    setInterval(() => {
      ytplayer = document.getElementById("movie_player")
      if (ytplayer && ytplayer.getCurrentTime && ytplayer.getCurrentTime()) {
        window.postMessage({
          action: "duration",
          data: ytplayer.getCurrentTime()
        })
      }
    }, 2000)
  },
  false
)
