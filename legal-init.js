/**
 * Early theme initializer for legal pages (privacy.html, terms.html).
 * Loaded synchronously in <body> to prevent flash of unstyled content.
 * This replaces the duplicated inline <script> blocks.
 */
(() => {
  const themes = ["dark", "light", "dawn", "ocean", "sage"];
  const normalizeTheme = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) {
      return "";
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
    const resolved = aliasMap[raw] || raw.replace(/^theme:\s*/i, "");
    return themes.includes(resolved) ? resolved : "";
  };

  let initialTheme = normalizeTheme(localStorage.getItem("theme"));
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
})();
