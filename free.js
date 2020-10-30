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
      } /*/ else /* */ {
        addLinksToVideoPlayer(videoTracks, meta)
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

function genLinkList(tracks, meta) {
  let videoTitle = meta['search-results'].result.dcTitle || '?'
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

  return videoLinkList
}

function genLinkContainer(tracks, meta) {
  let videoTitle = meta['search-results'].result.dcTitle || '?'
  let details = document.createElement('details')
  details.id = genVideoContainerId(meta)
  details.classList.add('_ext-openExcellenceMedia_container')
  let summary = document.createElement('summary')
  summary.innerText = `Download video: ${videoTitle}`
  details.appendChild(summary)
  details.appendChild(genLinkList(tracks, meta))

  return details
}

const _PLAYER_CONTROL_BUTTON_ID = '_ext_openExcellence_btn-ctrl-bar'
function genPlayerControlsButton() {
  let container = document.createElement('div');
  ['buttonPlugin', 'right', 'openExcellenceMediaPlugin'].forEach(c=>container.classList.add(c))
  container.id = _PLAYER_CONTROL_BUTTON_ID
  container.setAttribute('title', 'Show downloadable video links');

  let icon = document.createElement('i');
  ['button-icon', 'icon-download'].forEach(c=>icon.classList.add(c))
  container.appendChild(icon)

  return container
}

const _PLAYER_CONTROL_POPOUT_ID = '_ext_openExcellence_ctr-bar-pop-out'
function genPlayerControlsPopOut(tracks, meta) {
  let container = document.createElement('div');
  ['openExcellenceMediaPlugin', 'oemPopOut'].forEach(c=>container.classList.add(c))
  container.id = _PLAYER_CONTROL_POPOUT_ID
  container.appendChild(genLinkList(tracks, meta))

  return container
}

function addLinksToVideoPlayer(videoTracks, meta) {
  // removing old elements, if they are still here ...
  document.querySelectorAll(`#${_PLAYER_CONTROL_BUTTON_ID}, #${_PLAYER_CONTROL_POPOUT_ID}`)
    .forEach(n => n.remove())

  console.debug('adding links to page ...', document.readyState)

  let toolbarBtn = genPlayerControlsButton()
  let toolbarPopOut = genPlayerControlsPopOut(videoTracks, meta)
  document.body.appendChild(toolbarPopOut)
  console.debug(toolbarPopOut)

  let timeoutFn = ()=>{
    // waiting for things like the toolbar to be ready
    if (!document.querySelector('.playbackControls')) {
      setTimeout(timeoutFn, 250)
      return
    }
    console.debug('page seems to be ready ... adding things ...')

/*
    // web extensions can not trivially access properties in the window object of the page context
    // just using paella's API and adding a regular plugin for this would have been nice
    console.debug(window, window.paella)
    window.paella.addPlugin(()=>{
      return class OpenExcellenceMedia extends paella.ButtonPlugin {
        getIndex()      { return 42021; }
        getAlignment()  { return 'right' }
        getSubclass()   { return "openExcellenceMedia-ctrl-btn" }
        getIconClass()  { return 'icon-download' }
        getName()       { return "_.OpenExcellenceMedia.ff-ext" }
        getButtonType() { return paella.ButtonPlugin.type.popUpButton }
        buildContent(domElement) {
          let linkList = genLinkList(videoTracks, meta)
          domElement.appendChild(linkList)
          domElement.classList.add('OpenExcellenceMediaPlugin')
        }

      }
    })
*/

    let open = false
    let buttonBarContainer = document.querySelector('.playbackBarPlugins')
    let popOutContainer = document.querySelector('.popUpPluginContainer')
    buttonBarContainer.appendChild(toolbarBtn)
    popOutContainer.appendChild(toolbarPopOut)
    let _setOpen = (newState = null) => {
      if (newState === undefined || newState === null) newState = !open
      open = newState
      let style = toolbarPopOut.style
      if (open) {
        style.display = null
        toolbarBtn.classList.add('selected')
      } else {
        style.display = 'none'
        toolbarBtn.classList.remove('selected')
      }
    }
    _setOpen(false)
    toolbarBtn.addEventListener('click', e=>{
      _setOpen()
    })
  }
  console.debug('wating for player interface to get ready ...')
  timeoutFn()

}
