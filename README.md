# Sanctuary Study

Sanctuary Study is a single-page Christian study and focus app built with plain HTML, CSS, and JavaScript, with Firebase Authentication for accounts.

It combines Pomodoro-style focus sessions, scripture encouragement, analytics, achievements, favourites, notes, and background music in one minimal UI.

## Features

- Study/break timer cycle with presets (`25/5`, `50/10`, `90/15`, custom)
- Scripture popup before study sessions (theme-based verse + encouragement)
- Daily study tracking, streaks, and achievements
- Analytics views:
  - last 60 days study graph
  - weekly time by tag
  - achievement progress
- Session tags (e.g. Algorithms, Revision, Bible reading)
- Session notes + task checklist
- Favourites/Sanctuary section for saved verses and encouragements
- Theme toggle (dark/light)
- Background music support:
  - local tracks
  - presets
  - YouTube iframe support where available
- Authentication:
  - Email/password sign up + sign in
  - Google sign in
  - Guest mode (timer available, analytics/achievements restricted)
- Legal pages:
  - `privacy.html`
  - `terms.html`

## Tech Stack

- Frontend: HTML, CSS, JavaScript (vanilla)
- Auth/Backend services: Firebase
  - Firebase Authentication
  - Firebase Analytics (optional/available in config)
  - Firestore can be added later
- Persistence: `localStorage` (settings, local analytics cache, favourites, notes, etc.)

## Project Structure

```text
.
├── index.html          # Main SPA shell
├── style.css           # Main app styling
├── app.js              # Core app logic (timer, analytics, UI, music, achievements)
├── auth.js             # Firebase auth flows + auth event bridge
├── firebase.js         # Firebase initialization and exports
├── privacy.html        # Privacy Policy page
├── terms.html          # Terms of Use page
├── legal.css           # Shared styling for legal pages
├── sounds/             # Alarm sounds
└── music/              # Local background music tracks
```

## How to Run

Do **not** open `index.html` directly with `file://` for auth testing.

Run a local web server from the project folder:

```bash
cd "/Users/treasureokoye/Documents/Personal Projects"
python3 -m http.server 3000
```

Then open:

```text
http://localhost:3000/index.html
```

## Firebase Setup Notes

This project already contains Firebase configuration in `firebase.js`.

Make sure the Firebase console is configured correctly:

1. Enable **Authentication > Sign-in method**
   - Email/Password
   - Google (optional, if you want Google sign in)
2. Add authorized domain(s), for local development:
   - `localhost`
   - `127.0.0.1` (optional)

If auth appears slow/unavailable, first verify you are running from `http://localhost` (not `file://`).

## Theme Behavior

- Theme is controlled by `body[data-theme="dark" | "light"]`
- Preference is saved in localStorage key: `theme`
- Default on first load is dark mode unless user toggles

## Notes

- No build step is required.
- No framework is required.
- The app is designed to be easy to read and modify for learning/personal use.

