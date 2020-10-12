console.debug(document.readyState, ''+window.location)

if (window.location.host === 'engage.streaming.rwth-aachen.de') {
  console.debug(window, window.parent, window.top)
  const inFrame = (window.parent !== window)
  console.debug('running in video context ... deatching URLs ...', inFrame)
  let vId = new URLSearchParams(location.search).get('id')
  fetch(`https://engage.streaming.rwth-aachen.de/search/episode.json?id=${new URLSearchParams(location.search).get('id')}`)
    .then(d=>d.json())
    .then(meta => {
      window._meta = meta
      let videoTracks = meta['search-results'].result.mediapackage.media.track
        .filter(t=> t.mimetype.startsWith('video/') && t.url.startsWith('http'))
      videoTracks.forEach(t=>console.log(t.id, t.mimetype, t.video.resolution, t.url))
      if (inFrame) {
        console.debug('posting message')
        window.parent.postMessage({videoTracks, meta}, '*')
        window.addEventListener('message', msg => {
          console.debug('got message in frame', msg)
          console.debug('is from parent', msg.origin === window.parent)
        })
      }
    })
} else if (window.location.host === 'moodle.rwth-aachen.de') {
  window.addEventListener('message', msg => {
    window._lastMsg = msg;
    window._msgSrc = msg.source;
    console.log('msg', msg)

    let mainFrame = document.querySelector('div[role=main]')
    let sourceFrame = null;
    let _frames = [...document.querySelectorAll('iframe')].filter(f => f.contentWindow === msg.source)
    if (_frames.length) { sourceFrame = _frames[0] }

    let videoLinkList = genLinkContainer(msg.data.videoTracks, msg.data.meta)
    mainFrame.appendChild(videoLinkList)

    window._sf = sourceFrame
    console.debug('sourceFrame', sourceFrame, sourceFrame.parentNode)
    let beforeNode = sourceFrame
    while (beforeNode.parentNode && beforeNode.parentNode.matches('.occontainer_inner,.occontainer_outer')) {
      beforeNode = beforeNode.parentNode
    }
    if (beforeNode && beforeNode.parentNode) {
      beforeNode.parentNode.insertBefore(videoLinkList, beforeNode)
    }

    return false;
  })
  let frame = document.querySelector('iframe.ocplayer')
  if (frame) {
    console.debug('posting to child')
    frame.contentWindow.postMessage('hello child', '*')
  }
}

function genLinkContainer(tracks, meta) {
  let videoTitle = meta['search-results'].result.dcTitle || '?'
  let details = document.createElement('details')
  let summary = document.createElement('summary')
  summary.innerText = `Download video: ${videoTitle}`
  details.appendChild(summary)

  let videoLinkList = document.createElement('ul')
  msg.data.videoTracks.forEach(track => {
    let li = document.createElement('li')
    let a = document.createElement('a')
    a.href = track.url
    a.innerText = `${track.video.resolution} (${track.mimetype})`
    li.appendChild(a)
    videoLinkList.appendChild(li)
  })
  details.appendChild(videoLinkList)

  return details
}
