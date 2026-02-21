/**
 * Test helper: loads project source files (classic scripts) into a shared
 * V8 context so their top-level declarations become accessible as globals.
 *
 * Only evaluates files that contain pure/testable logic — skips DOM-dependent
 * initialisation by providing a minimal stub environment.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import vm from "vm";

const ROOT = resolve(import.meta.dirname, "..");

/**
 * Preprocess source code so that top-level `const` and `let` declarations
 * become `var` declarations.  In a V8 vm context, only `var` and `function`
 * declarations become properties of the sandbox object — `const`/`let` are
 * script-scoped and invisible on `ctx.foo`.  Converting to `var` is safe
 * here because these are classic scripts where top-level const/let behave
 * like script-global vars.
 */
function promoteDeclarations(code) {
  return code.replace(/^(const |let )/gm, "var ");
}

/** Minimal DOM element stub that won't throw on chained property access. */
function stubElement() {
  return {
    style: { setProperty() {}, getPropertyValue() { return ""; }, removeProperty() {} },
    dataset: {},
    value: "",
    textContent: "",
    innerHTML: "",
    checked: false,
    disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {},
    getAttribute() { return null; },
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return stubElement(); },
    querySelectorAll() { return []; },
    closest() { return null; },
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }; },
    offsetWidth: 0,
    offsetHeight: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    children: [],
    parentElement: null
  };
}

/**
 * Build a sandbox that provides the minimal globals the source files
 * reference at parse/declaration time (not at call time — those can
 * be stubbed per-test).
 */
function buildSandbox(overrides = {}) {
  return {
    // JS built-ins the source files use at top level
    console,
    Date,
    Object,
    Array,
    Map,
    Set,
    Number,
    Math,
    String,
    Boolean,
    JSON,
    RegExp,
    Promise,
    Error,
    TypeError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    crypto: globalThis.crypto,
    URL,
    Notification: { permission: "default", requestPermission: async () => "default" },

    // Minimal window/document stubs so the source files can be parsed
    // without throwing on DOM lookups (the actual elements are never
    // used inside the pure functions we test).
    window: { clearTimeout, setTimeout, YT: undefined, addEventListener() {} },
    document: {
      getElementById: () => stubElement(),
      querySelector: () => stubElement(),
      querySelectorAll: () => [],
      documentElement: stubElement(),
      body: stubElement(),
      addEventListener: () => {},
      createElement: () => stubElement()
    },
    navigator: { serviceWorker: undefined },
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] ?? null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; },
      clear() { this._store = {}; }
    },
    location: { hostname: "localhost", href: "http://localhost/" },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: () => 0,
    Audio: function() {
      return {
        play() { return Promise.resolve(); },
        pause() {},
        load() {},
        addEventListener() {},
        removeEventListener() {},
        src: "",
        volume: 1,
        loop: false,
        currentTime: 0
      };
    },

    // Allow overrides for specific tests
    ...overrides
  };
}

/**
 * Read a source file, preprocess it (const/let → var), and optionally
 * apply additional transforms.
 */
function readSource(filePath, transforms = []) {
  let code = readFileSync(resolve(ROOT, filePath), "utf8");
  code = promoteDeclarations(code);
  for (const fn of transforms) {
    code = fn(code);
  }
  return code;
}

/** Strip the init() call from app.js so it doesn't run during loading. */
function stripInit(code) {
  return code.replace(/^init\(\);$/m, "// init() skipped for testing");
}

/**
 * Load one or more source files into a shared context and return the
 * context object (which holds all top-level declarations as properties).
 *
 * @param {string[]} files  Paths relative to project root
 * @param {object}   [overrides]  Extra sandbox properties
 * @returns {object} The populated context (access globals by name)
 */
export function loadSourceFiles(files, overrides = {}) {
  const sandbox = buildSandbox(overrides);
  const ctx = vm.createContext(sandbox);

  for (const file of files) {
    const transforms = file === "app.js" ? [stripInit] : [];
    const code = readSource(file, transforms);
    vm.runInContext(code, ctx, { filename: file });
  }

  return ctx;
}

/**
 * Convenience: load constants.js only (fast, no DOM stubs needed).
 */
export function loadConstants() {
  return loadSourceFiles(["js/constants.js"]);
}

/**
 * Convenience: load the full app stack (minus music.js and auth.js).
 * Load order mirrors index.html: constants → sync → analytics → ui → timer → app.
 * init() is automatically stripped so app.js only declares functions and variables.
 */
export function loadApp() {
  return loadSourceFiles([
    "js/constants.js",
    "js/analytics.js",
    "js/ui.js",
    "js/timer.js",
    "app.js"
  ]);
}

/**
 * Load the full app stack plus sync.js for testing sync functions.
 * Load order mirrors index.html: constants → sync → analytics → ui → timer → app.
 */
export function loadWithSync() {
  return loadSourceFiles([
    "js/constants.js",
    "js/sync.js",
    "js/analytics.js",
    "js/ui.js",
    "js/timer.js",
    "app.js"
  ]);
}

/**
 * Load constants + music.js for testing music/YouTube functions.
 */
export function loadWithMusic() {
  return loadSourceFiles(["js/constants.js", "js/music.js"]);
}
