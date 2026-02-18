import { auth, googleProvider } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  validatePassword
} from "firebase/auth";

const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("authEmailInput");
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

function normalizeAuthInput() {
  const email = String(authEmailInput?.value || "").trim();
  const password = String(authPasswordInput?.value || "");
  return { email, password };
}

function isLikelyEmail(value) {
  return /.+@.+\..+/.test(value);
}

function formatRequirementList(items) {
  if (items.length <= 1) {
    return items[0] || "at least 8 chars, upper, lower, number, special";
  }

  return items.join(", ");
}

async function getPasswordPolicyFeedback(password) {
  try {
    const status = await validatePassword(auth, password);
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
    // Fallback when password policy metadata cannot be fetched.
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

  return "Authentication failed. Please try again.";
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
    await signInWithEmailPassword(email, password);
    setAuthMessage("Signed in successfully.");
  } catch (error) {
    setAuthMessage(getFriendlyAuthError(error), true);
  } finally {
    setAuthButtonsBusy(false);
  }
}

async function onSignUpClick() {
  const { email, password } = normalizeAuthInput();

  if (!isLikelyEmail(email)) {
    setAuthMessage("Enter a valid email address.", true);
    return;
  }

  const policy = await getPasswordPolicyFeedback(password);
  if (!policy.isValid) {
    setAuthMessage(policy.message || "Password does not meet the required policy.", true);
    return;
  }

  setAuthButtonsBusy(true);
  setAuthMessage("Creating your account...");

  try {
    await signUpWithEmailPassword(email, password);
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
    await signInWithGoogle();
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

initializeAuthPageBindings();
