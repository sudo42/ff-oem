if (window.location.host === 'engage.streaming.rwth-aachen.de') {
  if (!window.location.href.startsWith('https://engage.streaming.rwth-aachen.de/paella/ui/watch.html'))
    console.warn('looks like we are running outside a player context‽')

  const inFrame = (window.parent !== window)
  const vId = new URLSearchParams(location.search).get('id')
  fetch(`https://engage.streaming.rwth-aachen.de/search/episode.json?${new URLSearchParams({id:vId}).toString()}`)
    .then(d=>d.json())
    .then(meta => {
      window._meta = meta
      let videoTracks = meta['search-results'].result.mediapackage.media.track
        .filter(t=> t.mimetype.startsWith('video/') && t.url.startsWith('http'))
        .sort((a,b) => {
          let mimeComp = a.mimetype.localeCompare(b.mimetype)
          if (mimeComp) return mimeComp
          let resAI = parseInt(a.video.resolution)
          let resBI = parseInt(b.video.resolution)
          if (resAI > resBI) return 1
          if (resAI < resBI) return -1
          return 0
        })
      videoTracks.forEach(t=>console.debug(t.id, t.mimetype, t.video.resolution, t.url))
      if (inFrame) {
        window.parent.postMessage({videoTracks, meta}, '*')
      } else {
        // TODO: add download links to video
      }
    })
} else if (window.location.host === 'moodle.rwth-aachen.de') {
  window.addEventListener('message', msg => {
    let mainFrame = document.querySelector('div[role=main]')
    let sourceFrame = null;
    let _frames = [...document.querySelectorAll('iframe')].filter(f => f.contentWindow === msg.source)
    if (_frames.length) { sourceFrame = _frames[0] }

    let videoLinkList = genLinkContainer(msg.data.videoTracks, msg.data.meta)
    mainFrame.appendChild(videoLinkList)

    // if video frame was found: step out of the video container(s) and place links just below the frame
    let beforeNode = sourceFrame
    while (beforeNode.parentNode && beforeNode.parentNode.matches('.occontainer_inner,.occontainer_outer')) {
      beforeNode = beforeNode.parentNode
    }
    if (beforeNode && beforeNode.parentNode) {
      beforeNode.parentNode.insertBefore(videoLinkList, beforeNode.nextSibling)
    }

    return false;
  })
}

function genLinkContainer(tracks, meta) {
  let videoTitle = meta['search-results'].result.dcTitle || '?'
  let details = document.createElement('details')
  details.classList.add('_ext-openExcellenceMedia_container')
  let summary = document.createElement('summary')
  summary.innerText = `Download video: ${videoTitle}`
  details.appendChild(summary)

  let videoLinkList = document.createElement('ul')
  videoLinkList.classList.add('videoLinkList')
  tracks.forEach(track => {
    let li = document.createElement('li')
    let a = document.createElement('a')
    a.classList.add('videoLink')
    a.href = track.url
    a.innerText = `${track.video.resolution} (${track.mimetype.replace(/^video\//, '')})`
    li.appendChild(a)
    videoLinkList.appendChild(li)
  })
  details.appendChild(videoLinkList)

  return details
}
