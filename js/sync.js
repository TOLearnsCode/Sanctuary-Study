// Cloud sync and Firestore operations for Sanctuary Study.
// Depends on globals from js/constants.js and app.js.

// Serializes all Firestore analytics read/write operations so that
// concurrent hydrate and push calls cannot interleave and drop data.
var analyticsSyncChain = Promise.resolve();

function enqueueAnalyticsSync(fn) {
  analyticsSyncChain = analyticsSyncChain.then(fn, fn);
  return analyticsSyncChain;
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

    scheduleRenderAnalytics();
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

  return enqueueAnalyticsSync(async function () {
    if (cloudSyncHydrating) {
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
      safeSetItem(LAST_SYNCED_UID_KEY, uid);
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
    safeSetItem(LAST_SYNCED_UID_KEY, uid);

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
  });
}

async function pushAnalyticsToCloud(reason = "manual") {
  if (!canUseAnalyticsFeatures() || !currentUser || !currentUser.uid) {
    return false;
  }

  if (cloudSyncHydrating || cloudSyncInFlight) {
    cloudSyncQueued = true;
    return false;
  }

  return enqueueAnalyticsSync(async function () {
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

      safeSetItem(LAST_SYNCED_UID_KEY, currentUser.uid);
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
  });
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
  scheduleRenderAnalytics();
  renderFavourites();

  return true;
}
