/*! Pool Party soundtrack layer — Overflow + Clear to the Floor + volume buttons. cache-bust:v12 */
(function (global) {
  'use strict';

  var TRACKS = [
    { title: 'Overflow', note: 'Pool Party bed', src: 'assets/audio/overflow.mp3' },
    { title: 'Clear to the Floor', note: 'Sonic Ear Candy', src: 'assets/audio/clear-to-the-floor.mp3' }
  ];
  var SEC_URL = 'https://sonicearcandy.com/';
  var DEFAULT_VOL = 0.35;
  var VOL_STEP = 0.1;
  var KEY_MUTE = 'pp_music_muted';
  var KEY_TRACK = 'pp_music_track';
  var KEY_VOL = 'pp_music_vol';

  var audio = null;
  var index = 0;
  var muted = false;
  var volume = DEFAULT_VOL;
  var dock = null;
  var playBtn = null;
  var muteBtn = null;
  var volDownBtn = null;
  var volUpBtn = null;
  var volPctEl = null;
  var titleEl = null;
  var ready = false;

  function trackUrl(i) {
    return TRACKS[i].src;
  }

  function clampIndex(n) {
    var len = TRACKS.length;
    return ((n % len) + len) % len;
  }

  function clampVol(n) {
    if (isNaN(n)) return DEFAULT_VOL;
    return Math.min(1, Math.max(0, n));
  }

  function loadPersisted() {
    try {
      var t = parseInt(localStorage.getItem(KEY_TRACK), 10);
      if (!isNaN(t)) index = clampIndex(t);
      muted = localStorage.getItem(KEY_MUTE) === '1';
      var v = parseFloat(localStorage.getItem(KEY_VOL));
      if (!isNaN(v)) volume = clampVol(v);
    } catch (e) { /* ignore */ }
  }

  function persist() {
    try {
      localStorage.setItem(KEY_TRACK, String(index));
      localStorage.setItem(KEY_MUTE, muted ? '1' : '0');
      localStorage.setItem(KEY_VOL, String(volume));
    } catch (e) { /* ignore */ }
  }

  function setPlayingUI(on) {
    var band = document.querySelector('.music-band');
    var eq = document.querySelector('.music-band .eq');
    if (band) band.classList.toggle('is-playing', !!on);
    if (eq) eq.classList.toggle('is-playing', !!on);
    if (dock) dock.classList.toggle('is-playing', !!on);
    if (playBtn) {
      playBtn.setAttribute('aria-label', on ? 'Pause soundtrack' : 'Play soundtrack');
      playBtn.setAttribute('data-state', on ? 'playing' : 'paused');
      playBtn.innerHTML = on ? iconPause() : iconPlay();
    }
  }

  function updateTitle() {
    var t = TRACKS[index];
    var label = t.title + (t.note ? ' (' + t.note + ')' : '');
    if (titleEl) titleEl.textContent = label;
    if (audio) audio.setAttribute('title', label + ' — Pool Party');
  }

  function syncVolUI() {
    var pct = Math.round(volume * 100);
    if (volPctEl) volPctEl.textContent = pct + '%';
    if (volDownBtn) volDownBtn.disabled = volume <= 0 && muted;
    if (volUpBtn) volUpBtn.disabled = volume >= 1 && !muted;
  }

  function applyMute() {
    if (!audio) return;
    audio.muted = muted;
    audio.volume = muted ? 0 : volume;
    if (muteBtn) {
      muteBtn.setAttribute('aria-label', muted ? 'Unmute soundtrack' : 'Mute soundtrack');
      muteBtn.setAttribute('data-state', muted ? 'muted' : 'unmuted');
      muteBtn.innerHTML = muted ? iconMuted() : iconVolume();
    }
    if (dock) dock.classList.toggle('is-muted', muted);
    syncVolUI();
  }

  function setVolume(v, fromUser) {
    volume = clampVol(v);
    if (fromUser && volume > 0 && muted) muted = false;
    if (fromUser && volume === 0) muted = true;
    persist();
    applyMute();
  }

  function volDown() {
    setVolume(volume - VOL_STEP, true);
  }

  function volUp() {
    setVolume(volume + VOL_STEP, true);
  }

  function loadTrack(i, autoPlay) {
    index = clampIndex(i);
    persist();
    updateTitle();
    if (!audio) return;
    audio.src = trackUrl(index);
    audio.load();
    applyMute();
    if (autoPlay) {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { setPlayingUI(false); });
    }
  }

  function play() {
    if (!audio) return;
    if (!audio.src) loadTrack(index, false);
    applyMute();
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { setPlayingUI(true); }).catch(function () { setPlayingUI(false); });
    } else {
      setPlayingUI(true);
    }
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    setPlayingUI(false);
  }

  function toggle() {
    if (audio && !audio.paused) pause();
    else play();
  }

  function next() {
    var was = audio && !audio.paused;
    loadTrack(index + 1, was);
    if (was) setPlayingUI(true);
  }

  function prev() {
    var was = audio && !audio.paused;
    if (audio && audio.currentTime > 2.5) {
      audio.currentTime = 0;
      return;
    }
    loadTrack(index - 1, was);
    if (was) setPlayingUI(true);
  }

  function toggleMute() {
    muted = !muted;
    if (!muted && volume === 0) volume = DEFAULT_VOL;
    persist();
    applyMute();
  }

  function iconPlay() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  }
  function iconPause() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  }
  function iconPrev() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>';
  }
  function iconNext() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>';
  }
  function iconVolume() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>';
  }
  function iconMuted() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 12a4.5 4.5 0 0 0-2.5-4v2.2l2.5 2.5V12zm2.5 0c0 .9-.2 1.7-.5 2.5l1.5 1.5c.6-1.2 1-2.5 1-4 0-3.5-2.3-6.4-5.5-7.3v2.1c2 .8 3.5 2.8 3.5 5.2zM4.3 3 3 4.3 7.7 9H3v4h4l5 5v-6.7l4.7 4.7 1.3-1.3L4.3 3zM14 3.7l-2.1 2.1L14 8V3.7z"/></svg>';
  }

  function buildDock() {
    dock = document.createElement('div');
    dock.className = 'pp-music-dock';
    dock.setAttribute('role', 'region');
    dock.setAttribute('aria-label', 'Pool Party soundtrack');

    dock.innerHTML =
      '<div class="pp-music-dock__inner">' +
        '<button type="button" class="pp-music-dock__btn pp-music-dock__prev" aria-label="Previous track">' + iconPrev() + '</button>' +
        '<button type="button" class="pp-music-dock__btn pp-music-dock__play" aria-label="Play soundtrack" data-state="paused">' + iconPlay() + '</button>' +
        '<button type="button" class="pp-music-dock__btn pp-music-dock__next" aria-label="Next track">' + iconNext() + '</button>' +
        '<div class="pp-music-dock__meta">' +
          '<span class="pp-music-dock__title"></span>' +
          '<a class="pp-music-dock__sec" href="' + SEC_URL + '" target="_blank" rel="noopener noreferrer" title="Sonic Ear Candy · Frank Accettulli">SonicEarCandy.com</a>' +
        '</div>' +
        '<div class="pp-music-dock__vol">' +
          '<button type="button" class="pp-music-dock__btn pp-music-dock__mute" aria-label="Mute soundtrack" data-state="unmuted">' + iconVolume() + '</button>' +
          '<button type="button" class="pp-music-dock__btn pp-music-dock__voldown" aria-label="Volume down">−</button>' +
          '<span class="pp-music-dock__volpct" aria-live="polite">35%</span>' +
          '<button type="button" class="pp-music-dock__btn pp-music-dock__volup" aria-label="Volume up">+</button>' +
        '</div>' +
      '</div>';

    playBtn = dock.querySelector('.pp-music-dock__play');
    muteBtn = dock.querySelector('.pp-music-dock__mute');
    volDownBtn = dock.querySelector('.pp-music-dock__voldown');
    volUpBtn = dock.querySelector('.pp-music-dock__volup');
    volPctEl = dock.querySelector('.pp-music-dock__volpct');
    titleEl = dock.querySelector('.pp-music-dock__title');

    dock.querySelector('.pp-music-dock__prev').addEventListener('click', function (e) {
      e.preventDefault();
      prev();
    });
    playBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggle();
    });
    dock.querySelector('.pp-music-dock__next').addEventListener('click', function (e) {
      e.preventDefault();
      next();
    });
    muteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleMute();
    });
    volDownBtn.addEventListener('click', function (e) {
      e.preventDefault();
      volDown();
    });
    volUpBtn.addEventListener('click', function (e) {
      e.preventDefault();
      volUp();
    });

    document.body.appendChild(dock);
  }

  function bindTriggers() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-pp-music-play]');
      if (!t) return;
      e.preventDefault();
      play();
    });
  }

  function initAudio() {
    audio = document.createElement('audio');
    audio.preload = 'none';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('title', 'Pool Party soundtrack');
    audio.volume = volume;
    audio.addEventListener('play', function () { setPlayingUI(true); });
    audio.addEventListener('pause', function () { setPlayingUI(false); });
    audio.addEventListener('ended', function () { next(); play(); });
    document.body.appendChild(audio);
    loadTrack(index, false);
    applyMute();
  }

  function init() {
    if (ready) return;
    ready = true;
    loadPersisted();
    buildDock();
    initAudio();
    bindTriggers();
    updateTitle();
    setPlayingUI(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.PPMusic = {
    play: play,
    pause: pause,
    toggle: toggle,
    next: next,
    prev: prev,
    setVolume: function (v) { setVolume(v, true); }
  };
})(typeof window !== 'undefined' ? window : this);
