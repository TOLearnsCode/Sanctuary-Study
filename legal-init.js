/**
 * Early theme initializer for legal pages (privacy.html, terms.html).
 * Loaded synchronously in <body> to prevent flash of unstyled content.
 * This replaces the duplicated inline <script> blocks.
 */
(() => {
  const themes = [
    "dark",
    "obsidian",
    "forest-night",
    "deep-purple",
    "crimson-dark",
    "slate",
    "sunset-dark",
    "light"
  ];
  const normalizeTheme = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) {
      return "";
    }
    const aliasMap = {
      "theme-dark": "dark",
      "theme-obsidian": "obsidian",
      "theme-forest-night": "forest-night",
      "theme-deep-purple": "deep-purple",
      "theme-crimson-dark": "crimson-dark",
      "theme-slate": "slate",
      "theme-sunset-dark": "sunset-dark",
      "theme-light": "light",
      "theme-dawn": "sunset-dark",
      "theme-ocean": "slate",
      "theme-sage": "forest-night",
      "midnight-blue": "dark",
      midnight: "dark",
      forest_night: "forest-night",
      deep_purple: "deep-purple",
      crimson_dark: "crimson-dark",
      sunset_dark: "sunset-dark",
      dawn: "sunset-dark",
      ocean: "slate",
      sage: "forest-night",
      "mode-dark": "dark",
      "mode-light": "light"
    };
    const resolved = aliasMap[raw] || raw.replace(/^theme:\s*/i, "");
    return themes.includes(resolved) ? resolved : "";
  };

  let initialTheme = normalizeTheme(localStorage.getItem("selectedTheme"))
    || normalizeTheme(localStorage.getItem("theme"));
  if (!initialTheme) {
    try {
      const parsed = JSON.parse(localStorage.getItem("sanctuaryStudySettingsV1") || "{}");
      initialTheme = normalizeTheme(parsed.theme);
    } catch (error) {
      initialTheme = "";
    }
  }

  const theme = initialTheme || "dark";
  document.body.dataset.theme = theme;
  themes.forEach((themeId) => document.body.classList.remove(`theme-${themeId}`));
  document.body.classList.add(`theme-${theme}`);
  document.body.classList.toggle("theme-dark", theme !== "light");
})();
