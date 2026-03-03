// Sanctuary Study — Timer core, focus mode, session lifecycle, and toasts.
// Manages study/break timer, focus commit lock-in, session flow,
// verse popup, mini-timer widget, and toast notifications.

var popupRejectCallback = null;


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
  if (!lofiPresetSelect) {
    return;
  }

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

  if (customPresetFields) customPresetFields.classList.toggle("hidden", presetId !== "custom");

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

  if (customStudyMinutesInput) customStudyMinutesInput.value = studyMinutes;
  if (customBreakMinutesInput) customBreakMinutesInput.value = breakMinutes;
  applyPreset("custom");
}

function applyCustomPreset() {
  var studyVal = customStudyMinutesInput ? customStudyMinutesInput.value : 25;
  var breakVal = customBreakMinutesInput ? customBreakMinutesInput.value : 5;
  const study = clampMinutes(studyVal, 1, 240);
  const rest = clampMinutes(breakVal, 1, 120);
  if (customStudyMinutesInput) customStudyMinutesInput.value = study;
  if (customBreakMinutesInput) customBreakMinutesInput.value = rest;
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
  const selected = sessionTagSelect ? sessionTagSelect.value : "";
  if (selected === "Custom") {
    const custom = String(customTagInput ? customTagInput.value : "").trim().slice(0, 50);
    return custom || "Custom";
  }

  return selected || "General";
}

function updateSessionTagBadge() {
  const activeTag = getActiveSessionTag();
  if (sessionTagBadge) sessionTagBadge.textContent = `Tag: ${activeTag}`;
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
    if (musicDock && musicDock.classList.contains("hidden")) {
      startBackgroundMusicFromSavedPreference(false);
    }

    const startedFromHome = homeSection && !homeSection.classList.contains("hidden");
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
  if (studyPrep) studyPrep.classList.add("hidden");
  if (studySession) studySession.classList.remove("hidden");
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

  if (homeThemeBadge) homeThemeBadge.textContent = currentFocus.theme;
  if (homeVerseText) homeVerseText.textContent = `"${currentFocus.text}"`;
  if (homeVerseRef) homeVerseRef.textContent = currentFocus.reference;
  if (homeEncouragementText) homeEncouragementText.textContent = currentFocus.encouragement;

  if (sessionVerseText) sessionVerseText.textContent = `"${currentFocus.text}"`;
  if (sessionVerseRef) sessionVerseRef.textContent = currentFocus.reference;
  if (sessionEncouragementText) sessionEncouragementText.textContent = currentFocus.encouragement;
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

    timerState.remainingSeconds = Math.max(0, timerState.remainingSeconds - elapsedSeconds);
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

function catchUpTimerIfNeeded() {
  if (!timerState.running || !timerState.lastTickTime) {
    return;
  }

  var now = Date.now();
  var elapsedSeconds = Math.round((now - timerState.lastTickTime) / 1000);
  if (elapsedSeconds <= 0) {
    return;
  }

  timerState.lastTickTime = now;
  timerState.remainingSeconds = Math.max(0, timerState.remainingSeconds - elapsedSeconds);
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
  if (!studySession || studySession.classList.contains("hidden")) {
    return;
  }

  if (maybePromptFocusCommitExit({ type: "cancel-session" })) {
    return;
  }

  if (cancelSessionMessage) {
    if (timerState.phase === "study") {
      cancelSessionMessage.textContent = "This block will not be tracked if you do not finish the full study block. Do you still want to cancel?";
    } else {
      cancelSessionMessage.textContent = "Stopping now ends this cycle. Any unfinished study block will not be tracked. Do you still want to cancel?";
    }
  }

  if (cancelSessionModal) cancelSessionModal.classList.remove("hidden");
  if (confirmCancelSessionBtn) confirmCancelSessionBtn.focus();
}

function closeCancelSessionModal() {
  if (cancelSessionModal) cancelSessionModal.classList.add("hidden");
  if (cancelSessionBtn && studySession && !studySession.classList.contains("hidden")) {
    cancelSessionBtn.focus();
  }
}

function confirmCancelSession() {
  closeCancelSessionModal();
  cancelCurrentSession();
}

function dismissVersePopup() {
  clearInterval(popupIntervalId);
  popupIntervalId = null;
  if (versePopup) versePopup.classList.add("hidden");
  document.body.classList.remove("popup-open");
  if (popupOverlay) popupOverlay.classList.add("hidden");

  if (popupRejectCallback) {
    var callback = popupRejectCallback;
    popupRejectCallback = null;
    // Revert session panel state since timer will never start.
    if (studySession) studySession.classList.add("hidden");
    if (studyPrep) studyPrep.classList.remove("hidden");
    callback(new Error("Session cancelled during verse popup."));
  }
}

function cancelCurrentSession(options = {}) {
  if (!options.bypassFocusLock && maybePromptFocusCommitExit({ type: "cancel-session" })) {
    return;
  }

  stopTimerInterval();
  timerState.running = false;
  completeFocusPausedByTabSwitch = false;
  syncFocusModeAfterTimerStateChange();

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {
      // Fullscreen can fail to exit in some browsers without active gesture.
    });
  }

  dismissVersePopup();

  timerState.phase = "study";
  setUpBlock("study");
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();

  if (studySession) studySession.classList.add("hidden");
  if (studyPrep) studyPrep.classList.remove("hidden");
  closeSessionReviewPrompt();
  clearFocusCommitState();
  updateMiniTimerWidget();

  showToastMessage("Session cancelled. Incomplete study time was not tracked.");
}

function onBlockComplete() {
  stopTimerInterval();
  timerState.running = false;
  syncFocusModeAfterTimerStateChange();

  var completedPhase = timerState.phase;

  if (timerState.phase === "study") {
    const blockMinutes = timerState.activeBlockSeconds / 60;
    const activeTag = getActiveSessionTag();
    playAlarmSound();

    if (canUseAnalyticsFeatures()) {
      const context = recordCompletedStudyBlock(blockMinutes, activeTag);
      const unlockedAchievement = unlockStreakAchievements(context.currentStreak, true);
      const unlockedRareAchievement = unlockRareAchievements(context, true);
      const unlockedConsistency = unlockConsistencyAchievements(context, true);
      scheduleRenderAnalytics();
      showMotivationToast(getMotivationalMessage(context));
      const newAchievements = [unlockedAchievement, unlockedRareAchievement, ...unlockedConsistency].filter(Boolean);
      if (newAchievements.length > 0) {
        showAchievementToast(newAchievements[0]);
        newAchievements.slice(1, 3).forEach((achievement, index) => {
          setTimeout(() => {
            showAchievementToast(achievement);
          }, ((index + 1) * (TOAST_SHOW_MS + 1200)));
        });
      }
      openSessionReviewPrompt(context.sessionId);
    } else {
      closeSessionReviewPrompt();
      showMotivationToast("Study block completed. Sign in to save analytics and unlock achievements.");
    }

    timerState.phase = "break";
    setUpBlock("break");
  } else {
    playAlarmSound();
    timerState.phase = "study";
    setUpBlock("study");
  }

  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();
  syncFocusModeAfterTimerStateChange();

  if (completedPhase === "break") {
    showToastMessage("Break complete. Press Start when you are ready for the next study block.");
  } else {
    startTimer();
  }
}

function showMotivationToast(message) {
  showToastMessage(message);
}

function showAchievementToast(achievement) {
  if (!achievementToast) return;
  clearTimeout(achievementToastTimeoutId);
  clearTimeout(achievementToastCleanupId);

  if (achievementToastMedal) achievementToastMedal.textContent = achievement.medalText || achievement.days || "★";
  if (achievementToastTitle) achievementToastTitle.textContent = achievement.title;
  if (achievementToastMessage) achievementToastMessage.textContent = achievement.message;

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
  if (!motivationToast) return;
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
  if (miniTimerPhase) miniTimerPhase.textContent = timerState.phase === "study" ? "Study" : "Break";
  if (miniTimerTime && timerDisplay) miniTimerTime.textContent = timerDisplay.textContent;

  const sessionStarted = studySession && !studySession.classList.contains("hidden");
  const outsideStudyPage = currentView !== "study";
  if (miniTimerWidget) miniTimerWidget.classList.toggle("hidden", !(sessionStarted && outsideStudyPage));
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
  if (timerDisplay) timerDisplay.textContent = formatted;
  if (miniTimerTime) miniTimerTime.textContent = formatted;
}

function updatePhaseBadge() {
  const inStudy = timerState.phase === "study";
  if (phaseBadge) {
    phaseBadge.textContent = inStudy ? "Study" : "Break";
    phaseBadge.classList.toggle("study", inStudy);
    phaseBadge.classList.toggle("break", !inStudy);
  }
  if (miniTimerPhase) miniTimerPhase.textContent = inStudy ? "Study" : "Break";
}

function updateSessionStatus() {
  if (!sessionStatus) return;
  if (timerState.running) {
    sessionStatus.textContent = timerState.phase === "study" ? "Focus block in progress" : "Break block in progress";
    return;
  }

  sessionStatus.textContent = timerState.phase === "study" ? "Ready to start your study block" : "Ready to start your break block";
}

function updateTimerButtons() {
  if (startBtn) startBtn.disabled = timerState.running;
  if (pauseBtn) pauseBtn.disabled = !timerState.running;
}

function showVersePopupForSeconds(focus, seconds) {
  clearInterval(popupIntervalId);
  popupRejectCallback = null;
  if (popupVerseText) popupVerseText.textContent = `"${focus.text}"`;
  if (popupVerseRef) popupVerseRef.textContent = focus.reference;
  if (versePopup) versePopup.classList.remove("hidden");
  document.body.classList.add("popup-open");
  if (popupOverlay) popupOverlay.classList.remove("hidden");

  return new Promise((resolve, reject) => {
    popupRejectCallback = reject;
    let remaining = seconds;
    if (popupCountdown) popupCountdown.textContent = `Starting in ${remaining}s`;

    popupIntervalId = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(popupIntervalId);
        popupIntervalId = null;
        popupRejectCallback = null;
        if (versePopup) versePopup.classList.add("hidden");
        document.body.classList.remove("popup-open");
        if (popupOverlay) popupOverlay.classList.add("hidden");
        resolve();
      } else {
        if (popupCountdown) popupCountdown.textContent = `Starting in ${remaining}s`;
      }
    }, 1000);
  });
}
