/*
Sanctuary Study
Single-file JS app logic for:
- Themed scripture focus sessions
- Study/break timer cycle
- Analytics, streaks, tags, and goals
- Focus mode (partial + complete)
- Session notes and task list
- Favourites persistence
- Alarm sounds (local + API + custom)
- YouTube iframe API background music dock
*/

const STUDY_LOG_KEY = "sanctuaryStudyLogV1";
const TAG_LOG_KEY = "sanctuaryTagLogV1";
const SETTINGS_KEY = "sanctuaryStudySettingsV1";
const FAVOURITES_KEY = "sanctuaryFavouritesV1";
const DAILY_SCRIPTURE_CACHE_KEY = "sanctuaryDailyScriptureV1";
const DAILY_SCRIPTURE_HISTORY_KEY = "sanctuaryDailyScriptureHistoryV1";
const SESSION_NOTES_KEY = "sanctuarySessionNotesV1";
const ACHIEVEMENTS_KEY = "sanctuaryAchievementsV1";
const GUEST_MODE_KEY = "sanctuaryGuestModeV1";

const GRAPH_DAYS = 60;
const POPUP_SECONDS = 5;
const TOAST_SHOW_MS = 4200;
const SCRIPTURE_HISTORY_LIMIT = 14;

const BIBLE_API_BASE_URL = "https://bible-api.com/";
const COMMONS_API_BASE_URL = "https://commons.wikimedia.org/w/api.php";
const COMMONS_ALARM_CATEGORY = "Category:Sounds_of_alarm_clocks";

const LOCAL_ALARM_URLS = {
  mixkit_chime: "sounds/mixkit-alert-quick-chime-766.wav",
  mixkit_facility: "sounds/mixkit-facility-alarm-908.wav",
  mixkit_spaceship: "sounds/mixkit-spaceship-alarm-998.wav",
  mixkit_waiting: "sounds/mixkit-waiting-ringtone-1354.wav"
};

const DOWNLOADED_LOFI_TRACKS = [
  { id: "kyoto", title: "Kyoto", artist: "Another Kid & Pratzapp", url: "music/kyoto.mp3" },
  { id: "coming_of_age", title: "Coming Of Age", artist: "Hazelwood", url: "music/coming-of-age.mp3" },
  { id: "jay", title: "Jay", artist: "Lukrembo", url: "music/jay.mp3" },
  { id: "honey_jam", title: "Honey Jam", artist: "massobeats", url: "music/honey-jam.mp3" },
  { id: "love_in_japan", title: "Love in Japan", artist: "Milky Wayvers", url: "music/love-in-japan.mp3" },
  { id: "warm_cup_of_coffee", title: "Warm Cup of Coffee", artist: "Moavii", url: "music/warm-cup-of-coffee.mp3" },
  { id: "meticulous", title: "Meticulous", artist: "Pufino", url: "music/meticulous.mp3" }
];

const BUILTIN_MUSIC_PRESETS = [
  { id: "downloaded_shuffle", title: "Downloaded Lofi Pack (Shuffle)", artist: "Local", mode: "playlist", tracks: DOWNLOADED_LOFI_TRACKS },
  ...DOWNLOADED_LOFI_TRACKS.map((track) => ({
    id: `track_${track.id}`,
    title: track.title,
    artist: track.artist,
    mode: "single",
    url: track.url
  }))
];

const THEME_REFERENCE_MAP = {
  Perseverance: ["Galatians 6:9", "James 1:12", "Hebrews 12:1"],
  Peace: ["John 14:27", "Isaiah 26:3", "Philippians 4:6-7"],
  Wisdom: ["James 1:5", "Proverbs 2:6", "Proverbs 3:5-6"],
  Gratitude: ["1 Thessalonians 5:18", "Colossians 3:17", "Psalm 118:24"]
};

const DAILY_SCRIPTURE_REFERENCES = [
  "Psalm 119:105",
  "Matthew 6:33",
  "Proverbs 3:5-6",
  "Isaiah 40:31",
  "Philippians 4:13",
  "James 1:5",
  "Romans 12:12",
  "Colossians 3:23",
  "Joshua 1:9",
  "Psalm 23:1",
  "1 Peter 5:7",
  "Galatians 6:9",
  "Hebrews 10:23",
  "Psalm 27:1",
  "John 14:27",
  "Romans 8:28",
  "1 Thessalonians 5:18",
  "Psalm 46:1",
  "Micah 6:8",
  "2 Timothy 1:7",
  "Lamentations 3:22-23",
  "Proverbs 16:3",
  "Philippians 4:6-7",
  "Psalm 34:8",
  "Matthew 11:28",
  "Romans 15:13",
  "Hebrews 11:1",
  "Psalm 37:5",
  "Ephesians 2:10",
  "Psalm 90:12"
];

// Used when bible-api is unavailable so scripture-of-the-day still rotates.
const DAILY_SCRIPTURE_FALLBACK_VERSES = [
  { reference: "Psalm 119:105", text: "Your word is a lamp to my feet and a light to my path." },
  { reference: "Isaiah 40:31", text: "Those who hope in the Lord will renew their strength." },
  { reference: "Joshua 1:9", text: "Be strong and courageous. Do not be afraid; the Lord your God is with you." },
  { reference: "Colossians 3:23", text: "Whatever you do, work at it with all your heart, as working for the Lord." },
  { reference: "Romans 12:12", text: "Be joyful in hope, patient in affliction, faithful in prayer." },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and He will make your paths straight." },
  { reference: "Matthew 11:28", text: "Come to me, all you who are weary and burdened, and I will give you rest." },
  { reference: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, pray with thanksgiving." }
];

const THEME_FALLBACK_VERSES = {
  Perseverance: {
    text: "Let us not grow weary in doing good, for in due season we will reap, if we do not give up.",
    reference: "Galatians 6:9"
  },
  Peace: {
    text: "Peace I leave with you; my peace I give to you. Let not your hearts be troubled.",
    reference: "John 14:27"
  },
  Wisdom: {
    text: "If any of you lacks wisdom, let him ask God, who gives generously to all.",
    reference: "James 1:5"
  },
  Gratitude: {
    text: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
    reference: "1 Thessalonians 5:18"
  }
};

// Streak achievements are unlocked as consistency grows.
const STREAK_ACHIEVEMENTS = [
  {
    id: "streak_1",
    days: 1,
    title: "First Step",
    message: "You started your study rhythm. 'He who began a good work in you...' (Philippians 1:6)."
  },
  {
    id: "streak_3",
    days: 3,
    title: "Rooted Start",
    message: "Three steady days. Keep your heart set and your work faithful."
  },
  {
    id: "streak_5",
    days: 5,
    title: "Faithful Five",
    message: "Five days of consistency. Keep showing up with patience and peace."
  },
  {
    id: "streak_10",
    days: 10,
    title: "Ten-Day Builder",
    message: "Ten days strong. Perseverance is shaping your study life."
  },
  {
    id: "streak_15",
    days: 15,
    title: "Quiet Strength",
    message: "Fifteen days in a row. Stay steady and keep your mind fixed on what is good."
  },
  {
    id: "streak_25",
    days: 25,
    title: "Steady Heart",
    message: "Twenty-five faithful days. Your consistency is becoming a witness of discipline."
  },
  {
    id: "streak_45",
    days: 45,
    title: "Enduring Runner",
    message: "Forty-five days of endurance. Keep running with perseverance the race before you."
  },
  {
    id: "streak_60",
    days: 60,
    title: "Firm Foundation",
    message: "Sixty days complete. Your rhythm is strong; keep building wisely."
  },
  {
    id: "streak_75",
    days: 75,
    title: "Faithful Rhythm",
    message: "Seventy-five days of faithful effort. Grace and discipline are working together."
  },
  {
    id: "streak_90",
    days: 90,
    title: "Well Done, Good and Faithful",
    message: "Ninety days of consistency. Keep serving with a steady and willing heart."
  }
];

const defaultSettings = {
  studyMinutes: 25,
  breakMinutes: 5,
  dailyGoalMinutes: 60,
  theme: "light",
  focusMode: "partial",
  alarmMode: "mixkit_chime",
  customAlarmUrl: "",
  youtubeMusicUrl: "",
  musicPresetId: "downloaded_shuffle"
};

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
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");
const themeToggleText = document.getElementById("themeToggleText");
const authActionBtn = document.getElementById("authActionBtn");
const authActionText = document.getElementById("authActionText");

const authSection = document.getElementById("authSection");
const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("authEmailInput");
const authPasswordInput = document.getElementById("authPasswordInput");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authGuestBtn = document.getElementById("authGuestBtn");
const authMessage = document.getElementById("authMessage");
const authModeNotice = document.getElementById("authModeNotice");

const homeBeginBtn = document.getElementById("homeBeginBtn");
const homeSettingsBtn = document.getElementById("homeSettingsBtn");
const homeThemeBadge = document.getElementById("homeThemeBadge");
const homeTitle = document.querySelector(".type-title");
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
const chartSummaryEl = document.getElementById("chartSummary");
const studyGraphEl = document.getElementById("studyGraph");
const tagSummaryEl = document.getElementById("tagSummary");
const tagBreakdownListEl = document.getElementById("tagBreakdownList");
const achievementSummaryEl = document.getElementById("achievementSummary");
const achievementsGridEl = document.getElementById("achievementsGrid");

const settingsForm = document.getElementById("settingsForm");
const studyMinutesSetting = document.getElementById("studyMinutesSetting");
const breakMinutesSetting = document.getElementById("breakMinutesSetting");
const dailyGoalMinutesSetting = document.getElementById("dailyGoalMinutesSetting");
const themeSetting = document.getElementById("themeSetting");
const focusModeSetting = document.getElementById("focusModeSetting");
const alarmModeSetting = document.getElementById("alarmModeSetting");
const customAlarmRow = document.getElementById("customAlarmRow");
const customAlarmUrlSetting = document.getElementById("customAlarmUrlSetting");
const youtubeMusicUrlSetting = document.getElementById("youtubeMusicUrlSetting");
const lofiPresetSelect = document.getElementById("lofiPresetSelect");
const localMusicFileInput = document.getElementById("localMusicFileInput");
const testAlarmBtn = document.getElementById("testAlarmBtn");
const loadMusicBtn = document.getElementById("loadMusicBtn");
const playMusicBtn = document.getElementById("playMusic");
const stopMusicBtn = document.getElementById("stopMusicBtn");
const settingsMessage = document.getElementById("settingsMessage");
const accountSettingsCard = document.getElementById("accountSettingsCard");
const accountSettingsStatus = document.getElementById("accountSettingsStatus");
const settingsSignOutBtn = document.getElementById("settingsSignOutBtn");
const settingsDeleteAccountBtn = document.getElementById("settingsDeleteAccountBtn");

const favouritesList = document.getElementById("favouritesList");
const motivationToast = document.getElementById("motivationToast");
const achievementToast = document.getElementById("achievementToast");
const achievementToastMedal = document.getElementById("achievementToastMedal");
const achievementToastTitle = document.getElementById("achievementToastTitle");
const achievementToastMessage = document.getElementById("achievementToastMessage");
const cancelSessionModal = document.getElementById("cancelSessionModal");
const cancelSessionMessage = document.getElementById("cancelSessionMessage");
const keepSessionBtn = document.getElementById("keepSessionBtn");
const confirmCancelSessionBtn = document.getElementById("confirmCancelSessionBtn");
const MUSIC_DOCK_POSITION_KEY = "sanctuaryMusicDockPositionV1";

const miniTimerWidget = document.getElementById("miniTimerWidget");
const miniTimerPhase = document.getElementById("miniTimerPhase");
const miniTimerTime = document.getElementById("miniTimerTime");
const miniTimerGoBtn = document.getElementById("miniTimerGoBtn");

const musicDock = document.getElementById("musicDock");
const musicDockHead = musicDock.querySelector(".music-dock-head");
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
  activeBlockSeconds: settings.studyMinutes * 60
};

init();

function init() {
  if (!settings.musicPresetId && !settings.youtubeMusicUrl) {
    settings.musicPresetId = defaultSettings.musicPresetId;
    saveSettings(settings);
  }

  applyTheme(settings.theme);
  populateLofiPresetSelect();
  fillSettingsForm();
  wireEvents();
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
  preloadCommonsAlarmIfNeeded();
  updateMiniTimerWidget();
  initializeYouTubeApiBridge();
  initializeMusicDockDragging();
  initializeMusicDock();
  syncMusicPlayPauseButton();
  renderSessionNotes();
  loadScriptureOfTheDay();
  initializeAuthenticationFlow();
}

function hasAppAccess() {
  return authMode === "guest" || authMode === "user";
}

function canUseAnalyticsFeatures() {
  return authMode === "user";
}

function loadGuestModePreference() {
  return localStorage.getItem(GUEST_MODE_KEY) === "true";
}

function saveGuestModePreference(enabled) {
  if (enabled) {
    localStorage.setItem(GUEST_MODE_KEY, "true");
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
  syncFocusModeAfterTimerStateChange();
  clearInterval(popupIntervalId);
  popupIntervalId = null;
  versePopup.classList.add("hidden");
  document.body.classList.remove("popup-open");
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
      renderAnalytics();
      updateAuthUi();
      return;
    }

    if (mode === "signed_out") {
      currentUser = null;
      if (loadGuestModePreference()) {
        authMode = "guest";
        authSection.classList.add("hidden");
        setAuthMessage("");
        showHomeView({ forceStopTypeEffect: true });
        renderAnalytics();
        updateAuthUi();
        return;
      }

      showAuthScreen("Sign in with email and password, or continue as guest.");
      renderAnalytics();
      updateAuthUi();
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
    renderAnalytics();
    updateAuthUi();
    return;
  }

  showAuthScreen("Sign in with email and password, or continue as guest.");
  renderAnalytics();
  updateAuthUi();
}

function enterGuestMode() {
  authMode = "guest";
  currentUser = null;
  saveGuestModePreference(true);
  authSection.classList.add("hidden");
  setAuthMessage("");
  showHomeView({ forceStopTypeEffect: true });
  renderAnalytics();
  updateAuthUi();
  showToastMessage("Guest mode active. Sign in any time to unlock analytics and achievements.");
}

function requestAuthSignOut() {
  try {
    window.dispatchEvent(new CustomEvent("sanctuary:request-signout"));
  } catch (error) {
    // No-op when auth module is unavailable.
  }

  currentUser = null;
  showAuthScreen("You are signed out. Sign in again or continue as guest.");
  updateAuthUi();
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

function wireEvents() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchSection(button.dataset.section);
    });
  });

  homeNavBtn.addEventListener("click", () => {
    showHomeView({ forceStopTypeEffect: true });
  });
  authActionBtn.addEventListener("click", () => {
    handleAuthActionClick();
  });
  themeToggleBtn.addEventListener("click", toggleThemeFromTopBar);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      loadScriptureOfTheDay();
    }
  });

  authGuestBtn.addEventListener("click", () => {
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

  homeBeginBtn.addEventListener("click", beginStudyExperience);
  homeSettingsBtn.addEventListener("click", () => switchSection("settings"));
  homeSaveVerseBtn.addEventListener("click", saveCurrentFocusToFavourites);

  prepBeginBtn.addEventListener("click", beginStudyExperience);
  prepSettingsBtn.addEventListener("click", () => switchSection("settings"));
  studySaveVerseBtn.addEventListener("click", saveCurrentFocusToFavourites);

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

  applyCustomPresetBtn.addEventListener("click", () => {
    applyCustomPreset();
  });

  sessionTagSelect.addEventListener("change", () => {
    customTagRow.classList.toggle("hidden", sessionTagSelect.value !== "Custom");
    updateSessionTagBadge();
  });

  customTagInput.addEventListener("input", () => {
    updateSessionTagBadge();
  });

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);
  cancelSessionBtn.addEventListener("click", openCancelSessionModal);

  settingsForm.addEventListener("submit", onSettingsSubmit);
  themeSetting.addEventListener("change", () => {
    applyTheme(themeSetting.value);
  });
  focusModeSetting.addEventListener("change", () => {
    if (focusModeSetting.value === "complete") {
      showToastMessage("Complete focus is strict: timer pauses if you leave the tab.");
    }
  });
  alarmModeSetting.addEventListener("change", onAlarmModeFieldChange);
  testAlarmBtn.addEventListener("click", () => {
    playAlarmSound();
  });
  // Prepare only: this does not call play(), so browser autoplay rules are respected.
  loadMusicBtn.addEventListener("click", () => {
    loadBackgroundMusicFromSettings();
  });
  // Only this explicit user gesture starts music playback.
  playMusicBtn.addEventListener("click", () => {
    playBackgroundMusicFromUserGesture();
  });
  stopMusicBtn.addEventListener("click", () => {
    stopBackgroundMusic();
  });
  lofiPresetSelect.addEventListener("change", () => {
    if (lofiPresetSelect.value) {
      localMusicFileInput.value = "";
      const preset = getLofiPresetById(lofiPresetSelect.value);
      if (preset) {
        youtubeMusicUrlSetting.value = preset.url || "";
      }
    }
  });
  localMusicFileInput.addEventListener("change", () => {
    if (localMusicFileInput.files && localMusicFileInput.files.length > 0) {
      lofiPresetSelect.value = "";
    }
  });

  miniTimerGoBtn.addEventListener("click", () => {
    switchSection("study");
  });
  musicDockMinBtn.addEventListener("click", () => {
    setMusicDockMinimized(!musicDockMinimized);
  });
  musicDockPlayPauseBtn.addEventListener("click", () => {
    toggleDockMusicPlayback();
  });
  musicDockCloseBtn.addEventListener("click", () => {
    stopBackgroundMusic();
  });
  musicOpenExternalBtn.addEventListener("click", () => {
    const opened = openBackgroundMusicExternally();
    if (opened) {
      showToastMessage("Opened music source in a separate window.");
    }
  });
  bgAudio.addEventListener("error", () => {
    showToastMessage("This audio source could not be played. Try another preset or a downloaded file.");
    musicDockLabel.textContent = "Audio source failed to load.";
  });
  bgAudio.addEventListener("ended", () => {
    playNextDownloadedTrack();
  });
  bgAudio.addEventListener("play", () => {
    activeAudioSourceType = "audio";
    syncMusicPlayPauseButton();
  });
  bgAudio.addEventListener("pause", () => {
    syncMusicPlayPauseButton();
  });

  favouritesList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-favourite-btn");
    if (!deleteButton) {
      return;
    }

    deleteFavouriteItem(deleteButton.dataset.id);
    renderFavourites();
    showToastMessage("Removed from Sanctuary.");
  });

  sessionNotesInput.addEventListener("input", () => {
    sessionNotesState.text = sessionNotesInput.value;
    saveSessionNotesState(sessionNotesState);
  });
  addSessionTodoBtn.addEventListener("click", addSessionTodoItem);
  sessionTodoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSessionTodoItem();
    }
  });
  clearSessionNotesBtn.addEventListener("click", clearSessionNotes);
  sessionTodoList.addEventListener("click", onSessionTodoListClick);
  sessionTodoList.addEventListener("change", onSessionTodoListChange);
  keepSessionBtn.addEventListener("click", closeCancelSessionModal);
  confirmCancelSessionBtn.addEventListener("click", confirmCancelSession);
  cancelSessionModal.addEventListener("click", (event) => {
    if (event.target === cancelSessionModal) {
      closeCancelSessionModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cancelSessionModal.classList.contains("hidden")) {
      closeCancelSessionModal();
    }
  });

  document.addEventListener("visibilitychange", handleVisibilityFocusMode);
  window.addEventListener("beforeunload", handleBeforeUnloadFocusMode);
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

function switchSection(sectionName) {
  if (!hasAppAccess()) {
    showAuthScreen("Sign in to continue, or use guest mode.");
    return;
  }

  if (sectionName === "analytics" && !canUseAnalyticsFeatures()) {
    showToastMessage("Analytics and achievements are available after sign in.");
    return;
  }

  if (sectionName !== "study" && isCompleteFocusLockActive()) {
    showToastMessage("Complete focus is active. Pause the study timer before leaving this section.");
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
  } else if (sectionName === "favourites") {
    renderFavourites();
  }

  updateMiniTimerWidget();
}

function showHomeView(options = {}) {
  if (!hasAppAccess()) {
    showAuthScreen("Sign in to continue, or use guest mode.");
    return;
  }

  if (isCompleteFocusLockActive()) {
    showToastMessage("Complete focus is active. Pause the study timer before going home.");
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
  }

  timerState.running = true;
  syncFocusModeAfterTimerStateChange();
  updateTimerButtons();
  updateSessionStatus();

  timerState.intervalId = setInterval(() => {
    timerState.remainingSeconds -= 1;
    updateTimerDisplay();

    if (timerState.remainingSeconds <= 0) {
      onBlockComplete();
    }
  }, 1000);
}

function pauseTimer() {
  stopTimerInterval();
  timerState.running = false;
  syncFocusModeAfterTimerStateChange();
  updateTimerButtons();
  updateSessionStatus();
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
}

function openCancelSessionModal() {
  if (studySession.classList.contains("hidden")) {
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

function cancelCurrentSession() {
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

  timerState.phase = "study";
  setUpBlock("study");
  updatePhaseBadge();
  updateTimerDisplay();
  updateTimerButtons();
  updateSessionStatus();

  studySession.classList.add("hidden");
  studyPrep.classList.remove("hidden");
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
      renderAnalytics();
      showMotivationToast(getMotivationalMessage(context));
      if (unlockedAchievement) {
        showAchievementToast(unlockedAchievement);
      }
    } else {
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

function recordCompletedStudyBlock(blockMinutes, tag) {
  const previousLog = loadStudyLog();
  const updatedLog = { ...previousLog };
  const todayKey = getDateKey(new Date());

  const previousTodayMinutes = Number(updatedLog[todayKey] || 0);
  const totalTodayMinutes = Number((previousTodayMinutes + blockMinutes).toFixed(2));
  updatedLog[todayKey] = totalTodayMinutes;
  saveStudyLog(updatedLog);

  // Update per-tag study minutes for weekly analytics.
  const tagLog = loadTagLog();
  const todayTags = { ...(tagLog[todayKey] || {}) };
  todayTags[tag] = Number((Number(todayTags[tag] || 0) + blockMinutes).toFixed(2));
  tagLog[todayKey] = todayTags;
  saveTagLog(tagLog);

  const currentStreak = calculateStreak(updatedLog);
  const previousBestStreak = calculateBestStreak(previousLog);
  const bestStreakAfterUpdate = calculateBestStreak(updatedLog);
  const goal = settings.dailyGoalMinutes;

  return {
    blockMinutes: Math.round(blockMinutes),
    totalTodayMinutes: Math.round(totalTodayMinutes),
    currentStreak,
    dailyGoalMinutes: goal,
    reachedGoalNow: previousTodayMinutes < goal && totalTodayMinutes >= goal,
    extendedDailyGoal: previousTodayMinutes >= goal && totalTodayMinutes > previousTodayMinutes,
    extendedBestStreak: bestStreakAfterUpdate > previousBestStreak && currentStreak === bestStreakAfterUpdate
  };
}

function getMotivationalMessage(context) {
  if (context.extendedBestStreak && context.reachedGoalNow) {
    return `Great perseverance today. You reached your ${context.dailyGoalMinutes}-minute goal and started a new best ${context.currentStreak}-day streak.`;
  }

  if (context.extendedBestStreak) {
    return `Beautiful consistency. You just set a new best streak of ${context.currentStreak} days; keep showing up faithfully.`;
  }

  if (context.reachedGoalNow) {
    return `Daily goal reached at ${context.totalTodayMinutes} minutes. Keep persevering with calm focus; your work matters.`;
  }

  if (context.extendedDailyGoal) {
    return `You are beyond your daily goal now at ${context.totalTodayMinutes} minutes. Keep going with steady grace.`;
  }

  return `You completed ${context.blockMinutes} minutes and now have ${context.totalTodayMinutes} minutes today. Keep going; one faithful block at a time.`;
}

function showMotivationToast(message) {
  showToastMessage(message);
}

function showAchievementToast(achievement) {
  clearTimeout(achievementToastTimeoutId);
  clearTimeout(achievementToastCleanupId);

  achievementToastMedal.textContent = achievement.days;
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
        resolve();
      } else {
        popupCountdown.textContent = `Starting in ${remaining}s`;
      }
    }, 1000);
  });
}

function renderAnalytics() {
  if (!canUseAnalyticsFeatures()) {
    todayMinutesEl.textContent = "Sign in";
    totalHoursEl.textContent = "Sign in";
    streakDaysEl.textContent = "Sign in";
    studyDaysEl.textContent = "Sign in";
    goalProgressEl.textContent = `Goal: ${settings.dailyGoalMinutes} min`;

    chartSummaryEl.textContent = "Sign in to view your study analytics.";
    studyGraphEl.innerHTML = "";
    const graphLocked = document.createElement("p");
    graphLocked.className = "favourite-empty";
    graphLocked.textContent = "Analytics are unavailable in guest mode.";
    studyGraphEl.appendChild(graphLocked);

    tagSummaryEl.textContent = "Sign in to view weekly tag breakdown.";
    tagBreakdownListEl.innerHTML = "";
    const tagLocked = document.createElement("p");
    tagLocked.className = "favourite-empty";
    tagLocked.textContent = "Tag analytics require an account sign-in.";
    tagBreakdownListEl.appendChild(tagLocked);

    renderAchievements();
    return;
  }

  const log = loadStudyLog();
  const todayKey = getDateKey(new Date());
  const todayMinutes = Number(log[todayKey] || 0);
  const totalMinutes = sumMinutes(log);
  const totalHours = totalMinutes / 60;
  const streak = calculateStreak(log);
  const studyDays = countStudyDays(log);

  todayMinutesEl.textContent = `${Math.round(todayMinutes)} min`;
  totalHoursEl.textContent = `${totalHours.toFixed(1)} hrs`;
  streakDaysEl.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  studyDaysEl.textContent = `${studyDays} day${studyDays === 1 ? "" : "s"}`;
  goalProgressEl.textContent = `${Math.round(todayMinutes)} / ${settings.dailyGoalMinutes} min`;

  renderStudyGraph(log);
  renderWeeklyTagBreakdown(loadTagLog());
  renderAchievements();
}

function renderStudyGraph(log) {
  const graphDays = getRecentDays(GRAPH_DAYS);
  const points = graphDays.map((date) => {
    const key = getDateKey(date);
    return {
      date,
      minutes: Number(log[key] || 0)
    };
  });

  const windowMinutes = points.reduce((sum, point) => sum + point.minutes, 0);
  const activeDays = points.filter((point) => point.minutes > 0).length;
  const maxMinutes = Math.max(1, ...points.map((point) => point.minutes));

  chartSummaryEl.textContent = `${Math.round(windowMinutes)} min (${(windowMinutes / 60).toFixed(1)} hrs) across ${activeDays} active day${activeDays === 1 ? "" : "s"}`;
  studyGraphEl.innerHTML = "";

  points.forEach((point, index) => {
    const col = document.createElement("div");
    col.className = "graph-col";

    const bar = document.createElement("div");
    bar.className = "graph-bar";
    bar.style.height = `${Math.max(2, Math.round((point.minutes / maxMinutes) * 190))}px`;
    bar.title = `${formatDate(point.date)} • ${Math.round(point.minutes)} min`;

    const label = document.createElement("span");
    label.className = "graph-label";
    label.textContent = index % 7 === 0 || index === points.length - 1 ? String(point.date.getDate()) : "";

    col.appendChild(bar);
    col.appendChild(label);
    studyGraphEl.appendChild(col);
  });
}

function renderWeeklyTagBreakdown(tagLog) {
  const past7Days = getRecentDays(7);
  const totalsByTag = {};

  past7Days.forEach((date) => {
    const key = getDateKey(date);
    const dayTags = tagLog[key] || {};
    Object.entries(dayTags).forEach(([tag, minutes]) => {
      totalsByTag[tag] = Number((Number(totalsByTag[tag] || 0) + Number(minutes || 0)).toFixed(2));
    });
  });

  const rows = Object.entries(totalsByTag)
    .map(([tag, minutes]) => ({ tag, minutes: Number(minutes) }))
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  tagBreakdownListEl.innerHTML = "";

  if (!rows.length) {
    tagSummaryEl.textContent = "No tagged study yet this week.";
    const empty = document.createElement("p");
    empty.className = "favourite-empty";
    empty.textContent = "Complete a tagged study block to see weekly tag analytics.";
    tagBreakdownListEl.appendChild(empty);
    return;
  }

  const totalMinutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  tagSummaryEl.textContent = `${Math.round(totalMinutes)} min total this week`;
  const maxMinutes = Math.max(...rows.map((row) => row.minutes));

  rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "tag-row";

    const name = document.createElement("p");
    name.className = "tag-name";
    name.textContent = row.tag;

    const track = document.createElement("div");
    track.className = "tag-bar-track";

    const fill = document.createElement("div");
    fill.className = "tag-bar-fill";
    fill.style.width = `${Math.max(4, Math.round((row.minutes / maxMinutes) * 100))}%`;
    track.appendChild(fill);

    const minutes = document.createElement("p");
    minutes.className = "tag-minutes";
    minutes.textContent = `${Math.round(row.minutes)} min`;

    rowEl.appendChild(name);
    rowEl.appendChild(track);
    rowEl.appendChild(minutes);
    tagBreakdownListEl.appendChild(rowEl);
  });
}

function renderAchievements() {
  const analyticsAvailable = canUseAnalyticsFeatures();
  const unlocked = analyticsAvailable ? loadUnlockedAchievements() : {};
  const unlockedCount = analyticsAvailable
    ? STREAK_ACHIEVEMENTS.filter((achievement) => Boolean(unlocked[achievement.id])).length
    : 0;
  achievementSummaryEl.textContent = analyticsAvailable
    ? `${unlockedCount} / ${STREAK_ACHIEVEMENTS.length} unlocked`
    : "Sign in to unlock achievements";
  achievementsGridEl.innerHTML = "";

  STREAK_ACHIEVEMENTS.forEach((achievement) => {
    const unlockedEntry = analyticsAvailable ? (unlocked[achievement.id] || null) : null;
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.classList.add(unlockedEntry ? "unlocked" : "locked");

    const medal = document.createElement("div");
    medal.className = "achievement-medal";
    medal.textContent = achievement.days;

    const label = document.createElement("p");
    label.className = "achievement-days";
    label.textContent = `${achievement.days} day${achievement.days === 1 ? "" : "s"}`;

    const title = document.createElement("p");
    title.className = "achievement-title";
    title.textContent = achievement.title;

    const message = document.createElement("p");
    message.className = "achievement-message";
    message.textContent = unlockedEntry
      ? achievement.message
      : (analyticsAvailable
        ? "Keep your streak growing to unlock this medal."
        : "Locked in guest mode. Sign in to earn this medal.");

    card.appendChild(medal);
    card.appendChild(label);
    card.appendChild(title);
    card.appendChild(message);
    achievementsGridEl.appendChild(card);
  });
}

function syncAchievementsWithCurrentStreak() {
  if (!canUseAnalyticsFeatures()) {
    return;
  }

  const streak = calculateStreak(loadStudyLog());
  unlockStreakAchievements(streak, false);
}

function unlockStreakAchievements(currentStreak, announceExactMatch) {
  if (!canUseAnalyticsFeatures()) {
    return null;
  }

  const safeStreak = Number(currentStreak || 0);
  if (safeStreak <= 0) {
    return null;
  }

  const unlocked = loadUnlockedAchievements();
  const nowIso = new Date().toISOString();
  let changed = false;
  let achievementToAnnounce = null;

  STREAK_ACHIEVEMENTS.forEach((achievement) => {
    if (safeStreak < achievement.days || unlocked[achievement.id]) {
      return;
    }

    unlocked[achievement.id] = {
      unlockedAt: nowIso,
      days: achievement.days
    };
    changed = true;

    if (announceExactMatch && safeStreak === achievement.days) {
      achievementToAnnounce = achievement;
    }
  });

  if (changed) {
    saveUnlockedAchievements(unlocked);
  }

  return achievementToAnnounce;
}

function loadUnlockedAchievements() {
  const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveUnlockedAchievements(unlocked) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

function sumMinutes(log) {
  return Object.values(log).reduce((sum, value) => sum + Number(value || 0), 0);
}

function countStudyDays(log) {
  return Object.values(log).filter((value) => Number(value || 0) > 0).length;
}

function calculateStreak(log) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = getDateKey(cursor);
    if (Number(log[key] || 0) > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(log) {
  const activeDates = Object.entries(log)
    .filter(([, minutes]) => Number(minutes || 0) > 0)
    .map(([dateKey]) => dateKey)
    .sort();

  if (activeDates.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let i = 1; i < activeDates.length; i += 1) {
    const previousDate = parseDateKey(activeDates[i - 1]);
    const currentDate = parseDateKey(activeDates[i]);
    const dayDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function getRecentDays(count) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  return dates;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function loadStudyLog() {
  const raw = localStorage.getItem(STUDY_LOG_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveStudyLog(log) {
  localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(log));
}

function loadTagLog() {
  const raw = localStorage.getItem(TAG_LOG_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveTagLog(tagLog) {
  localStorage.setItem(TAG_LOG_KEY, JSON.stringify(tagLog));
}

/*
SESSION NOTES MODULE
Stores free-form notes and checklist items for study sessions.
*/
function loadSessionNotesState() {
  const raw = localStorage.getItem(SESSION_NOTES_KEY);
  if (!raw) {
    return { text: "", todos: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    const todos = Array.isArray(parsed.todos)
      ? parsed.todos
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: String(item.id || createLocalId("todo")),
          text: String(item.text || "").trim(),
          done: Boolean(item.done)
        }))
        .filter((item) => item.text.length > 0)
      : [];

    return {
      text: String(parsed.text || ""),
      todos
    };
  } catch (error) {
    return { text: "", todos: [] };
  }
}

function saveSessionNotesState(state) {
  localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(state));
}

function renderSessionNotes() {
  sessionNotesInput.value = sessionNotesState.text;
  renderSessionTodoList();
}

function renderSessionTodoList() {
  sessionTodoList.innerHTML = "";

  if (!sessionNotesState.todos.length) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "No tasks yet. Add a focus task for this session.";
    sessionTodoList.appendChild(empty);
    return;
  }

  sessionNotesState.todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;
    item.dataset.todoId = todo.id;

    const checkbox = document.createElement("input");
    checkbox.className = "todo-check";
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.dataset.todoAction = "toggle";

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "todo-delete-btn";
    removeBtn.dataset.todoAction = "delete";
    removeBtn.textContent = "Delete";

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(removeBtn);
    sessionTodoList.appendChild(item);
  });
}

function addSessionTodoItem() {
  const text = String(sessionTodoInput.value || "").trim();
  if (!text) {
    showToastMessage("Type a task first.");
    return;
  }

  sessionNotesState.todos.unshift({
    id: createLocalId("todo"),
    text,
    done: false
  });
  saveSessionNotesState(sessionNotesState);
  sessionTodoInput.value = "";
  renderSessionTodoList();
}

function onSessionTodoListClick(event) {
  const target = event.target.closest("[data-todo-action='delete']");
  if (!target) {
    return;
  }

  const item = target.closest(".todo-item");
  if (!item) {
    return;
  }

  const todoId = item.dataset.todoId;
  sessionNotesState.todos = sessionNotesState.todos.filter((todo) => todo.id !== todoId);
  saveSessionNotesState(sessionNotesState);
  renderSessionTodoList();
}

function onSessionTodoListChange(event) {
  const checkbox = event.target.closest("[data-todo-action='toggle']");
  if (!checkbox) {
    return;
  }

  const item = checkbox.closest(".todo-item");
  if (!item) {
    return;
  }

  const todo = sessionNotesState.todos.find((entry) => entry.id === item.dataset.todoId);
  if (!todo) {
    return;
  }

  todo.done = checkbox.checked;
  saveSessionNotesState(sessionNotesState);
  renderSessionTodoList();
}

function clearSessionNotes() {
  sessionNotesState = { text: "", todos: [] };
  saveSessionNotesState(sessionNotesState);
  renderSessionNotes();
  showToastMessage("Notes cleared.");
}

/*
FAVOURITES MODULE
Simple helpers to keep localStorage logic clear.
*/
function loadFavourites() {
  const raw = localStorage.getItem(FAVOURITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveFavourites(items) {
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(items));
}

function buildFavouriteKey(verseText, reference) {
  return `${String(reference).trim().toLowerCase()}::${String(verseText).trim().toLowerCase()}`;
}

function saveFavouriteItem(item) {
  const favourites = loadFavourites();
  const favouriteKey = buildFavouriteKey(item.verseText, item.reference);
  const alreadyExists = favourites.some((entry) => entry.key === favouriteKey);

  if (alreadyExists) {
    return { saved: false };
  }

  favourites.unshift({
    id: typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    key: favouriteKey,
    theme: item.theme,
    verseText: item.verseText,
    reference: item.reference,
    encouragement: item.encouragement,
    savedAt: new Date().toISOString()
  });

  saveFavourites(favourites);
  return { saved: true };
}

function deleteFavouriteItem(favouriteId) {
  const favourites = loadFavourites();
  const updated = favourites.filter((item) => item.id !== favouriteId);
  saveFavourites(updated);
}

function saveCurrentFocusToFavourites() {
  if (!currentFocus.text || !currentFocus.reference) {
    showToastMessage("No verse to save yet.");
    return;
  }

  if (currentFocus.reference === "Session Preview") {
    showToastMessage("Start a themed session first, then save that verse.");
    return;
  }

  const result = saveFavouriteItem({
    theme: currentFocus.theme,
    verseText: currentFocus.text,
    reference: currentFocus.reference,
    encouragement: currentFocus.encouragement
  });

  renderFavourites();
  showToastMessage(result.saved ? "Saved to Sanctuary." : "Already saved in Sanctuary.");
}

function renderFavourites() {
  const favourites = loadFavourites();
  favouritesList.innerHTML = "";

  if (!favourites.length) {
    const empty = document.createElement("p");
    empty.className = "favourite-empty";
    empty.textContent = "No saved verses yet. Tap Save on a verse to keep it in your Sanctuary.";
    favouritesList.appendChild(empty);
    return;
  }

  favourites.forEach((item) => {
    const card = document.createElement("article");
    card.className = "favourite-card";

    const topRow = document.createElement("div");
    topRow.className = "favourite-top";

    const themeBadge = document.createElement("p");
    themeBadge.className = "home-theme-badge";
    themeBadge.textContent = item.theme;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-favourite-btn";
    deleteButton.type = "button";
    deleteButton.dataset.id = item.id;
    deleteButton.textContent = "Delete";

    topRow.appendChild(themeBadge);
    topRow.appendChild(deleteButton);

    const verse = document.createElement("blockquote");
    verse.className = "scripture-text";
    verse.textContent = `"${item.verseText}"`;

    const reference = document.createElement("p");
    reference.className = "scripture-ref";
    reference.textContent = item.reference;

    const encouragement = document.createElement("p");
    encouragement.className = "session-encouragement";
    encouragement.textContent = item.encouragement;

    const meta = document.createElement("p");
    meta.className = "favourite-meta";
    const safeSavedAt = typeof item.savedAt === "string" ? item.savedAt : new Date().toISOString();
    meta.textContent = `Saved ${formatDate(parseDateKey(safeSavedAt.slice(0, 10)))}`;

    card.appendChild(topRow);
    card.appendChild(verse);
    card.appendChild(reference);
    card.appendChild(encouragement);
    card.appendChild(meta);
    favouritesList.appendChild(card);
  });
}

async function loadScriptureOfTheDay() {
  const todayKey = getDateKey(new Date());
  const cached = loadDailyScriptureCache();

  if (cached && cached.dateKey === todayKey && cached.verse?.text && cached.verse?.reference) {
    renderDailyScripture(cached.verse);
    return;
  }

  const verse = await pickNewDailyScripture();
  saveDailyScriptureCache({
    dateKey: todayKey,
    verse
  });
  renderDailyScripture(verse);
}

function loadDailyScriptureCache() {
  const raw = localStorage.getItem(DAILY_SCRIPTURE_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function saveDailyScriptureCache(data) {
  localStorage.setItem(DAILY_SCRIPTURE_CACHE_KEY, JSON.stringify(data));
}

function loadDailyScriptureHistory() {
  const raw = localStorage.getItem(DAILY_SCRIPTURE_HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveDailyScriptureHistory(history) {
  localStorage.setItem(DAILY_SCRIPTURE_HISTORY_KEY, JSON.stringify(history.slice(0, SCRIPTURE_HISTORY_LIMIT)));
}

async function pickNewDailyScripture() {
  const history = loadDailyScriptureHistory();
  const recentRefs = new Set(history.map((item) => item.reference));

  let candidates = DAILY_SCRIPTURE_REFERENCES.filter((ref) => !recentRefs.has(ref));
  if (!candidates.length) {
    candidates = [...DAILY_SCRIPTURE_REFERENCES];
  }

  const reference = pickRandom(candidates);

  try {
    const verse = await fetchVerseByReference(reference);
    history.unshift({ reference: verse.reference || reference });
    saveDailyScriptureHistory(history);
    return verse;
  } catch (error) {
    const fallback = pickDailyFallbackVerse(history);
    history.unshift({ reference: fallback.reference });
    saveDailyScriptureHistory(history);
    return fallback;
  }
}

function pickDailyFallbackVerse(history) {
  const recentRefs = new Set(history.map((item) => item.reference));
  let candidates = DAILY_SCRIPTURE_FALLBACK_VERSES.filter((verse) => !recentRefs.has(verse.reference));

  if (!candidates.length) {
    candidates = [...DAILY_SCRIPTURE_FALLBACK_VERSES];
  }

  return pickRandom(candidates);
}

function renderDailyScripture(verse) {
  dailyVerseText.textContent = `"${verse.text}"`;
  dailyVerseRef.textContent = verse.reference;
}

function fillSettingsForm() {
  studyMinutesSetting.value = settings.studyMinutes;
  breakMinutesSetting.value = settings.breakMinutes;
  dailyGoalMinutesSetting.value = settings.dailyGoalMinutes;
  themeSetting.value = settings.theme;
  focusModeSetting.value = settings.focusMode;
  alarmModeSetting.value = settings.alarmMode;
  customAlarmUrlSetting.value = settings.customAlarmUrl;
  youtubeMusicUrlSetting.value = settings.youtubeMusicUrl;
  lofiPresetSelect.value = settings.musicPresetId || "";
  updateCustomAlarmVisibility();
}

function onAlarmModeFieldChange() {
  updateCustomAlarmVisibility();
  if (alarmModeSetting.value === "commons") {
    preloadCommonsAlarmIfNeeded();
  }
}

function updateCustomAlarmVisibility() {
  customAlarmRow.classList.toggle("hidden", alarmModeSetting.value !== "custom");
}

function onSettingsSubmit(event) {
  event.preventDefault();

  settings = {
    studyMinutes: clampMinutes(studyMinutesSetting.value, 1, 240),
    breakMinutes: clampMinutes(breakMinutesSetting.value, 1, 120),
    dailyGoalMinutes: clampMinutes(dailyGoalMinutesSetting.value, 10, 600),
    theme: themeSetting.value === "dark" ? "dark" : "light",
    focusMode: sanitizeFocusMode(focusModeSetting.value),
    alarmMode: sanitizeAlarmMode(alarmModeSetting.value),
    customAlarmUrl: String(customAlarmUrlSetting.value || "").trim(),
    youtubeMusicUrl: String(youtubeMusicUrlSetting.value || "").trim(),
    musicPresetId: sanitizeMusicPresetId(lofiPresetSelect.value)
  };

  saveSettings(settings);
  applyTheme(settings.theme);
  fillSettingsForm();
  applyPresetByMinutes(settings.studyMinutes, settings.breakMinutes);
  updateCustomAlarmVisibility();

  if (!timerState.running) {
    setUpBlock(timerState.phase);
    updateTimerDisplay();
    updateSessionStatus();
  }

  if (settings.alarmMode === "commons") {
    preloadCommonsAlarmIfNeeded();
  }

  syncFocusModeAfterTimerStateChange();
  initializeMusicDock();
  renderAnalytics();
  showSettingsSuccess("Settings saved.");
}

function showSettingsSuccess(message) {
  showSettingsStatus(message, true);
}

function showSettingsError(message) {
  showSettingsStatus(message, false);
}

function showSettingsStatus(message, isSuccess) {
  settingsMessage.textContent = String(message || "");
  settingsMessage.classList.toggle("success", Boolean(isSuccess));
  settingsMessage.classList.toggle("error", !isSuccess);

  if (settingsMessageTimeoutId) {
    window.clearTimeout(settingsMessageTimeoutId);
  }

  settingsMessageTimeoutId = window.setTimeout(() => {
    settingsMessage.textContent = "";
    settingsMessage.classList.remove("success");
    settingsMessage.classList.remove("error");
    settingsMessageTimeoutId = null;
  }, 2600);
}

function sanitizeAlarmMode(value) {
  const validModes = new Set([
    "mixkit_chime",
    "mixkit_facility",
    "mixkit_spaceship",
    "mixkit_waiting",
    "commons",
    "soft",
    "bell",
    "custom"
  ]);
  return validModes.has(value) ? value : defaultSettings.alarmMode;
}

function sanitizeFocusMode(value) {
  const validModes = new Set(["partial", "complete"]);
  return validModes.has(value) ? value : defaultSettings.focusMode;
}

function sanitizeMusicPresetId(value) {
  const presetId = String(value || "");
  return getLofiPresetById(presetId) ? presetId : "";
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { ...defaultSettings };
  }

  try {
    const parsed = JSON.parse(raw);
    const parsedUrl = String(parsed.youtubeMusicUrl || "").trim();
    const parsedPreset = sanitizeMusicPresetId(parsed.musicPresetId);

    return {
      studyMinutes: clampMinutes(parsed.studyMinutes, 1, 240),
      breakMinutes: clampMinutes(parsed.breakMinutes, 1, 120),
      dailyGoalMinutes: clampMinutes(parsed.dailyGoalMinutes || 60, 10, 600),
      theme: parsed.theme === "dark" ? "dark" : "light",
      focusMode: sanitizeFocusMode(parsed.focusMode),
      alarmMode: sanitizeAlarmMode(parsed.alarmMode),
      customAlarmUrl: String(parsed.customAlarmUrl || "").trim(),
      youtubeMusicUrl: parsedUrl,
      musicPresetId: parsedPreset || (parsedUrl ? "" : defaultSettings.musicPresetId)
    };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings(nextSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
}

function applyTheme(theme) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = resolvedTheme;
  if (resolvedTheme === "dark") {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-light");
  } else {
    document.body.classList.add("theme-light");
    document.body.classList.remove("theme-dark");
  }
  themeSetting.value = resolvedTheme;
  updateThemeToggleUi(resolvedTheme);
}

function toggleThemeFromTopBar() {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  settings.theme = nextTheme;
  saveSettings(settings);
  applyTheme(nextTheme);
}

function updateThemeToggleUi(theme) {
  if (theme === "dark") {
    themeToggleText.textContent = "Light Mode";
    themeToggleIcon.innerHTML = `
      <svg viewBox="0 0 24 24" class="icon-svg" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    `;
    return;
  }

  themeToggleText.textContent = "Dark Mode";
  themeToggleIcon.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon-svg" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.41M7.05 16.95l-1.41 1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  `;
}

function clampMinutes(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

async function buildFocusForTheme(theme) {
  const references = THEME_REFERENCE_MAP[theme] || THEME_REFERENCE_MAP.Perseverance;
  const selectedReference = pickRandom(references);

  try {
    const verse = await fetchVerseByReference(selectedReference);
    return {
      theme,
      text: verse.text,
      reference: verse.reference,
      encouragement: getThemeEncouragement(theme)
    };
  } catch (error) {
    const fallback = THEME_FALLBACK_VERSES[theme] || THEME_FALLBACK_VERSES.Perseverance;
    return {
      theme,
      text: fallback.text,
      reference: fallback.reference,
      encouragement: getThemeEncouragement(theme)
    };
  }
}

async function fetchVerseByReference(reference) {
  const response = await fetch(`${BIBLE_API_BASE_URL}${encodeURIComponent(reference)}`);
  if (!response.ok) {
    throw new Error(`Verse API status ${response.status}`);
  }

  const data = await response.json();
  if (!data?.text) {
    throw new Error("Verse API response shape was unexpected");
  }

  return {
    text: normalizeVerseText(data.text),
    reference: data.reference || reference
  };
}

function normalizeVerseText(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

function getThemeEncouragement(theme) {
  const encouragementByTheme = {
    Perseverance: "Keep showing up one block at a time. God can strengthen your focus through steady effort.",
    Peace: "Study with a calm heart and unclenched mind. God’s peace can steady your attention and pace.",
    Wisdom: "Ask God for clarity as you learn. Small moments of focus can grow into deep understanding.",
    Gratitude: "Approach this session with thankfulness. A grateful heart turns ordinary study into meaningful growth."
  };

  return encouragementByTheme[theme] || encouragementByTheme.Perseverance;
}

async function preloadCommonsAlarmIfNeeded() {
  if (settings.alarmMode !== "commons") {
    return;
  }

  try {
    alarmSoundUrl = await loadRandomCommonsAudioUrl();
  } catch (error) {
    alarmSoundUrl = null;
  }
}

async function loadRandomCommonsAudioUrl() {
  const titles = await fetchCommonsFileTitles();
  const shuffled = shuffleCopy(titles);

  for (const title of shuffled) {
    try {
      return await fetchCommonsFileUrl(title);
    } catch (error) {
      // Continue trying until a playable audio file is found.
    }
  }

  throw new Error("Could not find a playable Commons alarm file");
}

async function fetchCommonsFileTitles() {
  const params = new URLSearchParams({
    action: "query",
    list: "categorymembers",
    cmtitle: COMMONS_ALARM_CATEGORY,
    cmtype: "file",
    cmlimit: "50",
    format: "json",
    origin: "*"
  });

  const response = await fetch(`${COMMONS_API_BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Commons category request failed (${response.status})`);
  }

  const data = await response.json();
  const members = data?.query?.categorymembers || [];
  if (!members.length) {
    throw new Error("No files returned by Commons alarm category");
  }

  return members.map((member) => member.title).filter(Boolean);
}

async function fetchCommonsFileUrl(title) {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|mime",
    format: "json",
    origin: "*"
  });

  const response = await fetch(`${COMMONS_API_BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Commons file request failed (${response.status})`);
  }

  const data = await response.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const imageInfo = pages[0]?.imageinfo?.[0];

  if (!imageInfo?.url) {
    throw new Error("Commons file missing URL");
  }

  if (imageInfo.mime && !String(imageInfo.mime).startsWith("audio/")) {
    throw new Error("Commons file was not audio");
  }

  return imageInfo.url;
}

async function playAlarmSound() {
  const localAlarmUrl = LOCAL_ALARM_URLS[settings.alarmMode];
  if (localAlarmUrl) {
    const played = await tryPlayAudioUrl(localAlarmUrl);
    if (played) {
      return;
    }
  }

  if (settings.alarmMode === "soft") {
    playToneSequence([740, 660], 0.28, 0.22, 0.1);
    return;
  }

  if (settings.alarmMode === "bell") {
    playToneSequence([880, 880, 660], 0.2, 0.14, 0.12);
    return;
  }

  if (settings.alarmMode === "custom" && settings.customAlarmUrl) {
    const played = await tryPlayAudioUrl(settings.customAlarmUrl);
    if (played) {
      return;
    }
  }

  if (settings.alarmMode === "commons") {
    if (!alarmSoundUrl) {
      await preloadCommonsAlarmIfNeeded();
    }

    if (alarmSoundUrl) {
      const played = await tryPlayAudioUrl(alarmSoundUrl);
      if (played) {
        return;
      }
    }
  }

  playToneSequence([740, 660], 0.28, 0.22, 0.1);
}

function tryPlayAudioUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 0.35;
    audio.play().then(() => resolve(true)).catch(() => resolve(false));
  });
}

function playToneSequence(frequencies, gapSeconds, noteDuration, volume) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!fallbackAudioContext) {
    fallbackAudioContext = new AudioContextClass();
  }

  const play = () => {
    const start = fallbackAudioContext.currentTime;
    frequencies.forEach((frequency, index) => {
      const noteStart = start + index * gapSeconds;
      const oscillator = fallbackAudioContext.createOscillator();
      const gain = fallbackAudioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

      oscillator.connect(gain);
      gain.connect(fallbackAudioContext.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteDuration);
    });
  };

  if (fallbackAudioContext.state === "suspended") {
    fallbackAudioContext.resume().then(play).catch(() => {
      // Browser blocked generated audio.
    });
    return;
  }

  play();
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
  const clampedLeft = Math.max(8, left);
  const clampedTop = Math.max(8, top);

  musicDock.style.left = `${Math.round(clampedLeft)}px`;
  musicDock.style.top = `${Math.round(clampedTop)}px`;
  musicDock.style.right = "auto";
  musicDock.style.bottom = "auto";
}

function clampMusicDockToViewport() {
  const rect = musicDock.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - rect.height - 8);

  const nextLeft = Math.min(maxLeft, Math.max(8, rect.left));
  const nextTop = Math.min(maxTop, Math.max(8, rect.top));

  setMusicDockPosition(nextLeft, nextTop);
}

function saveMusicDockPosition() {
  if (!musicDock.style.left || !musicDock.style.top) {
    return;
  }

  localStorage.setItem(MUSIC_DOCK_POSITION_KEY, JSON.stringify({
    left: Number.parseFloat(musicDock.style.left),
    top: Number.parseFloat(musicDock.style.top)
  }));
}

function loadMusicDockPosition() {
  const raw = localStorage.getItem(MUSIC_DOCK_POSITION_KEY);
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
  if (!url) {
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
  pendingYouTubeRequest = { videoId, autoplay };
  ensureYouTubeIframeApiLoaded();

  if (!youtubeApiReady) {
    musicDockLabel.textContent = "Loading YouTube player...";
    return;
  }

  if (!youtubePlayer) {
    createYouTubePlayer(videoId, autoplay);
    return;
  }

  playQueuedYouTubeRequest();
}

function createYouTubePlayer(videoId, autoplay) {
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
  if (!pendingYouTubeRequest || !youtubePlayer) {
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
    musicDockLabel.textContent = `${request.autoplay ? "Now playing" : "Ready"}: ${shortenUrl(watchUrl)}`;
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
    musicFrameWrap.classList.add("hidden");
    musicDockLabel.textContent = "This video blocks embedding. Use Open on YouTube.";
    showToastMessage("YouTube blocked this embed for your browser. Use Open on YouTube.");
    return;
  }

  musicDockLabel.textContent = "YouTube player error. Try another link.";
  showToastMessage("YouTube player error. Try a different URL.");
}

function destroyYouTubePlayer() {
  pendingYouTubeRequest = null;
  youtubeCurrentVideoId = null;

  if (!youtubePlayer) {
    musicFrame.innerHTML = "";
    return;
  }

  try {
    youtubePlayer.stopVideo();
    youtubePlayer.destroy();
  } catch (error) {
    // Ignore player teardown errors.
  }

  youtubePlayer = null;
  musicFrame.innerHTML = "";
}

function stopAudioPlayback() {
  try {
    bgAudio.pause();
  } catch (error) {
    // Ignore playback teardown errors.
  }

  bgAudio.removeAttribute("src");
  bgAudio.load();
  audioPlayerWrap.classList.add("hidden");

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
  musicFrameWrap.classList.add("hidden");
  musicDock.classList.add("hidden");
  musicDockLabel.textContent = "";
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
  if (!url) {
    musicOpenExternalBtn.classList.add("hidden");
    musicOpenExternalBtn.dataset.url = "";
    return;
  }

  musicOpenExternalBtn.dataset.url = url;
  musicOpenExternalBtn.textContent = extractYouTubeVideoId(url) ? "Open on YouTube" : "Open Source Link";
  musicOpenExternalBtn.classList.remove("hidden");
}

function openBackgroundMusicExternally(providedUrl, silent = false) {
  const preset = getLofiPresetById(settings.musicPresetId);
  const fallbackUrl = preset
    ? (preset.url || downloadedPlaylistQueue[downloadedPlaylistCursor]?.url || DOWNLOADED_LOFI_TRACKS[0]?.url || "")
    : settings.youtubeMusicUrl;
  const url = providedUrl || musicOpenExternalBtn.dataset.url || fallbackUrl;
  if (!url) {
    if (!silent) {
      showToastMessage("Set a valid music source first.");
    }
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
    musicDock.classList.remove("hidden");
    musicDockLabel.textContent = `Playing externally: ${shortenUrl(url)}`;
    return true;
  }

  if (!silent) {
    showToastMessage("Popup blocked. Allow popups, or use the same link in a new tab.");
  }

  return false;
}

function createLocalId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function shortenUrl(url) {
  return url.length > 48 ? `${url.slice(0, 45)}...` : url;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleCopy(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
