const LEGAL_THEME_KEY = "theme";
const LEGAL_SETTINGS_KEY = "sanctuaryStudySettingsV1";
const LEGAL_THEMES = ["dark", "light", "dawn", "ocean", "sage"];
const LEGAL_THEME_LABELS = {
  dark: "Midnight",
  light: "Pearl",
  dawn: "Ember",
  ocean: "Azure",
  sage: "Forest"
};

function sanitizeTheme(theme) {
  const raw = String(theme || "").trim().toLowerCase();
  if (!raw) {
    return "dark";
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
  return LEGAL_THEMES.includes(normalized) ? normalized : "dark";
}

function getNextTheme(theme) {
  const current = sanitizeTheme(theme);
  const index = LEGAL_THEMES.indexOf(current);
  if (index < 0) {
    return LEGAL_THEMES[0];
  }
  return LEGAL_THEMES[(index + 1) % LEGAL_THEMES.length];
}

function applyTheme(theme, options = {}) {
  const shouldPersist = Boolean(options.persist);
  const shouldSyncSettings = Boolean(options.syncSettings);
  const resolved = sanitizeTheme(theme);
  document.body.dataset.theme = resolved;
  LEGAL_THEMES.forEach((themeId) => {
    document.body.classList.remove(`theme-${themeId}`);
  });
  document.body.classList.add(`theme-${resolved}`);
  if (shouldPersist) {
    localStorage.setItem(LEGAL_THEME_KEY, resolved);
  }
  if (shouldSyncSettings) {
    syncThemeToAppSettings(resolved);
  }

  const toggleBtn = document.getElementById("legalThemeToggle");
  if (toggleBtn) {
    const label = LEGAL_THEME_LABELS[resolved] || "Midnight";
    toggleBtn.textContent = `Theme: ${label}`;
    toggleBtn.title = `Cycle theme (current: ${label})`;
    toggleBtn.setAttribute("aria-label", `Cycle theme (current: ${label})`);
  }
}

function syncThemeToAppSettings(theme) {
  if (theme == null || theme === "") {
    return;
  }

  const resolvedTheme = sanitizeTheme(theme);
  const rawSettings = localStorage.getItem(LEGAL_SETTINGS_KEY);
  if (!rawSettings) {
    return;
  }

  try {
    const parsed = JSON.parse(rawSettings);
    if (!parsed || typeof parsed !== "object") {
      return;
    }

    if (parsed.theme == null) {
      return;
    }

    if (sanitizeTheme(parsed.theme) === resolvedTheme) {
      return;
    }

    parsed.theme = resolvedTheme;
    localStorage.setItem(LEGAL_SETTINGS_KEY, JSON.stringify(parsed));
  } catch (error) {
    // Ignore malformed local settings.
  }
}

function initializeLegalThemeSync() {
  const savedTheme = localStorage.getItem(LEGAL_THEME_KEY);
  applyTheme(savedTheme || "dark", { persist: false, syncSettings: false });

  const toggleBtn = document.getElementById("legalThemeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nextTheme = getNextTheme(document.body.dataset.theme);
      applyTheme(nextTheme, { persist: true, syncSettings: true });
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== LEGAL_THEME_KEY) {
      return;
    }
    applyTheme(event.newValue || "dark", { persist: false, syncSettings: false });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeLegalThemeSync);
} else {
  initializeLegalThemeSync();
}
