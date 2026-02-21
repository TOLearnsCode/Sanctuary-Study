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
