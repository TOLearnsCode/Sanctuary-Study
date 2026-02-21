// Sanctuary Study — UI helpers: notes, favourites, scripture, settings,
// theme system, alarm sounds, and small utilities.


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

/*
SESSION NOTES MODULE
Stores free-form notes and checklist items for study sessions.
*/
function loadSessionNotesState() {
  const raw = safeGetItem(SESSION_NOTES_KEY);
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
  safeSetItem(SESSION_NOTES_KEY, JSON.stringify(state));
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
  const raw = safeGetItem(FAVOURITES_KEY);
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
  safeSetItem(FAVOURITES_KEY, JSON.stringify(items));
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
  const raw = safeGetItem(DAILY_SCRIPTURE_CACHE_KEY);
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
  safeSetItem(DAILY_SCRIPTURE_CACHE_KEY, JSON.stringify(data));
}

function loadDailyScriptureHistory() {
  const raw = safeGetItem(DAILY_SCRIPTURE_HISTORY_KEY);
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
  safeSetItem(DAILY_SCRIPTURE_HISTORY_KEY, JSON.stringify(history.slice(0, SCRIPTURE_HISTORY_LIMIT)));
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
    customAlarmUrl: sanitizeAudioUrl(customAlarmUrlSetting.value),
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
  scheduleRenderAnalytics();
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
  const legacyThemePref = safeGetItem(THEME_PREF_KEY);
  const raw = safeGetItem(SETTINGS_KEY);
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
      customAlarmUrl: sanitizeAudioUrl(parsed.customAlarmUrl),
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

  safeSetItem(SETTINGS_KEY, JSON.stringify(nextSettings));
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
  safeSetItem(THEME_PREF_KEY, resolvedTheme);
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
    Peace: "Study with a calm heart and unclenched mind. God's peace can steady your attention and pace.",
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
  if (!isSafeAudioUrl(url)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 0.35;

    var cleanup = function () {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    audio.play().then(() => resolve(true)).catch(() => {
      cleanup();
      resolve(false);
    });
  });
}

function isSafeAudioUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    var parsed = new URL(url);
    var protocol = parsed.protocol.toLowerCase();
    return protocol === "https:" || protocol === "http:" || protocol === "data:";
  } catch (error) {
    return false;
  }
}

function sanitizeAudioUrl(value) {
  var trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }
  return isSafeAudioUrl(trimmed) ? trimmed : "";
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


/**
 * Safe localStorage.setItem wrapper that catches QuotaExceededError.
 * Returns true on success, false if the write failed (storage full).
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("localStorage write failed (storage may be full):", key, error);
    return false;
  }
}


/**
 * Safe localStorage.getItem wrapper that catches errors (e.g. Safari
 * private mode, SecurityError). Returns null when storage is unavailable.
 */
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn("localStorage read failed:", key, error);
    return null;
  }
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
