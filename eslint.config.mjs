import globals from "globals";

/*
 * ESLint flat config for Sanctuary Study.
 *
 * The app uses classic <script> tags (not ES modules) for all source files
 * except auth.js. Every top-level function and variable is intentionally
 * global and shared across files, so `no-undef` is turned off for classic
 * scripts — listing 500+ cross-file globals would be unmaintainable.
 *
 * auth.js and test files are ES modules and keep stricter checking.
 */

/** Rules shared by every file in the project. */
const sharedRules = {
  "eqeqeq": ["warn", "smart"],
  "no-constant-condition": "warn",
  "no-debugger": "warn",
  "no-duplicate-case": "error",
  "no-empty": ["warn", { allowEmptyCatch: true }],
  "no-extra-boolean-cast": "warn",
  "no-irregular-whitespace": "warn",
  "no-loss-of-precision": "error",
  "no-redeclare": "warn",
  "no-self-assign": "warn",
  "no-self-compare": "warn",
  "no-sparse-arrays": "warn",
  "no-template-curly-in-string": "warn",
  "no-unreachable": "warn",
  "no-var": "off",            // project deliberately uses var in app.js
  "prefer-const": "off",      // classic scripts need let/var for shared state
  "use-isnan": "error",
  "valid-typeof": "error"
};

export default [
  // ── Ignore non-lintable files ────────────────────────────────────────
  {
    ignores: [
      "node_modules/**",
      "firebase.js",           // Firebase SDK bootstrap — not our code
      "legal.js",              // trivial legal-page script
      "vitest.config.js"
    ]
  },

  // ── Classic <script> source files ────────────────────────────────────
  // These share the global scope via script tags. no-undef is off because
  // 500+ cross-file globals are intentional and expected.
  {
    files: [
      "app.js",
      "js/constants.js",
      "js/sync.js",
      "js/analytics.js",
      "js/ui.js",
      "js/timer.js",
      "js/music.js"
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        // Firebase SDK globals loaded via CDN <script> tags
        firebase: "readonly"
      }
    },
    rules: {
      ...sharedRules,
      "no-undef": "off",
      "no-unused-vars": "off"  // all 500+ globals are used cross-file, not within-file
    }
  },

  // ── auth.js (ES module) ──────────────────────────────────────────────
  {
    files: ["auth.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Globals from classic scripts that auth.js references
        // (it's an ES module so it can't see them without declaration)
        settings: "readonly",
        currentUser: "writable",
        cloudSyncDb: "writable",
        cloudSyncApi: "writable",
        cloudSyncReady: "writable",
        authMode: "writable",
        showAuthScreen: "readonly",
        updateAuthUi: "readonly",
        setAuthMessage: "readonly",
        saveGuestModePreference: "readonly",
        loadGuestModePreference: "readonly",
        enterGuestMode: "readonly",
        hasAppAccess: "readonly",
        initializeAuthenticationFlow: "readonly",
        resetCloudSyncState: "readonly",
        ensureCloudSyncClient: "readonly",
        startUserDocRealtimeSync: "readonly",
        hydrateAnalyticsFromCloud: "readonly",
        renderAnalytics: "readonly",
        showHomeView: "readonly",
        setTheme: "readonly",
        resolveThemePreference: "readonly",
        fillSettingsForm: "readonly",
        loadSettings: "readonly",
        saveSettings: "readonly",
        loadStudyLog: "readonly",
        loadTagLog: "readonly",
        loadSessionHistory: "readonly"
      }
    },
    rules: {
      ...sharedRules,
      "no-undef": "warn",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }]
    }
  },

  // ── Service worker ───────────────────────────────────────────────────
  {
    files: ["service-worker.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.serviceworker
      }
    },
    rules: {
      ...sharedRules,
      "no-undef": "error",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }]
    }
  },

  // ── Test files (ES modules, Node + vitest globals) ───────────────────
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...sharedRules,
      "no-undef": "off",       // vitest injects describe/it/expect via imports
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }]
    }
  }
];
