/*! Pool Party soundtrack layer — soft-nav continuous play + unmuted autoplay. cache-bust:v18 */
(function (global) {
  'use strict';

  var TRACKS = [
    { title: 'Overflow', note: 'Pool Party bed', src: 'assets/audio/overflow.mp3' },
    { title: 'Clear to the Floor', note: 'Sonic Ear Candy', src: 'assets/audio/clear-to-the-floor.mp3' }
  ];
  var SEC_URL = 'https://sonicearcandy.com/';
  var DEFAULT_VOL = 0.5;
  var VOL_STEP = 0.1;
  var KEY_MUTE = 'pp_music_muted';
  var KEY_TRACK = 'pp_music_track';
  var KEY_VOL = 'pp_music_vol';
  var KEY_TIME = 'pp_music_time';
  var KEY_PLAYING = 'pp_music_playing';
  var KEY_TOUCHED = 'pp_music_touched';

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
  var navigating = false;
  var gestureArmed = false;
  var gestureUnbind = null;
  var sessionTouched = false;
  var resumeTime = 0;
  var wantPlaying = false;

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

  function ssGet(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  }
  function ssSet(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }

  function loadPersisted() {
    try {
      // Volume / mute can persist; track always opens on Overflow unless this
      // tab already soft-nav'd mid-play (sessionStorage playing+track).
      var muteRaw = ssGet(KEY_MUTE);
      if (muteRaw === null) muteRaw = localStorage.getItem(KEY_MUTE);
      muted = muteRaw === '1';
      var v = parseFloat(ssGet(KEY_VOL) || localStorage.getItem(KEY_VOL));
      if (!isNaN(v)) volume = clampVol(v);
      else volume = DEFAULT_VOL;
      wantPlaying = ssGet(KEY_PLAYING) === '1';
      sessionTouched = ssGet(KEY_TOUCHED) === '1';
      var t = parseInt(ssGet(KEY_TRACK), 10);
      var tm = parseFloat(ssGet(KEY_TIME));
      if (wantPlaying && !isNaN(t)) {
        // Mid-session soft-nav / hard refresh while playing — keep track+time
        index = clampIndex(t);
        if (!isNaN(tm) && tm > 0) resumeTime = tm;
      } else {
        // Fresh visit / first click start — always Overflow from the top
        index = 0;
        resumeTime = 0;
      }
    } catch (e) {
      index = 0;
      resumeTime = 0;
    }
  }

  /** First start / unlock always begins on Overflow. */
  function ensureOverflowStart() {
    index = 0;
    resumeTime = 0;
    if (audio) {
      try { audio.currentTime = 0; } catch (e) { /* ignore */ }
    }
    loadTrack(0, false);
  }

  function persist() {
    try {
      localStorage.setItem(KEY_TRACK, String(index));
      localStorage.setItem(KEY_MUTE, muted ? '1' : '0');
      localStorage.setItem(KEY_VOL, String(volume));
    } catch (e) { /* ignore */ }
    ssSet(KEY_TRACK, String(index));
    ssSet(KEY_MUTE, muted ? '1' : '0');
    ssSet(KEY_VOL, String(volume));
    persistSessionPlayback();
  }

  function persistSessionPlayback() {
    if (!audio) {
      ssSet(KEY_PLAYING, wantPlaying ? '1' : '0');
      if (sessionTouched) ssSet(KEY_TOUCHED, '1');
      return;
    }
    try {
      if (!isNaN(audio.currentTime)) ssSet(KEY_TIME, String(audio.currentTime));
    } catch (e) { /* ignore */ }
    var playing = !!(audio && !audio.paused && !audio.ended);
    ssSet(KEY_PLAYING, playing ? '1' : '0');
    if (sessionTouched) ssSet(KEY_TOUCHED, '1');
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
    sessionTouched = true;
    ssSet(KEY_TOUCHED, '1');
    if (!audio.src) loadTrack(index, false);
    applyMute();
    var p = audio.play();
    if (p && p.then) {
      p.then(function () {
        setPlayingUI(true);
        wantPlaying = true;
        persistSessionPlayback();
      }).catch(function () {
        setPlayingUI(false);
        armGestureUnlock();
      });
    } else {
      setPlayingUI(true);
      wantPlaying = true;
      persistSessionPlayback();
    }
  }

  function pause() {
    if (!audio) return;
    sessionTouched = true;
    ssSet(KEY_TOUCHED, '1');
    audio.pause();
    setPlayingUI(false);
    wantPlaying = false;
    ssSet(KEY_PLAYING, '0');
    persistSessionPlayback();
  }

  function toggle() {
    if (audio && !audio.paused) pause();
    else play();
  }

  function next() {
    var was = audio && !audio.paused;
    resumeTime = 0;
    loadTrack(index + 1, was);
    if (was) setPlayingUI(true);
  }

  function prev() {
    var was = audio && !audio.paused;
    if (audio && audio.currentTime > 2.5) {
      audio.currentTime = 0;
      return;
    }
    resumeTime = 0;
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
    if (document.querySelector('.pp-music-dock')) {
      dock = document.querySelector('.pp-music-dock');
      playBtn = dock.querySelector('.pp-music-dock__play');
      muteBtn = dock.querySelector('.pp-music-dock__mute');
      volDownBtn = dock.querySelector('.pp-music-dock__voldown');
      volUpBtn = dock.querySelector('.pp-music-dock__volup');
      volPctEl = dock.querySelector('.pp-music-dock__volpct');
      titleEl = dock.querySelector('.pp-music-dock__title');
      return;
    }
    dock = document.createElement('div');
    dock.className = 'pp-music-dock';
    dock.setAttribute('role', 'region');
    dock.setAttribute('aria-label', 'Pool Party soundtrack');
    dock.setAttribute('data-pp-persist', 'music');

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
          '<span class="pp-music-dock__volpct" aria-live="polite">50%</span>' +
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

  function showStartChip(show) {
    if (!dock) return;
    var chip = dock.querySelector('.pp-music-dock__start');
    if (show) {
      if (!chip) {
        chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'pp-music-dock__start';
        chip.setAttribute('aria-label', 'Start soundtrack');
        chip.textContent = 'Tap to start soundtrack';
        chip.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          hideStartChip();
          disarmGestureUnlock();
          muted = false;
          if (volume < 0.05) volume = DEFAULT_VOL;
          ensureOverflowStart();
          persist();
          applyMute();
          play();
        });
        dock.appendChild(chip);
      }
      chip.hidden = false;
      dock.classList.add('needs-start');
    } else if (chip) {
      chip.hidden = true;
      dock.classList.remove('needs-start');
    }
  }

  function hideStartChip() {
    showStartChip(false);
  }

  function disarmGestureUnlock() {
    if (typeof gestureUnbind === 'function') {
      try { gestureUnbind(); } catch (e) { /* ignore */ }
    }
    gestureUnbind = null;
    gestureArmed = false;
  }

  function unlockAndPlay() {
    disarmGestureUnlock();
    hideStartChip();
    if (!audio) return;
    muted = false;
    if (volume < 0.05) volume = DEFAULT_VOL;
    ensureOverflowStart();
    persist();
    applyMute();
    play();
  }

  function armGestureUnlock() {
    if (gestureArmed) return;
    gestureArmed = true;
    showStartChip(true);
    var evts = ['pointerdown', 'touchstart', 'keydown', 'click'];
    // Capture phase so we unlock in the same gesture before soft-nav runs.
    var unlock = function (e) {
      // Don't steal dock controls — they handle play themselves
      if (e && e.target && e.target.closest && e.target.closest('.pp-music-dock__btn, .pp-music-dock__start')) {
        return;
      }
      unlockAndPlay();
    };
    evts.forEach(function (t) {
      document.addEventListener(t, unlock, true);
    });
    gestureUnbind = function () {
      evts.forEach(function (t) {
        document.removeEventListener(t, unlock, true);
      });
    };
  }

  function attemptPlayPromise() {
    applyMute();
    var p = audio.play();
    if (p && p.then) {
      return p.then(function () {
        setPlayingUI(true);
        wantPlaying = true;
        sessionTouched = true;
        ssSet(KEY_TOUCHED, '1');
        persistSessionPlayback();
        hideStartChip();
        disarmGestureUnlock();
      });
    }
    setPlayingUI(true);
    hideStartChip();
    return Promise.resolve();
  }

  /** Try unmuted autoplay; if blocked, show chip + capture-phase gesture unlock.
   *  Respects an intentional stop: if the visitor paused this session, stay off. */
  function tryAutoplay() {
    if (!audio) return;
    // Fresh visits should land at ~50% unless user set a volume before
    if (!localStorage.getItem(KEY_VOL)) {
      volume = DEFAULT_VOL;
    }

    // User stopped the player this session — do not restart on hard refresh / new page
    if (sessionTouched && !wantPlaying) {
      muted = false;
      applyMute();
      setPlayingUI(false);
      hideStartChip();
      disarmGestureUnlock();
      return;
    }

    muted = false;
    // Cold start / first play intent: Overflow. Mid-session resume keeps index.
    if (!wantPlaying) {
      ensureOverflowStart();
    }
    persist();
    applyMute();

    var run = function () {
      // Re-check in case user paused while we waited for canplay
      if (sessionTouched && !wantPlaying) {
        setPlayingUI(false);
        return;
      }
      attemptPlayPromise().catch(function () {
        setPlayingUI(false);
        armGestureUnlock();
      });
    };

    if (audio.readyState >= 2) {
      run();
    } else {
      var onReady = function () {
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('loadeddata', onReady);
        run();
      };
      audio.addEventListener('canplay', onReady);
      audio.addEventListener('loadeddata', onReady);
      try { audio.load(); } catch (e) { /* ignore */ }
      // Fallback if events never fire
      setTimeout(function () {
        if (audio && audio.paused && !gestureArmed && !(sessionTouched && !wantPlaying)) run();
      }, 800);
    }
  }

  function initAudio() {
    if (audio && audio.isConnected) return;
    if (audio) {
      document.body.appendChild(audio);
      return;
    }
    audio = document.createElement('audio');
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('title', 'Pool Party soundtrack');
    audio.setAttribute('data-pp-persist', 'music');
    audio.volume = muted ? 0 : volume;
    audio.addEventListener('play', function () {
      setPlayingUI(true);
      wantPlaying = true;
      persistSessionPlayback();
    });
    audio.addEventListener('pause', function () {
      setPlayingUI(false);
      persistSessionPlayback();
    });
    audio.addEventListener('ended', function () {
      next();
      play();
    });
    audio.addEventListener('timeupdate', function () {
      if (!audio || audio.paused) return;
      if (Math.floor(audio.currentTime) % 2 === 0) persistSessionPlayback();
    });
    document.body.appendChild(audio);
    loadTrack(index, false);
    if (resumeTime > 0) {
      var seekOnce = function () {
        try {
          if (resumeTime > 0 && audio.duration && resumeTime < audio.duration) {
            audio.currentTime = resumeTime;
          }
        } catch (e) { /* ignore */ }
        audio.removeEventListener('loadedmetadata', seekOnce);
      };
      audio.addEventListener('loadedmetadata', seekOnce);
    }
    applyMute();
  }

  /* ---------- Soft navigation (keep audio + dock alive) ---------- */

  function shouldSoftNav(anchor, evt) {
    if (!anchor || !ready) return false;
    if (evt.defaultPrevented) return false;
    if (evt.button !== 0) return false;
    if (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey) return false;
    if (anchor.hasAttribute('download')) return false;
    var target = (anchor.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') return false;
    var hrefAttr = anchor.getAttribute('href');
    if (!hrefAttr || hrefAttr.charAt(0) === '#') return false;
    if (/^(mailto:|tel:|javascript:)/i.test(hrefAttr)) return false;
    var url;
    try { url = new URL(anchor.href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    // Same document hash scroll — let the browser handle it
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    // Only same preview site paths
    var path = url.pathname;
    var base = location.pathname.replace(/\/[^/]*$/, '/');
    if (path.indexOf(base) !== 0 && path.indexOf('/poolparty-preview/') !== 0) {
      // still allow relative html under same directory tree
      if (!/\.html?$/i.test(path) && !/\/$/.test(path)) return false;
    }
    return true;
  }

  function detachPersistents() {
    var nodes = [];
    if (audio) {
      try { audio.remove(); } catch (e) { /* ignore */ }
      nodes.push(audio);
    }
    if (dock) {
      try { dock.remove(); } catch (e) { /* ignore */ }
      nodes.push(dock);
    }
    // Strip any stray duplicates
    document.querySelectorAll('[data-pp-persist="music"], .pp-music-dock').forEach(function (el) {
      if (el !== audio && el !== dock) {
        try { el.remove(); } catch (e2) { /* ignore */ }
      }
    });
    return nodes;
  }

  function reattachPersistents(nodes) {
    nodes.forEach(function (el) {
      if (el && !el.isConnected) document.body.appendChild(el);
    });
  }

  function copyBodyAttributes(fromBody) {
    var body = document.body;
    var keep = {};
    Array.prototype.forEach.call(body.attributes, function (attr) {
      keep[attr.name] = true;
    });
    Array.prototype.forEach.call(fromBody.attributes, function (attr) {
      body.setAttribute(attr.name, attr.value);
      delete keep[attr.name];
    });
    Object.keys(keep).forEach(function (name) {
      body.removeAttribute(name);
    });
  }

  function syncHeadAssets(doc) {
    // Ensure stylesheets referenced by the new page exist (same set usually).
    var seen = {};
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      seen[l.href] = true;
    });
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      try {
        var abs = new URL(l.getAttribute('href'), location.href).href;
        if (!seen[abs]) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = l.getAttribute('href');
          document.head.appendChild(link);
        }
      } catch (e) { /* ignore */ }
    });
  }

  function runInlineScripts(doc) {
    var scripts = Array.prototype.slice.call(doc.querySelectorAll('script'));
    var signal = (global.PP && typeof global.PP.pageSignal === 'function')
      ? global.PP.pageSignal()
      : null;

    scripts.forEach(function (old) {
      var src = old.getAttribute('src');
      if (src) {
        // Never reload music.js / site.js — already live
        if (/\/assets\/js\/(music|site)\.js/i.test(src) || /(^|\/)(music|site)\.js/i.test(src)) return;
        // Other external scripts: inject once if needed
        var abs;
        try { abs = new URL(src, location.href).href; } catch (e) { return; }
        var exists = Array.prototype.some.call(document.scripts, function (s) {
          return s.src === abs;
        });
        if (exists) return;
        var s = document.createElement('script');
        s.src = src;
        if (old.type) s.type = old.type;
        document.body.appendChild(s);
        return;
      }

      var code = old.textContent || '';
      if (!code.trim()) return;

      // Patch addEventListener so DOMContentLoaded handlers run immediately,
      // and wire AbortSignal so soft-nav can drop prior page listeners.
      var targets = [document, global];
      var restorers = [];
      targets.forEach(function (target) {
        if (!target || !target.addEventListener) return;
        var orig = target.addEventListener.bind(target);
        target.addEventListener = function (type, listener, options) {
          if (type === 'DOMContentLoaded') {
            Promise.resolve().then(function () {
              try { listener.call(document, new Event('DOMContentLoaded')); } catch (err) {
                console.error('[PPMusic] page boot error', err);
              }
            });
            return;
          }
          var opts = options;
          if (signal) {
            if (opts === true || opts === false) opts = { capture: !!opts };
            if (!opts || typeof opts !== 'object') opts = {};
            else opts = Object.assign({}, opts);
            if (!opts.signal) opts.signal = signal;
          }
          return orig(type, listener, opts);
        };
        restorers.push(function () { target.addEventListener = orig; });
      });

      try {
        // Indirect eval keeps scope global
        (0, eval)(code);
      } catch (err) {
        console.error('[PPMusic] inline script error', err);
      } finally {
        restorers.forEach(function (r) { try { r(); } catch (e2) { /* ignore */ } });
      }
    });
  }

  function softNavigate(url, opts) {
    opts = opts || {};
    if (navigating) return Promise.resolve();
    navigating = true;
    persistSessionPlayback();

    var absUrl;
    try { absUrl = new URL(url, location.href).href; } catch (e) {
      navigating = false;
      location.href = url;
      return Promise.resolve();
    }

    return fetch(absUrl, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('soft-nav ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc.body) throw new Error('no body');

        var kept = detachPersistents();

        // Drop prior page listeners before swapping DOM
        if (global.PP && typeof global.PP.beginPageScope === 'function') {
          global.PP.beginPageScope();
        }

        syncHeadAssets(doc);
        copyBodyAttributes(doc.body);

        // Assign markup without executing scripts
        document.body.innerHTML = doc.body.innerHTML;
        document.body.querySelectorAll('script').forEach(function (s) { s.remove(); });
        // Remove any dock/audio clones that came from the fetched HTML (none expected)
        document.body.querySelectorAll('.pp-music-dock, audio[data-pp-persist="music"]').forEach(function (el) {
          el.remove();
        });

        reattachPersistents(kept);
        // Re-bind dock refs in case inner nodes somehow changed (they shouldn't)
        if (dock) {
          playBtn = dock.querySelector('.pp-music-dock__play');
          muteBtn = dock.querySelector('.pp-music-dock__mute');
          volDownBtn = dock.querySelector('.pp-music-dock__voldown');
          volUpBtn = dock.querySelector('.pp-music-dock__volup');
          volPctEl = dock.querySelector('.pp-music-dock__volpct');
          titleEl = dock.querySelector('.pp-music-dock__title');
        }

        document.title = doc.title || document.title;

        if (opts.replace) history.replaceState({ ppSoft: 1 }, '', absUrl);
        else history.pushState({ ppSoft: 1 }, '', absUrl);

        window.scrollTo(0, 0);
        document.body.style.overflow = '';

        if (global.PP && typeof global.PP.bootPage === 'function') {
          global.PP.bootPage();
        }

        runInlineScripts(doc);

        setPlayingUI(audio && !audio.paused);
        updateTitle();
        applyMute();
      })
      .catch(function (err) {
        console.warn('[PPMusic] soft-nav fallback', err);
        location.href = absUrl;
      })
      .then(function () {
        navigating = false;
      });
  }

  function bindSoftNav() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!shouldSoftNav(a, e)) return;
      e.preventDefault();
      // Same user gesture: unlock/resume ONLY if they still want music.
      // If they paused this session, leave it off across pages.
      if (audio && audio.paused && !(sessionTouched && !wantPlaying)) {
        muted = false;
        if (!wantPlaying) ensureOverflowStart();
        applyMute();
        var p = audio.play();
        if (p && p.then) {
          p.then(function () {
            setPlayingUI(true);
            wantPlaying = true;
            sessionTouched = true;
            ssSet(KEY_TOUCHED, '1');
            persistSessionPlayback();
          }).catch(function () { /* still blocked */ });
        } else {
          setPlayingUI(true);
          wantPlaying = true;
        }
        hideStartChip();
        disarmGestureUnlock();
      }
      softNavigate(a.href, { replace: false });
    }, true);

    window.addEventListener('popstate', function () {
      softNavigate(location.href, { replace: true });
    });
  }

  function init() {
    if (ready) return;
    ready = true;
    loadPersisted();
    buildDock();
    initAudio();
    bindTriggers();
    bindSoftNav();
    updateTitle();
    syncVolUI();
    setPlayingUI(audio && !audio.paused);

    window.addEventListener('pagehide', persistSessionPlayback);
    window.addEventListener('beforeunload', persistSessionPlayback);

    // Unmuted autoplay (or resume after hard refresh). Gesture unlock if blocked.
    tryAutoplay();
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
    setVolume: function (v) { setVolume(v, true); },
    softNavigate: softNavigate
  };
})(typeof window !== 'undefined' ? window : this);
