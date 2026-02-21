// Music, YouTube API, audio playback, and dock management for Sanctuary Study.
// Depends on globals from js/constants.js and app.js.

function hasMusicDockUi() {
  return Boolean(
    musicDock
    && musicDockHead
    && musicDockMinBtn
    && musicDockPlayPauseBtn
    && musicDockLabel
    && musicOpenExternalBtn
    && musicFrameWrap
    && audioPlayerWrap
    && musicFrame
  );
}

function hasMusicSettingsInputs() {
  return Boolean(localMusicFileInput && lofiPresetSelect && youtubeMusicUrlSetting);
}

function initializeYouTubeApiBridge() {
  const readyNow = window.YT && typeof window.YT.Player === "function";
  if (readyNow) {
    youtubeApiReady = true;
    return;
  }

  const previousHandler = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    youtubeApiReady = true;

    if (typeof previousHandler === "function") {
      try {
        previousHandler();
      } catch (error) {
        // Ignore prior callback errors from other scripts.
      }
    }

    playQueuedYouTubeRequest();
  };
}

function ensureYouTubeIframeApiLoaded() {
  if (youtubeApiReady || (window.YT && typeof window.YT.Player === "function")) {
    youtubeApiReady = true;
    return;
  }

  if (youtubeApiRequested) {
    return;
  }

  youtubeApiRequested = true;
  const existingScript = document.getElementById("youtubeIframeApiScript");
  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.id = "youtubeIframeApiScript";
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  script.onerror = () => {
    showToastMessage("Could not load the YouTube iframe API. Check your internet connection.");
  };
  document.head.appendChild(script);
}

function initializeMusicDockDragging() {
  if (!hasMusicDockUi()) {
    return;
  }

  const savedPosition = loadMusicDockPosition();
  if (savedPosition) {
    setMusicDockPosition(savedPosition.left, savedPosition.top);
  }

  musicDockHead.addEventListener("pointerdown", onMusicDockPointerDown);
  window.addEventListener("resize", () => {
    if (!musicDock.style.left || !musicDock.style.top) {
      return;
    }
    clampMusicDockToViewport();
    saveMusicDockPosition();
  });
}

function onMusicDockPointerDown(event) {
  if (!hasMusicDockUi()) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  if (event.target.closest("button, input, select, textarea, audio, a")) {
    return;
  }

  const rect = musicDock.getBoundingClientRect();
  dockDragState = {
    pointerId: event.pointerId,
    originLeft: rect.left,
    originTop: rect.top,
    startX: event.clientX,
    startY: event.clientY
  };

  musicDock.classList.add("dragging");
  musicDockHead.setPointerCapture(event.pointerId);

  document.addEventListener("pointermove", onMusicDockPointerMove);
  document.addEventListener("pointerup", onMusicDockPointerUp);
  document.addEventListener("pointercancel", onMusicDockPointerUp);
}

function onMusicDockPointerMove(event) {
  if (!musicDock) {
    return;
  }

  if (!dockDragState || event.pointerId !== dockDragState.pointerId) {
    return;
  }

  const deltaX = event.clientX - dockDragState.startX;
  const deltaY = event.clientY - dockDragState.startY;
  const nextLeft = dockDragState.originLeft + deltaX;
  const nextTop = dockDragState.originTop + deltaY;

  setMusicDockPosition(nextLeft, nextTop);
  clampMusicDockToViewport();
}

function onMusicDockPointerUp(event) {
  if (!musicDock || !musicDockHead) {
    dockDragState = null;
    return;
  }

  if (!dockDragState || event.pointerId !== dockDragState.pointerId) {
    return;
  }

  try {
    musicDockHead.releasePointerCapture(event.pointerId);
  } catch (error) {
    // Pointer capture may already be released.
  }

  dockDragState = null;
  musicDock.classList.remove("dragging");
  document.removeEventListener("pointermove", onMusicDockPointerMove);
  document.removeEventListener("pointerup", onMusicDockPointerUp);
  document.removeEventListener("pointercancel", onMusicDockPointerUp);
  saveMusicDockPosition();
}

function setMusicDockPosition(left, top) {
  if (!musicDock) {
    return;
  }

  const clampedLeft = Math.max(8, left);
  const clampedTop = Math.max(8, top);

  musicDock.style.left = `${Math.round(clampedLeft)}px`;
  musicDock.style.top = `${Math.round(clampedTop)}px`;
  musicDock.style.right = "auto";
  musicDock.style.bottom = "auto";
}

function clampMusicDockToViewport() {
  if (!musicDock) {
    return;
  }

  if (window.innerWidth <= 430) {
    musicDock.style.left = "";
    musicDock.style.top = "";
    musicDock.style.right = "";
    musicDock.style.bottom = "";
    return;
  }

  const rect = musicDock.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

  const nextLeft = Math.min(maxLeft, Math.max(8, rect.left));
  const nextTop = Math.min(maxTop, Math.max(8, rect.top));

  setMusicDockPosition(nextLeft, nextTop);
}

function saveMusicDockPosition() {
  if (!musicDock) {
    return;
  }

  if (!musicDock.style.left || !musicDock.style.top) {
    return;
  }

  safeSetItem(MUSIC_DOCK_POSITION_KEY, JSON.stringify({
    left: Number.parseFloat(musicDock.style.left),
    top: Number.parseFloat(musicDock.style.top)
  }));
}

function loadMusicDockPosition() {
  const raw = safeGetItem(MUSIC_DOCK_POSITION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function initializeMusicDock() {
  if (!hasMusicDockUi()) {
    return;
  }

  setMusicDockMinimized(false);
  musicFrameWrap.classList.add("hidden");
  audioPlayerWrap.classList.add("hidden");

  const preset = getLofiPresetById(settings.musicPresetId);
  if (preset) {
    musicDock.classList.remove("hidden");
    setExternalMusicButtonState(preset.url);
    musicDockLabel.textContent = `Saved preset: ${preset.title} • ${preset.artist}`;
    return;
  }

  if (settings.youtubeMusicUrl) {
    const savedUrl = String(settings.youtubeMusicUrl).trim();
    const watchUrl = getYouTubeWatchUrl(savedUrl);
    musicDock.classList.remove("hidden");
    setExternalMusicButtonState(watchUrl || savedUrl);

    if (watchUrl) {
      musicDockLabel.textContent = `Saved YouTube: ${shortenUrl(savedUrl)}`;
    } else {
      musicDockLabel.textContent = `Saved audio: ${shortenUrl(savedUrl)}`;
    }
    return;
  }

  musicDock.classList.add("hidden");
  setExternalMusicButtonState(null);
}

function setMusicDockMinimized(minimized) {
  if (!musicDock || !musicDockMinBtn) {
    return;
  }

  musicDockMinimized = minimized;
  musicDock.classList.toggle("minimized", minimized);
  const label = minimized ? "Expand music player" : "Minimize music player";
  musicDockMinBtn.setAttribute("aria-label", label);
  musicDockMinBtn.title = label;
  updateDockButtonIcon(musicDockMinBtn, minimized ? "expand" : "minimize");
  if (musicDockTitle) {
    musicDockTitle.textContent = minimized ? "Music" : "Background Music";
  }
}

function loadBackgroundMusicFromSettings() {
  if (!hasMusicSettingsInputs()) {
    showToastMessage("Music controls are unavailable right now.");
    return;
  }

  const localFile = localMusicFileInput.files && localMusicFileInput.files[0];
  const selectedPreset = getLofiPresetById(lofiPresetSelect.value);
  const enteredUrl = String(youtubeMusicUrlSetting.value || "").trim();

  if (localFile) {
    const localBlobUrl = createObjectUrlForLocalMusic(localFile);
    const started = startAudioFromUrl(localBlobUrl, `Local file: ${localFile.name}`, { loop: true });
    if (!started) {
      showToastMessage("Could not play that local file.");
      return;
    }

    settings.musicPresetId = "";
    settings.youtubeMusicUrl = "";
    saveSettings(settings);
    showToastMessage("Music loaded. Press Play background music.");
    return;
  }

  if (selectedPreset) {
    settings.musicPresetId = selectedPreset.id;
    settings.youtubeMusicUrl = selectedPreset.url || "";
    youtubeMusicUrlSetting.value = selectedPreset.url || "";
    saveSettings(settings);

    const started = selectedPreset.mode === "playlist"
      ? prepareDownloadedShufflePlaylist()
      : startAudioFromUrl(selectedPreset.url, `${selectedPreset.title} • ${selectedPreset.artist}`, { loop: true });

    if (!started) {
      showToastMessage("Preset failed to load. Try another preset or local file.");
      return;
    }

    showToastMessage("Lofi preset loaded. Press Play background music.");
    return;
  }

  if (!enteredUrl) {
    showToastMessage("Add a YouTube URL, choose a preset, or select a local file.");
    return;
  }

  settings.musicPresetId = "";
  settings.youtubeMusicUrl = enteredUrl;
  saveSettings(settings);

  const started = startBackgroundMusicFromSavedPreference(false);
  if (!started) {
    showToastMessage("This link could not be played. Try a direct audio URL or local file.");
    return;
  }

  showToastMessage("Background music loaded. Press Play background music.");
}

function startBackgroundMusicFromSavedPreference(autoplay) {
  if (!hasMusicDockUi()) {
    return false;
  }

  const preset = getLofiPresetById(settings.musicPresetId);
  if (preset) {
    if (preset.mode === "playlist") {
      return prepareDownloadedShufflePlaylist();
    }

    return startAudioFromUrl(preset.url, `${preset.title} • ${preset.artist}`, { loop: true });
  }

  const url = String(settings.youtubeMusicUrl || "").trim();
  if (!url) {
    setExternalMusicButtonState(null);
    return false;
  }

  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    const watchUrl = buildYouTubeWatchUrl(videoId);
    setExternalMusicButtonState(watchUrl);
    setMusicDockMinimized(false);
    activeAudioSourceType = "youtube";
    musicDock.classList.remove("hidden");
    stopAudioPlayback();
    musicFrameWrap.classList.remove("hidden");
    musicDockLabel.textContent = `Loading: ${shortenUrl(url)}`;
    queueYouTubePlayRequest(videoId, autoplay);
    syncMusicPlayPauseButton();
    return true;
  }

  return startAudioFromUrl(url, shortenUrl(url), { loop: true });
}

function createObjectUrlForLocalMusic(file) {
  if (currentObjectAudioUrl) {
    URL.revokeObjectURL(currentObjectAudioUrl);
    currentObjectAudioUrl = null;
  }

  currentObjectAudioUrl = URL.createObjectURL(file);
  setExternalMusicButtonState(null);
  return currentObjectAudioUrl;
}

function startAudioFromUrl(url, label, options = {}) {
  if (!url || !bgAudio || !hasMusicDockUi()) {
    return false;
  }

  const loop = options.loop !== false;
  const resetPlaylist = options.resetPlaylist !== false;

  destroyYouTubePlayer();
  setMusicDockMinimized(false);
  activeAudioSourceType = "audio";

  musicDock.classList.remove("hidden");
  musicFrameWrap.classList.add("hidden");
  audioPlayerWrap.classList.remove("hidden");

  if (resetPlaylist) {
    downloadedPlaylistQueue = [];
    downloadedPlaylistCursor = -1;
  }

  if (String(url).startsWith("blob:")) {
    setExternalMusicButtonState(null);
  } else {
    setExternalMusicButtonState(url);
  }
  musicDockLabel.textContent = `Ready: ${label || shortenUrl(url)}`;

  if (bgAudio.src !== url) {
    bgAudio.src = url;
  }

  bgAudio.loop = loop;
  bgAudio.volume = 0.3;
  syncMusicPlayPauseButton();

  return true;
}

function playBackgroundMusicFromUserGesture() {
  if (!bgAudio) {
    showToastMessage("Audio player is unavailable.");
    return;
  }

  // Browser policy-safe: play() is invoked only after a real click.
  // If nothing is loaded yet, prepare from saved settings first.
  if (!bgAudio.src && !youtubePlayer && !pendingYouTubeRequest) {
    const prepared = startBackgroundMusicFromSavedPreference(false);
    if (!prepared) {
      showToastMessage("Load a music source first.");
      return;
    }
  }

  if (bgAudio.src) {
    bgAudio.volume = 0.3;
    bgAudio.play().then(() => {
      musicDockLabel.textContent = "Now playing.";
      activeAudioSourceType = "audio";
      syncMusicPlayPauseButton();
    }).catch(() => {
      showToastMessage("Playback blocked. Tap the audio controls directly once.");
    });
    return;
  }

  if (youtubePlayer) {
    try {
      youtubePlayer.playVideo();
      activeAudioSourceType = "youtube";
      musicDockLabel.textContent = "Now playing.";
      syncMusicPlayPauseButton();
    } catch (error) {
      showToastMessage("YouTube player is not ready yet. Tap Play again in a second.");
    }
    return;
  }

  showToastMessage("YouTube player is still loading. Tap Play again when it appears.");
}

function toggleDockMusicPlayback() {
  if (!bgAudio) {
    return;
  }

  if (activeAudioSourceType === "audio" && bgAudio.src) {
    if (bgAudio.paused) {
      playBackgroundMusicFromUserGesture();
    } else {
      bgAudio.pause();
      musicDockLabel.textContent = "Paused.";
    }
    return;
  }

  if (activeAudioSourceType === "youtube" && youtubePlayer && window.YT) {
    let state = null;
    try {
      state = youtubePlayer.getPlayerState();
    } catch (error) {
      state = null;
    }

    if (state === window.YT.PlayerState.PLAYING) {
      youtubePlayer.pauseVideo();
      musicDockLabel.textContent = "Paused.";
      syncMusicPlayPauseButton();
    } else {
      playBackgroundMusicFromUserGesture();
    }
    return;
  }

  playBackgroundMusicFromUserGesture();
}

function syncMusicPlayPauseButton() {
  if (!musicDockPlayPauseBtn || !bgAudio) {
    return;
  }

  const isAudioPlaying = Boolean(bgAudio.src) && !bgAudio.paused;
  let isYouTubePlaying = false;
  if (youtubePlayer && window.YT && youtubePlayer.getPlayerState) {
    try {
      isYouTubePlaying = youtubePlayer.getPlayerState() === window.YT.PlayerState.PLAYING;
    } catch (error) {
      isYouTubePlaying = false;
    }
  }
  const isPlaying = isAudioPlaying || isYouTubePlaying;

  const label = isPlaying ? "Pause music" : "Play music";
  musicDockPlayPauseBtn.setAttribute("aria-label", label);
  musicDockPlayPauseBtn.title = label;
  updateDockButtonIcon(musicDockPlayPauseBtn, isPlaying ? "pause" : "play");
}

function updateDockButtonIcon(button, activeIconName) {
  if (!button) {
    return;
  }

  const iconNodes = button.querySelectorAll("[data-icon]");
  iconNodes.forEach((iconNode) => {
    const shouldShow = iconNode.dataset.icon === activeIconName;
    iconNode.classList.toggle("hidden", !shouldShow);
  });
}

function prepareDownloadedShufflePlaylist() {
  if (!DOWNLOADED_LOFI_TRACKS.length) {
    return false;
  }

  downloadedPlaylistQueue = shuffleCopy(DOWNLOADED_LOFI_TRACKS);
  downloadedPlaylistCursor = 0;
  const track = downloadedPlaylistQueue[downloadedPlaylistCursor];

  return startAudioFromUrl(track.url, `${track.title} • ${track.artist}`, {
    loop: false,
    resetPlaylist: false
  });
}

function playNextDownloadedTrack() {
  if (!downloadedPlaylistQueue.length) {
    return;
  }

  downloadedPlaylistCursor += 1;
  if (downloadedPlaylistCursor >= downloadedPlaylistQueue.length) {
    downloadedPlaylistQueue = shuffleCopy(DOWNLOADED_LOFI_TRACKS);
    downloadedPlaylistCursor = 0;
  }

  const nextTrack = downloadedPlaylistQueue[downloadedPlaylistCursor];
  const switched = startAudioFromUrl(nextTrack.url, `${nextTrack.title} • ${nextTrack.artist}`, {
    loop: false,
    resetPlaylist: false
  });

  if (switched) {
    bgAudio.play().catch(() => {
      showToastMessage("Next track is ready. Press play to continue.");
    });
  }
}

function queueYouTubePlayRequest(videoId, autoplay) {
  if (!hasMusicDockUi()) {
    return;
  }

  pendingYouTubeRequest = { videoId, autoplay };
  ensureYouTubeIframeApiLoaded();

  if (!youtubeApiReady) {
    musicDockLabel.textContent = "Loading YouTube player...";
    setTimeout(() => {
      if (pendingYouTubeRequest && !youtubeApiReady) {
        musicDockLabel.textContent = "YouTube player failed to load. Check your connection.";
        showToastMessage("YouTube player timed out. Try reloading the page.");
      }
    }, 15000);
    return;
  }

  if (!youtubePlayer) {
    createYouTubePlayer(videoId, autoplay);
    return;
  }

  playQueuedYouTubeRequest();
}

function createYouTubePlayer(videoId, autoplay) {
  if (!musicFrame) {
    return;
  }

  if (!window.YT || typeof window.YT.Player !== "function") {
    return;
  }

  const playerVars = {
    autoplay: autoplay ? 1 : 0,
    controls: 1,
    rel: 0,
    modestbranding: 1,
    playsinline: 1
  };

  if (location.origin.startsWith("http")) {
    playerVars.origin = location.origin;
  }

  youtubePlayer = new window.YT.Player("musicFrame", {
    videoId,
    playerVars,
    events: {
      onReady: onYouTubePlayerReady,
      onStateChange: onYouTubePlayerStateChange,
      onError: onYouTubePlayerError
    }
  });
}

function onYouTubePlayerReady() {
  playQueuedYouTubeRequest();
  syncMusicPlayPauseButton();
}

function playQueuedYouTubeRequest() {
  if (!pendingYouTubeRequest) {
    return;
  }

  if (!youtubePlayer) {
    if (youtubeApiReady) {
      createYouTubePlayer(pendingYouTubeRequest.videoId, pendingYouTubeRequest.autoplay);
    }
    return;
  }

  const request = pendingYouTubeRequest;
  pendingYouTubeRequest = null;
  youtubeCurrentVideoId = request.videoId;

  try {
    if (request.autoplay) {
      youtubePlayer.loadVideoById(request.videoId);
    } else {
      youtubePlayer.cueVideoById(request.videoId);
    }

    const watchUrl = buildYouTubeWatchUrl(request.videoId);
    musicDockLabel.textContent = `${request.autoplay ? "Now playing" : "Ready"}: ${watchUrl ? shortenUrl(watchUrl) : "YouTube video"}`;
  } catch (error) {
    pendingYouTubeRequest = request;
    musicDockLabel.textContent = "Could not start this YouTube video. Try Open on YouTube.";
    showToastMessage("Embed playback failed. Use Open on YouTube.");
  }
}

function onYouTubePlayerStateChange(event) {
  if (!window.YT || !youtubePlayer || !youtubeCurrentVideoId) {
    return;
  }

  if (event.data === window.YT.PlayerState.ENDED) {
    youtubePlayer.playVideo();
  }

  syncMusicPlayPauseButton();
}

function onYouTubePlayerError(event) {
  const blockedCodes = new Set([101, 150, 153]);
  const blockedByEmbedPolicy = blockedCodes.has(event.data);

  if (blockedByEmbedPolicy) {
    if (musicFrameWrap) {
      musicFrameWrap.classList.add("hidden");
    }
    if (musicDockLabel) {
      musicDockLabel.textContent = "This video blocks embedding. Use Open on YouTube.";
    }
    showToastMessage("YouTube blocked this embed for your browser. Use Open on YouTube.");
    return;
  }

  if (musicDockLabel) {
    musicDockLabel.textContent = "YouTube player error. Try another link.";
  }
  showToastMessage("YouTube player error. Try a different URL.");
}

function destroyYouTubePlayer() {
  pendingYouTubeRequest = null;
  youtubeCurrentVideoId = null;

  if (!youtubePlayer) {
    if (musicFrame) {
      musicFrame.innerHTML = "";
    }
    return;
  }

  try {
    youtubePlayer.stopVideo();
    youtubePlayer.destroy();
  } catch (error) {
    // Ignore player teardown errors.
  }

  youtubePlayer = null;
  if (musicFrame) {
    musicFrame.innerHTML = "";
  }
}

function stopAudioPlayback() {
  if (!bgAudio) {
    activeAudioSourceType = null;
    return;
  }

  try {
    bgAudio.pause();
  } catch (error) {
    // Ignore playback teardown errors.
  }

  bgAudio.removeAttribute("src");
  bgAudio.load();
  if (audioPlayerWrap) {
    audioPlayerWrap.classList.add("hidden");
  }

  if (currentObjectAudioUrl) {
    URL.revokeObjectURL(currentObjectAudioUrl);
    currentObjectAudioUrl = null;
  }
}

function stopBackgroundMusic() {
  activeAudioSourceType = null;
  downloadedPlaylistQueue = [];
  downloadedPlaylistCursor = -1;
  destroyYouTubePlayer();
  stopAudioPlayback();
  if (musicFrameWrap) {
    musicFrameWrap.classList.add("hidden");
  }
  if (musicDock) {
    musicDock.classList.add("hidden");
  }
  if (musicDockLabel) {
    musicDockLabel.textContent = "";
  }
  setMusicDockMinimized(false);
  syncMusicPlayPauseButton();

  if (musicPopupWindow && !musicPopupWindow.closed) {
    try {
      musicPopupWindow.close();
    } catch (error) {
      // Ignore cross-window close errors.
    }
  }

  musicPopupWindow = null;
}

function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host.endsWith("youtube.com")) {
      const idFromQuery = parsed.searchParams.get("v");
      if (idFromQuery) {
        return idFromQuery;
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (!parts.length) {
        return null;
      }

      if ((parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") && parts[1]) {
        return parts[1];
      }
    }
  } catch (error) {
    return null;
  }

  return null;
}

function buildYouTubeWatchUrl(videoId) {
  if (!videoId || !/^[a-zA-Z0-9_-]{1,20}$/.test(videoId)) {
    return null;
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function getYouTubeWatchUrl(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }
  return buildYouTubeWatchUrl(videoId);
}

function setExternalMusicButtonState(url) {
  if (!musicOpenExternalBtn) {
    return;
  }

  if (!url) {
    musicOpenExternalBtn.classList.add("hidden");
    musicOpenExternalBtn.dataset.url = "";
    return;
  }

  musicOpenExternalBtn.dataset.url = url;
  musicOpenExternalBtn.textContent = extractYouTubeVideoId(url) ? "Open on YouTube" : "Open Source Link";
  musicOpenExternalBtn.classList.remove("hidden");
}

function openBackgroundMusicExternally(providedUrl, silent = false, options = {}) {
  const bypassFocusLock = Boolean(options.bypassFocusLock);
  const preset = getLofiPresetById(settings.musicPresetId);
  const queuedTrack = downloadedPlaylistQueue[downloadedPlaylistCursor] || null;
  const defaultTrack = DOWNLOADED_LOFI_TRACKS[0] || null;
  const fallbackUrl = preset
    ? (preset.url || (queuedTrack ? queuedTrack.url : "") || (defaultTrack ? defaultTrack.url : "") || "")
    : settings.youtubeMusicUrl;
  const fallbackButtonUrl = musicOpenExternalBtn ? musicOpenExternalBtn.dataset.url : "";
  const url = providedUrl || fallbackButtonUrl || fallbackUrl;
  if (!url) {
    if (!silent) {
      showToastMessage("Set a valid music source first.");
    }
    return false;
  }

  if (!bypassFocusLock && isFocusCommitEnforced() && isUrlBlockedBySettings(url)) {
    openFocusExitModal({ type: "open-url", url });
    return false;
  }

  let opened = null;

  try {
    opened = window.open(url, "sanctuaryMusicWindow", "width=520,height=420,menubar=no,toolbar=no");
  } catch (error) {
    opened = null;
  }

  if (!opened) {
    try {
      opened = window.open(url, "_blank");
    } catch (error) {
      opened = null;
    }
  }

  if (opened) {
    musicPopupWindow = opened;
    if (musicDock) {
      musicDock.classList.remove("hidden");
    }
    if (musicDockLabel) {
      musicDockLabel.textContent = `Playing externally: ${shortenUrl(url)}`;
    }
    return true;
  }

  if (!silent) {
    showToastMessage("Popup blocked. Allow popups, or use the same link in a new tab.");
  }

  return false;
}
