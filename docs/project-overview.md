# SignBridge AI — Project Overview

**What is it?** A free website that converts English text (or video/audio) into American Sign Language (ASL) using a 3D animated avatar.

**Who is it for?** Deaf & hard-of-hearing individuals, their families, ASL learners, and educators.

**Date:** February 2026

---

## What Does SignBridge Do?

1. **You type English text** → a 3D human avatar performs the sign language on screen
2. **You paste a YouTube link** → the app extracts the audio, converts speech to text, then the avatar signs it
3. **Word-by-word highlighting** — you can follow along as each word is being signed
4. **Playback controls** — play, pause, replay, and adjust speed (0.5×, 1×, 1.5×)

No sign-up, no payment, no installation. Just open the website and use it.

---

## What Has Been Built

### Frontend (What the User Sees)

| Feature | Status | Description |
|---------|--------|-------------|
| Home Page | ✅ Done | Landing page with project intro, features, and the translator tool |
| About Page | ✅ Done | Information about the project, team, and mission |
| Text Input | ✅ Done | Type English text (up to 500 characters) to convert |
| Video/Link Input | ✅ Done | Paste a YouTube or video URL for transcription |
| Tab Switcher | ✅ Done | Toggle between "Text" and "Video Link" input modes |
| 3D Avatar | ✅ Done | A realistic 3D human model that performs signs on screen |
| Fingerspelling (A–Z) | ✅ Done | Avatar spells out any word letter-by-letter using hand shapes |
| Common Signs (~50 words) | ✅ Done | Pre-built signs for words like "hello", "thank you", "yes", "no", etc. |
| Word Highlighting | ✅ Done | Each word lights up as the avatar signs it |
| Playback Controls | ✅ Done | Play, pause, replay, and speed adjustment buttons |
| Fullscreen Mode | ✅ Done | Expand the avatar to full screen for a better view |
| Progress Bar | ✅ Done | Shows how far along the signing is |
| Mobile Friendly | ✅ Done | Works on phones and tablets |
| Error Handling | ✅ Done | Friendly messages if something goes wrong (e.g. WebGL not supported) |

### Backend (Behind the Scenes)

| Feature | Status | Description |
|---------|--------|-------------|
| Video Transcription API | ✅ Done | Extracts audio from YouTube videos and converts speech to text |
| Text Processing API | ✅ Done | Cleans and simplifies English text before signing using Mistral AI |
| Health Check API | ✅ Done | Quick check to confirm the server is running |

> The backend handles the heavy processing — extracting audio from videos, converting speech to text, and simplifying sentences so the avatar can sign them clearly.

---

## Technology Used (Simple Explanation)

### Frontend — "The visible part"

| Tool | What It Does |
|------|-------------|
| **React** | Builds the interactive user interface (buttons, pages, forms) |
| **Vite** | Makes the website load fast during development and production |
| **Tailwind CSS** | Styles everything — colors, layouts, spacing, responsiveness |
| **Three.js + React Three Fiber** | Renders the 3D avatar in the browser |
| **Mixamo GLB (local)** | The 3D avatar model loaded from `/public/avatar.glb` with `mixamorig` hand/finger bones |
| **Zustand** | Manages app state (what's playing, which word is active, etc.) |
| **React Router** | Handles page navigation (Home, About) |
| **Lucide React** | Provides the icons used throughout the interface |

### Backend — "The engine room"

| Tool | What It Does |
|------|-------------|
| **Python + FastAPI** | Runs the server that processes requests |
| **Mistral AI** (via Ollama) | AI model that simplifies and cleans up English text for better signing |
| **faster-whisper** | Converts speech from videos into written text (speech-to-text) |
| **yt-dlp** | Downloads audio from YouTube videos for processing |
| **Ollama** | Runs the Mistral AI model locally on your computer (no cloud needed) |

---

## How It All Works Together

```
   YOU (User)
    │
    ├── Type text ──────────────────┐
    │                               ▼
    │                     ┌─────────────────┐
    │                     │   Frontend       │
    │                     │   (React App)    │
    │                     │                  │
    │                     │  Looks up each   │
    │                     │  word → finds    │
    │                     │  sign or spells  │
    │                     │  it out          │
    │                     │                  │
    │                     │  3D Avatar       │
    │                     │  performs the    │
    │                     │  signs           │
    │                     └─────────────────┘
    │
    └── Paste video link ───────────┐
                                    ▼
                          ┌─────────────────┐
                          │   Backend        │
                          │   (Python)       │
                          │                  │
                          │  1. Downloads    │
                          │     audio        │
                          │  2. Converts     │
                          │     speech →     │
                          │     text         │
                          │  3. Mistral AI   │
                          │     cleans the   │
                          │     text         │
                          │  4. Sends clean  │
                          │     text back    │
                          └────────┬────────┘
                                   │
                                   ▼
                          Frontend receives
                          text → avatar signs it
```

---

## Sign Language Coverage

| Type | How Many | How It Works |
|------|----------|-------------|
| **Full Signs** | ~50 common words | The avatar performs a natural-looking sign (e.g. waving for "hello") |
| **Fingerspelling** | All 26 letters (A–Z) | For any word not in the dictionary, the avatar spells it out letter by letter |
| **Total Coverage** | 100% of English words | Every word either has a sign or gets fingerspelled — nothing is skipped |

> **Note:** Version 1.0 signs words in English order (not true ASL grammar, which has a different word order). This is clearly shown to users.

---

## What's Coming Next (Future Plans)

- **More signs** — expand the vocabulary beyond 50 words
- **Bangla Sign Language (BDSL)** — support for Bangla-speaking deaf community
- **Camera input** — user signs in front of camera, app translates to text
- **Multiple languages** — BSL (British), ISL (Indian), and more
- **ASL learning mode** — interactive lessons to learn sign language
- **Mobile app** — dedicated app for Android/iOS

---

## Quick Facts

| | |
|---|---|
| **Cost** | 100% Free |
| **Sign-up required?** | No |
| **Works on mobile?** | Yes |
| **Internet required?** | Yes (for the website; backend runs locally) |
| **AI Model used** | Mistral (via Ollama, runs on your computer) |
| **3D Avatar** | Local Mixamo-compatible GLB with full finger rig |
| **Browser support** | Chrome, Firefox, Edge, Safari (needs WebGL) |
| **Open source?** | Yes |
