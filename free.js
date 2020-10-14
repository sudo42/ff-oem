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
        .sort((a,b) =>
            a.mimetype.localeCompare(b.mimetype)
            || Math.sign(parseInt(a.video.resolution) - parseInt(b.video.resolution))
            || Math.sign(a.video.bitrate - b.video.bitrate)
            || 00
        )
      videoTracks.forEach(t=>console.debug(t.id, t.mimetype, t.video.resolution, t.url))
      if (inFrame) {
        window.parent.postMessage({videoTracks, meta}, '*')
      } else {
        // TODO: add download links to video
      }
    })
} else if (window.location.host === 'moodle.rwth-aachen.de') {
  window.addEventListener('message', msg => {
    // this message is not meant for us
    if (!msg.data || !msg.data.videoTracks) return true;

    let mainFrame = document.querySelector('div[role=main]')
    let sourceFrame = null;
    let _frames = [...document.querySelectorAll('iframe')].filter(f => f.contentWindow === msg.source)
    if (_frames.length) { sourceFrame = _frames[0] }

    let videoLinkList = genLinkContainer(msg.data.videoTracks, msg.data.meta)
    if (document.getElementById(videoLinkList.id)) {
      console.debug('looks like we did already insert download links‽')
      // TODO: think about remove + insert vs keep existing
      document.getElementById(videoLinkList.id).remove()
    }
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

function genIdPrefix(videoId) {
  return `_ext-openExcellence_vid-${videoId}`
}
function genVideoContainerId(vidIdOrMeta) {
  if (typeof vidIdOrMeta === 'object')
    vidIdOrMeta = vidIdOrMeta['search-results'].result.id
  return `${genIdPrefix(vidIdOrMeta)}_container`
}

const FMT = (()=>{
  const _locale = undefined
  const _defaults = { style: 'unit', unitDisplay: 'narrow'}
  const kbps = new Intl.NumberFormat(undefined, {..._defaults, unit: 'kilobit-per-second'})
  const base = new Intl.NumberFormat(undefined, {..._defaults, style: 'decimal' })

  return {
    fps: v => `${base.format(v)}fps`,
    hz: v => `${base.format(v/1000)}kHz`,
    bps: v => kbps.format(v/1000),
  }
})()

function genLinkContainer(tracks, meta) {
  let videoTitle = meta['search-results'].result.dcTitle || '?'
  let details = document.createElement('details')
  details.id = genVideoContainerId(meta)
  details.classList.add('_ext-openExcellenceMedia_container')
  let summary = document.createElement('summary')
  summary.innerText = `Download video: ${videoTitle}`
  details.appendChild(summary)

  let videoLinkList = document.createElement('ul')
  videoLinkList.classList.add('videoLinkList')
  tracks.forEach(track => {
    let mVid = track.video || {}
    let mAud = track.audio || {}
    let li = document.createElement('li')
    let a = document.createElement('a')
    a.classList.add('videoLink')
    a.href = track.url
    a.innerText = `${mVid.resolution} (${track.mimetype.replace(/^video\//, '')})`
    a.title = `Title: ${videoTitle}
Type: ${track.mimetype}
Video: ${mVid.resolution}@${FMT.fps(mVid.framerate)} (${FMT.bps(mVid.bitrate)}, ${mVid.encoder.type})
Audio: ${mAud.channels}ch@${FMT.hz(mAud.samplingrate)} (${FMT.bps(mAud.bitrate)}, ${mAud.encoder.type})`
    li.appendChild(a)
    videoLinkList.appendChild(li)
  })
  details.appendChild(videoLinkList)

  return details
}
