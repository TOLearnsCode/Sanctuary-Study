import { auth, db, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  validatePassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const USER_PROFILES_KEY = "sanctuaryUserProfilesV1";
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const EMAIL_SEND_TIMEOUT_MS = 7000;
const EMAIL_SEND_RETRY_DELAY_MS = 900;
const POLICY_CHECK_TIMEOUT_MS = 4500;
const VERIFICATION_RESEND_COOLDOWN_MS = 20000;

const authForm = document.getElementById("authForm");
const authFirstNameInput = document.getElementById("authFirstNameInput");
const authLastNameInput = document.getElementById("authLastNameInput");
const authEmailInput = document.getElementById("authEmailInput");
const authDobInput = document.getElementById("authDobInput");
const authPasswordInput = document.getElementById("authPasswordInput");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authSignInBtn = document.getElementById("authSignInBtn");
const authSignUpBtn = document.getElementById("authSignUpBtn");
const authGoogleBtn = document.getElementById("authGoogleBtn");
const authGuestBtn = document.getElementById("authGuestBtn");
const authResendVerificationBtn = document.getElementById("authResendVerificationBtn");
const authLoading = document.getElementById("authLoading");
const authLoadingText = document.getElementById("authLoadingText");
const authMessage = document.getElementById("authMessage");
const authInlineNote = document.querySelector(".auth-inline-note");

const authNameRow = authFirstNameInput ? authFirstNameInput.closest(".auth-form-row") : null;
const authDobLabel = authDobInput ? authDobInput.closest("label") : null;

let authFormMode = "signin"; // "signin" | "signup"
let verificationRequiredEmail = "";
let lastVerificationSentAt = 0;
let authRequestInProgress = false;

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

function buildVerificationActionSettings() {
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return undefined;
  }

  return {
    url: `${window.location.origin}${window.location.pathname}`,
    handleCodeInApp: false
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getErrorCode(error, fallback = "auth/unknown") {
  return error && typeof error.code === "string" ? error.code : fallback;
}

function isRetryableVerificationErrorCode(code) {
  return code === "auth/network-request-failed" || code === "auth/request-timeout";
}

async function sendVerificationAttempt(user, actionCodeSettings) {
  const sendPromise = actionCodeSettings
    ? sendEmailVerification(user, actionCodeSettings)
    : sendEmailVerification(user);

  try {
    await withTimeout(sendPromise, EMAIL_SEND_TIMEOUT_MS);
    return { ok: true, reason: "sent" };
  } catch (firstError) {
    const firstCode = getErrorCode(firstError);
    if (!isRetryableVerificationErrorCode(firstCode)) {
      return { ok: false, code: firstCode, error: firstError };
    }

    await sleep(EMAIL_SEND_RETRY_DELAY_MS);

    const retryPromise = actionCodeSettings
      ? sendEmailVerification(user, actionCodeSettings)
      : sendEmailVerification(user);

    try {
      await withTimeout(retryPromise, EMAIL_SEND_TIMEOUT_MS);
      return { ok: true, reason: "sent-retry" };
    } catch (retryError) {
      return {
        ok: false,
        code: getErrorCode(retryError),
        error: retryError
      };
    }
  }
}

function formatVerificationRetrySeconds(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return `${seconds}s`;
}

function getVerificationSendMessage(result) {
  if (!result || typeof result !== "object") {
    return "Could not send verification right now.";
  }

  if (result.ok) {
    return "Verification email sent. Check inbox/spam/promotions.";
  }

  if (result.reason === "cooldown") {
    return `Please wait ${formatVerificationRetrySeconds(result.retryAfterMs || 0)} before resending.`;
  }

  if (result.code === "auth/too-many-requests") {
    return "Too many verification attempts. Please wait a moment and try again.";
  }

  if (result.code === "auth/network-request-failed" || result.code === "auth/request-timeout") {
    return "Could not send verification due to network issues. Try again shortly.";
  }

  if (result.code === "auth/unauthorized-continue-uri" || result.code === "auth/invalid-continue-uri") {
    return "Verification email could not be sent due to auth domain settings.";
  }

  return "Could not send verification right now. Use resend after a short wait.";
}

async function sendVerificationEmailIfPossible(user, options = {}) {
  const skipCooldown = Boolean(options.skipCooldown);
  if (!user || !user.email) {
    return { ok: false, reason: "missing-user", code: "auth/missing-user" };
  }

  const now = Date.now();
  const sinceLastSent = now - lastVerificationSentAt;
  if (!skipCooldown && sinceLastSent < VERIFICATION_RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterMs: VERIFICATION_RESEND_COOLDOWN_MS - sinceLastSent
    };
  }

  const actionCodeSettings = buildVerificationActionSettings();
  const primaryAttempt = await sendVerificationAttempt(user, actionCodeSettings);
  if (primaryAttempt.ok) {
    lastVerificationSentAt = now;
    return {
      ok: true,
      reason: primaryAttempt.reason || "sent"
    };
  }

  const primaryCode = String(primaryAttempt.code || "");
  const shouldFallbackToPlainSend = Boolean(actionCodeSettings)
    && (primaryCode === "auth/unauthorized-continue-uri"
      || primaryCode === "auth/invalid-continue-uri"
      || primaryCode === "auth/missing-continue-uri");

  if (shouldFallbackToPlainSend) {
    const fallbackAttempt = await sendVerificationAttempt(user, undefined);
    if (fallbackAttempt.ok) {
      lastVerificationSentAt = now;
      return {
        ok: true,
        reason: "sent-fallback"
      };
    }

    console.warn("Verification email fallback send failed.", fallbackAttempt.error || fallbackAttempt.code);
    return { ok: false, reason: "error", code: String(fallbackAttempt.code || "auth/unknown") };
  }

  console.warn("Verification email send failed.", primaryAttempt.error || primaryAttempt.code);
  return { ok: false, reason: "error", code: primaryCode || "auth/unknown" };
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
  const targets = [authSubmitBtn, authSignInBtn, authSignUpBtn, authGoogleBtn, authGuestBtn, authResendVerificationBtn];
  targets.forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

function setButtonVariant(button, usePrimary) {
  if (!button) {
    return;
  }

  button.classList.toggle("btn-primary", usePrimary);
  button.classList.toggle("btn-glass", !usePrimary);
}

function setVerificationResendVisibility(visible, email = "") {
  if (!authResendVerificationBtn) {
    return;
  }

  authResendVerificationBtn.classList.toggle("hidden", !visible);
  if (visible && authEmailInput && email && !String(authEmailInput.value || "").trim()) {
    authEmailInput.value = email;
  }
}

function setVerificationRequiredEmail(email) {
  verificationRequiredEmail = String(email || "").trim();
  setVerificationResendVisibility(Boolean(verificationRequiredEmail), verificationRequiredEmail);
}

function clearVerificationRequiredEmail() {
  verificationRequiredEmail = "";
  setVerificationResendVisibility(false);
}

function setAuthFormMode(nextMode) {
  authFormMode = nextMode === "signup" ? "signup" : "signin";
  const isSignUp = authFormMode === "signup";

  if (authNameRow) {
    authNameRow.classList.toggle("hidden", !isSignUp);
  }
  if (authDobLabel) {
    authDobLabel.classList.toggle("hidden", !isSignUp);
  }

  if (authFirstNameInput) {
    authFirstNameInput.disabled = !isSignUp;
    authFirstNameInput.required = isSignUp;
  }
  if (authLastNameInput) {
    authLastNameInput.disabled = !isSignUp;
    authLastNameInput.required = isSignUp;
  }
  if (authDobInput) {
    authDobInput.disabled = !isSignUp;
    authDobInput.required = isSignUp;
  }
  if (authPasswordInput) {
    authPasswordInput.setAttribute("autocomplete", isSignUp ? "new-password" : "current-password");
  }

  setButtonVariant(authSignInBtn, !isSignUp);
  setButtonVariant(authSignUpBtn, isSignUp);

  if (authSubmitBtn) {
    authSubmitBtn.textContent = isSignUp ? "Submit Sign Up" : "Submit Sign In";
  }

  if (authInlineNote) {
    authInlineNote.textContent = isSignUp
      ? "Sign up requires first name, surname, date of birth, email, and password."
      : "Sign in uses email and password only.";
  }

  if (isSignUp) {
    setVerificationResendVisibility(false);
  } else {
    setVerificationResendVisibility(Boolean(verificationRequiredEmail), verificationRequiredEmail);
  }
}

function setAuthLoading(isLoading, text = "Processing request...") {
  if (!authLoading) {
    return;
  }

  authLoading.classList.toggle("hidden", !isLoading);
  authLoading.setAttribute("aria-hidden", String(!isLoading));
  if (authLoadingText) {
    authLoadingText.textContent = text;
  }
  if (authForm) {
    authForm.setAttribute("aria-busy", String(isLoading));
  }
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

function removeStoredProfile(uid) {
  if (!uid) {
    return;
  }

  const map = loadProfilesMap();
  if (!(uid in map)) {
    return;
  }

  delete map[uid];
  saveProfilesMap(map);
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
  if (code === "auth/requires-recent-login") {
    return "For security, please sign in again before deleting your account.";
  }
  if (code === "auth/email-not-verified") {
    return "Please verify your email address before signing in.";
  }
  if (code === "app/data-delete-failed") {
    return "Could not delete cloud data. Please try again while signed in.";
  }

  return "Authentication failed. Please try again.";
}

function validateSignUpProfile(input) {
  if (!input.firstName || input.firstName.length < 2) {
    return "Enter your first name (at least 2 characters).";
  }
  if (!input.lastName || input.lastName.length < 2) {
    return "Enter your surname (at least 2 characters).";
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
  setAuthLoading(true, "Signing in...");
  setAuthMessage("");
  authRequestInProgress = true;

  try {
    const credential = await withTimeout(
      signInWithEmailPassword(email, password),
      AUTH_REQUEST_TIMEOUT_MS
    );

    if (credential?.user) {
      const signedInUser = auth.currentUser || credential.user;
      if (!signedInUser.emailVerified) {
        const verificationResult = await sendVerificationEmailIfPossible(signedInUser);
        setVerificationRequiredEmail(String(signedInUser.email || email).trim());

        try {
          await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
        } catch (error) {
          // If sign-out fails, still surface a trust-gate event.
          emitAuthChanged({
            mode: "verification_required",
            email: verificationRequiredEmail,
            verificationEmailSent: verificationResult.ok
          });
        }

        setAuthMessage(
          `Verify your email before signing in. ${getVerificationSendMessage(verificationResult)}`,
          true
        );
        return;
      }
    }

    clearVerificationRequiredEmail();
    syncProfileFromAuthUser(credential?.user);
    setAuthMessage("Signed in successfully.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    authRequestInProgress = false;
    setAuthLoading(false);
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
  setAuthLoading(true, "Creating your account...");
  setAuthMessage("");
  authRequestInProgress = true;

  try {
    const credential = await withTimeout(
      signUpWithEmailPassword(input.email, input.password),
      AUTH_REQUEST_TIMEOUT_MS
    );

    // Send verification first so the email dispatch starts as early as possible.
    const verificationResult = await sendVerificationEmailIfPossible(credential.user, { skipCooldown: true });
    setVerificationRequiredEmail(String(input.email || credential.user?.email || "").trim());

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

    try {
      await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
    } catch (error) {
      emitAuthChanged({
        mode: "verification_required",
        email: verificationRequiredEmail,
        verificationEmailSent: verificationResult.ok
      });
    }

    setAuthFormMode("signin");
    if (authPasswordInput) {
      authPasswordInput.value = "";
    }
    setAuthMessage(
      verificationResult.ok
        ? "Account created. Verification email sent. Check inbox/spam/promotions, then sign in."
        : `Account created, but verification was not sent. ${getVerificationSendMessage(verificationResult)}`,
      !verificationResult.ok
    );
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    authRequestInProgress = false;
    setAuthLoading(false);
    setAuthButtonsBusy(false);
  }
}

async function onGoogleSignInClick() {
  setAuthButtonsBusy(true);
  setAuthLoading(true, "Opening Google sign-in...");
  setAuthMessage("");
  authRequestInProgress = true;

  try {
    const credential = await withTimeout(signInWithGoogle(), AUTH_REQUEST_TIMEOUT_MS);

    if (credential?.user) {
      const signedInUser = auth.currentUser || credential.user;
      if (!signedInUser.emailVerified) {
        setVerificationRequiredEmail(String(signedInUser.email || "").trim());
        await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
        setAuthMessage("This Google account email must be verified before sign-in.", true);
        return;
      }
    }

    clearVerificationRequiredEmail();
    syncProfileFromAuthUser(credential?.user);
    setAuthMessage("Signed in with Google.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    authRequestInProgress = false;
    setAuthLoading(false);
    setAuthButtonsBusy(false);
  }
}

async function onResendVerificationClick() {
  const { email: inputEmail, password } = normalizeAuthInput();
  const email = String(inputEmail || verificationRequiredEmail || "").trim();

  if (!isLikelyEmail(email)) {
    setAuthMessage("Enter your account email to resend verification.", true);
    return;
  }
  if (!password) {
    setAuthMessage("Enter your password to resend verification.", true);
    return;
  }

  setAuthButtonsBusy(true);
  setAuthLoading(true, "Sending verification email...");
  setAuthMessage("");
  authRequestInProgress = true;

  try {
    const credential = await withTimeout(
      signInWithEmailPassword(email, password),
      AUTH_REQUEST_TIMEOUT_MS
    );

    let activeUser = credential?.user || auth.currentUser;
    if (!activeUser) {
      throw { code: "auth/invalid-credential" };
    }

    if (activeUser.emailVerified) {
      clearVerificationRequiredEmail();
      setAuthMessage("Email already verified. Please sign in now.");
      try {
        await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
      } catch (error) {
        // If sign-out fails here, user can still continue to the app.
      }
      return;
    }

    const verificationResult = await sendVerificationEmailIfPossible(activeUser, { skipCooldown: true });
    setVerificationRequiredEmail(String(activeUser.email || email).trim());
    setAuthMessage(
      getVerificationSendMessage(verificationResult),
      !verificationResult.ok
    );
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    try {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
      }
    } catch (error) {
      // Keep trust gate active even if sign-out fails.
    }

    authRequestInProgress = false;
    setAuthLoading(false);
    setAuthButtonsBusy(false);
  }
}

function initializeAuthPageBindings() {
  if (!authSignInBtn || !authSignUpBtn || !authForm || !authSubmitBtn) {
    return;
  }

  // Ensure actions are clickable immediately on load.
  setAuthButtonsBusy(false);
  setAuthLoading(false);
  setAuthFormMode("signin");
  setVerificationResendVisibility(false);

  authSignInBtn.addEventListener("click", () => {
    setAuthFormMode("signin");
    setAuthMessage("");
    authEmailInput?.focus();
  });

  authSignUpBtn.addEventListener("click", () => {
    setAuthFormMode("signup");
    clearVerificationRequiredEmail();
    setAuthMessage("");
    authFirstNameInput?.focus();
  });

  if (authGoogleBtn) {
    authGoogleBtn.addEventListener("click", () => {
      onGoogleSignInClick();
    });
  }

  if (authFirstNameInput) {
    authFirstNameInput.addEventListener("focus", () => {
      setAuthFormMode("signup");
    });
  }
  if (authLastNameInput) {
    authLastNameInput.addEventListener("focus", () => {
      setAuthFormMode("signup");
    });
  }
  if (authDobInput) {
    authDobInput.addEventListener("focus", () => {
      setAuthFormMode("signup");
    });
  }

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (authFormMode === "signup") {
      onSignUpClick();
      return;
    }
    onSignInClick();
  });

  if (authResendVerificationBtn) {
    authResendVerificationBtn.addEventListener("click", () => {
      onResendVerificationClick();
    });
  }
}

function initializeAuthBridge() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const activeUser = user;

      if (!activeUser.emailVerified) {
        if (authRequestInProgress) {
          return;
        }

        const verificationResult = await sendVerificationEmailIfPossible(activeUser);
        setVerificationRequiredEmail(String(activeUser.email || "").trim());

        try {
          await withTimeout(signOut(auth), AUTH_REQUEST_TIMEOUT_MS);
        } catch (error) {
          emitAuthChanged({
            mode: "verification_required",
            email: verificationRequiredEmail,
            verificationEmailSent: verificationResult.ok
          });
        }
        return;
      }

      clearVerificationRequiredEmail();
      const profile = syncProfileFromAuthUser(activeUser);
      emitAuthChanged({
        mode: "user",
        email: (profile && profile.email) || activeUser.email || "",
        profile: profile || null,
        user: activeUser,
        emailVerified: true
      });
      return;
    }

    setAuthFormMode("signin");
    if (authPasswordInput) {
      authPasswordInput.value = "";
    }
    if (verificationRequiredEmail) {
      emitAuthChanged({
        mode: "verification_required",
        email: verificationRequiredEmail
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

  window.addEventListener("sanctuary:request-delete-account", async () => {
    const user = auth.currentUser;
    if (!user) {
      window.dispatchEvent(new CustomEvent("sanctuary:delete-account-result", {
        detail: {
          ok: false,
          message: "No signed-in account found."
        }
      }));
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const analyticsDocRef = doc(db, "users", user.uid, "private", "appData");
      const deleteResults = await Promise.allSettled([
        deleteDoc(analyticsDocRef),
        deleteDoc(userDocRef)
      ]);
      const hasDeleteFailure = deleteResults.some((result) => result.status === "rejected");
      if (hasDeleteFailure) {
        throw { code: "app/data-delete-failed" };
      }

      await deleteUser(user);
      removeStoredProfile(user.uid);
      clearVerificationRequiredEmail();
      emitAuthChanged({ mode: "signed_out" });
      window.dispatchEvent(new CustomEvent("sanctuary:delete-account-result", {
        detail: { ok: true }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent("sanctuary:delete-account-result", {
        detail: {
          ok: false,
          message: getFriendlyAuthError(error)
        }
      }));
    }
  });
}

initializeAuthPageBindings();
initializeAuthBridge();
