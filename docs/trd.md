# SignBridge AI — Technical Requirements Document (TRD)

**Version:** 1.0  
**Last Updated:** February 28, 2026  
**Status:** In Development  

---

## 1. System Architecture Overview

SignBridge AI is a **two-part system**: a React frontend that renders the 3D signing avatar and a Python FastAPI backend that handles video transcription and text processing.

```
┌──────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│                                                          │
│   ┌────────────┐     ┌──────────────────────────────┐    │
│   │ Text Input │     │   @react-three/fiber Canvas   │    │
│   │ URL Input  │────▶│   Mixamo GLB Avatar           │    │
│   │ Mic Input  │     │   Skeletal Animation Engine    │    │
│   └────────────┘     └──────────────────────────────┘    │
│         │                         ▲                      │
│         │ API calls               │ Sign data            │
│         ▼                         │                      │
│   ┌─────────────────┐   ┌────────────────────┐          │
│   │  API Service    │   │ Sign Router        │          │
│   │  (src/services) │   │ Fingerspelling DB  │          │
│   └────────┬────────┘   │ Sign Vocabulary DB │          │
│            │             └────────────────────┘          │
└────────────┼─────────────────────────────────────────────┘
             │ HTTP (localhost:8000)
             ▼
┌──────────────────────────────────────────────────────────┐
│                 PYTHON BACKEND (FastAPI)                  │
│                                                          │
│   ┌──────────────────┐   ┌────────────────────────┐     │
│   │ /api/transcribe  │   │ /api/process-text      │     │
│   │                  │   │                        │     │
│   │ yt-dlp           │   │ Ollama (Llama 3.1 8B)  │     │
│   │ faster-whisper   │   │ Text simplification    │     │
│   └──────────────────┘   └────────────────────────┘     │
│                                                          │
│   ┌──────────────────┐                                   │
│   │ /api/health      │                                   │
│   └──────────────────┘                                   │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI framework |
| **Vite** | 7.x | Build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **React Router** | 7.x | Client-side routing (/, /about) |
| **@react-three/fiber** | 9.x | React renderer for Three.js |
| **@react-three/drei** | 9.x | Three.js helpers (useGLTF, useAnimations, etc.) |
| **Three.js** | 0.170+ | 3D rendering engine |
| **Zustand** | 5.x | Lightweight state management |
| **Lucide React** | 0.575+ | Icon library |

### 2.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.11+ | Backend language |
| **FastAPI** | 0.115+ | API framework |
| **Uvicorn** | 0.34+ | ASGI server |
| **faster-whisper** | 1.1+ | Speech-to-text (CTranslate2-optimized Whisper) |
| **yt-dlp** | 2024+ | YouTube/video audio extraction |
| **Ollama** | 0.5+ | Local LLM runtime |
| **Llama 3.1 8B** | via Ollama | Text simplification & cleanup |
| **httpx** | 0.28+ | Async HTTP client (for Ollama API) |
| **Pydantic** | 2.x | Request/response validation |

### 2.3 Infrastructure

| Component | Detail |
|-----------|--------|
| **Frontend hosting** | Vite dev server (localhost:5173) |
| **Backend hosting** | Uvicorn (localhost:8000) |
| **Ollama** | Local daemon (localhost:11434) |
| **GPU requirement** | NVIDIA RTX 3060+ for Whisper acceleration |
| **OS** | Linux (primary), macOS/Windows (compatible) |

---

## 3. Project Structure

### 3.1 Complete File Tree

```
SignBridge/
│
├── docs/                              # Documentation
│   ├── prd.md                         # Product Requirements Document
│   ├── trd.md                         # Technical Requirements Document (this file)
│   ├── backend-implementation.md      # Backend step-by-step plan
│   └── frontend-implementation.md     # Frontend step-by-step plan
│
├── backend/                           # Python backend (FastAPI)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry, CORS, router mounting
│   │   ├── config.py                  # Settings (model paths, Ollama URL, etc.)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── transcribe.py          # POST /api/transcribe
│   │   │   ├── process_text.py        # POST /api/process-text
│   │   │   └── health.py             # GET /api/health
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── whisper_service.py     # Whisper model singleton + transcribe()
│   │       ├── audio_service.py       # yt-dlp audio extraction
│   │       └── llm_service.py         # Ollama client + text processing prompt
│   ├── temp/                          # Temporary audio files (gitignored)
│   ├── requirements.txt
│   ├── .env.example                   # Environment variable template
│   └── README.md                      # Backend setup instructions
│
├── public/                            # Static assets
│   ├── SignBridge logo.png
│   ├── vite.svg
│   └── models/                        # 3D avatar models
│       └── avatar.glb                 # Local Mixamo-compatible avatar
│
├── src/                               # React frontend
│   ├── main.jsx                       # React entry point
│   ├── App.jsx                        # Router setup
│   ├── index.css                      # Tailwind imports + theme
│   │
│   ├── components/
│   │   ├── layout/                    # App shell
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── RootLayout.jsx
│   │   │   └── index.js
│   │   └── ui/                        # Reusable UI components
│   │       ├── FeatureCard.jsx
│   │       ├── InfoCard.jsx
│   │       ├── SocialIcon.jsx
│   │       ├── TabSwitch.jsx
│   │       ├── TechBadge.jsx
│   │       ├── LoadingSpinner.jsx     # NEW — loading indicator
│   │       ├── ErrorMessage.jsx       # NEW — error display
│   │       └── index.js
│   │
│   ├── features/
│   │   ├── translator/                # Translation feature module
│   │   │   ├── components/
│   │   │   │   ├── InputPanel.jsx     # Text/URL input + convert button
│   │   │   │   ├── AvatarPanel.jsx    # Composes avatar + controls + transcript
│   │   │   │   ├── AvatarDisplay.jsx  # REPLACE — will mount AvatarScene
│   │   │   │   ├── PlayerControls.jsx # Play/pause/speed controls
│   │   │   │   ├── Transcript.jsx     # Word-by-word highlight display
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   │   ├── useTranslator.js   # Core translation state & logic
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   └── avatar/                    # NEW — 3D avatar feature module
│   │       ├── components/
│   │       │   ├── AvatarScene.jsx    # R3F <Canvas> + lighting + camera
│   │       │   ├── SignAvatar.jsx     # Avatar model + bone control
│   │       │   └── index.js
│   │       ├── hooks/
│   │       │   ├── useAvatarAnimation.js  # Animation state machine
│   │       │   └── index.js
│   │       ├── services/
│   │       │   ├── signRouter.js      # Word → sign lookup + fingerspell fallback
│   │       │   └── index.js
│   │       └── index.js
│   │
│   ├── data/                          # NEW — Sign language data
│   │   ├── fingerspelling.js          # 26 letter → bone rotation mappings
│   │   ├── signs.js                   # ~50 common sign animation keyframes
│   │   └── signDictionary.js          # Word → signId lookup table
│   │
│   ├── services/                      # NEW — API client layer
│   │   ├── api.js                     # Backend API calls (transcribe, processText)
│   │   └── index.js
│   │
│   ├── hooks/                         # NEW — Shared custom hooks
│   │   ├── useSpeechRecognition.js    # Web Speech API wrapper
│   │   └── index.js
│   │
│   ├── stores/                        # NEW — Zustand state stores
│   │   ├── useTranslatorStore.js      # Input text, tab, processed words
│   │   ├── usePlaybackStore.js        # isPlaying, currentIndex, speed
│   │   └── index.js
│   │
│   ├── constants/
│   │   ├── app.js                     # Brand colors, config values
│   │   └── index.js
│   │
│   ├── utils/
│   │   ├── text.js                    # splitIntoWords, calculateProgress
│   │   └── index.js
│   │
│   ├── pages/
│   │   ├── HomePage.jsx               # Hero + translator interface
│   │   ├── AboutPage.jsx              # About + mission + tech
│   │   └── index.js
│   │
│   └── assets/                        # Static imports (images, etc.)
│
├── package.json
├── vite.config.js
├── eslint.config.js
├── index.html
├── .gitignore
└── README.md
```

### 3.2 What Already Exists vs. What's New

| Status | Files |
|--------|-------|
| **EXISTS** | All files under `components/layout/`, `components/ui/`, `features/translator/`, `pages/`, `constants/`, `utils/`, plus `App.jsx`, `main.jsx`, `index.css` |
| **NEW** | `features/avatar/`, `data/`, `services/`, `hooks/`, `stores/`, `backend/`, `docs/`, `public/models/` |
| **MODIFY** | `AvatarDisplay.jsx` (replace placeholder with 3D scene), `useTranslator.js` (add API/avatar integration), `InputPanel.jsx` (add URL input mode), `PlayerControls.jsx` (add working speed control), `package.json` (new deps) |
| **DELETE** | `src/SignBridgeApp.jsx` (dead code — old monolith) |

---

## 4. API Specifications

### 4.1 Backend Base URL
```
http://localhost:8000
```

### 4.2 Endpoints

#### `GET /api/health`
Health check for frontend to verify backend is running.

**Response:**
```json
{
  "status": "ok",
  "whisper_loaded": true,
  "ollama_available": true
}
```

---

#### `POST /api/transcribe`
Extracts audio from a video URL and transcribes it to English text.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "max_duration": 300
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | YouTube URL or direct video/audio file URL |
| `max_duration` | int | No | Max seconds to transcribe (default: 300) |

**Response (200):**
```json
{
  "text": "Hello everyone, today we will learn about...",
  "words": [
    { "word": "hello", "start": 0.0, "end": 0.52 },
    { "word": "everyone", "start": 0.52, "end": 1.1 },
    { "word": "today", "start": 1.2, "end": 1.6 }
  ],
  "duration": 62.5,
  "language": "en"
}
```

**Error Response (422):**
```json
{
  "detail": "Invalid URL format"
}
```

**Error Response (400):**
```json
{
  "detail": "Video exceeds 5-minute limit"
}
```

---

#### `POST /api/process-text`
Cleans, simplifies, and tokenizes English text for sign language display.

**Request:**
```json
{
  "text": "I am going to the store to buy some groceries"
}
```

**Response (200):**
```json
{
  "original": "I am going to the store to buy some groceries",
  "processed_words": ["i", "go", "store", "buy", "grocery"],
  "removed": ["am", "to", "the", "some"],
  "changes": [
    { "from": "going", "to": "go", "reason": "lemmatized" },
    { "from": "groceries", "to": "grocery", "reason": "lemmatized" },
    { "from": "am", "to": null, "reason": "auxiliary verb removed" },
    { "from": "the", "to": null, "reason": "article removed" }
  ]
}
```

---

## 5. Data Models

### 5.1 Fingerspelling Data Structure
Each letter maps to a set of bone quaternion rotations for the right hand (15 bones).

```javascript
// src/data/fingerspelling.js
export const FINGERSPELLING = {
  A: {
    duration: 400,    // ms to hold this pose
    hand: 'right',
    bones: {
      'RightHandThumb1':  { x: 0.1, y: 0.2, z: 0.0, w: 0.97 },
      'RightHandThumb2':  { x: 0.0, y: 0.1, z: 0.0, w: 0.99 },
      'RightHandIndex1':  { x: 0.7, y: 0.0, z: 0.0, w: 0.71 },
      'RightHandIndex2':  { x: 0.7, y: 0.0, z: 0.0, w: 0.71 },
      'RightHandIndex3':  { x: 0.5, y: 0.0, z: 0.0, w: 0.87 },
      // ... all 15 hand bones
    }
  },
  B: { /* ... */ },
  // ... A through Z
};
```

### 5.2 Sign Animation Data Structure
Each sign is a sequence of keyframe poses with timing.

```javascript
// src/data/signs.js
export const SIGNS = {
  hello: {
    id: 'hello',
    duration: 1200,   // total animation time in ms
    keyframes: [
      {
        time: 0,       // ms from start
        bones: {
          'RightUpperArm': { x: 0.0, y: 0.0, z: -0.3, w: 0.95 },
          'RightForeArm':  { x: 0.2, y: 0.0, z: 0.0, w: 0.98 },
          'RightHand':     { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
          // ... open hand, palm facing out
        }
      },
      {
        time: 600,
        bones: {
          'RightUpperArm': { x: 0.0, y: 0.3, z: -0.3, w: 0.90 },
          // ... wave motion
        }
      },
      {
        time: 1200,
        bones: {
          // ... return to neutral
        }
      }
    ]
  },
  // ... more signs
};
```

### 5.3 Sign Dictionary Structure
Simple word → sign ID lookup with synonym support.

```javascript
// src/data/signDictionary.js
export const SIGN_DICTIONARY = {
  'hello':     'hello',
  'hi':        'hello',
  'hey':       'hello',
  'thank':     'thank-you',
  'thanks':    'thank-you',
  'thank-you': 'thank-you',
  'yes':       'yes',
  'yeah':      'yes',
  'no':        'no',
  'nope':      'no',
  // ... ~50 entries with synonyms
};
```

---

## 6. 3D Avatar Technical Details

### 6.1 Avatar Model
- **Source:** Local asset at `/public/avatar.glb`
- **Format:** `.glb` (binary glTF)
- **Skeleton naming:** Mixamo-style names prefixed with `mixamorig`
- **Skeleton control:** centralized through `src/avatar/boneMap.js`
- **Hand rig:** 15 finger bones per hand (Thumb/Index/Middle/Ring/Pinky × 3 joints)
- **Runtime contract:** all sign data references bones through `BONE_MAP` keys only
- **Palm semantics:** wrist orientation presets defined in `src/avatar/palmOrientations.js`

### 6.2 Animation System

```
┌─────────────────────────────────────────┐
│          Animation State Machine         │
│                                          │
│   IDLE ──▶ SIGNING ──▶ TRANSITIONING    │
│    ▲          │              │           │
│    │          ▼              ▼           │
│    │      PAUSED        NEXT_SIGN       │
│    │          │              │           │
│    └──────────┴──────────────┘           │
└─────────────────────────────────────────┘
```

| State | Description |
|-------|-------------|
| **IDLE** | Avatar in neutral standing pose with breathing animation |
| **SIGNING** | Actively performing a sign — bone rotations interpolated per keyframe |
| **TRANSITIONING** | Blending from current sign's end pose to next sign's start pose (200ms SLERP) |
| **PAUSED** | Frozen at current frame, resumable |

### 6.3 Bone Interpolation
- Use **Quaternion SLERP** (Spherical Linear Interpolation) for smooth rotation blending
- All rotations stored as quaternions `{x, y, z, w}` — no gimbal lock
- Interpolation factor: `t = elapsed / duration` (0.0 to 1.0)
- Between signs: 200ms transition window with ease-in-out curve

### 6.4 Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60fps on GTX 1650+ |
| Model load time | < 2 seconds |
| Memory usage | < 50 MB for avatar + animation data |
| Sign transition | < 200ms, visually smooth |
| Fingerspelling speed | ~400ms per letter at 1x speed |
| Full sign duration | 800–1500ms depending on complexity |

---

## 7. State Management Design (Zustand)

### 7.1 Store Architecture

```javascript
// Three separate stores for separation of concerns

// 1. Translator Store — input & processing
useTranslatorStore = {
  inputText: '',           // Raw user input
  activeTab: 'text',       // 'text' | 'video'
  videoUrl: '',            // Video URL input
  processedWords: [],      // Cleaned word list from backend
  isProcessing: false,     // Loading state for API calls
  error: null,             // Error message string or null
  // Actions
  setInputText, setActiveTab, setVideoUrl,
  processText, transcribeVideo, clearError
}

// 2. Playback Store — animation control
usePlaybackStore = {
  isPlaying: false,
  currentWordIndex: -1,    // -1 = not started
  speed: 1,                // 0.5 | 1 | 1.5
  // Actions
  play, pause, reset, setSpeed,
  nextWord, jumpToWord
}

// 3. Avatar Store — 3D state (kept separate to avoid re-renders)
useAvatarStore = {
  currentSign: null,       // Current sign data object
  animationState: 'idle',  // 'idle' | 'signing' | 'transitioning' | 'paused'
  isModelLoaded: false,
  // Actions
  setCurrentSign, setAnimationState, setModelLoaded
}
```

### 7.2 Data Flow

```
User types text
    │
    ▼
useTranslatorStore.setInputText()
    │
    ▼
User clicks "Convert"
    │
    ▼
useTranslatorStore.processText()  ── API call ──▶  Backend /api/process-text
    │                                                       │
    ▼                                                       ▼
processedWords updated                              Cleaned word list
    │
    ▼
usePlaybackStore.play()
    │
    ▼
Animation loop reads currentWordIndex
    │
    ▼
signRouter(word) → sign data or fingerspelling
    │
    ▼
useAvatarStore.setCurrentSign()
    │
    ▼
SignAvatar.jsx reads currentSign → applies bone rotations
    │
    ▼
R3F useFrame() → smooth interpolation at 60fps
```

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **CORS** | Backend allows only `http://localhost:5173` (Vite dev server) |
| **Input validation** | URL validation on both frontend and backend. Text length limit: 500 chars. |
| **File system** | yt-dlp downloads to `backend/temp/`, auto-deleted after transcription |
| **No user data** | Zero data persistence. No database. No cookies. No tracking. |
| **Ollama** | Runs locally, no data leaves the machine |
| **Dependency security** | Regular `npm audit` and `pip audit` |

---

## 9. Error Handling Strategy

| Error Type | Where | User Experience |
|-----------|-------|-----------------|
| Backend unreachable | Frontend API call | "Backend is not running. Please start the server." with setup instructions |
| Invalid URL | Backend /api/transcribe | "Please enter a valid YouTube or video URL" |
| Video too long | Backend /api/transcribe | "Video exceeds 5-minute limit. Please use a shorter clip." |
| Whisper model not loaded | Backend startup | Backend logs error, /api/health reports `whisper_loaded: false` |
| Ollama not running | Backend /api/process-text | Fallback to rule-based text cleanup (JS-side). Non-blocking. |
| WebGL not available | Frontend avatar render | Error boundary shows "3D not supported" message |
| Network error | Frontend API call | "Connection error. Please check your internet and try again." |

---

## 10. Testing Strategy

### 10.1 Frontend
| Type | Tool | Scope |
|------|------|-------|
| Unit tests | Vitest | Utility functions, sign router logic, stores |
| Component tests | Vitest + Testing Library | InputPanel, Transcript, PlayerControls |
| E2E tests | Playwright (future) | Full text→sign flow |
| Visual | Manual | Avatar animation quality, smooth transitions |

### 10.2 Backend
| Type | Tool | Scope |
|------|------|-------|
| Unit tests | pytest | Text processing, URL validation |
| API tests | pytest + httpx | All endpoints, error cases |
| Integration | Manual | yt-dlp + Whisper pipeline with real YouTube URLs |

---

## 11. Deployment (Future)

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel / Netlify | Static build, free tier |
| Backend | Railway / Fly.io / Self-hosted | Needs GPU for Whisper — or switch to CPU (slower) |
| Ollama | Same server as backend | Or remove LLM, use rule-based cleanup for deployed version |
| Avatar model | CDN / bundled | Served from `/public/models/` |

> **v1.0 is local-only.** Both frontend and backend run on the developer's machine. Cloud deployment is a post-v1.0 concern.
