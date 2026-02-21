// Sanctuary Study — Timer core, focus mode, session lifecycle, and toasts.
// Manages study/break timer, focus commit lock-in, session flow,
// verse popup, mini-timer widget, and toast notifications.


function clampFocusCommitMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(240, Math.round(numeric)));
}

function normalizeBlockedSiteValue(input) {
  let value = String(input || "").trim().toLowerCase();
  if (!value) {
    return "";
  }

  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0];
  value = value.split("?")[0];
  value = value.split("#")[0];
  value = value.replace(/:\d+$/, "");

  return value;
}

function sanitizeBlockedSites(input) {
  const rawItems = Array.isArray(input)
    ? input
    : String(input || "")
      .split(/\n|,/g);

  const seen = new Set();
  const items = [];

  rawItems.forEach((item) => {
    const normalized = normalizeBlockedSiteValue(item);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    items.push(normalized);
  });

  return items.slice(0, 40);
}

function formatBlockedSitesForTextarea(sites) {
  return sanitizeBlockedSites(sites).join("\n");
}

function isUrlBlockedBySettings(url) {
  const blockedSites = sanitizeBlockedSites(settings.blockedSites);
  if (!url || !blockedSites.length) {
    return false;
  }

  let hostname = "";
  try {
    const parsed = new URL(url, window.location.origin);
    hostname = normalizeBlockedSiteValue(parsed.hostname || "");
  } catch (error) {
    hostname = normalizeBlockedSiteValue(url);
  }

  if (!hostname) {
    return false;
  }

  return blockedSites.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`));
}

function isFocusCommitEnabled() {
  return clampFocusCommitMinutes(settings.focusCommitMinutes) > 0;
}

function isFocusCommitEnforced() {
  return isCompleteFocusLockActive() && focusCommitRemainingSeconds > 0;
}

function formatDurationShort(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${String(remMinutes).padStart(2, "0")}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updateFocusLockStatus() {
  if (!focusLockStatus) {
    return;
  }

  if (sanitizeFocusMode(settings.focusMode) !== "complete" || !isFocusCommitEnabled() || focusCommitRemainingSeconds <= 0) {
    focusLockStatus.classList.add("hidden");
    focusLockStatus.textContent = "";
    return;
  }

  focusLockStatus.classList.remove("hidden");
  const blockedSites = sanitizeBlockedSites(settings.blockedSites);
  const blockedSuffix = blockedSites.length
    ? ` • ${blockedSites.length} blocked site reminder${blockedSites.length === 1 ? "" : "s"}`
    : "";
  focusLockStatus.textContent = `Lock-in commitment active: ${formatDurationShort(focusCommitRemainingSeconds)} left${blockedSuffix}`;
}

function activateFocusCommitIfNeeded() {
  if (focusCommitRemainingSeconds > 0) {
    updateFocusLockStatus();
    return;
  }

  if (!isFocusCommitEnabled()) {
    updateFocusLockStatus();
    return;
  }

  const minutes = clampFocusCommitMinutes(settings.focusCommitMinutes);
  if (minutes <= 0) {
    updateFocusLockStatus();
    return;
  }

  focusCommitRemainingSeconds = minutes * 60;
  updateFocusLockStatus();
  showToastMessage(`Lock-in commitment started for ${minutes} minute${minutes === 1 ? "" : "s"}.`);
}

function clearFocusCommitState() {
  focusCommitRemainingSeconds = 0;
  focusExitPendingAction = null;
  closeFocusExitModal();
  updateFocusLockStatus();
}

function closeFocusExitModal() {
  if (!focusExitModal) {
    return;
  }

  focusExitModal.classList.add("hidden");
}

function openFocusExitModal(action) {
  if (!focusExitModal || !focusExitMessage || !breakGlassBtn) {
    return;
  }

  focusExitPendingAction = action && typeof action === "object" ? action : { type: "leave" };
  const blockedSites = sanitizeBlockedSites(settings.blockedSites);
  const description = focusExitPendingAction.type === "open-url"
    ? "Opening this link now"
    : "Leaving this session now";

  focusExitMessage.textContent = `${description} will end your lock-in commitment with ${formatDurationShort(focusCommitRemainingSeconds)} remaining.`;

  if (focusBlockedSitesList) {
    focusBlockedSitesList.innerHTML = "";
    if (blockedSites.length) {
      focusBlockedSitesList.classList.remove("hidden");
      const head = document.createElement("p");
      head.textContent = "Blocked site reminders:";
      focusBlockedSitesList.appendChild(head);

      blockedSites.slice(0, 8).forEach((site) => {
        const item = document.createElement("p");
        item.textContent = `• ${site}`;
        focusBlockedSitesList.appendChild(item);
      });
    } else {
      focusBlockedSitesList.classList.add("hidden");
    }
  }

  focusExitModal.classList.remove("hidden");
  breakGlassBtn.focus();
}

function executeFocusExitAction(action) {
  if (!action || typeof action !== "object") {
    return;
  }

  if (action.type === "switch-section" && action.sectionName) {
    switchSection(action.sectionName, { bypassFocusLock: true });
    return;
  }

  if (action.type === "go-home") {
    showHomeView({ forceStopTypeEffect: true, bypassFocusLock: true });
    return;
  }

  if (action.type === "cancel-session") {
    cancelCurrentSession({ bypassFocusLock: true });
    return;
  }

  if (action.type === "open-url" && action.url) {
    openBackgroundMusicExternally(action.url, false, { bypassFocusLock: true });
  }
}

function maybePromptFocusCommitExit(action) {
  if (!isFocusCommitEnforced()) {
    return false;
  }

  openFocusExitModal(action);
  return true;
}

function populateLofiPresetSelect() {
  lofiPresetSelect.innerHTML = "<option value=\"\">None</option>";

  BUILTIN_MUSIC_PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.mode === "playlist"
      ? `${preset.title}`
      : `${preset.title} • ${preset.artist}`;
    lofiPresetSelect.appendChild(option);
  });
}

function getLofiPresetById(presetId) {
  return BUILTIN_MUSIC_PRESETS.find((preset) => preset.id === presetId) || null;
}

function applyPreset(presetId) {
  selectedPreset = presetId;
  presetButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === presetId);
  });

  customPresetFields.classList.toggle("hidden", presetId !== "custom");

  if (presetId === "25-5") {
    setTimerPreset(25, 5);
  } else if (presetId === "50-10") {
    setTimerPreset(50, 10);
  } else if (presetId === "90-15") {
    setTimerPreset(90, 15);
  }
}

function applyPresetByMinutes(studyMinutes, breakMinutes) {
  const mapping = {
    "25-5": [25, 5],
    "50-10": [50, 10],
    "90-15": [90, 15]
  };

  const matchedEntry = Object.entries(mapping).find(([, pair]) => pair[0] === studyMinutes && pair[1] === breakMinutes);
  if (matchedEntry) {
    applyPreset(matchedEntry[0]);
    return;
  }

  customStudyMinutesInput.value = studyMinutes;
  customBreakMinutesInput.value = breakMinutes;
  applyPreset("custom");
}

function applyCustomPreset() {
  const study = clampMinutes(customStudyMinutesInput.value, 1, 240);
  const rest = clampMinutes(customBreakMinutesInput.value, 1, 120);
  customStudyMinutesInput.value = study;
  customBreakMinutesInput.value = rest;
  setTimerPreset(study, rest);
  showToastMessage(`Custom preset applied: ${study}/${rest}`);
}

function setTimerPreset(studyMinutes, breakMinutes) {
  settings.studyMinutes = studyMinutes;
  settings.breakMinutes = breakMinutes;
  saveSettings(settings);
  fillSettingsForm();

  if (!timerState.running) {
    resetToStudyBlock();
  }
}

function getActiveSessionTag() {
  const selected = sessionTagSelect.value;
  if (selected === "Custom") {
    const custom = String(customTagInput.value || "").trim();
    return custom || "Custom";
  }

  return selected;
}

function updateSessionTagBadge() {
  const activeTag = getActiveSessionTag();
  sessionTagBadge.textContent = `Tag: ${activeTag}`;
}

async function beginStudyExperience() {
  if (!hasAppAccess()) {
    showAuthScreen("Sign in to begin your study session, or continue as guest.");
    return;
  }

  if (isPreparingSession) {
    return;
  }

  isPreparingSession = true;
  stopTimerInterval();
  timerState.running = false;
  updateTimerButtons();
  updateSessionStatus();

  try {
    clearFocusCommitState();
    prepareFocusModeBeforeSessionStart();
    const focus = await buildFocusForTheme(selectedStudyTheme);
    setCurrentFocus(focus);
    if (musicDock.classList.contains("hidden")) {
      startBackgroundMusicFromSavedPreference(false);
    }

    const startedFromHome = !homeSection.classList.contains("hidden");
    if (startedFromHome) {
      await wait(320);
    }

    switchSection("study");
    showSessionPanel();
    await showVersePopupForSeconds(focus, POPUP_SECONDS);

    resetToStudyBlock();
    startTimer();
  } finally {
    isPreparingSession = false;
  }
}

function showSessionPanel() {
  studyPrep.classList.add("hidden");
  studySession.classList.remove("hidden");
  updateFocusLockStatus();
  updateMiniTimerWidget();
}

function setCurrentFocus(focus) {
  currentFocus = {
    theme: focus.theme,
    text: focus.text,
    reference: focus.reference,
    encouragement: focus.encouragement
  };

  homeThemeBadge.textContent = currentFocus.theme;
  homeVerseText.textContent = `"${currentFocus.text}"`;
  homeVerseRef.textContent = currentFocus.reference;
  homeEncouragementText.textContent = currentFocus.encouragement;

  sessionVerseText.textContent = `"${currentFocus.text}"`;
  sessionVerseRef.textContent = currentFocus.reference;
  sessionEncouragementText.textContent = currentFocus.encouragement;
}

function resetToStudyBlock() {
  stopTimerInterval();
  timerState.running = false;
  timerState.phase = "study";
  timerState.remainingSeconds = settings.studyMinutes * 60;
  timerState.activeBlockSeconds = timerState.remainingSeconds;
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();
  updateFocusLockStatus();
}

function startTimer() {
  if (timerState.running) {
    return;
  }

  if (timerState.remainingSeconds <= 0) {
    setUpBlock(timerState.phase);
  }

  if (settings.focusMode === "complete" && timerState.phase === "study") {
    requestFocusFullscreenIfPossible();
    activateFocusCommitIfNeeded();
  }

  timerState.running = true;
  timerState.lastTickTime = Date.now();
  syncFocusModeAfterTimerStateChange();
  updateTimerButtons();
  updateSessionStatus();

  timerState.intervalId = setInterval(() => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - timerState.lastTickTime) / 1000);
    timerState.lastTickTime = now;

    if (elapsedSeconds <= 0) {
      return;
    }

    timerState.remainingSeconds -= elapsedSeconds;
    if (timerState.phase === "study" && focusCommitRemainingSeconds > 0) {
      focusCommitRemainingSeconds = Math.max(0, focusCommitRemainingSeconds - elapsedSeconds);
      if (focusCommitRemainingSeconds === 0) {
        showToastMessage("Lock-in commitment completed. You can now leave strict focus.");
      }
      updateFocusLockStatus();
    }
    updateTimerDisplay();

    if (timerState.remainingSeconds <= 0) {
      onBlockComplete();
    }
  }, 1000);
}

function pauseTimer() {
  stopTimerInterval();
  timerState.running = false;
  timerState.lastTickTime = null;
  syncFocusModeAfterTimerStateChange();
  updateTimerButtons();
  updateSessionStatus();
  updateFocusLockStatus();
}

function resetTimer() {
  stopTimerInterval();
  timerState.running = false;
  timerState.phase = "study";
  setUpBlock("study");
  syncFocusModeAfterTimerStateChange();
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();
  updateFocusLockStatus();
}

function openCancelSessionModal() {
  if (studySession.classList.contains("hidden")) {
    return;
  }

  if (maybePromptFocusCommitExit({ type: "cancel-session" })) {
    return;
  }

  if (timerState.phase === "study") {
    cancelSessionMessage.textContent = "This block will not be tracked if you do not finish the full study block. Do you still want to cancel?";
  } else {
    cancelSessionMessage.textContent = "Stopping now ends this cycle. Any unfinished study block will not be tracked. Do you still want to cancel?";
  }

  cancelSessionModal.classList.remove("hidden");
  confirmCancelSessionBtn.focus();
}

function closeCancelSessionModal() {
  cancelSessionModal.classList.add("hidden");
  if (!studySession.classList.contains("hidden")) {
    cancelSessionBtn.focus();
  }
}

function confirmCancelSession() {
  closeCancelSessionModal();
  cancelCurrentSession();
}

function cancelCurrentSession(options = {}) {
  if (!options.bypassFocusLock && maybePromptFocusCommitExit({ type: "cancel-session" })) {
    return;
  }

  stopTimerInterval();
  timerState.running = false;
  syncFocusModeAfterTimerStateChange();

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {
      // Fullscreen can fail to exit in some browsers without active gesture.
    });
  }

  clearInterval(popupIntervalId);
  popupIntervalId = null;
  versePopup.classList.add("hidden");
  document.body.classList.remove("popup-open");
  popupOverlay.classList.add("hidden");

  timerState.phase = "study";
  setUpBlock("study");
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();

  studySession.classList.add("hidden");
  studyPrep.classList.remove("hidden");
  closeSessionReviewPrompt();
  clearFocusCommitState();
  updateMiniTimerWidget();

  showToastMessage("Session cancelled. Incomplete study time was not tracked.");
}

function onBlockComplete() {
  stopTimerInterval();
  timerState.running = false;
  syncFocusModeAfterTimerStateChange();

  if (timerState.phase === "study") {
    const blockMinutes = timerState.activeBlockSeconds / 60;
    const activeTag = getActiveSessionTag();
    playAlarmSound();

    if (canUseAnalyticsFeatures()) {
      const context = recordCompletedStudyBlock(blockMinutes, activeTag);
      const unlockedAchievement = unlockStreakAchievements(context.currentStreak, true);
      const unlockedRareAchievement = unlockRareAchievements(context, true);
      renderAnalytics();
      showMotivationToast(getMotivationalMessage(context));
      const newAchievements = [unlockedAchievement, unlockedRareAchievement].filter(Boolean);
      if (newAchievements.length > 0) {
        showAchievementToast(newAchievements[0]);
        if (newAchievements.length > 1) {
          setTimeout(() => {
            showAchievementToast(newAchievements[1]);
          }, TOAST_SHOW_MS + 1200);
        }
      }
      openSessionReviewPrompt(context.sessionId);
    } else {
      closeSessionReviewPrompt();
      showMotivationToast("Study block completed. Sign in to save analytics and unlock achievements.");
    }

    timerState.phase = "break";
    setUpBlock("break");
  } else {
    timerState.phase = "study";
    setUpBlock("study");
  }

  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();
  syncFocusModeAfterTimerStateChange();
  startTimer();
}

function showMotivationToast(message) {
  showToastMessage(message);
}

function showAchievementToast(achievement) {
  clearTimeout(achievementToastTimeoutId);
  clearTimeout(achievementToastCleanupId);

  achievementToastMedal.textContent = achievement.medalText || achievement.days || "★";
  achievementToastTitle.textContent = achievement.title;
  achievementToastMessage.textContent = achievement.message;

  achievementToast.classList.remove("hidden", "hide");
  achievementToast.classList.add("show");

  achievementToastTimeoutId = setTimeout(() => {
    achievementToast.classList.remove("show");
    achievementToast.classList.add("hide");

    achievementToastCleanupId = setTimeout(() => {
      achievementToast.classList.add("hidden");
      achievementToast.classList.remove("hide");
    }, 220);
  }, TOAST_SHOW_MS + 900);
}

function showToastMessage(message) {
  clearTimeout(toastTimeoutId);
  clearTimeout(toastCleanupId);

  motivationToast.textContent = message;
  motivationToast.classList.remove("hidden", "hide");
  motivationToast.classList.add("show");

  toastTimeoutId = setTimeout(() => {
    motivationToast.classList.remove("show");
    motivationToast.classList.add("hide");

    toastCleanupId = setTimeout(() => {
      motivationToast.classList.add("hidden");
      motivationToast.classList.remove("hide");
    }, 220);
  }, TOAST_SHOW_MS);
}

function updateMiniTimerWidget() {
  miniTimerPhase.textContent = timerState.phase === "study" ? "Study" : "Break";
  miniTimerTime.textContent = timerDisplay.textContent;

  const sessionStarted = !studySession.classList.contains("hidden");
  const outsideStudyPage = currentView !== "study";
  miniTimerWidget.classList.toggle("hidden", !(sessionStarted && outsideStudyPage));
}

function isStudyBlockRunning() {
  return timerState.running && timerState.phase === "study";
}

function isCompleteFocusLockActive() {
  return settings.focusMode === "complete" && isStudyBlockRunning();
}

function prepareFocusModeBeforeSessionStart() {
  if (settings.focusMode === "partial") {
    requestPartialFocusNotifications();
    return;
  }

  if (settings.focusMode === "complete") {
    requestFocusFullscreenIfPossible();
  }
}

function requestPartialFocusNotifications() {
  if (!("Notification" in window) || Notification.permission !== "default") {
    return;
  }

  Notification.requestPermission().catch(() => {
    // Permission can be denied by browser/user.
  });
}

function requestFocusFullscreenIfPossible() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
    return;
  }

  document.documentElement.requestFullscreen().catch(() => {
    // Browser can block fullscreen if gesture context has expired.
  });
}

function handleVisibilityFocusMode() {
  if (document.hidden) {
    if (!isStudyBlockRunning()) {
      stopPartialFocusReminders();
      return;
    }

    if (settings.focusMode === "complete") {
      completeFocusPausedByTabSwitch = true;
      pauseTimer();
      return;
    }

    if (settings.focusMode === "partial") {
      startPartialFocusReminders();
    }

    return;
  }

  document.title = "Sanctuary Study";
  stopPartialFocusReminders();

  if (completeFocusPausedByTabSwitch) {
    completeFocusPausedByTabSwitch = false;
    showToastMessage("Complete focus paused your timer while you were away. Press Start to continue.");
    return;
  }

  if (settings.focusMode === "partial" && isStudyBlockRunning()) {
    showToastMessage("Welcome back. Stay steady and continue your study block.");
  }
}

function startPartialFocusReminders() {
  if (partialFocusReminderIntervalId) {
    return;
  }

  sendPartialFocusReminder();
  partialFocusReminderIntervalId = setInterval(sendPartialFocusReminder, 45000);
}

function stopPartialFocusReminders() {
  clearInterval(partialFocusReminderIntervalId);
  partialFocusReminderIntervalId = null;
}

function sendPartialFocusReminder() {
  if (!document.hidden || settings.focusMode !== "partial" || !isStudyBlockRunning()) {
    stopPartialFocusReminders();
    return;
  }

  document.title = "Return to Study • Sanctuary";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Sanctuary Study", {
      body: "Gentle reminder: return to your study block when you can."
    });
  }
}

function syncFocusModeAfterTimerStateChange() {
  if (!isStudyBlockRunning()) {
    stopPartialFocusReminders();
    document.title = "Sanctuary Study";
  }

  updateFocusLockStatus();
}

function handleBeforeUnloadFocusMode(event) {
  if (!isCompleteFocusLockActive()) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
}

function setUpBlock(phase) {
  const minutes = phase === "study" ? settings.studyMinutes : settings.breakMinutes;
  const safeMinutes = clampMinutes(minutes, 1, phase === "study" ? 240 : 120);
  timerState.remainingSeconds = safeMinutes * 60;
  timerState.activeBlockSeconds = timerState.remainingSeconds;
}

function stopTimerInterval() {
  clearInterval(timerState.intervalId);
  timerState.intervalId = null;
  timerState.lastTickTime = null;
}

function updateTimerDisplay() {
  const safeSeconds = Math.max(0, timerState.remainingSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timerDisplay.textContent = formatted;
  miniTimerTime.textContent = formatted;
}

function updatePhaseBadge() {
  const inStudy = timerState.phase === "study";
  phaseBadge.textContent = inStudy ? "Study" : "Break";
  phaseBadge.classList.toggle("study", inStudy);
  phaseBadge.classList.toggle("break", !inStudy);
  miniTimerPhase.textContent = phaseBadge.textContent;
}

function updateSessionStatus() {
  if (timerState.running) {
    sessionStatus.textContent = timerState.phase === "study" ? "Focus block in progress" : "Break block in progress";
    return;
  }

  sessionStatus.textContent = timerState.phase === "study" ? "Ready to start your study block" : "Ready to start your break block";
}

function updateTimerButtons() {
  startBtn.disabled = timerState.running;
  pauseBtn.disabled = !timerState.running;
}

function showVersePopupForSeconds(focus, seconds) {
  clearInterval(popupIntervalId);
  popupVerseText.textContent = `"${focus.text}"`;
  popupVerseRef.textContent = focus.reference;
  versePopup.classList.remove("hidden");
  document.body.classList.add("popup-open");
  popupOverlay.classList.remove("hidden");

  return new Promise((resolve) => {
    let remaining = seconds;
    popupCountdown.textContent = `Starting in ${remaining}s`;

    popupIntervalId = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(popupIntervalId);
        popupIntervalId = null;
        versePopup.classList.add("hidden");
        document.body.classList.remove("popup-open");
        popupOverlay.classList.add("hidden");
        resolve();
      } else {
        popupCountdown.textContent = `Starting in ${remaining}s`;
      }
    }, 1000);
  });
}
