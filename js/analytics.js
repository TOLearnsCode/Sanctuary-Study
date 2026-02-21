// Sanctuary Study — Analytics, achievements, and study data persistence.
// Provides study log management, streak calculation, graph rendering,
// achievement tracking, weekly plan progress, and session review.

var renderAnalyticsPending = null;

function scheduleRenderAnalytics() {
  if (renderAnalyticsPending) {
    return;
  }

  renderAnalyticsPending = requestAnimationFrame(function () {
    renderAnalyticsPending = null;
    renderAnalytics();
  });
}

function cancelPendingAnalyticsRender() {
  if (renderAnalyticsPending) {
    cancelAnimationFrame(renderAnalyticsPending);
    renderAnalyticsPending = null;
  }
}


function getAllAchievementDefinitions() {
  return [...STREAK_ACHIEVEMENTS, ...RARE_ACHIEVEMENTS, ...ENGAGEMENT_ACHIEVEMENTS];
}

function getAchievementById(id) {
  return getAllAchievementDefinitions().find((achievement) => achievement.id === id) || null;
}

const REQUIRED_EXPLORER_SECTIONS = ["home", "study", "analytics", "settings", "favourites"];
const REQUIRED_MUSIC_SOURCE_TYPES = ["builtin", "url", "upload"];

function normalizeAchievementProgress(input) {
  const source = input && typeof input === "object" ? input : {};
  const visitedSections = Array.isArray(source.visitedSections)
    ? source.visitedSections.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const musicSources = Array.isArray(source.musicSources)
    ? source.musicSources.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean)
    : [];

  return {
    visitedSections: Array.from(new Set(visitedSections)),
    musicSources: Array.from(new Set(musicSources))
  };
}

function loadAchievementProgress() {
  const raw = safeGetItem(ACHIEVEMENT_PROGRESS_KEY);
  if (!raw) {
    return {
      visitedSections: [],
      musicSources: []
    };
  }

  try {
    return normalizeAchievementProgress(JSON.parse(raw));
  } catch (error) {
    return {
      visitedSections: [],
      musicSources: []
    };
  }
}

function saveAchievementProgress(progress) {
  safeSetItem(ACHIEVEMENT_PROGRESS_KEY, JSON.stringify(normalizeAchievementProgress(progress)));
}

function unlockAchievementById(id) {
  if (!canUseAnalyticsFeatures()) {
    return null;
  }

  const achievement = getAchievementById(id);
  if (!achievement) {
    return null;
  }

  const unlocked = loadUnlockedAchievements();
  if (unlocked[id]) {
    return null;
  }

  unlocked[id] = {
    unlockedAt: new Date().toISOString(),
    days: Number(achievement.days || 0)
  };

  saveUnlockedAchievements(unlocked);
  return achievement;
}

function unlockAchievementsByIds(ids) {
  const unlockedNow = [];
  ids.forEach((id) => {
    const unlockedAchievement = unlockAchievementById(id);
    if (unlockedAchievement) {
      unlockedNow.push(unlockedAchievement);
    }
  });
  return unlockedNow;
}

function announceAchievementUnlock(achievement) {
  if (!achievement) {
    return null;
  }
  if (typeof showAchievementToast === "function") {
    showAchievementToast(achievement);
  }
  scheduleRenderAnalytics();
  return achievement;
}

function unlockAchievementAndAnnounce(id) {
  const achievement = unlockAchievementById(id);
  if (!achievement) {
    return null;
  }
  return announceAchievementUnlock(achievement);
}

function unlockConsistencyAchievements(context = {}, announce = true) {
  if (!canUseAnalyticsFeatures()) {
    return [];
  }

  const log = loadStudyLog();
  const streak = Number(context.currentStreak || calculateStreak(log));
  const studyDays = countStudyDays(log);
  const unlockedNow = [];

  if (streak >= 3) {
    unlockedNow.push(...unlockAchievementsByIds(["eng_on_a_roll"]));
  }
  if (studyDays >= 7) {
    unlockedNow.push(...unlockAchievementsByIds(["eng_dedicated"]));
  }

  if (unlockedNow.length) {
    scheduleRenderAnalytics();
  }

  if (!announce) {
    return [];
  }

  return unlockedNow;
}

function syncProgressBasedAchievements(announce = false) {
  const progress = loadAchievementProgress();
  const unlockedNow = [];

  const visitedAllSections = REQUIRED_EXPLORER_SECTIONS.every((sectionId) => progress.visitedSections.includes(sectionId));
  if (visitedAllSections) {
    unlockedNow.push(...unlockAchievementsByIds(["eng_explorer"]));
  }

  const usedAllMusicSources = REQUIRED_MUSIC_SOURCE_TYPES.every((sourceType) => progress.musicSources.includes(sourceType));
  if (usedAllMusicSources) {
    unlockedNow.push(...unlockAchievementsByIds(["eng_dj"]));
  }

  if (unlockedNow.length) {
    scheduleRenderAnalytics();
  }

  if (!announce) {
    return [];
  }

  return unlockedNow;
}

function markSectionVisited(sectionName, options = {}) {
  const normalized = String(sectionName || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const progress = loadAchievementProgress();
  if (!progress.visitedSections.includes(normalized)) {
    progress.visitedSections.push(normalized);
    saveAchievementProgress(progress);
  }

  const unlockedNow = syncProgressBasedAchievements(options.announce !== false);
  if (options.announce !== false && unlockedNow.length) {
    return announceAchievementUnlock(unlockedNow[0]);
  }

  return unlockedNow[0] || null;
}

function markMusicSourceUsed(sourceType, options = {}) {
  const normalized = String(sourceType || "").trim().toLowerCase();
  if (!REQUIRED_MUSIC_SOURCE_TYPES.includes(normalized)) {
    return null;
  }

  const progress = loadAchievementProgress();
  if (!progress.musicSources.includes(normalized)) {
    progress.musicSources.push(normalized);
    saveAchievementProgress(progress);
  }

  const unlockedNow = syncProgressBasedAchievements(options.announce !== false);
  if (options.announce !== false && unlockedNow.length) {
    return announceAchievementUnlock(unlockedNow[0]);
  }

  return unlockedNow[0] || null;
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
  const chartCard = studyGraphEl ? studyGraphEl.closest(".chart-card") : null;
  const chartTitle = chartCard ? chartCard.querySelector(".chart-head h3") : null;
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
    const value = Object.prototype.hasOwnProperty.call(source, key) ? source[key] : fallback;
    targets[key] = clampPlanMinutes(value);
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
  unlockConsistencyAchievements({ currentStreak: streak }, false);
  syncProgressBasedAchievements(false);
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
  const raw = safeGetItem(ACHIEVEMENTS_KEY);
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
  safeSetItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
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
  var MAX_STREAK_LOOKBACK = 3650;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (streak < MAX_STREAK_LOOKBACK) {
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

    if (Math.round(dayDiff) === 1) {
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
  const raw = safeGetItem(STUDY_LOG_KEY);
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
  safeSetItem(STUDY_LOG_KEY, JSON.stringify(log));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("study-log");
  }
}

function loadTagLog() {
  const raw = safeGetItem(TAG_LOG_KEY);
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
  safeSetItem(TAG_LOG_KEY, JSON.stringify(tagLog));
  if (!options.skipCloudSync) {
    scheduleCloudAnalyticsSync("tag-log");
  }
}

function loadSessionHistory() {
  const raw = safeGetItem(SESSION_HISTORY_KEY);
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
  safeSetItem(SESSION_HISTORY_KEY, JSON.stringify(sanitizeSessionHistory(entries)));
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
