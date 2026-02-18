import { auth, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  validatePassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const USER_PROFILES_KEY = "sanctuaryUserProfilesV1";
const AUTH_REQUEST_TIMEOUT_MS = 15000;
const POLICY_CHECK_TIMEOUT_MS = 4500;

const authForm = document.getElementById("authForm");
const authFirstNameInput = document.getElementById("authFirstNameInput");
const authLastNameInput = document.getElementById("authLastNameInput");
const authEmailInput = document.getElementById("authEmailInput");
const authDobInput = document.getElementById("authDobInput");
const authPasswordInput = document.getElementById("authPasswordInput");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authGoogleBtn = document.getElementById("authGoogleBtn");
const authGuestBtn = document.getElementById("authGuestBtn");
const authMessage = document.getElementById("authMessage");

// Exported helpers so other modules can call auth actions directly if needed.
export function signUpWithEmailPassword(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmailPassword(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

function withTimeout(promise, timeoutMs, timeoutCode = "auth/request-timeout") {
  return new Promise((resolve, reject) => {
    const timerId = window.setTimeout(() => {
      reject({ code: timeoutCode });
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        window.clearTimeout(timerId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timerId);
        reject(error);
      });
  });
}

function emitAuthChanged(detail) {
  const safeDetail = detail && typeof detail === "object" ? detail : { mode: "signed_out" };
  window.__SANCTUARY_AUTH_STATE = safeDetail;
  window.dispatchEvent(new CustomEvent("sanctuary:auth-changed", {
    detail: safeDetail
  }));
}

function setAuthMessage(message, isError = false) {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = message || "";
  authMessage.classList.toggle("success", Boolean(message) && !isError);
}

function setAuthButtonsBusy(isBusy) {
  const targets = [authSignInBtn, authSignUpBtn, authGoogleBtn, authGuestBtn];
  targets.forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

function loadProfilesMap() {
  try {
    const raw = localStorage.getItem(USER_PROFILES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveProfilesMap(map) {
  try {
    localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(map));
  } catch (error) {
    // Ignore storage failure; auth can still continue.
  }
}

function getStoredProfile(uid) {
  if (!uid) {
    return null;
  }
  const map = loadProfilesMap();
  const profile = map[uid];
  return profile && typeof profile === "object" ? profile : null;
}

function saveUserProfile(uid, profileInput) {
  if (!uid || !profileInput || typeof profileInput !== "object") {
    return null;
  }

  const map = loadProfilesMap();
  const existing = map[uid] && typeof map[uid] === "object" ? map[uid] : {};
  const profile = {
    firstName: String(profileInput.firstName || existing.firstName || "").trim(),
    lastName: String(profileInput.lastName || existing.lastName || "").trim(),
    email: String(profileInput.email || existing.email || "").trim(),
    dob: String(profileInput.dob || existing.dob || "").trim(),
    createdAt: String(existing.createdAt || profileInput.createdAt || new Date().toISOString())
  };

  map[uid] = profile;
  saveProfilesMap(map);
  return profile;
}

function splitDisplayName(displayName) {
  const cleaned = String(displayName || "").trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return { firstName: "", lastName: "" };
  }

  const parts = cleaned.split(" ");
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
}

function getProfileFromFirebaseUser(user) {
  if (!user) {
    return null;
  }

  const split = splitDisplayName(user.displayName || "");
  return {
    firstName: split.firstName,
    lastName: split.lastName,
    email: String(user.email || "").trim(),
    dob: "",
    createdAt: ""
  };
}

function syncProfileFromAuthUser(user, preferredProfile = null) {
  if (!user || !user.uid) {
    return null;
  }

  const stored = getStoredProfile(user.uid) || {};
  const firebaseProfile = getProfileFromFirebaseUser(user) || {};
  const merged = {
    firstName: String(preferredProfile?.firstName || stored.firstName || firebaseProfile.firstName || "").trim(),
    lastName: String(preferredProfile?.lastName || stored.lastName || firebaseProfile.lastName || "").trim(),
    email: String(preferredProfile?.email || user.email || stored.email || "").trim(),
    dob: String(preferredProfile?.dob || stored.dob || "").trim(),
    createdAt: String(stored.createdAt || preferredProfile?.createdAt || new Date().toISOString())
  };

  return saveUserProfile(user.uid, merged);
}

function normalizeAuthInput() {
  return {
    firstName: String(authFirstNameInput?.value || "").trim(),
    lastName: String(authLastNameInput?.value || "").trim(),
    email: String(authEmailInput?.value || "").trim(),
    dob: String(authDobInput?.value || "").trim(),
    password: String(authPasswordInput?.value || "")
  };
}

function isLikelyEmail(value) {
  return /.+@.+\..+/.test(value);
}

function isValidDob(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const dobDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dobDate.getTime())) {
    return false;
  }

  const now = new Date();
  return dobDate <= now;
}

function formatRequirementList(items) {
  if (items.length <= 1) {
    return items[0] || "at least 8 chars, upper, lower, number, special";
  }

  return items.join(", ");
}

function getFallbackPasswordFeedback(password) {
  const needs = [];
  if (password.length < 8) {
    needs.push("at least 8 chars");
  }
  if (!/[A-Z]/.test(password)) {
    needs.push("upper");
  }
  if (!/[a-z]/.test(password)) {
    needs.push("lower");
  }
  if (!/[0-9]/.test(password)) {
    needs.push("number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    needs.push("special");
  }

  if (needs.length === 0) {
    return { isValid: true, message: "" };
  }

  return {
    isValid: false,
    message: `Need ${formatRequirementList(needs)}.`
  };
}

async function getPasswordPolicyFeedback(password) {
  try {
    const status = await withTimeout(
      validatePassword(auth, password),
      POLICY_CHECK_TIMEOUT_MS,
      "auth/password-policy-timeout"
    );

    if (status.isValid) {
      return { isValid: true, message: "" };
    }

    const required = [];
    const minLength = status.passwordPolicy && Number.isFinite(status.passwordPolicy.minPasswordLength)
      ? status.passwordPolicy.minPasswordLength
      : 8;

    if (status.meetsMinPasswordLength === false) {
      required.push(`at least ${minLength} chars`);
    }
    if (status.containsUppercaseLetter === false) {
      required.push("upper");
    }
    if (status.containsLowercaseLetter === false) {
      required.push("lower");
    }
    if (status.containsNumericCharacter === false) {
      required.push("number");
    }
    if (status.containsNonAlphanumericCharacter === false) {
      required.push("special");
    }

    if (!required.length) {
      required.push("at least 8 chars", "upper", "lower", "number", "special");
    }

    return {
      isValid: false,
      message: `Need ${formatRequirementList(required)}.`
    };
  } catch (error) {
    // If policy fetch is slow or unavailable, still validate locally so sign-up does not feel stuck.
    return getFallbackPasswordFeedback(password);
  }
}

function getFriendlyAuthError(error) {
  const code = error && typeof error.code === "string" ? error.code : "";

  if (code === "auth/invalid-credential") {
    return "Incorrect email or password.";
  }
  if (code === "auth/email-already-in-use") {
    return "This email already has an account. Try signing in.";
  }
  if (code === "auth/invalid-email") {
    return "That email format is invalid.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled before completion.";
  }
  if (code === "auth/popup-blocked") {
    return "Popup blocked by browser. Allow popups, then try Google sign-in again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email/password auth is disabled in Firebase. Enable it in Authentication > Sign-in method.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Authentication settings.";
  }
  if (code === "auth/request-timeout") {
    return "Request timed out. Please check your internet and try again.";
  }

  return "Authentication failed. Please try again.";
}

function validateSignUpProfile(input) {
  if (!input.firstName || input.firstName.length < 2) {
    return "Enter your first name (at least 2 characters).";
  }
  if (!input.lastName || input.lastName.length < 2) {
    return "Enter your last name (at least 2 characters).";
  }
  if (!isValidDob(input.dob)) {
    return "Enter a valid date of birth.";
  }
  return "";
}

async function onSignInClick() {
  const { email, password } = normalizeAuthInput();

  if (!isLikelyEmail(email)) {
    setAuthMessage("Enter a valid email address.", true);
    return;
  }
  if (!password) {
    setAuthMessage("Enter your password.", true);
    return;
  }

  setAuthButtonsBusy(true);
  setAuthMessage("Signing in...");

  try {
    const credential = await withTimeout(
      signInWithEmailPassword(email, password),
      AUTH_REQUEST_TIMEOUT_MS
    );
    syncProfileFromAuthUser(credential?.user);
    setAuthMessage("Signed in successfully.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    setAuthButtonsBusy(false);
  }
}

async function onSignUpClick() {
  const input = normalizeAuthInput();

  if (!isLikelyEmail(input.email)) {
    setAuthMessage("Enter a valid email address.", true);
    return;
  }

  const profileError = validateSignUpProfile(input);
  if (profileError) {
    setAuthMessage(profileError, true);
    return;
  }

  const policy = await getPasswordPolicyFeedback(input.password);
  if (!policy.isValid) {
    setAuthMessage(policy.message || "Password does not meet the required policy.", true);
    return;
  }

  setAuthButtonsBusy(true);
  setAuthMessage("Creating your account...");

  try {
    const credential = await withTimeout(
      signUpWithEmailPassword(input.email, input.password),
      AUTH_REQUEST_TIMEOUT_MS
    );

    const displayName = `${input.firstName} ${input.lastName}`.trim();
    if (displayName) {
      try {
        await withTimeout(
          updateProfile(credential.user, { displayName }),
          AUTH_REQUEST_TIMEOUT_MS
        );
      } catch (error) {
        // Non-critical. Profile name can still be taken from local profile storage.
      }
    }

    syncProfileFromAuthUser(credential.user, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      dob: input.dob,
      createdAt: new Date().toISOString()
    });

    setAuthMessage("Account created. Welcome to Sanctuary Study.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    setAuthButtonsBusy(false);
  }
}

async function onGoogleSignInClick() {
  setAuthButtonsBusy(true);
  setAuthMessage("Opening Google sign-in...");

  try {
    const credential = await withTimeout(signInWithGoogle(), AUTH_REQUEST_TIMEOUT_MS);
    syncProfileFromAuthUser(credential?.user);
    setAuthMessage("Signed in with Google.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    setAuthButtonsBusy(false);
  }
}

function initializeAuthPageBindings() {
  if (!authSignInBtn || !authSignUpBtn || !authGoogleBtn || !authForm) {
    return;
  }

  authSignInBtn.addEventListener("click", () => {
    onSignInClick();
  });

  authSignUpBtn.addEventListener("click", () => {
    onSignUpClick();
  });

  authGoogleBtn.addEventListener("click", () => {
    onGoogleSignInClick();
  });

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    onSignInClick();
  });
}

function initializeAuthBridge() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const profile = syncProfileFromAuthUser(user);
      emitAuthChanged({
        mode: "user",
        email: (profile && profile.email) || user.email || "",
        profile: profile || null,
        user
      });
      return;
    }

    emitAuthChanged({ mode: "signed_out" });
  });

  window.addEventListener("sanctuary:request-signout", async () => {
    try {
      await signOut(auth);
      emitAuthChanged({ mode: "signed_out" });
    } catch (error) {
      // Keep the bridge stable even when sign out fails.
    }
  });
}

initializeAuthPageBindings();
initializeAuthBridge();
window.__SANCTUARY_AUTH_READY = true;
