const subsUrl =
  ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer
    .captionTracks[0].baseUrl
const container = document.createElement("p")
container.setAttribute("id", "subsUrl")
container.setAttribute("data-sub-url", subsUrl)
document.body.appendChild(container)
