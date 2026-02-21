// Sanctuary Study — Main application logic.
// Constants and config: see js/constants.js
// Cloud sync: see js/sync.js
// Analytics and achievements: see js/analytics.js
// UI helpers (notes, favourites, settings, theme, alarm): see js/ui.js
// Timer and focus mode: see js/timer.js
// Music system: see js/music.js


const sections = {
  study: document.getElementById("studySection"),
  analytics: document.getElementById("analyticsSection"),
  settings: document.getElementById("settingsSection"),
  favourites: document.getElementById("favouritesSection")
};

const homeSection = document.getElementById("homeSection");
const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const logoHomeBtn = document.getElementById("logoHomeBtn");
const homeNavBtn = document.getElementById("homeNavBtn");
const themeToggleBtn = document.getElementById("theme-toggle");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleText = document.getElementById("themeToggleText");
const authActionBtn = document.getElementById("authActionBtn");
const authActionText = document.getElementById("authActionText");

const authSection = document.getElementById("authSection");
// authForm, authEmailInput, authPasswordInput, authSignInBtn, authSignUpBtn
// are queried and managed exclusively by auth.js (ES module).
const authGuestBtn = document.getElementById("authGuestBtn");
const authMessage = document.getElementById("authMessage");
const authModeNotice = document.getElementById("authModeNotice");

const homeBeginBtn = document.getElementById("homeBeginBtn");
const homeSettingsBtn = document.getElementById("homeSettingsBtn");
const homeThemeBadge = document.getElementById("homeThemeBadge");
const homeTitle = document.querySelector(".type-title");
if (homeTitle) {
  const titleLength = (homeTitle.textContent || "").trim().length;
  homeTitle.style.setProperty("--type-width", `${titleLength}ch`);
  homeTitle.style.setProperty("--type-steps", String(titleLength));
}
const homeVerseText = document.getElementById("homeVerseText");
const homeVerseRef = document.getElementById("homeVerseRef");
const homeEncouragementText = document.getElementById("homeEncouragementText");
const homeSaveVerseBtn = document.getElementById("homeSaveVerseBtn");
const dailyVerseText = document.getElementById("dailyVerseText");
const dailyVerseRef = document.getElementById("dailyVerseRef");
const themePills = Array.from(document.querySelectorAll(".theme-pill"));

const studyPrep = document.getElementById("studyPrep");
const prepBeginBtn = document.getElementById("prepBeginBtn");
const prepSettingsBtn = document.getElementById("prepSettingsBtn");
const versePopup = document.getElementById("versePopup");
const popupOverlay = document.getElementById("popupOverlay");
const popupVerseText = document.getElementById("popupVerseText");
const popupVerseRef = document.getElementById("popupVerseRef");
const popupCountdown = document.getElementById("popupCountdown");

const presetButtons = Array.from(document.querySelectorAll(".preset-btn"));
const customPresetFields = document.getElementById("customPresetFields");
const customStudyMinutesInput = document.getElementById("customStudyMinutes");
const customBreakMinutesInput = document.getElementById("customBreakMinutes");
const applyCustomPresetBtn = document.getElementById("applyCustomPresetBtn");

const sessionTagSelect = document.getElementById("sessionTagSelect");
const customTagRow = document.getElementById("customTagRow");
const customTagInput = document.getElementById("customTagInput");
const sessionTagBadge = document.getElementById("sessionTagBadge");

const studySession = document.getElementById("studySession");
const phaseBadge = document.getElementById("phaseBadge");
const sessionStatus = document.getElementById("sessionStatus");
const timerDisplay = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const cancelSessionBtn = document.getElementById("cancelSessionBtn");
const focusLockStatus = document.getElementById("focusLockStatus");
const sessionVerseText = document.getElementById("sessionVerseText");
const sessionVerseRef = document.getElementById("sessionVerseRef");
const sessionEncouragementText = document.getElementById("sessionEncouragementText");
const studySaveVerseBtn = document.getElementById("studySaveVerseBtn");
const sessionNotesInput = document.getElementById("sessionNotesInput");
const addSessionTodoBtn = document.getElementById("addSessionTodoBtn");
const sessionTodoInput = document.getElementById("sessionTodoInput");
const sessionTodoList = document.getElementById("sessionTodoList");
const clearSessionNotesBtn = document.getElementById("clearSessionNotesBtn");

const todayMinutesEl = document.getElementById("todayMinutes");
const totalHoursEl = document.getElementById("totalHours");
const streakDaysEl = document.getElementById("streakDays");
const studyDaysEl = document.getElementById("studyDays");
const goalProgressEl = document.getElementById("goalProgress");
const weeklyPlanSummaryEl = document.getElementById("weeklyPlanSummary");
const weeklyPlanProgressFillEl = document.getElementById("weeklyPlanProgressFill");
const weeklyPlanBreakdownEl = document.getElementById("weeklyPlanBreakdown");
const chartSummaryEl = document.getElementById("chartSummary");
const studyGraphEl = document.getElementById("studyGraph");
const tagSummaryEl = document.getElementById("tagSummary");
const tagBreakdownListEl = document.getElementById("tagBreakdownList");
const deepInsightsSummaryEl = document.getElementById("deepInsightsSummary");
const deepInsightsListEl = document.getElementById("deepInsightsList");
const tagTrendListEl = document.getElementById("tagTrendList");
const achievementSummaryEl = document.getElementById("achievementSummary");
const achievementsGridEl = document.getElementById("achievementsGrid");

const settingsForm = document.getElementById("settingsForm");
const settingsQuickButtons = Array.from(document.querySelectorAll(".settings-quick-btn"));
const settingsQuickAccountBtn = settingsQuickButtons.find((button) => button.dataset.settingsTarget === "accountSettingsCard") || null;
const studyMinutesSetting = document.getElementById("studyMinutesSetting");
const breakMinutesSetting = document.getElementById("breakMinutesSetting");
const dailyGoalMinutesSetting = document.getElementById("dailyGoalMinutesSetting");
const weeklyPlanMonSetting = document.getElementById("weeklyPlanMonSetting");
const weeklyPlanTueSetting = document.getElementById("weeklyPlanTueSetting");
const weeklyPlanWedSetting = document.getElementById("weeklyPlanWedSetting");
const weeklyPlanThuSetting = document.getElementById("weeklyPlanThuSetting");
const weeklyPlanFriSetting = document.getElementById("weeklyPlanFriSetting");
const weeklyPlanSatSetting = document.getElementById("weeklyPlanSatSetting");
const weeklyPlanSunSetting = document.getElementById("weeklyPlanSunSetting");
const remindersEnabledSetting = document.getElementById("remindersEnabledSetting");
const reminderTimeSetting = document.getElementById("reminderTimeSetting");
const quietHoursStartSetting = document.getElementById("quietHoursStartSetting");
const quietHoursEndSetting = document.getElementById("quietHoursEndSetting");
const enableReminderPermissionBtn = document.getElementById("enableReminderPermissionBtn");
const focusCommitMinutesSetting = document.getElementById("focusCommitMinutesSetting");
const blockedSitesSetting = document.getElementById("blockedSitesSetting");
const themeSetting = document.getElementById("themeSetting");
const focusModeSetting = document.getElementById("focusModeSetting");
const alarmModeSetting = document.getElementById("alarmModeSetting");
const customAlarmRow = document.getElementById("customAlarmRow");
const customAlarmUrlSetting = document.getElementById("customAlarmUrlSetting");
const youtubeMusicUrlSetting = document.getElementById("youtubeMusicUrlSetting");
const lofiPresetSelect = document.getElementById("lofiPresetSelect");
const localMusicFileInput = document.getElementById("localMusicFileInput");
const musicAttributionList = document.getElementById("musicAttributionList");
const testAlarmBtn = document.getElementById("testAlarmBtn");
const loadMusicBtn = document.getElementById("loadMusicBtn");
const playMusicBtn = document.getElementById("playMusic");
const stopMusicBtn = document.getElementById("stopMusicBtn");
const settingsMessage = document.getElementById("settingsMessage");
const accountSettingsCard = document.getElementById("accountSettingsCard");
const accountSettingsStatus = document.getElementById("accountSettingsStatus");
const settingsSignOutBtn = document.getElementById("settingsSignOutBtn");
const settingsDeleteAccountBtn = document.getElementById("settingsDeleteAccountBtn");
const syncStatusDot = document.getElementById("syncStatusDot");
const syncStatusPrimary = document.getElementById("syncStatusPrimary");
const syncStatusSecondary = document.getElementById("syncStatusSecondary");

const favouritesList = document.getElementById("favouritesList");
const motivationToast = document.getElementById("motivationToast");
const achievementToast = document.getElementById("achievementToast");
const achievementToastMedal = document.getElementById("achievementToastMedal");
const achievementToastTitle = document.getElementById("achievementToastTitle");
const achievementToastMessage = document.getElementById("achievementToastMessage");
const sessionReviewPrompt = document.getElementById("sessionReviewPrompt");
const reviewFocusedBtn = document.getElementById("reviewFocusedBtn");
const reviewDistractedBtn = document.getElementById("reviewDistractedBtn");
const reviewSkipBtn = document.getElementById("reviewSkipBtn");
const cancelSessionModal = document.getElementById("cancelSessionModal");
const cancelSessionMessage = document.getElementById("cancelSessionMessage");
const keepSessionBtn = document.getElementById("keepSessionBtn");
const confirmCancelSessionBtn = document.getElementById("confirmCancelSessionBtn");
const focusExitModal = document.getElementById("focusExitModal");
const focusExitMessage = document.getElementById("focusExitMessage");
const focusBlockedSitesList = document.getElementById("focusBlockedSitesList");
const keepFocusBtn = document.getElementById("keepFocusBtn");
const breakGlassBtn = document.getElementById("breakGlassBtn");
const MUSIC_DOCK_POSITION_KEY = "sanctuaryMusicDockPositionV1";

const miniTimerWidget = document.getElementById("miniTimerWidget");
const miniTimerPhase = document.getElementById("miniTimerPhase");
const miniTimerTime = document.getElementById("miniTimerTime");
const miniTimerGoBtn = document.getElementById("miniTimerGoBtn");

const musicDock = document.getElementById("musicDock");
const musicDockHead = musicDock ? musicDock.querySelector(".music-dock-head") : null;
const musicDockCloseBtn = document.getElementById("musicDockCloseBtn");
const musicDockMinBtn = document.getElementById("musicDockMinBtn");
const musicDockPlayPauseBtn = document.getElementById("musicDockPlayPauseBtn");
const musicDockTitle = document.getElementById("musicDockTitle");
const musicDockLabel = document.getElementById("musicDockLabel");
const musicOpenExternalBtn = document.getElementById("musicOpenExternalBtn");
const musicFrameWrap = document.getElementById("musicFrameWrap");
const musicFrame = document.getElementById("musicFrame");
const audioPlayerWrap = document.getElementById("audioPlayerWrap");
const bgAudio = document.getElementById("bg-audio");

let settings = loadSettings();
let alarmSoundUrl = null;
let fallbackAudioContext = null;
let popupIntervalId = null;
let toastTimeoutId = null;
let toastCleanupId = null;
let achievementToastTimeoutId = null;
let achievementToastCleanupId = null;
let settingsMessageTimeoutId = null;
let musicPopupWindow = null;
let partialFocusReminderIntervalId = null;
let completeFocusPausedByTabSwitch = false;
let musicDockMinimized = false;
let youtubeApiReady = false;
let youtubeApiRequested = false;
let youtubePlayer = null;
let youtubeCurrentVideoId = null;
let pendingYouTubeRequest = null;
let currentObjectAudioUrl = null;
let activeAudioSourceType = null; // "audio" | "youtube" | null
let downloadedPlaylistQueue = [];
let downloadedPlaylistCursor = -1;
let dockDragState = null;
let isPreparingSession = false;
let selectedStudyTheme = "Perseverance";
let selectedPreset = "25-5";
let currentView = "home";
let sessionNotesState = loadSessionNotesState();
let homeTypeEffectLocked = false;
let homeTypeEffectTimeoutId = null;
let authMode = "pending"; // "pending" | "guest" | "user"
let currentUser = null;
let cloudSyncDb = null;
let cloudSyncApi = null;
let cloudSyncReady = false;
let cloudSyncTimerId = null;
let cloudSyncInFlight = false;
let cloudSyncQueued = false;
let cloudSyncHydrating = false;
let lastCloudHydrateAt = 0;
let userDocUnsubscribe = null;
let userDocSyncTimerId = null;
let userDocApplyingRemote = false;
let analyticsResizeTimeoutId = null;
let reminderIntervalId = null;
let lastReminderSentDayKey = loadLastReminderSentDayKey();
let lastSuccessfulSyncAt = loadLastSuccessfulSyncAt();
let syncIndicatorState = "idle"; // "idle" | "syncing" | "error"
let lastLocalSettingsMutationAt = loadLastLocalSettingsMutationAt();
let lastLocalThemeMutationAt = 0;
let pendingSessionReviewId = null;
let pendingServiceWorkerRegistration = null;
let updateBarElement = null;
let reloadOnControllerChangeArmed = false;
let focusCommitRemainingSeconds = 0;
let focusExitPendingAction = null;

let currentFocus = {
  theme: selectedStudyTheme,
  text: "Choose a study theme and begin. A scripture and encouragement will appear here.",
  reference: "Session Preview",
  encouragement: "Take a breath and prepare your mind for steady, meaningful work."
};

const timerState = {
  phase: "study",
  running: false,
  intervalId: null,
  remainingSeconds: settings.studyMinutes * 60,
  activeBlockSeconds: settings.studyMinutes * 60,
  lastTickTime: null
};

init();

function init() {
  if (!settings.musicPresetId && !settings.youtubeMusicUrl) {
    settings.musicPresetId = defaultSettings.musicPresetId;
    saveSettings(settings, {
      skipThemeMutationStamp: true,
      skipLocalMutationStamp: true
    });
  }

  const savedTheme = safeGetItem(THEME_PREF_KEY);
  const initialTheme = resolveThemePreference(savedTheme, settings.theme, defaultSettings.theme);
  setTheme(initialTheme, { fromRemote: true });
  settings.theme = initialTheme;
  safeSetItem(THEME_PREF_KEY, initialTheme);

  wireEvents();

  try {
    populateLofiPresetSelect();
    renderMusicAttributionList();
    fillSettingsForm();
  } catch (error) {
    console.warn("Settings UI initialization failed:", error);
  }

  activateSettingsQuickNav("settingsGeneralAnchor");
  setStudyTheme(selectedStudyTheme);
  setCurrentFocus(currentFocus);
  applyPresetByMinutes(settings.studyMinutes, settings.breakMinutes);
  showAuthScreen("Sign in to continue, or use guest mode.");
  updateSessionTagBadge();
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();
  renderAnalytics();
  renderFavourites();
  try {
    preloadCommonsAlarmIfNeeded();
  } catch (error) {
    console.warn("Alarm preload failed:", error);
  }
  updateMiniTimerWidget();
  try {
    initializeYouTubeApiBridge();
    initializeMusicDockDragging();
    initializeMusicDock();
    syncMusicPlayPauseButton();
  } catch (error) {
    console.warn("Music dock initialization failed:", error);
  }
  try {
    renderSessionNotes();
  } catch (error) {
    console.warn("Session notes initialization failed:", error);
  }
  renderSyncStatus();
  try {
    initializeReminderScheduler();
    loadScriptureOfTheDay();
  } catch (error) {
    console.warn("Reminder/scripture initialization failed:", error);
  }
  initializeAuthenticationFlow();
  registerServiceWorkerWithUpdatePrompt();
}

function registerServiceWorkerWithUpdatePrompt() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const secureContextLike = window.location.protocol === "https:"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";

  if (!secureContextLike) {
    return;
  }

  (async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");

      const checkForUpdates = async () => {
        try {
          await registration.update();
        } catch (error) {
          return;
        }

        if (registration.waiting) {
          showUpdateBanner(registration);
        }
      };

      if (registration.waiting) {
        showUpdateBanner(registration);
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) {
          return;
        }

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(registration);
          }
        });
      });

      // Faster checks so update banner appears soon after a deploy.
      void checkForUpdates();
      window.setTimeout(checkForUpdates, 700);
      window.setTimeout(checkForUpdates, 2000);
      window.setInterval(checkForUpdates, 60000);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          void checkForUpdates();
        }
      });

      window.addEventListener("online", () => {
        void checkForUpdates();
      });
    } catch (error) {
      console.warn("Service worker registration failed.", error);
    }
  })();
}

function showUpdateBanner(registration) {
  pendingServiceWorkerRegistration = registration;

  if (updateBarElement) {
    return;
  }

  const bar = document.createElement("div");
  bar.className = "update-bar";
  bar.setAttribute("role", "status");
  bar.setAttribute("aria-live", "polite");

  const text = document.createElement("span");
  text.textContent = "New version of Sanctuary Study available.";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Refresh";
  button.addEventListener("click", requestServiceWorkerRefresh);

  bar.appendChild(text);
  bar.appendChild(button);
  document.body.appendChild(bar);

  updateBarElement = bar;
}

function removeUpdateBanner() {
  if (!updateBarElement) {
    return;
  }

  updateBarElement.remove();
  updateBarElement = null;
}

function requestServiceWorkerRefresh() {
  const registration = pendingServiceWorkerRegistration;
  removeUpdateBanner();

  if (!registration || !registration.waiting) {
    window.location.reload();
    return;
  }

  if (!reloadOnControllerChangeArmed) {
    reloadOnControllerChangeArmed = true;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloadOnControllerChangeArmed) {
        return;
      }

      reloadOnControllerChangeArmed = false;
      window.location.reload();
    }, { once: true });
  }

  registration.waiting.postMessage({ type: "SKIP_WAITING" });
}

function loadLastSuccessfulSyncAt() {
  const raw = String(safeGetItem(LAST_SUCCESSFUL_SYNC_AT_KEY) || "").trim();
  if (!raw) {
    return "";
  }

  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Date(timestamp).toISOString();
}

function saveLastSuccessfulSyncAt(isoString) {
  const safeIso = String(isoString || "").trim();
  if (!safeIso) {
    localStorage.removeItem(LAST_SUCCESSFUL_SYNC_AT_KEY);
    return;
  }

  safeSetItem(LAST_SUCCESSFUL_SYNC_AT_KEY, safeIso);
}

function loadLastReminderSentDayKey() {
  const raw = String(safeGetItem(REMINDER_LAST_SENT_KEY) || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function saveLastReminderSentDayKey(dayKey) {
  const safeDayKey = String(dayKey || "").trim();
  if (!safeDayKey) {
    localStorage.removeItem(REMINDER_LAST_SENT_KEY);
    return;
  }
  safeSetItem(REMINDER_LAST_SENT_KEY, safeDayKey);
}

function loadLastLocalSettingsMutationAt() {
  const numeric = Number(safeGetItem(SETTINGS_UPDATED_AT_KEY));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function saveLastLocalSettingsMutationAt(timestampMs) {
  const safeTimestamp = Number(timestampMs);
  if (!Number.isFinite(safeTimestamp) || safeTimestamp <= 0) {
    localStorage.removeItem(SETTINGS_UPDATED_AT_KEY);
    return;
  }

  safeSetItem(SETTINGS_UPDATED_AT_KEY, String(Math.round(safeTimestamp)));
}

function parseTimestampToMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function setSyncIndicatorState(state) {
  const safeState = state === "syncing" || state === "error" ? state : "idle";
  syncIndicatorState = safeState;
  renderSyncStatus();
}

function markSuccessfulSync(isoString = new Date().toISOString()) {
  lastSuccessfulSyncAt = String(isoString || "").trim();
  saveLastSuccessfulSyncAt(lastSuccessfulSyncAt);
  syncIndicatorState = "idle";
  renderSyncStatus();
}

function formatSyncTime(isoString) {
  const timestamp = Date.parse(String(isoString || ""));
  if (!Number.isFinite(timestamp)) {
    return "Never";
  }

  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderSyncStatus() {
  if (!syncStatusPrimary || !syncStatusSecondary || !syncStatusDot) {
    return;
  }

  const online = navigator.onLine;
  syncStatusDot.classList.remove("online", "offline", "syncing", "error");

  if (!canUseAnalyticsFeatures()) {
    syncStatusDot.classList.add("offline");
    syncStatusPrimary.textContent = "Sign in to enable cloud sync.";
    syncStatusSecondary.textContent = "Last synced: --";
    return;
  }

  if (!online) {
    syncStatusDot.classList.add("offline");
    syncStatusPrimary.textContent = "Offline. Changes will sync when you reconnect.";
    syncStatusSecondary.textContent = `Last synced: ${formatSyncTime(lastSuccessfulSyncAt)}`;
    return;
  }

  if (syncIndicatorState === "syncing") {
    syncStatusDot.classList.add("syncing");
    syncStatusPrimary.textContent = "Syncing study data...";
    syncStatusSecondary.textContent = `Last synced: ${formatSyncTime(lastSuccessfulSyncAt)}`;
    return;
  }

  if (syncIndicatorState === "error") {
    syncStatusDot.classList.add("error");
    syncStatusPrimary.textContent = "Sync delayed. Sanctuary will retry automatically.";
    syncStatusSecondary.textContent = `Last synced: ${formatSyncTime(lastSuccessfulSyncAt)}`;
    return;
  }

  syncStatusDot.classList.add("online");
  syncStatusPrimary.textContent = lastSuccessfulSyncAt
    ? "Cloud sync is up to date."
    : "Cloud sync is ready for your first saved update.";
  syncStatusSecondary.textContent = `Last synced: ${formatSyncTime(lastSuccessfulSyncAt)}`;
}

function sanitizeTimeInput(value, fallback) {
  const safeValue = String(value || "").trim();
  if (/^\d{2}:\d{2}$/.test(safeValue)) {
    const [hours, minutes] = safeValue.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  return fallback;
}

function timeStringToMinutes(timeString) {
  const safe = sanitizeTimeInput(timeString, "00:00");
  const [hours, minutes] = safe.split(":").map(Number);
  return (hours * 60) + minutes;
}

function isInsideQuietHours(nowDate, startTime, endTime) {
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);
  const nowMinutes = (nowDate.getHours() * 60) + nowDate.getMinutes();

  if (start === end) {
    return false;
  }
  if (start < end) {
    return nowMinutes >= start && nowMinutes < end;
  }

  return nowMinutes >= start || nowMinutes < end;
}

function initializeReminderScheduler() {
  if (reminderIntervalId) {
    window.clearInterval(reminderIntervalId);
  }

  reminderIntervalId = window.setInterval(() => {
    maybeSendStudyReminder();
  }, REMINDER_CHECK_INTERVAL_MS);

  maybeSendStudyReminder();
}

function maybeSendStudyReminder() {
  if (!settings.remindersEnabled) {
    return;
  }

  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const now = new Date();
  if (isInsideQuietHours(now, settings.quietHoursStart, settings.quietHoursEnd)) {
    return;
  }

  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (nowTime !== settings.reminderTime) {
    return;
  }

  const todayKey = getDateKey(now);
  if (lastReminderSentDayKey === todayKey) {
    return;
  }

  lastReminderSentDayKey = todayKey;
  saveLastReminderSentDayKey(todayKey);

  new Notification("Sanctuary Study", {
    body: "It is time for your next study session. Stay steady and focused."
  });

  showToastMessage("Study reminder sent.");
}

function requestStudyReminderPermission() {
  if (!("Notification" in window)) {
    showSettingsError("This browser does not support notifications.");
    return;
  }

  Notification.requestPermission()
    .then((permission) => {
      if (permission === "granted") {
        showSettingsSuccess("Notifications enabled for study reminders.");
        maybeSendStudyReminder();
        return;
      }

      showSettingsError("Notification permission was not granted.");
    })
    .catch(() => {
      showSettingsError("Could not request notification permission.");
    });
}

function hasAppAccess() {
  return authMode === "guest" || authMode === "user";
}

function canUseAnalyticsFeatures() {
  return authMode === "user";
}

function loadGuestModePreference() {
  return safeGetItem(GUEST_MODE_KEY) === "true";
}

function saveGuestModePreference(enabled) {
  if (enabled) {
    safeSetItem(GUEST_MODE_KEY, "true");
    return;
  }

  localStorage.removeItem(GUEST_MODE_KEY);
}

function setAuthMessage(message, isError = false) {
  authMessage.textContent = message || "";
  authMessage.classList.toggle("success", Boolean(message) && !isError);
}

function showAuthScreen(message = "") {
  authMode = "pending";
  currentView = "auth";

  stopTimerInterval();
  timerState.running = false;
  completeFocusPausedByTabSwitch = false;
  syncFocusModeAfterTimerStateChange();
  dismissVersePopup();
  closeSessionReviewPrompt();
  clearFocusCommitState();
  updateTimerButtons();
  updateSessionStatus();

  authSection.classList.remove("hidden");
  homeSection.classList.add("hidden");
  Object.values(sections).forEach((section) => {
    section.classList.add("hidden");
  });
  navButtons.forEach((button) => {
    button.classList.remove("active");
  });
  setAuthMessage(message, false);
  updateMiniTimerWidget();
  updateAuthUi();
  renderSyncStatus();
}

function updateAuthUi() {
  const analyticsButton = navButtons.find((button) => button.dataset.section === "analytics");
  const analyticsLocked = !canUseAnalyticsFeatures();
  if (analyticsButton) {
    analyticsButton.classList.toggle("disabled", analyticsLocked);
    analyticsButton.disabled = analyticsLocked;
    analyticsButton.setAttribute("aria-disabled", String(analyticsLocked));
  }

  const isSignedIn = authMode === "user";
  authActionBtn.classList.toggle("hidden", isSignedIn);

  if (authMode === "user") {
    authActionText.textContent = "Sign In";
    authActionBtn.setAttribute("aria-label", "Sign in");
    const hasName = currentUser && (currentUser.firstName || currentUser.lastName);
    const fullName = hasName
      ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
      : "";
    const userLabel = fullName
      ? `Signed in as ${fullName}`
      : (currentUser && currentUser.email ? `Signed in as ${currentUser.email}` : "Signed in");
    authModeNotice.textContent = userLabel;
    authModeNotice.classList.remove("hidden");
  } else if (authMode === "guest") {
    authActionText.textContent = "Sign In";
    authActionBtn.setAttribute("aria-label", "Sign in");
    authModeNotice.textContent = "Guest mode: study timer only. Sign in to unlock analytics and achievements.";
    authModeNotice.classList.remove("hidden");
  } else {
    authActionText.textContent = "Sign In";
    authActionBtn.setAttribute("aria-label", "Sign in");
    authModeNotice.classList.add("hidden");
  }

  updateSettingsAccountControls();
}

function updateSettingsAccountControls() {
  if (!accountSettingsCard || !accountSettingsStatus || !settingsSignOutBtn || !settingsDeleteAccountBtn) {
    return;
  }

  const isSignedIn = authMode === "user";
  accountSettingsCard.classList.toggle("hidden", !isSignedIn);
  settingsSignOutBtn.disabled = !isSignedIn;
  settingsDeleteAccountBtn.disabled = !isSignedIn;
  if (settingsQuickAccountBtn) {
    settingsQuickAccountBtn.disabled = !isSignedIn;
    settingsQuickAccountBtn.classList.toggle("disabled", !isSignedIn);
    if (!isSignedIn && settingsQuickAccountBtn.classList.contains("active")) {
      activateSettingsQuickNav("settingsGeneralAnchor");
    }
  }

  if (!isSignedIn) {
    accountSettingsStatus.textContent = "Sign in to access account actions.";
    return;
  }

  const hasName = currentUser && (currentUser.firstName || currentUser.lastName);
  const fullName = hasName
    ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
    : "";
  accountSettingsStatus.textContent = fullName
    ? `Signed in as ${fullName}${currentUser.email ? ` (${currentUser.email})` : ""}.`
    : `Signed in as ${currentUser && currentUser.email ? currentUser.email : "your account"}.`;
}

function initializeAuthenticationFlow() {
  const onAuthChanged = (event) => {
    const detail = event && event.detail ? event.detail : {};
    const mode = String(detail.mode || "");

    if (mode === "verification_required") {
      const email = String(detail.email || "").trim();
      const label = email || "your email address";
      currentUser = null;
      resetCloudSyncState();
      showAuthScreen(`Verify ${label} before signing in. Check inbox/spam. You can use "Resend verification email" if needed.`);
      scheduleRenderAnalytics();
      updateAuthUi();
      renderSyncStatus();
      return;
    }

    if (mode === "user") {
      const detailUser = detail.user && typeof detail.user === "object" ? detail.user : {};
      const profile = detail.profile && typeof detail.profile === "object" ? detail.profile : {};
      currentUser = {
        uid: String(detailUser.uid || ""),
        email: String(detail.email || detailUser.email || profile.email || ""),
        firstName: String(profile.firstName || "").trim(),
        lastName: String(profile.lastName || "").trim()
      };
      authMode = "user";
      saveGuestModePreference(false);
      authSection.classList.add("hidden");
      setAuthMessage("");
      showHomeView({ forceStopTypeEffect: true });
      syncAchievementsWithCurrentStreak();
      scheduleRenderAnalytics();
      updateAuthUi();
      renderSyncStatus();
      void startUserDocRealtimeSync(currentUser.uid);
      void hydrateAnalyticsFromCloud(currentUser.uid).then((hydrated) => {
        if (!hydrated) {
          return;
        }
        lastCloudHydrateAt = Date.now();
        syncAchievementsWithCurrentStreak();
        scheduleRenderAnalytics();
        renderFavourites();
        scheduleCloudAnalyticsSync("post-hydrate");
        renderSyncStatus();
      });
      return;
    }

    if (mode === "signed_out") {
      currentUser = null;
      resetCloudSyncState();
      if (loadGuestModePreference()) {
        authMode = "guest";
        authSection.classList.add("hidden");
        setAuthMessage("");
        showHomeView({ forceStopTypeEffect: true });
        scheduleRenderAnalytics();
        updateAuthUi();
        renderSyncStatus();
        return;
      }

      showAuthScreen("Sign in with email and password, or continue as guest.");
      scheduleRenderAnalytics();
      updateAuthUi();
      renderSyncStatus();
    }
  };

  window.addEventListener("sanctuary:auth-changed", onAuthChanged);

  if (window.__SANCTUARY_AUTH_STATE && typeof window.__SANCTUARY_AUTH_STATE === "object") {
    onAuthChanged({ detail: window.__SANCTUARY_AUTH_STATE });
    return;
  }

  if (loadGuestModePreference()) {
    authMode = "guest";
    authSection.classList.add("hidden");
    setAuthMessage("");
    showHomeView({ forceStopTypeEffect: true });
    scheduleRenderAnalytics();
    updateAuthUi();
    renderSyncStatus();
    return;
  }

  showAuthScreen("Sign in with email and password, or continue as guest.");
  renderAnalytics();
  updateAuthUi();
  renderSyncStatus();
}


function enterGuestMode() {
  authMode = "guest";
  currentUser = null;
  resetCloudSyncState();
  saveGuestModePreference(true);
  authSection.classList.add("hidden");
  setAuthMessage("");
  showHomeView({ forceStopTypeEffect: true });
  scheduleRenderAnalytics();
  updateAuthUi();
  renderSyncStatus();
  showToastMessage("Guest mode active. Sign in any time to unlock analytics and achievements.");
}

function requestAuthSignOut() {
  try {
    window.dispatchEvent(new CustomEvent("sanctuary:request-signout"));
  } catch (error) {
    // No-op when auth module is unavailable.
  }

  currentUser = null;
  resetCloudSyncState();
  cancelPendingAnalyticsRender();
  showAuthScreen("You are signed out. Sign in again or continue as guest.");
  updateAuthUi();
  renderSyncStatus();
}

function requestDeleteAccount() {
  try {
    window.dispatchEvent(new CustomEvent("sanctuary:request-delete-account"));
  } catch (error) {
    showSettingsError("Delete account is unavailable right now.");
  }
}

function handleAuthActionClick() {
  if (authMode === "user") {
    switchSection("settings");
    return;
  }

  showAuthScreen("Sign in to save analytics and achievements.");
}

function activateSettingsQuickNav(targetId = "") {
  settingsQuickButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTarget === targetId);
  });
}

function expandSettingsPanelForTarget(targetId = "") {
  const panelMap = {
    settingsPlanAnchor: ".weekly-plan-panel",
    settingsFocusAnchor: ".lockin-panel"
  };

  const selector = panelMap[targetId];
  if (!selector) {
    return;
  }

  const panel = sections.settings ? sections.settings.querySelector(selector) : null;
  if (panel && panel.tagName === "DETAILS") {
    panel.open = true;
  }
}

function listen(el, event, handler) {
  if (el) {
    el.addEventListener(event, handler);
  }
}

function wireEvents() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchSection(button.dataset.section);
    });
  });

  listen(homeNavBtn, "click", () => {
    showHomeView({ forceStopTypeEffect: true });
  });
  listen(logoHomeBtn, "click", () => {
    showHomeView({ forceStopTypeEffect: true });
  });
  listen(authActionBtn, "click", () => {
    handleAuthActionClick();
  });
  listen(themeToggleBtn, "click", () => {
    const next = getNextThemeId(document.body.dataset.theme);
    setTheme(next);
    settings.theme = next;
    saveSettings(settings);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      catchUpTimerIfNeeded();
      loadScriptureOfTheDay();
      void refreshAnalyticsFromCloud("visibility");
      maybeSendStudyReminder();
    }
  });
  window.addEventListener("online", () => {
    renderSyncStatus();
    scheduleCloudAnalyticsSync("online");
    scheduleUserDocSync("online");
  });
  window.addEventListener("offline", () => {
    renderSyncStatus();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_PREF_KEY) {
      return;
    }

    const nextTheme = resolveThemePreference(event.newValue, settings.theme, defaultSettings.theme);
    if (nextTheme === sanitizeThemeId(document.body.dataset.theme)) {
      return;
    }

    setTheme(nextTheme);
    settings.theme = nextTheme;
    saveSettings(settings);
  });
  window.addEventListener("resize", () => {
    if (analyticsResizeTimeoutId) {
      window.clearTimeout(analyticsResizeTimeoutId);
    }

    analyticsResizeTimeoutId = window.setTimeout(() => {
      analyticsResizeTimeoutId = null;
      if (currentView === "analytics") {
        renderAnalytics();
      }
    }, 160);
  });

  listen(authGuestBtn, "click", () => {
    enterGuestMode();
  });
  if (settingsSignOutBtn) {
    settingsSignOutBtn.addEventListener("click", () => {
      if (authMode !== "user") {
        showSettingsError("Sign in first to manage your account.");
        return;
      }
      requestAuthSignOut();
    });
  }
  if (settingsDeleteAccountBtn) {
    settingsDeleteAccountBtn.addEventListener("click", () => {
      if (authMode !== "user") {
        showSettingsError("Sign in first to manage your account.");
        return;
      }

      const shouldDelete = window.confirm("Delete your account permanently? This cannot be undone.");
      if (!shouldDelete) {
        return;
      }

      showSettingsSuccess("Deleting account...");
      requestDeleteAccount();
    });
  }
  window.addEventListener("sanctuary:delete-account-result", (event) => {
    const detail = event && event.detail ? event.detail : {};
    if (detail.ok) {
      showToastMessage("Account deleted.");
      return;
    }

    const message = String(detail.message || "Could not delete account right now.");
    showSettingsError(message);
  });

  listen(homeBeginBtn, "click", () => beginStudyExperience().catch(console.error));
  listen(homeSettingsBtn, "click", () => switchSection("settings"));
  listen(homeSaveVerseBtn, "click", saveCurrentFocusToFavourites);

  listen(prepBeginBtn, "click", () => beginStudyExperience().catch(console.error));
  listen(prepSettingsBtn, "click", () => switchSection("settings"));
  listen(studySaveVerseBtn, "click", saveCurrentFocusToFavourites);

  themePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      setStudyTheme(pill.dataset.studyTheme);
    });
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  listen(applyCustomPresetBtn, "click", () => {
    applyCustomPreset();
  });

  listen(sessionTagSelect, "change", () => {
    customTagRow.classList.toggle("hidden", sessionTagSelect.value !== "Custom");
    updateSessionTagBadge();
  });

  listen(customTagInput, "input", () => {
    updateSessionTagBadge();
  });

  listen(startBtn, "click", startTimer);
  listen(pauseBtn, "click", pauseTimer);
  listen(resetBtn, "click", resetTimer);
  listen(cancelSessionBtn, "click", openCancelSessionModal);

  listen(settingsForm, "submit", onSettingsSubmit);
  settingsQuickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = String(button.dataset.settingsTarget || "");
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      if (currentView !== "settings") {
        switchSection("settings");
      }

      activateSettingsQuickNav(targetId);
      expandSettingsPanelForTarget(targetId);
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
  listen(themeSetting, "change", (event) => {
    const nextTheme = event && event.target && event.target.name === "themeSetting"
      ? event.target.value
      : null;
    if (!nextTheme) {
      return;
    }

    setTheme(nextTheme);
    settings.theme = sanitizeThemeId(document.body.dataset.theme);
    saveSettings(settings);
  });
  listen(focusModeSetting, "change", () => {
    if (focusModeSetting.value === "complete") {
      showToastMessage("Complete focus is strict: timer pauses if you leave the tab. Lock-in commitment can be set below.");
    }
  });
  listen(alarmModeSetting, "change", onAlarmModeFieldChange);
  if (enableReminderPermissionBtn) {
    enableReminderPermissionBtn.addEventListener("click", () => {
      requestStudyReminderPermission();
    });
  }
  listen(testAlarmBtn, "click", () => {
    playAlarmSound();
  });
  // Prepare only: this does not call play(), so browser autoplay rules are respected.
  listen(loadMusicBtn, "click", () => {
    loadBackgroundMusicFromSettings();
  });
  // Only this explicit user gesture starts music playback.
  listen(playMusicBtn, "click", () => {
    playBackgroundMusicFromUserGesture();
  });
  listen(stopMusicBtn, "click", () => {
    stopBackgroundMusic();
  });
  listen(lofiPresetSelect, "change", () => {
    if (lofiPresetSelect.value) {
      localMusicFileInput.value = "";
      const preset = getLofiPresetById(lofiPresetSelect.value);
      if (preset) {
        youtubeMusicUrlSetting.value = preset.url || "";
      }
    }
  });
  listen(localMusicFileInput, "change", () => {
    if (localMusicFileInput.files && localMusicFileInput.files.length > 0) {
      lofiPresetSelect.value = "";
    }
  });

  listen(miniTimerGoBtn, "click", () => {
    switchSection("study");
  });
  listen(musicDockMinBtn, "click", () => {
    setMusicDockMinimized(!musicDockMinimized);
  });
  listen(musicDockPlayPauseBtn, "click", () => {
    toggleDockMusicPlayback();
  });
  listen(musicDockCloseBtn, "click", () => {
    stopBackgroundMusic();
  });
  listen(musicOpenExternalBtn, "click", () => {
    const opened = openBackgroundMusicExternally();
    if (opened) {
      showToastMessage("Opened music source in a separate window.");
    }
  });
  listen(bgAudio, "error", () => {
    showToastMessage("This audio source could not be played. Try another preset or a downloaded file.");
    musicDockLabel.textContent = "Audio source failed to load.";
  });
  listen(bgAudio, "ended", () => {
    playNextDownloadedTrack();
  });
  listen(bgAudio, "play", () => {
    activeAudioSourceType = "audio";
    syncMusicPlayPauseButton();
  });
  listen(bgAudio, "pause", () => {
    syncMusicPlayPauseButton();
  });

  listen(favouritesList, "click", (event) => {
    const deleteButton = event.target.closest(".delete-favourite-btn");
    if (!deleteButton) {
      return;
    }

    deleteFavouriteItem(deleteButton.dataset.id);
    renderFavourites();
    showToastMessage("Removed from Sanctuary.");
  });

  listen(sessionNotesInput, "input", () => {
    sessionNotesState.text = sessionNotesInput.value;
    saveSessionNotesState(sessionNotesState);
  });
  listen(addSessionTodoBtn, "click", addSessionTodoItem);
  listen(sessionTodoInput, "keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSessionTodoItem();
    }
  });
  listen(clearSessionNotesBtn, "click", clearSessionNotes);
  listen(sessionTodoList, "click", onSessionTodoListClick);
  listen(sessionTodoList, "change", onSessionTodoListChange);
  if (reviewFocusedBtn) {
    reviewFocusedBtn.addEventListener("click", () => {
      submitSessionReview("focused");
    });
  }
  if (reviewDistractedBtn) {
    reviewDistractedBtn.addEventListener("click", () => {
      submitSessionReview("distracted");
    });
  }
  if (reviewSkipBtn) {
    reviewSkipBtn.addEventListener("click", () => {
      closeSessionReviewPrompt();
    });
  }
  listen(keepSessionBtn, "click", closeCancelSessionModal);
  listen(confirmCancelSessionBtn, "click", confirmCancelSession);
  if (keepFocusBtn) {
    keepFocusBtn.addEventListener("click", () => {
      closeFocusExitModal();
      focusExitPendingAction = null;
    });
  }
  if (breakGlassBtn) {
    breakGlassBtn.addEventListener("click", () => {
      const pendingAction = focusExitPendingAction;
      focusExitPendingAction = null;
      if (isStudyBlockRunning()) {
        pauseTimer();
      }
      clearFocusCommitState();
      showToastMessage("Lock-in commitment ended with break-glass exit.");
      executeFocusExitAction(pendingAction);
    });
  }
  listen(cancelSessionModal, "click", (event) => {
    if (event.target === cancelSessionModal) {
      closeCancelSessionModal();
    }
  });
  if (focusExitModal) {
    focusExitModal.addEventListener("click", (event) => {
      if (event.target === focusExitModal) {
        closeFocusExitModal();
        focusExitPendingAction = null;
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cancelSessionModal.classList.contains("hidden")) {
      closeCancelSessionModal();
      return;
    }

    if (event.key === "Escape" && focusExitModal && !focusExitModal.classList.contains("hidden")) {
      closeFocusExitModal();
      focusExitPendingAction = null;
    }
  });

  document.addEventListener("visibilitychange", handleVisibilityFocusMode);
  window.addEventListener("beforeunload", handleBeforeUnloadFocusMode);
}

function switchSection(sectionName, options = {}) {
  const bypassFocusLock = Boolean(options.bypassFocusLock);
  if (!hasAppAccess()) {
    showAuthScreen("Sign in to continue, or use guest mode.");
    return;
  }

  if (sectionName === "analytics" && !canUseAnalyticsFeatures()) {
    showToastMessage("Analytics and achievements are available after sign in.");
    return;
  }

  if (!bypassFocusLock && sectionName !== "study" && maybePromptFocusCommitExit({ type: "switch-section", sectionName })) {
    return;
  }

  if (!bypassFocusLock && sectionName !== "study" && isCompleteFocusLockActive()) {
    showToastMessage("Complete focus is active. Pause the study timer or use break-glass to leave.");
    return;
  }

  authSection.classList.add("hidden");
  homeSection.classList.add("hidden");
  currentView = sectionName;

  Object.entries(sections).forEach(([key, section]) => {
    section.classList.toggle("hidden", key !== sectionName);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionName);
  });

  if (sectionName === "analytics") {
    renderAnalytics();
    void refreshAnalyticsFromCloud("view");
  } else if (sectionName === "settings") {
    activateSettingsQuickNav("settingsGeneralAnchor");
    sections.settings.scrollTop = 0;
  } else if (sectionName === "favourites") {
    renderFavourites();
  }

  updateMiniTimerWidget();
  renderSyncStatus();
}

function showHomeView(options = {}) {
  const bypassFocusLock = Boolean(options.bypassFocusLock);
  if (!hasAppAccess()) {
    showAuthScreen("Sign in to continue, or use guest mode.");
    return;
  }

  if (!bypassFocusLock && maybePromptFocusCommitExit({ type: "go-home" })) {
    return;
  }

  if (!bypassFocusLock && isCompleteFocusLockActive()) {
    showToastMessage("Complete focus is active. Pause the study timer or use break-glass to go home.");
    return;
  }

  currentView = "home";
  authSection.classList.add("hidden");
  homeSection.classList.remove("hidden");

  Object.values(sections).forEach((section) => {
    section.classList.add("hidden");
  });

  navButtons.forEach((button) => {
    button.classList.remove("active");
  });

  updateHomeTypeEffect(options.forceStopTypeEffect === true);
  // Re-check daily scripture whenever home opens; cached result prevents extra work.
  loadScriptureOfTheDay();
  updateMiniTimerWidget();
  updateAuthUi();
  renderSyncStatus();
}

function updateHomeTypeEffect(forceStop) {
  if (!homeTitle) {
    return;
  }

  if (forceStop || homeTypeEffectLocked) {
    lockHomeTypeEffect();
    return;
  }

  if (homeTypeEffectTimeoutId) {
    return;
  }

  homeTypeEffectTimeoutId = window.setTimeout(() => {
    lockHomeTypeEffect();
  }, 2800);
}

function lockHomeTypeEffect() {
  if (!homeTitle) {
    return;
  }

  homeTitle.classList.add("type-title-static");
  homeTypeEffectLocked = true;

  if (homeTypeEffectTimeoutId) {
    window.clearTimeout(homeTypeEffectTimeoutId);
    homeTypeEffectTimeoutId = null;
  }
}

function setStudyTheme(theme) {
  if (!THEME_REFERENCE_MAP[theme]) {
    return;
  }

  selectedStudyTheme = theme;
  themePills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.studyTheme === theme);
  });

  homeThemeBadge.textContent = theme;
  scheduleUserDocSync("study-theme");
}
