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
const SESSION_HISTORY_KEY = "sanctuarySessionHistoryV1";
const ACHIEVEMENTS_KEY = "sanctuaryAchievementsV1";
const GUEST_MODE_KEY = "sanctuaryGuestModeV1";
const THEME_PREF_KEY = "theme";
const SETTINGS_UPDATED_AT_KEY = "sanctuarySettingsUpdatedAtV1";
const LAST_SYNCED_UID_KEY = "sanctuaryLastAnalyticsUidV1";
const LAST_SUCCESSFUL_SYNC_AT_KEY = "sanctuaryLastSuccessfulSyncAtV1";
const REMINDER_LAST_SENT_KEY = "sanctuaryReminderLastSentV1";
const CLOUD_SYNC_DOC_NAME = "appData";
const CLOUD_SYNC_DEBOUNCE_MS = 900;
const USER_DOC_SYNC_DEBOUNCE_MS = 750;
const USER_DOC_SCHEMA_VERSION = 1;
const AVAILABLE_COLOR_THEMES = ["dark", "light", "dawn", "ocean", "sage"];
const COLOR_THEME_LABELS = {
  dark: "Dark",
  light: "Light",
  dawn: "Dawn",
  ocean: "Ocean",
  sage: "Sage"
};

const GRAPH_DAYS = 60;
const GRAPH_DAYS_TABLET = 42;
const GRAPH_DAYS_MOBILE = 30;
const GRAPH_DAYS_SMALL_MOBILE = 21;
const POPUP_SECONDS = 5;
const TOAST_SHOW_MS = 4200;
const SCRIPTURE_HISTORY_LIMIT = 14;
const CLOUD_HYDRATE_COOLDOWN_MS = 6000;
const REMINDER_CHECK_INTERVAL_MS = 30000;
const LOCAL_PREF_OVERRIDE_GUARD_MS = 90000;

const BIBLE_API_BASE_URL = "https://bible-api.com/";
const COMMONS_API_BASE_URL = "https://commons.wikimedia.org/w/api.php";
const COMMONS_ALARM_CATEGORY = "Category:Sounds_of_alarm_clocks";

const LOCAL_ALARM_URLS = {
  mixkit_chime: "sounds/mixkit-alert-quick-chime-766.wav",
  mixkit_facility: "sounds/mixkit-facility-alarm-908.wav",
  mixkit_spaceship: "sounds/mixkit-spaceship-alarm-998.wav",
  mixkit_waiting: "sounds/mixkit-waiting-ringtone-1354.wav"
};

// Local tracks from FreeToUse lofi collection; keep attribution visible in settings.
const DOWNLOADED_LOFI_TRACKS = [
  {
    id: "kyoto",
    title: "Kyoto",
    artist: "Another Kid & Pratzapp",
    url: "music/kyoto.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Kyoto — Another Kid & Pratzapp (FreeToUse Music)"
  },
  {
    id: "coming_of_age",
    title: "Coming Of Age",
    artist: "Hazelwood",
    url: "music/coming-of-age.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Coming Of Age — Hazelwood (FreeToUse Music)"
  },
  {
    id: "jay",
    title: "Jay",
    artist: "Lukrembo",
    url: "music/jay.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Jay — Lukrembo (FreeToUse Music)"
  },
  {
    id: "honey_jam",
    title: "Honey Jam",
    artist: "massobeats",
    url: "music/honey-jam.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Honey Jam — massobeats (FreeToUse Music)"
  },
  {
    id: "love_in_japan",
    title: "Love in Japan",
    artist: "Milky Wayvers",
    url: "music/love-in-japan.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Love in Japan — Milky Wayvers (FreeToUse Music)"
  },
  {
    id: "warm_cup_of_coffee",
    title: "Warm Cup of Coffee",
    artist: "Moavii",
    url: "music/warm-cup-of-coffee.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Warm Cup of Coffee — Moavii (FreeToUse Music)"
  },
  {
    id: "meticulous",
    title: "Meticulous",
    artist: "Pufino",
    url: "music/meticulous.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Meticulous — Pufino (FreeToUse Music)"
  },
  {
    id: "bread",
    title: "Bread",
    artist: "Lukrembo",
    url: "music/bread.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Bread — Lukrembo (FreeToUse Music)"
  },
  {
    id: "butter",
    title: "Butter",
    artist: "Lukrembo",
    url: "music/butter.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Butter — Lukrembo (FreeToUse Music)"
  },
  {
    id: "donut",
    title: "Donut",
    artist: "Lukrembo",
    url: "music/donut.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Donut — Lukrembo (FreeToUse Music)"
  },
  {
    id: "imagine",
    title: "Imagine",
    artist: "Lukrembo",
    url: "music/imagine.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Imagine — Lukrembo (FreeToUse Music)"
  },
  {
    id: "storybook",
    title: "Storybook",
    artist: "Lukrembo",
    url: "music/storybook.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Storybook — Lukrembo (FreeToUse Music)"
  },
  {
    id: "this_is_for_you",
    title: "This Is For You",
    artist: "Lukrembo",
    url: "music/this-is-for-you.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "This Is For You — Lukrembo (FreeToUse Music)"
  },
  {
    id: "feeling_good",
    title: "Feeling Good",
    artist: "Pufino",
    url: "music/feeling-good.mp3",
    source: "https://freetouse.com/music/category/lofi",
    attribution: "Feeling Good — Pufino (FreeToUse Music)"
  }
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
  },
  {
    id: "streak_120",
    days: 120,
    title: "Long-Haul Faithfulness",
    message: "One hundred and twenty days of steady focus. Keep planting faithfully, one day at a time."
  },
  {
    id: "streak_180",
    days: 180,
    title: "Half-Year of Discipline",
    message: "Six months of consistency. Your rhythm is strong and your perseverance is growing."
  },
  {
    id: "streak_365",
    days: 365,
    title: "Crown of Consistency",
    message: "A full year of faithful study. Keep running with endurance and gratitude."
  }
];

const RARE_ACHIEVEMENTS = [
  {
    id: "rare_deep_work_60",
    title: "Deep Work",
    message: "One full hour in a single block. Quiet endurance builds real momentum.",
    hint: "Complete one study block of at least 60 minutes.",
    label: "Rare Badge",
    medalText: "60",
    tier: "Gold"
  },
  {
    id: "rare_monthly_consistency",
    title: "Steady Month",
    message: "You showed up on 20 days this month. Faithful steps create lasting rhythm.",
    hint: "Study on 20 different days within one calendar month.",
    label: "Rare Badge",
    medalText: "M",
    tier: "Platinum"
  },
  {
    id: "rare_streak_recovery",
    title: "Graceful Comeback",
    message: "You restarted after a gap and rebuilt your streak with perseverance.",
    hint: "After a break of at least 2 days, rebuild to a 3-day streak (with prior best 7+ days).",
    label: "Rare Badge",
    medalText: "R",
    tier: "Gold"
  }
];

const WEEKDAY_PLAN_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_PLAN_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_WEEKLY_PLAN_TARGETS = {
  mon: 60,
  tue: 60,
  wed: 60,
  thu: 60,
  fri: 60,
  sat: 40,
  sun: 40
};

const defaultSettings = {
  studyMinutes: 25,
  breakMinutes: 5,
  dailyGoalMinutes: 60,
  weeklyPlanTargets: { ...DEFAULT_WEEKLY_PLAN_TARGETS },
  remindersEnabled: false,
  reminderTime: "19:00",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  theme: "dark",
  focusMode: "partial",
  focusCommitMinutes: 0,
  blockedSites: [],
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
const themeToggleBtn = document.getElementById("theme-toggle");
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
  activeBlockSeconds: settings.studyMinutes * 60
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

  const savedTheme = localStorage.getItem(THEME_PREF_KEY);
  const initialTheme = resolveThemePreference(savedTheme, settings.theme, defaultSettings.theme);
  setTheme(initialTheme, { fromRemote: true });
  settings.theme = initialTheme;
  localStorage.setItem(THEME_PREF_KEY, initialTheme);
  populateLofiPresetSelect();
  renderMusicAttributionList();
  fillSettingsForm();
  wireEvents();
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
  preloadCommonsAlarmIfNeeded();
  updateMiniTimerWidget();
  initializeYouTubeApiBridge();
  initializeMusicDockDragging();
  initializeMusicDock();
  syncMusicPlayPauseButton();
  renderSessionNotes();
  renderSyncStatus();
  initializeReminderScheduler();
  loadScriptureOfTheDay();
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
  const raw = String(localStorage.getItem(LAST_SUCCESSFUL_SYNC_AT_KEY) || "").trim();
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

  localStorage.setItem(LAST_SUCCESSFUL_SYNC_AT_KEY, safeIso);
}

function loadLastReminderSentDayKey() {
  const raw = String(localStorage.getItem(REMINDER_LAST_SENT_KEY) || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function saveLastReminderSentDayKey(dayKey) {
  const safeDayKey = String(dayKey || "").trim();
  if (!safeDayKey) {
    localStorage.removeItem(REMINDER_LAST_SENT_KEY);
    return;
  }
  localStorage.setItem(REMINDER_LAST_SENT_KEY, safeDayKey);
}

function loadLastLocalSettingsMutationAt() {
  const numeric = Number(localStorage.getItem(SETTINGS_UPDATED_AT_KEY));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function saveLastLocalSettingsMutationAt(timestampMs) {
  const safeTimestamp = Number(timestampMs);
  if (!Number.isFinite(safeTimestamp) || safeTimestamp <= 0) {
    localStorage.removeItem(SETTINGS_UPDATED_AT_KEY);
    return;
  }

  localStorage.setItem(SETTINGS_UPDATED_AT_KEY, String(Math.round(safeTimestamp)));
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

function getAllAchievementDefinitions() {
  return [...STREAK_ACHIEVEMENTS, ...RARE_ACHIEVEMENTS];
}

function getAchievementById(id) {
  return getAllAchievementDefinitions().find((achievement) => achievement.id === id) || null;
}

function getStreakAchievementTier(days) {
  const safeDays = Number(days || 0);
  if (safeDays >= 120) {
    return "Platinum";
  }
  if (safeDays >= 45) {
    return "Gold";
  }
  if (safeDays >= 10) {
    return "Silver";
  }
  return "Bronze";
}

function getAchievementTier(achievement) {
  if (!achievement || typeof achievement !== "object") {
    return "Bronze";
  }
  if (achievement.tier) {
    return String(achievement.tier);
  }
  return getStreakAchievementTier(achievement.days);
}

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

function renderMusicAttributionList() {
  if (!musicAttributionList) {
    return;
  }

  musicAttributionList.innerHTML = "";
  DOWNLOADED_LOFI_TRACKS.forEach((track) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = `${track.title} — ${track.artist}`;

    const attribution = document.createElement("p");
    attribution.className = "music-attribution-line";
    attribution.textContent = `Attribution: ${track.attribution || `${track.title} — ${track.artist} (FreeToUse Music)`}`;

    const source = document.createElement("a");
    source.className = "music-attribution-link";
    source.href = track.source || "https://freetouse.com/music/category/lofi";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Source: FreeToUse Lofi Category";

    item.appendChild(title);
    item.appendChild(attribution);
    item.appendChild(source);
    musicAttributionList.appendChild(item);
  });
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
  closeSessionReviewPrompt();
  clearFocusCommitState();
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
      renderAnalytics();
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
      renderAnalytics();
      updateAuthUi();
      renderSyncStatus();
      void startUserDocRealtimeSync(currentUser.uid);
      void hydrateAnalyticsFromCloud(currentUser.uid).then((hydrated) => {
        if (!hydrated) {
          return;
        }
        lastCloudHydrateAt = Date.now();
        syncAchievementsWithCurrentStreak();
        renderAnalytics();
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
        renderAnalytics();
        updateAuthUi();
        renderSyncStatus();
        return;
      }

      showAuthScreen("Sign in with email and password, or continue as guest.");
      renderAnalytics();
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
    renderAnalytics();
    updateAuthUi();
    renderSyncStatus();
    return;
  }

  showAuthScreen("Sign in with email and password, or continue as guest.");
  renderAnalytics();
  updateAuthUi();
  renderSyncStatus();
}

function resetCloudSyncState() {
  if (cloudSyncTimerId) {
    window.clearTimeout(cloudSyncTimerId);
  }
  if (userDocSyncTimerId) {
    window.clearTimeout(userDocSyncTimerId);
  }
  if (typeof userDocUnsubscribe === "function") {
    try {
      userDocUnsubscribe();
    } catch (error) {
      // Listener may already be detached.
    }
  }
  cloudSyncTimerId = null;
  userDocSyncTimerId = null;
  userDocUnsubscribe = null;
  userDocApplyingRemote = false;
  cloudSyncInFlight = false;
  cloudSyncQueued = false;
  cloudSyncHydrating = false;
  lastCloudHydrateAt = 0;
  syncIndicatorState = "idle";
}

function sanitizeStudyLog(logInput) {
  if (!logInput || typeof logInput !== "object") {
    return {};
  }

  const clean = {};
  Object.entries(logInput).forEach(([dateKey, minutes]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return;
    }
    const value = Number(minutes || 0);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    clean[dateKey] = Number(value.toFixed(2));
  });
  return clean;
}

function sanitizeTagLog(tagLogInput) {
  if (!tagLogInput || typeof tagLogInput !== "object") {
    return {};
  }

  const clean = {};
  Object.entries(tagLogInput).forEach(([dateKey, dayTags]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !dayTags || typeof dayTags !== "object") {
      return;
    }

    const cleanedTags = {};
    Object.entries(dayTags).forEach(([tag, minutes]) => {
      const safeTag = String(tag || "").trim();
      const value = Number(minutes || 0);
      if (!safeTag || !Number.isFinite(value) || value <= 0) {
        return;
      }
      cleanedTags[safeTag] = Number(value.toFixed(2));
    });

    if (Object.keys(cleanedTags).length > 0) {
      clean[dateKey] = cleanedTags;
    }
  });
  return clean;
}

function sanitizeAchievementMap(input) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const allDefinitions = getAllAchievementDefinitions();
  const validIds = new Set(allDefinitions.map((achievement) => achievement.id));
  const clean = {};
  Object.entries(input).forEach(([id, entry]) => {
    if (!validIds.has(id) || !entry || typeof entry !== "object") {
      return;
    }

    const definition = allDefinitions.find((item) => item.id === id) || null;
    const days = Number(entry.days || 0);
    const unlockedAt = String(entry.unlockedAt || "").trim();
    clean[id] = {
      days: Number.isFinite(days) && days > 0 ? days : Number(definition?.days || 0),
      unlockedAt: unlockedAt || new Date().toISOString()
    };
  });
  return clean;
}

function sanitizeSessionHistory(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const byId = new Map();
  input.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const id = String(entry.id || "").trim();
    const timestamp = String(entry.timestamp || "").trim();
    const minutes = Number(entry.minutes || 0);
    const tag = String(entry.tag || "").trim();
    const reviewRaw = String(entry.review || "").trim().toLowerCase();
    const review = reviewRaw === "focused" || reviewRaw === "distracted" ? reviewRaw : "";

    if (!id || !Number.isFinite(Date.parse(timestamp)) || !Number.isFinite(minutes) || minutes <= 0 || !tag) {
      return;
    }

    const previous = byId.get(id);
    if (!previous) {
      byId.set(id, {
        id,
        timestamp: new Date(timestamp).toISOString(),
        minutes: Number(minutes.toFixed(2)),
        tag,
        review
      });
      return;
    }

    // Keep richer entry if duplicate id appears.
    if (!previous.review && review) {
      byId.set(id, {
        ...previous,
        review
      });
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 1200);
}

function mergeStudyLogs(localLog, remoteLog) {
  const local = sanitizeStudyLog(localLog);
  const remote = sanitizeStudyLog(remoteLog);
  const merged = { ...remote };
  Object.entries(local).forEach(([dateKey, minutes]) => {
    merged[dateKey] = Math.max(Number(remote[dateKey] || 0), Number(minutes || 0));
  });
  return sanitizeStudyLog(merged);
}

function mergeTagLogs(localTagLog, remoteTagLog) {
  const local = sanitizeTagLog(localTagLog);
  const remote = sanitizeTagLog(remoteTagLog);
  const merged = { ...remote };

  Object.entries(local).forEach(([dateKey, tags]) => {
    if (!merged[dateKey]) {
      merged[dateKey] = {};
    }

    Object.entries(tags).forEach(([tag, minutes]) => {
      merged[dateKey][tag] = Math.max(
        Number((merged[dateKey] && merged[dateKey][tag]) || 0),
        Number(minutes || 0)
      );
    });
  });

  return sanitizeTagLog(merged);
}

function mergeAchievementMaps(localInput, remoteInput) {
  const local = sanitizeAchievementMap(localInput);
  const remote = sanitizeAchievementMap(remoteInput);
  const merged = { ...remote };

  Object.entries(local).forEach(([id, localEntry]) => {
    if (!merged[id]) {
      merged[id] = localEntry;
      return;
    }

    const remoteDate = Date.parse(String(merged[id].unlockedAt || ""));
    const localDate = Date.parse(String(localEntry.unlockedAt || ""));
    if (Number.isFinite(localDate) && (!Number.isFinite(remoteDate) || localDate < remoteDate)) {
      merged[id] = localEntry;
    }
  });

  return sanitizeAchievementMap(merged);
}

function mergeSessionHistory(localInput, remoteInput) {
  const local = sanitizeSessionHistory(localInput);
  const remote = sanitizeSessionHistory(remoteInput);
  return sanitizeSessionHistory([...remote, ...local]);
}

async function ensureCloudSyncClient() {
  if (cloudSyncReady && cloudSyncDb && cloudSyncApi) {
    return true;
  }

  try {
    const [{ db }, firestoreModule] = await Promise.all([
      import("./firebase.js"),
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js")
    ]);

    cloudSyncDb = db;
    cloudSyncApi = firestoreModule;
    cloudSyncReady = true;
    return true;
  } catch (error) {
    console.warn("Cloud analytics sync is unavailable right now.", error);
    if (canUseAnalyticsFeatures()) {
      setSyncIndicatorState("error");
    }
    return false;
  }
}

function getCloudAnalyticsDocRef(uid) {
  if (!uid || !cloudSyncReady || !cloudSyncDb || !cloudSyncApi) {
    return null;
  }

  return cloudSyncApi.doc(cloudSyncDb, "users", uid, "private", CLOUD_SYNC_DOC_NAME);
}

function buildLocalAnalyticsPayload(allowLocalData = true) {
  if (!allowLocalData) {
    return {
      studyLog: {},
      tagLog: {},
      achievements: {},
      sessionHistory: []
    };
  }

  return {
    studyLog: sanitizeStudyLog(loadStudyLog()),
    tagLog: sanitizeTagLog(loadTagLog()),
    achievements: sanitizeAchievementMap(loadUnlockedAchievements()),
    sessionHistory: sanitizeSessionHistory(loadSessionHistory())
  };
}

function getUserDocRef(uid) {
  if (!uid || !cloudSyncReady || !cloudSyncDb || !cloudSyncApi) {
    return null;
  }

  return cloudSyncApi.doc(cloudSyncDb, "users", uid);
}

function getLastSessionAtFromLog(logInput) {
  const history = sanitizeSessionHistory(loadSessionHistory());
  if (history.length > 0) {
    return history[0].timestamp;
  }

  const log = sanitizeStudyLog(logInput);
  const keys = Object.keys(log)
    .filter((dateKey) => Number(log[dateKey] || 0) > 0)
    .sort();

  if (!keys.length) {
    return null;
  }

  const latest = parseDateKey(keys[keys.length - 1]);
  if (Number.isNaN(latest.getTime())) {
    return null;
  }

  return latest.toISOString();
}

function buildUserDocPayload(reason = "update") {
  const localLog = loadStudyLog();
  const currentTheme = THEME_REFERENCE_MAP[selectedStudyTheme] ? selectedStudyTheme : "Perseverance";
  const safePreferences = {
    studyMinutes: clampMinutes(settings.studyMinutes, 1, 240),
    breakMinutes: clampMinutes(settings.breakMinutes, 1, 120),
    dailyGoalMinutes: clampMinutes(settings.dailyGoalMinutes, 10, 600),
    weeklyPlanTargets: sanitizeWeeklyPlanTargets(settings.weeklyPlanTargets),
    remindersEnabled: Boolean(settings.remindersEnabled),
    reminderTime: sanitizeTimeInput(settings.reminderTime, defaultSettings.reminderTime),
    quietHoursStart: sanitizeTimeInput(settings.quietHoursStart, defaultSettings.quietHoursStart),
    quietHoursEnd: sanitizeTimeInput(settings.quietHoursEnd, defaultSettings.quietHoursEnd),
    theme: sanitizeThemeId(document.body.dataset.theme),
    focusMode: sanitizeFocusMode(settings.focusMode),
    focusCommitMinutes: clampFocusCommitMinutes(settings.focusCommitMinutes),
    blockedSites: sanitizeBlockedSites(settings.blockedSites),
    alarmMode: sanitizeAlarmMode(settings.alarmMode),
    customAlarmUrl: String(settings.customAlarmUrl || "").trim(),
    youtubeMusicUrl: String(settings.youtubeMusicUrl || "").trim(),
    musicPresetId: sanitizeMusicPresetId(settings.musicPresetId)
  };

  return {
    studyTheme: currentTheme,
    preferences: safePreferences,
    preferencesUpdatedAt: lastLocalSettingsMutationAt || Date.now(),
    streakCount: calculateStreak(localLog),
    lastSessionAt: getLastSessionAtFromLog(localLog),
    updatedAt: new Date().toISOString(),
    schemaVersion: USER_DOC_SCHEMA_VERSION,
    source: reason
  };
}

function applyUserDocSnapshot(data) {
  if (!data || typeof data !== "object") {
    return;
  }

  userDocApplyingRemote = true;

  try {
    const remoteTheme = String(data.studyTheme || "").trim();
    if (THEME_REFERENCE_MAP[remoteTheme] && remoteTheme !== selectedStudyTheme) {
      setStudyTheme(remoteTheme);
    }

    const preferences = data.preferences && typeof data.preferences === "object" ? data.preferences : null;
    if (!preferences) {
      return;
    }

    const parsedMusicUrl = String(preferences.youtubeMusicUrl || "").trim();
    const parsedPresetId = sanitizeMusicPresetId(preferences.musicPresetId);
    const remotePreferencesUpdatedAtMs = parseTimestampToMs(data.preferencesUpdatedAt || data.updatedAt);
    const localSettingsRecentlyChanged = lastLocalSettingsMutationAt > 0
      && (Date.now() - lastLocalSettingsMutationAt) < LOCAL_PREF_OVERRIDE_GUARD_MS;
    const remoteLooksOlderThanLocal = Number.isFinite(remotePreferencesUpdatedAtMs)
      && remotePreferencesUpdatedAtMs + 500 < lastLocalSettingsMutationAt;
    const shouldKeepLocalPreferences = localSettingsRecentlyChanged
      && (!Number.isFinite(remotePreferencesUpdatedAtMs) || remoteLooksOlderThanLocal);

    if (shouldKeepLocalPreferences) {
      scheduleUserDocSync("preferences-reconcile");
      return;
    }

    const resolvedRemoteTheme = resolveThemePreference(
      preferences.theme,
      localStorage.getItem(THEME_PREF_KEY),
      settings.theme,
      defaultSettings.theme
    );

    settings = {
      studyMinutes: clampMinutes(preferences.studyMinutes, 1, 240),
      breakMinutes: clampMinutes(preferences.breakMinutes, 1, 120),
      dailyGoalMinutes: clampMinutes(preferences.dailyGoalMinutes, 10, 600),
      weeklyPlanTargets: sanitizeWeeklyPlanTargets(preferences.weeklyPlanTargets),
      remindersEnabled: Boolean(preferences.remindersEnabled),
      reminderTime: sanitizeTimeInput(preferences.reminderTime, defaultSettings.reminderTime),
      quietHoursStart: sanitizeTimeInput(preferences.quietHoursStart, defaultSettings.quietHoursStart),
      quietHoursEnd: sanitizeTimeInput(preferences.quietHoursEnd, defaultSettings.quietHoursEnd),
      theme: resolvedRemoteTheme,
      focusMode: sanitizeFocusMode(preferences.focusMode),
      focusCommitMinutes: clampFocusCommitMinutes(preferences.focusCommitMinutes),
      blockedSites: sanitizeBlockedSites(preferences.blockedSites),
      alarmMode: sanitizeAlarmMode(preferences.alarmMode),
      customAlarmUrl: String(preferences.customAlarmUrl || "").trim(),
      youtubeMusicUrl: parsedMusicUrl,
      musicPresetId: parsedPresetId || (parsedMusicUrl ? "" : defaultSettings.musicPresetId)
    };

    if (!isFocusCommitEnabled()) {
      clearFocusCommitState();
    } else {
      updateFocusLockStatus();
    }

    saveSettings(settings, {
      skipUserDocSync: true,
      skipThemeMutationStamp: true,
      skipLocalMutationStamp: true
    });
    setTheme(settings.theme, { fromRemote: true });
    fillSettingsForm();
    applyPresetByMinutes(settings.studyMinutes, settings.breakMinutes);
    updateCustomAlarmVisibility();
    initializeMusicDock();
    initializeReminderScheduler();
    maybeSendStudyReminder();

    if (!timerState.running) {
      setUpBlock(timerState.phase);
      updateTimerDisplay();
      updateSessionStatus();
    }

    renderAnalytics();
  } finally {
    userDocApplyingRemote = false;
  }
}

async function startUserDocRealtimeSync(uid) {
  if (!uid) {
    return false;
  }

  const ready = await ensureCloudSyncClient();
  if (!ready) {
    return false;
  }

  if (typeof userDocUnsubscribe === "function") {
    try {
      userDocUnsubscribe();
    } catch (error) {
      // Listener may already be detached.
    }
    userDocUnsubscribe = null;
  }

  const userDocRef = getUserDocRef(uid);
  if (!userDocRef) {
    return false;
  }

  try {
    userDocUnsubscribe = cloudSyncApi.onSnapshot(userDocRef, (snapshot) => {
      if (!snapshot.exists()) {
        scheduleUserDocSync("bootstrap");
        return;
      }

      const data = snapshot.data() || {};
      applyUserDocSnapshot(data);
      markSuccessfulSync(String(data.updatedAt || new Date().toISOString()));
    }, (error) => {
      console.warn("User profile sync listener failed.", error);
      setSyncIndicatorState("error");
    });
  } catch (error) {
    console.warn("Could not start user profile listener.", error);
    setSyncIndicatorState("error");
    return false;
  }

  scheduleUserDocSync("login");
  return true;
}

async function pushUserDocToCloud(reason = "manual") {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid || userDocApplyingRemote) {
    return false;
  }

  const ready = await ensureCloudSyncClient();
  if (!ready) {
    return false;
  }

  const userDocRef = getUserDocRef(currentUser.uid);
  if (!userDocRef) {
    return false;
  }

  setSyncIndicatorState("syncing");
  try {
    await cloudSyncApi.setDoc(userDocRef, buildUserDocPayload(reason), { merge: true });
    markSuccessfulSync(new Date().toISOString());
    return true;
  } catch (error) {
    console.warn("Could not save user profile to Firestore.", error);
    setSyncIndicatorState("error");
    return false;
  }
}

function scheduleUserDocSync(reason = "change") {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid || userDocApplyingRemote) {
    return;
  }

  if (userDocSyncTimerId) {
    window.clearTimeout(userDocSyncTimerId);
  }

  userDocSyncTimerId = window.setTimeout(() => {
    userDocSyncTimerId = null;
    void pushUserDocToCloud(reason);
  }, USER_DOC_SYNC_DEBOUNCE_MS);
}

async function hydrateAnalyticsFromCloud(uid) {
  if (!uid || cloudSyncHydrating) {
    return false;
  }

  const ready = await ensureCloudSyncClient();
  if (!ready) {
    return false;
  }

  const docRef = getCloudAnalyticsDocRef(uid);
  if (!docRef) {
    return false;
  }

  setSyncIndicatorState("syncing");
  cloudSyncHydrating = true;
  try {
    const lastUid = String(localStorage.getItem(LAST_SYNCED_UID_KEY) || "").trim();
    const allowLocalMerge = !lastUid || lastUid === uid;
    const localPayload = buildLocalAnalyticsPayload(allowLocalMerge);

    const snapshot = await cloudSyncApi.getDoc(docRef);
    if (!snapshot.exists()) {
      await cloudSyncApi.setDoc(docRef, {
        ...localPayload,
        updatedAt: new Date().toISOString(),
        schemaVersion: 1
      }, { merge: true });
      localStorage.setItem(LAST_SYNCED_UID_KEY, uid);
      markSuccessfulSync(new Date().toISOString());
      return true;
    }

    const remote = snapshot.data() || {};
    const remoteStudyLog = sanitizeStudyLog(remote.studyLog);
    const remoteTagLog = sanitizeTagLog(remote.tagLog);
    const remoteAchievements = sanitizeAchievementMap(remote.achievements);
    const remoteSessionHistory = sanitizeSessionHistory(remote.sessionHistory);

    const mergedStudyLog = mergeStudyLogs(localPayload.studyLog, remoteStudyLog);
    const mergedTagLog = mergeTagLogs(localPayload.tagLog, remoteTagLog);
    const mergedAchievements = mergeAchievementMaps(localPayload.achievements, remoteAchievements);
    const mergedSessionHistory = mergeSessionHistory(localPayload.sessionHistory, remoteSessionHistory);

    saveStudyLog(mergedStudyLog, { skipCloudSync: true });
    saveTagLog(mergedTagLog, { skipCloudSync: true });
    saveUnlockedAchievements(mergedAchievements, { skipCloudSync: true });
    saveSessionHistory(mergedSessionHistory, { skipCloudSync: true });
    localStorage.setItem(LAST_SYNCED_UID_KEY, uid);

    const needsWriteBack = JSON.stringify(mergedStudyLog) !== JSON.stringify(remoteStudyLog)
      || JSON.stringify(mergedTagLog) !== JSON.stringify(remoteTagLog)
      || JSON.stringify(mergedAchievements) !== JSON.stringify(remoteAchievements)
      || JSON.stringify(mergedSessionHistory) !== JSON.stringify(remoteSessionHistory);

    if (needsWriteBack) {
      await cloudSyncApi.setDoc(docRef, {
        studyLog: mergedStudyLog,
        tagLog: mergedTagLog,
        achievements: mergedAchievements,
        sessionHistory: mergedSessionHistory,
        updatedAt: new Date().toISOString(),
        schemaVersion: 1
      }, { merge: true });
    }

    markSuccessfulSync(new Date().toISOString());
    return true;
  } catch (error) {
    console.warn("Could not load analytics from cloud.", error);
    setSyncIndicatorState("error");
    return false;
  } finally {
    cloudSyncHydrating = false;
  }
}

async function pushAnalyticsToCloud(reason = "manual") {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid) {
    return false;
  }

  if (cloudSyncHydrating || cloudSyncInFlight) {
    cloudSyncQueued = true;
    return false;
  }

  const ready = await ensureCloudSyncClient();
  if (!ready) {
    return false;
  }

  const docRef = getCloudAnalyticsDocRef(currentUser.uid);
  if (!docRef) {
    return false;
  }

  setSyncIndicatorState("syncing");
  cloudSyncInFlight = true;
  try {
    await cloudSyncApi.setDoc(docRef, {
      studyLog: sanitizeStudyLog(loadStudyLog()),
      tagLog: sanitizeTagLog(loadTagLog()),
      achievements: sanitizeAchievementMap(loadUnlockedAchievements()),
      sessionHistory: sanitizeSessionHistory(loadSessionHistory()),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
      source: reason
    }, { merge: true });

    localStorage.setItem(LAST_SYNCED_UID_KEY, currentUser.uid);
    markSuccessfulSync(new Date().toISOString());
    return true;
  } catch (error) {
    console.warn("Could not save analytics to cloud.", error);
    setSyncIndicatorState("error");
    return false;
  } finally {
    cloudSyncInFlight = false;
    if (cloudSyncQueued) {
      cloudSyncQueued = false;
      scheduleCloudAnalyticsSync("queued");
    }
  }
}

function scheduleCloudAnalyticsSync(reason = "change") {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid) {
    return;
  }

  if (cloudSyncTimerId) {
    window.clearTimeout(cloudSyncTimerId);
  }

  cloudSyncTimerId = window.setTimeout(() => {
    cloudSyncTimerId = null;
    void pushAnalyticsToCloud(reason);
  }, CLOUD_SYNC_DEBOUNCE_MS);
}

async function refreshAnalyticsFromCloud(_reason = "view", force = false) {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid) {
    return false;
  }

  const now = Date.now();
  if (!force && now - lastCloudHydrateAt < CLOUD_HYDRATE_COOLDOWN_MS) {
    return false;
  }

  const hydrated = await hydrateAnalyticsFromCloud(currentUser.uid);
  if (!hydrated) {
    return false;
  }

  lastCloudHydrateAt = Date.now();
  syncAchievementsWithCurrentStreak();
  renderAnalytics();
  renderFavourites();

  return true;
}

function enterGuestMode() {
  authMode = "guest";
  currentUser = null;
  resetCloudSyncState();
  saveGuestModePreference(true);
  authSection.classList.add("hidden");
  setAuthMessage("");
  showHomeView({ forceStopTypeEffect: true });
  renderAnalytics();
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
    settingsFocusAnchor: ".lockin-panel",
    settingsAudioAnchor: ".attribution-dropdown"
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
  themeToggleBtn.addEventListener("click", () => {
    const next = getNextThemeId(document.body.dataset.theme);
    setTheme(next);
    settings.theme = next;
    saveSettings(settings);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
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
  themeSetting.addEventListener("change", () => {
    setTheme(themeSetting.value);
    settings.theme = sanitizeThemeId(document.body.dataset.theme);
    saveSettings(settings);
  });
  focusModeSetting.addEventListener("change", () => {
    if (focusModeSetting.value === "complete") {
      showToastMessage("Complete focus is strict: timer pauses if you leave the tab. Lock-in commitment can be set below.");
    }
  });
  alarmModeSetting.addEventListener("change", onAlarmModeFieldChange);
  if (enableReminderPermissionBtn) {
    enableReminderPermissionBtn.addEventListener("click", () => {
      requestStudyReminderPermission();
    });
  }
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
  keepSessionBtn.addEventListener("click", closeCancelSessionModal);
  confirmCancelSessionBtn.addEventListener("click", confirmCancelSession);
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
  cancelSessionModal.addEventListener("click", (event) => {
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
  syncFocusModeAfterTimerStateChange();
  updateTimerButtons();
  updateSessionStatus();

  timerState.intervalId = setInterval(() => {
    timerState.remainingSeconds -= 1;
    if (timerState.phase === "study" && focusCommitRemainingSeconds > 0) {
      focusCommitRemainingSeconds = Math.max(0, focusCommitRemainingSeconds - 1);
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
  const sessionId = recordSessionHistoryEntry(blockMinutes, tag);
  scheduleUserDocSync("study-progress");

  return {
    sessionId,
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

    weeklyPlanSummaryEl.textContent = "Sign in to track plan progress.";
    weeklyPlanProgressFillEl.style.width = "0%";
    weeklyPlanBreakdownEl.innerHTML = "";
    const planLocked = document.createElement("p");
    planLocked.className = "favourite-empty";
    planLocked.textContent = "Weekly plan progress appears after sign in.";
    weeklyPlanBreakdownEl.appendChild(planLocked);

    deepInsightsSummaryEl.textContent = "Sign in to unlock deeper insights.";
    deepInsightsListEl.innerHTML = "";
    const insightLocked = document.createElement("p");
    insightLocked.className = "favourite-empty";
    insightLocked.textContent = "Best times, weekly comparison, and forecasts are account features.";
    deepInsightsListEl.appendChild(insightLocked);
    tagTrendListEl.innerHTML = "";

    renderAchievements();
    return;
  }

  const log = loadStudyLog();
  const tagLog = loadTagLog();
  const sessionHistory = loadSessionHistory();
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

  renderWeeklyPlanProgress(log);
  renderStudyGraph(log);
  renderWeeklyTagBreakdown(tagLog);
  renderDeepInsights(log, tagLog, sessionHistory);
  renderAchievements();
}

function getGraphDaysForViewport() {
  const viewportWidth = Math.max(0, window.innerWidth || 0);

  if (viewportWidth <= 375) {
    return GRAPH_DAYS_SMALL_MOBILE;
  }
  if (viewportWidth <= 430) {
    return GRAPH_DAYS_MOBILE;
  }
  if (viewportWidth <= 760) {
    return GRAPH_DAYS_TABLET;
  }

  return GRAPH_DAYS;
}

function updateStudyGraphTitle(dayCount) {
  const chartTitle = studyGraphEl
    ? studyGraphEl.closest(".chart-card")?.querySelector(".chart-head h3")
    : null;
  if (!chartTitle) {
    return;
  }

  chartTitle.textContent = `Last ${dayCount} Day${dayCount === 1 ? "" : "s"} (minutes)`;
}

function clampPlanMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.min(360, Math.max(0, Math.round(numeric)));
}

function sanitizeWeeklyPlanTargets(input) {
  const source = input && typeof input === "object" ? input : {};
  const targets = {};

  WEEKDAY_PLAN_KEYS.forEach((key) => {
    const fallback = DEFAULT_WEEKLY_PLAN_TARGETS[key] || 0;
    targets[key] = clampPlanMinutes(source[key] ?? fallback);
  });

  return targets;
}

function getWeeklyTargetMinutes(targetsInput) {
  const targets = sanitizeWeeklyPlanTargets(targetsInput);
  return WEEKDAY_PLAN_KEYS.reduce((sum, key) => sum + Number(targets[key] || 0), 0);
}

function getWeekStart(dateInput) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  const weekday = date.getDay(); // 0 = Sunday
  const distanceToMonday = (weekday + 6) % 7;
  date.setDate(date.getDate() - distanceToMonday);
  return date;
}

function getDatesForWeek(startDate) {
  const dates = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    dates.push(date);
  }
  return dates;
}

function getTargetMinutesForDate(targetsInput, date) {
  const targets = sanitizeWeeklyPlanTargets(targetsInput);
  const weekdayIndex = (date.getDay() + 6) % 7; // Monday = 0
  const key = WEEKDAY_PLAN_KEYS[weekdayIndex];
  return Number(targets[key] || 0);
}

function getWeekTotalMinutes(log, startDate) {
  return getDatesForWeek(startDate).reduce((sum, date) => {
    const key = getDateKey(date);
    return sum + Number(log[key] || 0);
  }, 0);
}

function renderWeeklyPlanProgress(log) {
  const weekStart = getWeekStart(new Date());
  const dates = getDatesForWeek(weekStart);
  const weeklyTarget = getWeeklyTargetMinutes(settings.weeklyPlanTargets);

  let totalActual = 0;
  let totalTarget = 0;
  weeklyPlanBreakdownEl.innerHTML = "";

  dates.forEach((date, index) => {
    const key = getDateKey(date);
    const actual = Number(log[key] || 0);
    const target = getTargetMinutesForDate(settings.weeklyPlanTargets, date);
    totalActual += actual;
    totalTarget += target;

    const row = document.createElement("div");
    row.className = "plan-day-row";

    const label = document.createElement("p");
    label.className = "plan-day-label";
    label.textContent = WEEKDAY_PLAN_LABELS[index];

    const value = document.createElement("p");
    value.className = "plan-day-value";
    value.textContent = `${Math.round(actual)} / ${target} min`;

    row.appendChild(label);
    row.appendChild(value);
    weeklyPlanBreakdownEl.appendChild(row);
  });

  const safeTarget = totalTarget > 0 ? totalTarget : weeklyTarget;
  const progressPercent = safeTarget > 0 ? Math.min(100, Math.round((totalActual / safeTarget) * 100)) : 0;
  weeklyPlanProgressFillEl.style.width = `${progressPercent}%`;

  if (safeTarget <= 0) {
    weeklyPlanSummaryEl.textContent = "Set daily targets in Settings to enable weekly progress.";
    return;
  }

  weeklyPlanSummaryEl.textContent = `${Math.round(totalActual)} / ${Math.round(safeTarget)} min (${progressPercent}%)`;
}

function formatHourRange(hour) {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(hour + 1, 0, 0, 0);

  const startLabel = start.toLocaleTimeString([], { hour: "numeric" });
  const endLabel = end.toLocaleTimeString([], { hour: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function calculateBestStudyHour(sessionHistory) {
  const buckets = Array(24).fill(0);
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  sanitizeSessionHistory(sessionHistory).forEach((entry) => {
    const timestamp = Date.parse(entry.timestamp);
    if (!Number.isFinite(timestamp) || (now - timestamp) > thirtyDaysMs) {
      return;
    }

    const hour = new Date(timestamp).getHours();
    buckets[hour] += Number(entry.minutes || 0);
  });

  let bestHour = -1;
  let bestMinutes = 0;
  buckets.forEach((minutes, hour) => {
    if (minutes > bestMinutes) {
      bestMinutes = minutes;
      bestHour = hour;
    }
  });

  if (bestHour < 0 || bestMinutes <= 0) {
    return "Not enough study blocks yet";
  }

  return `${formatHourRange(bestHour)} (${Math.round(bestMinutes)} min in last 30 days)`;
}

function calculateFocusScore(sessionHistory) {
  const entries = sanitizeSessionHistory(sessionHistory).filter((entry) => entry.review === "focused" || entry.review === "distracted");
  if (!entries.length) {
    return "No session reviews yet";
  }

  const focused = entries.filter((entry) => entry.review === "focused").length;
  const score = Math.round((focused / entries.length) * 100);
  return `${score}% focused (${entries.length} reviewed blocks)`;
}

function getTagTotalsForWeek(tagLog, weekStart) {
  const totals = {};
  getDatesForWeek(weekStart).forEach((date) => {
    const key = getDateKey(date);
    const dayTags = tagLog[key] || {};
    Object.entries(dayTags).forEach(([tag, minutes]) => {
      totals[tag] = Number((Number(totals[tag] || 0) + Number(minutes || 0)).toFixed(2));
    });
  });
  return totals;
}

function renderTagTrends(tagLog) {
  tagTrendListEl.innerHTML = "";

  const thisWeekStart = getWeekStart(new Date());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekTotals = getTagTotalsForWeek(tagLog, thisWeekStart);
  const lastWeekTotals = getTagTotalsForWeek(tagLog, lastWeekStart);
  const tags = new Set([...Object.keys(thisWeekTotals), ...Object.keys(lastWeekTotals)]);

  const rows = Array.from(tags)
    .map((tag) => {
      const current = Number(thisWeekTotals[tag] || 0);
      const previous = Number(lastWeekTotals[tag] || 0);
      const delta = Number((current - previous).toFixed(2));
      return { tag, current, previous, delta };
    })
    .filter((row) => row.current > 0 || row.previous > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "favourite-empty";
    empty.textContent = "No tag trend data yet for this week.";
    tagTrendListEl.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "tag-trend-row";

    const name = document.createElement("p");
    name.className = "tag-trend-name";
    name.textContent = row.tag;

    const change = document.createElement("p");
    change.className = `tag-trend-change ${row.delta >= 0 ? "positive" : "negative"}`;
    const prefix = row.delta > 0 ? "+" : "";
    change.textContent = `${prefix}${Math.round(row.delta)} min vs last week`;

    item.appendChild(name);
    item.appendChild(change);
    tagTrendListEl.appendChild(item);
  });
}

function renderDeepInsights(log, tagLog, sessionHistory) {
  const thisWeekStart = getWeekStart(new Date());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekMinutes = getWeekTotalMinutes(log, thisWeekStart);
  const lastWeekMinutes = getWeekTotalMinutes(log, lastWeekStart);
  const deltaMinutes = thisWeekMinutes - lastWeekMinutes;
  const deltaPrefix = deltaMinutes > 0 ? "+" : "";

  const weekTarget = getWeeklyTargetMinutes(settings.weeklyPlanTargets);
  const today = new Date();
  const daysElapsed = Math.min(7, Math.max(1, Math.floor((today - thisWeekStart) / (1000 * 60 * 60 * 24)) + 1));
  const projectedMinutes = Math.round((thisWeekMinutes / daysElapsed) * 7);
  const forecastText = weekTarget > 0
    ? `${projectedMinutes} / ${weekTarget} min projected`
    : "Set weekly targets to unlock forecast";

  deepInsightsSummaryEl.textContent = `${Math.round(thisWeekMinutes)} min this week (${deltaPrefix}${Math.round(deltaMinutes)} vs last week)`;
  deepInsightsListEl.innerHTML = "";

  const insights = [
    {
      label: "Best Study Time",
      value: calculateBestStudyHour(sessionHistory)
    },
    {
      label: "Weekly Comparison",
      value: `${Math.round(thisWeekMinutes)} min this week, ${Math.round(lastWeekMinutes)} min last week`
    },
    {
      label: "Goal Forecast",
      value: forecastText
    },
    {
      label: "Focus Score",
      value: calculateFocusScore(sessionHistory)
    }
  ];

  insights.forEach((insight) => {
    const item = document.createElement("div");
    item.className = "insight-item";

    const label = document.createElement("p");
    label.className = "insight-label";
    label.textContent = insight.label;

    const value = document.createElement("p");
    value.className = "insight-value";
    value.textContent = insight.value;

    item.appendChild(label);
    item.appendChild(value);
    deepInsightsListEl.appendChild(item);
  });

  renderTagTrends(tagLog);
}

function renderStudyGraph(log) {
  const graphDayCount = getGraphDaysForViewport();
  const graphDays = getRecentDays(graphDayCount);
  updateStudyGraphTitle(graphDayCount);
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
  const achievementDefinitions = getAllAchievementDefinitions();
  const unlockedCount = analyticsAvailable
    ? achievementDefinitions.filter((achievement) => Boolean(unlocked[achievement.id])).length
    : 0;
  achievementSummaryEl.textContent = analyticsAvailable
    ? `${unlockedCount} / ${achievementDefinitions.length} unlocked`
    : "Sign in to unlock achievements";
  achievementsGridEl.innerHTML = "";

  achievementDefinitions.forEach((achievement) => {
    const unlockedEntry = analyticsAvailable ? (unlocked[achievement.id] || null) : null;
    const tier = getAchievementTier(achievement);
    const lockedHint = achievement.hint || "Keep showing up to unlock this badge.";
    const card = document.createElement("article");
    card.className = "achievement-card";
    card.classList.add(unlockedEntry ? "unlocked" : "locked");

    const medal = document.createElement("div");
    medal.className = "achievement-medal";
    medal.textContent = achievement.medalText || achievement.days || "★";

    const label = document.createElement("p");
    label.className = "achievement-days";
    label.textContent = achievement.label || `${achievement.days} day${achievement.days === 1 ? "" : "s"}`;

    const tierBadge = document.createElement("p");
    tierBadge.className = `achievement-tier tier-${tier.toLowerCase()}`;
    tierBadge.textContent = tier;

    const title = document.createElement("p");
    title.className = "achievement-title";
    title.textContent = achievement.title;

    const message = document.createElement("p");
    message.className = "achievement-message";
    message.textContent = unlockedEntry
      ? achievement.message
      : (analyticsAvailable
        ? lockedHint
        : "Locked in guest mode. Sign in to earn this medal.");

    card.appendChild(medal);
    card.appendChild(label);
    card.appendChild(tierBadge);
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
  unlockRareAchievements({}, false);
}

function countStudyDaysInCurrentMonth(log) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return Object.entries(log).filter(([dateKey, minutes]) => {
    if (Number(minutes || 0) <= 0) {
      return false;
    }
    const date = parseDateKey(dateKey);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    return date.getFullYear() === year && date.getMonth() === month;
  }).length;
}

function hasRecoveryGapBeforeCurrentStreak(log, currentStreak, requiredGapDays) {
  const safeStreak = Number(currentStreak || 0);
  const safeGap = Math.max(1, Number(requiredGapDays || 1));
  if (safeStreak <= 0) {
    return false;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (safeStreak - 1));

  let gapDays = 0;
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() - 1);

  // Count zero-minute days immediately before current streak.
  for (let i = 0; i < 3660; i += 1) {
    const key = getDateKey(cursor);
    if (Number(log[key] || 0) > 0) {
      break;
    }
    gapDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  if (gapDays < safeGap) {
    return false;
  }

  // Ensure there was historical activity before the gap.
  for (let i = 0; i < 3660; i += 1) {
    const key = getDateKey(cursor);
    if (Number(log[key] || 0) > 0) {
      return true;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return false;
}

function unlockRareAchievements(context = {}, announce = true) {
  if (!canUseAnalyticsFeatures()) {
    return null;
  }

  const log = loadStudyLog();
  const history = loadSessionHistory();
  const unlocked = loadUnlockedAchievements();
  const nowIso = new Date().toISOString();
  const currentStreak = Number(context.currentStreak || calculateStreak(log));
  const bestStreak = calculateBestStreak(log);
  const monthStudyDays = countStudyDaysInCurrentMonth(log);
  const hasDeepWork = Number(context.blockMinutes || 0) >= 60
    || history.some((entry) => Number(entry.minutes || 0) >= 60);
  const hasRecovery = bestStreak >= 7
    && currentStreak >= 3
    && hasRecoveryGapBeforeCurrentStreak(log, currentStreak, 2);
  const hasSteadyMonth = monthStudyDays >= 20;

  const checks = [
    { id: "rare_deep_work_60", passed: hasDeepWork },
    { id: "rare_monthly_consistency", passed: hasSteadyMonth },
    { id: "rare_streak_recovery", passed: hasRecovery }
  ];

  let changed = false;
  let achievementToAnnounce = null;

  checks.forEach((check) => {
    if (!check.passed || unlocked[check.id]) {
      return;
    }

    unlocked[check.id] = {
      unlockedAt: nowIso,
      days: 0
    };
    changed = true;

    if (!achievementToAnnounce && announce) {
      achievementToAnnounce = getAchievementById(check.id);
    }
  });

  if (changed) {
    saveUnlockedAchievements(unlocked);
  }

  return achievementToAnnounce;
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

function saveUnlockedAchievements(unlocked, options = {}) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("achievements");
  }
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

function saveStudyLog(log, options = {}) {
  localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(log));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("study-log");
  }
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

function saveTagLog(tagLog, options = {}) {
  localStorage.setItem(TAG_LOG_KEY, JSON.stringify(tagLog));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("tag-log");
  }
}

function loadSessionHistory() {
  const raw = localStorage.getItem(SESSION_HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    return sanitizeSessionHistory(JSON.parse(raw));
  } catch (error) {
    return [];
  }
}

function saveSessionHistory(entries, options = {}) {
  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(sanitizeSessionHistory(entries)));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("session-history");
  }
}

function recordSessionHistoryEntry(minutes, tag) {
  const history = loadSessionHistory();
  const entry = {
    id: createLocalId("session"),
    timestamp: new Date().toISOString(),
    minutes: Number(Number(minutes || 0).toFixed(2)),
    tag: String(tag || "").trim() || "Study",
    review: ""
  };

  history.unshift(entry);
  saveSessionHistory(history);
  return entry.id;
}

function openSessionReviewPrompt(sessionId) {
  if (!sessionReviewPrompt || !sessionId) {
    return;
  }

  pendingSessionReviewId = String(sessionId);
  sessionReviewPrompt.classList.remove("hidden");
}

function closeSessionReviewPrompt() {
  pendingSessionReviewId = null;
  if (!sessionReviewPrompt) {
    return;
  }

  sessionReviewPrompt.classList.add("hidden");
}

function submitSessionReview(review) {
  const safeReview = review === "focused" || review === "distracted" ? review : "";
  if (!safeReview || !pendingSessionReviewId) {
    closeSessionReviewPrompt();
    return;
  }

  const history = loadSessionHistory();
  const entry = history.find((item) => item.id === pendingSessionReviewId);
  if (!entry) {
    closeSessionReviewPrompt();
    return;
  }

  entry.review = safeReview;
  saveSessionHistory(history);
  closeSessionReviewPrompt();
  renderAnalytics();
  showToastMessage(safeReview === "focused" ? "Session review saved: Focused." : "Session review saved: Distracted.");
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
  const weeklyTargets = sanitizeWeeklyPlanTargets(settings.weeklyPlanTargets);
  studyMinutesSetting.value = settings.studyMinutes;
  breakMinutesSetting.value = settings.breakMinutes;
  dailyGoalMinutesSetting.value = settings.dailyGoalMinutes;
  weeklyPlanMonSetting.value = weeklyTargets.mon;
  weeklyPlanTueSetting.value = weeklyTargets.tue;
  weeklyPlanWedSetting.value = weeklyTargets.wed;
  weeklyPlanThuSetting.value = weeklyTargets.thu;
  weeklyPlanFriSetting.value = weeklyTargets.fri;
  weeklyPlanSatSetting.value = weeklyTargets.sat;
  weeklyPlanSunSetting.value = weeklyTargets.sun;
  remindersEnabledSetting.checked = Boolean(settings.remindersEnabled);
  reminderTimeSetting.value = sanitizeTimeInput(settings.reminderTime, defaultSettings.reminderTime);
  quietHoursStartSetting.value = sanitizeTimeInput(settings.quietHoursStart, defaultSettings.quietHoursStart);
  quietHoursEndSetting.value = sanitizeTimeInput(settings.quietHoursEnd, defaultSettings.quietHoursEnd);
  focusCommitMinutesSetting.value = clampFocusCommitMinutes(settings.focusCommitMinutes);
  blockedSitesSetting.value = formatBlockedSitesForTextarea(settings.blockedSites);
  themeSetting.value = sanitizeThemeId(settings.theme);
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

  const weeklyTargets = sanitizeWeeklyPlanTargets({
    mon: weeklyPlanMonSetting.value,
    tue: weeklyPlanTueSetting.value,
    wed: weeklyPlanWedSetting.value,
    thu: weeklyPlanThuSetting.value,
    fri: weeklyPlanFriSetting.value,
    sat: weeklyPlanSatSetting.value,
    sun: weeklyPlanSunSetting.value
  });

  settings = {
    studyMinutes: clampMinutes(studyMinutesSetting.value, 1, 240),
    breakMinutes: clampMinutes(breakMinutesSetting.value, 1, 120),
    dailyGoalMinutes: clampMinutes(dailyGoalMinutesSetting.value, 10, 600),
    weeklyPlanTargets: weeklyTargets,
    remindersEnabled: Boolean(remindersEnabledSetting.checked),
    reminderTime: sanitizeTimeInput(reminderTimeSetting.value, defaultSettings.reminderTime),
    quietHoursStart: sanitizeTimeInput(quietHoursStartSetting.value, defaultSettings.quietHoursStart),
    quietHoursEnd: sanitizeTimeInput(quietHoursEndSetting.value, defaultSettings.quietHoursEnd),
    theme: sanitizeThemeId(themeSetting.value),
    focusMode: sanitizeFocusMode(focusModeSetting.value),
    focusCommitMinutes: clampFocusCommitMinutes(focusCommitMinutesSetting.value),
    blockedSites: sanitizeBlockedSites(blockedSitesSetting.value),
    alarmMode: sanitizeAlarmMode(alarmModeSetting.value),
    customAlarmUrl: String(customAlarmUrlSetting.value || "").trim(),
    youtubeMusicUrl: String(youtubeMusicUrlSetting.value || "").trim(),
    musicPresetId: sanitizeMusicPresetId(lofiPresetSelect.value)
  };

  saveSettings(settings);

  if (sanitizeFocusMode(settings.focusMode) !== "complete" || !isFocusCommitEnabled()) {
    clearFocusCommitState();
  } else {
    const maxCommitSeconds = clampFocusCommitMinutes(settings.focusCommitMinutes) * 60;
    if (focusCommitRemainingSeconds > maxCommitSeconds) {
      focusCommitRemainingSeconds = maxCommitSeconds;
    }
    updateFocusLockStatus();
  }

  setTheme(settings.theme);
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
  initializeReminderScheduler();
  maybeSendStudyReminder();
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
  const legacyThemePref = localStorage.getItem(THEME_PREF_KEY);
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return {
      ...defaultSettings,
      theme: resolveThemePreference(legacyThemePref, defaultSettings.theme),
      weeklyPlanTargets: { ...defaultSettings.weeklyPlanTargets }
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const parsedUrl = String(parsed.youtubeMusicUrl || "").trim();
    const parsedPreset = sanitizeMusicPresetId(parsed.musicPresetId);

    return {
      studyMinutes: clampMinutes(parsed.studyMinutes, 1, 240),
      breakMinutes: clampMinutes(parsed.breakMinutes, 1, 120),
      dailyGoalMinutes: clampMinutes(parsed.dailyGoalMinutes || 60, 10, 600),
      weeklyPlanTargets: sanitizeWeeklyPlanTargets(parsed.weeklyPlanTargets),
      remindersEnabled: Boolean(parsed.remindersEnabled),
      reminderTime: sanitizeTimeInput(parsed.reminderTime, defaultSettings.reminderTime),
      quietHoursStart: sanitizeTimeInput(parsed.quietHoursStart, defaultSettings.quietHoursStart),
      quietHoursEnd: sanitizeTimeInput(parsed.quietHoursEnd, defaultSettings.quietHoursEnd),
      theme: resolveThemePreference(parsed.theme, legacyThemePref, defaultSettings.theme),
      focusMode: sanitizeFocusMode(parsed.focusMode),
      focusCommitMinutes: clampFocusCommitMinutes(parsed.focusCommitMinutes),
      blockedSites: sanitizeBlockedSites(parsed.blockedSites),
      alarmMode: sanitizeAlarmMode(parsed.alarmMode),
      customAlarmUrl: String(parsed.customAlarmUrl || "").trim(),
      youtubeMusicUrl: parsedUrl,
      musicPresetId: parsedPreset || (parsedUrl ? "" : defaultSettings.musicPresetId)
    };
  } catch (error) {
    return {
      ...defaultSettings,
      theme: resolveThemePreference(legacyThemePref, defaultSettings.theme),
      weeklyPlanTargets: { ...defaultSettings.weeklyPlanTargets }
    };
  }
}

function saveSettings(nextSettings, options = {}) {
  if (!options.skipLocalMutationStamp) {
    lastLocalSettingsMutationAt = Date.now();
    saveLastLocalSettingsMutationAt(lastLocalSettingsMutationAt);
  }

  if (!options.skipThemeMutationStamp) {
    const nextTheme = normalizeThemeId(nextSettings && nextSettings.theme);
    if (nextTheme) {
      lastLocalThemeMutationAt = Date.now();
    }
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  if (!options.skipUserDocSync) {
    scheduleUserDocSync("preferences");
  }
}

function normalizeThemeId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const aliasMap = {
    "theme-dark": "dark",
    "theme-light": "light",
    "theme-dawn": "dawn",
    "theme-ocean": "ocean",
    "theme-sage": "sage",
    "mode-dark": "dark",
    "mode-light": "light"
  };

  const normalized = aliasMap[raw] || raw.replace(/^theme:\s*/i, "");
  return AVAILABLE_COLOR_THEMES.includes(normalized) ? normalized : null;
}

function resolveThemePreference(...values) {
  for (const value of values) {
    const normalized = normalizeThemeId(value);
    if (normalized) {
      return normalized;
    }
  }

  return "dark";
}

function sanitizeThemeId(value) {
  return resolveThemePreference(value);
}

function getNextThemeId(currentTheme) {
  const resolvedCurrent = sanitizeThemeId(currentTheme);
  const index = AVAILABLE_COLOR_THEMES.indexOf(resolvedCurrent);
  if (index < 0) {
    return AVAILABLE_COLOR_THEMES[0];
  }
  return AVAILABLE_COLOR_THEMES[(index + 1) % AVAILABLE_COLOR_THEMES.length];
}

function setTheme(theme, options = {}) {
  const resolvedTheme = sanitizeThemeId(theme);
  document.body.dataset.theme = resolvedTheme;
  AVAILABLE_COLOR_THEMES.forEach((themeId) => {
    document.body.classList.remove(`theme-${themeId}`);
  });
  document.body.classList.add(`theme-${resolvedTheme}`);
  if (!options.fromRemote) {
    lastLocalThemeMutationAt = Date.now();
  }
  localStorage.setItem(THEME_PREF_KEY, resolvedTheme);
  if (themeSetting) {
    themeSetting.value = resolvedTheme;
  }
  updateThemeToggleUi(resolvedTheme);
}

function updateThemeToggleUi(theme) {
  const label = COLOR_THEME_LABELS[theme] || "Dark";
  themeToggleText.textContent = `Theme: ${label}`;
  if (themeToggleBtn) {
    const tooltip = `Cycle color theme (current: ${label})`;
    themeToggleBtn.setAttribute("aria-label", tooltip);
    themeToggleBtn.title = tooltip;
  }

  if (theme === "dark") {
    themeToggleIcon.innerHTML = `
      <svg viewBox="0 0 24 24" class="icon-svg" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    `;
    return;
  }

  if (theme === "light") {
    themeToggleIcon.innerHTML = `
      <svg viewBox="0 0 24 24" class="icon-svg" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36-1.42-1.42M7.05 7.05 5.64 5.64m12.72 0-1.42 1.41M7.05 16.95l-1.41 1.41" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    `;
    return;
  }

  themeToggleIcon.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon-svg" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="13" cy="12" r="3.2" />
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h4.5A2.5 2.5 0 0 1 18 9.5v5A2.5 2.5 0 0 1 15.5 17h-10A2.5 2.5 0 0 1 3 14.5z" />
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

function openBackgroundMusicExternally(providedUrl, silent = false, options = {}) {
  const bypassFocusLock = Boolean(options.bypassFocusLock);
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
