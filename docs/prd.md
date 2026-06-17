# SignBridge AI — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** February 28, 2026  
**Status:** In Development  

---

## 1. Product Overview

### 1.1 Product Name
SignBridge AI

### 1.2 Product Type
AI-Powered Accessibility Web Application

### 1.3 One-Line Description
A free, browser-based tool that converts English text and video/audio content into American Sign Language (ASL) via a real-time 3D animated avatar.

### 1.4 Target Users
| User Group | Description |
|-----------|-------------|
| **Primary** | Deaf and mute individuals who use ASL as their primary language |
| **Secondary** | Families/friends of deaf individuals wanting to understand sign language |
| **Tertiary** | Educators, students learning ASL, accessibility advocates |

### 1.5 Tech Level of Users
Basic — can type text and paste links. No technical knowledge required. Zero installation.

---

## 2. Problem Statement

Over **70 million deaf people worldwide** use sign language as their primary language. Most digital content — websites, videos, lectures, news — is inaccessible to them.

### Current Gaps
- No widely available, free, AI-powered tool converts English text → ASL avatar animation in real time
- YouTube/educational video content has subtitles but no sign language interpretation
- Professional sign language interpreters are scarce (1 interpreter per ~50 deaf individuals in the US) and expensive ($50–150/hour)
- Existing tools are either proprietary, offline, or use outdated technology (Java applets)

### Impact
- 98% of deaf children are born to hearing parents with no sign language knowledge
- Only 2–3% of educational content has sign language interpretation
- Deaf individuals face barriers in education, healthcare, employment, and daily interactions

---

## 3. Product Goals

### 3.1 Primary Goals (v1.0 — Must Have)
- [ ] Build a web app that converts **English text → ASL 3D avatar animation**
- [ ] Build a pipeline for **YouTube/video link → speech transcription → ASL avatar animation**
- [ ] Make it **100% free** to use, no sign-up required
- [ ] Achieve **100% English word coverage** via fingerspelling fallback

### 3.2 Secondary Goals (v1.0 — Should Have)
- [ ] Word-by-word synchronized highlighting during signing
- [ ] Playback controls (play, pause, replay, speed: 0.5x / 1x / 1.5x)
- [ ] Mobile responsive UI
- [ ] Smooth avatar transitions between signs (no jarring jumps)

### 3.3 Stretch Goals (v1.0 — Nice to Have)
- [ ] Live microphone input via Web Speech API
- [ ] PWA support (installable, offline-capable for cached signs)
- [ ] 2D fallback if WebGL is unavailable

### 3.4 Future Goals (v2.0+)
- Bangla Sign Language (BDSL) support
- Camera input: user signs → app reads/translates (sign → text)
- Multi-language support (BSL, ISL)
- Interactive ASL learning mode
- Community sign contributions
- Public API for developers
- React Native mobile app

---

## 4. Feature Specifications — v1.0

### 4.1 Text Input Box

| Attribute | Specification |
|-----------|--------------|
| Input type | Multi-line textarea |
| Language | English only |
| Max characters | 500 characters |
| Placeholder | "Type your English text here..." |
| Validation | Empty check, character limit warning |
| Behavior | On text change, reset playback state |

### 4.2 Video / Link Input Box

| Attribute | Specification |
|-----------|--------------|
| Input type | Single-line URL input |
| Supported formats | YouTube links, direct video file links (.mp4, .webm, .wav, .mp3) |
| Placeholder | "Paste YouTube or video link here..." |
| Validation | Valid URL format check |
| Processing | Backend: yt-dlp extracts audio → Whisper transcribes → returns text |
| Loading state | Spinner + "Transcribing audio..." message |
| Error state | Friendly error message (invalid URL, video too long, network error) |
| Max video length | 5 minutes (v1.0 limit to manage processing time) |

### 4.3 Tab Switch (Text / Video Link)

| Attribute | Specification |
|-----------|--------------|
| Modes | "Text" (default) and "Video Link" |
| Behavior | Only one input mode active at a time |
| Visual | Active tab highlighted in brand color |
| State | Switching tabs clears the other input |

### 4.4 Convert Button

| Attribute | Specification |
|-----------|--------------|
| Label | "Convert to Sign Language" |
| Behavior | Text mode: process text → begin signing. Video mode: call backend → get transcript → begin signing |
| Loading state | Spinner + "Processing..." (text mode: instant, video mode: 3–10s) |
| Error state | Toast/inline error message |
| Disabled when | Input is empty or currently processing |

### 4.5 3D Avatar Display

| Attribute | Specification |
|-----------|--------------|
| Avatar type | Local Mixamo-compatible GLB (`/public/avatar.glb`) |
| Rendering engine | Three.js via @react-three/fiber |
| Default state | Avatar stands idle with subtle breathing animation |
| Active state | Performs ASL signs in sequence |
| Sign types | Full signs (from vocabulary) + fingerspelling (for unknown words) |
| Animation blending | Smooth SLERP interpolation between poses (no jarring transitions) |
| Fullscreen | Expand button to view avatar fullscreen |
| Fallback | If WebGL unavailable, show message "3D not supported in your browser" |

### 4.6 Word Highlighter / Transcript

| Attribute | Specification |
|-----------|--------------|
| Display | All words as inline chips/tags |
| Sync | Current word highlighted in accent color while being signed |
| Past words | Dimmed color |
| Upcoming words | Normal color |
| Clickable | Click any word to jump avatar to that sign |
| Source | User's text (text mode) OR transcribed text (video mode) |

### 4.7 Playback Controls

| Control | Function |
|---------|----------|
| ▶ Play | Start / resume avatar animation from current position |
| ⏸ Pause | Pause avatar animation at current sign |
| 🔄 Replay | Restart from beginning |
| 🐢 Speed | Toggle: 0.5x / 1x / 1.5x playback speed |
| Progress bar | Visual progress indicator, shows % completed |

### 4.8 Sign Language Coverage

| Category | Coverage | Method |
|----------|----------|--------|
| **Fingerspelling** | 26 letters (A–Z) | Manual bone-rotation presets |
| **Common Signs** | ~50 words (hello, thank you, yes, no, etc.) | Manually authored animation clips |
| **All other words** | 100% via fallback | Fingerspelled letter-by-letter |

> **Note:** v1.0 uses **Signed Exact English (SEE)** — signing each English word in order. This is NOT true ASL grammar (which has different word order). This is clearly communicated to users.

---

## 5. Features NOT in v1.0

| Feature | Reason |
|---------|--------|
| ✗ User authentication / login / signup | Keep it zero-friction |
| ✗ User profiles or history | No data storage needed |
| ✗ Database | All processing is stateless |
| ✗ Bangla or other language support | English → ASL only for v1.0 |
| ✗ Camera / live signing input | Requires MediaPipe + sign recognition ML — deferred to v2.0 |
| ✗ Social sharing | Keep simple |
| ✗ Payment / premium tier | 100% free |
| ✗ Admin dashboard | No admin features needed |
| ✗ Notifications | No async operations that need notifying |
| ✗ Dark/light mode toggle | Use system default |
| ✗ True ASL grammar reordering | Research-level NLP — deferred to v2.0 |

---

## 6. User Flows

### 6.1 Text → Sign Language
```
1. User opens SignBridge AI in browser
2. Text tab is active by default
3. User types English text (e.g., "Hello, my name is Sarah")
4. User clicks "Convert to Sign Language"
5. Backend processes text: strip articles, lemmatize via Ollama
6. Cleaned word list returned: ["hello", "my", "name", "sarah"]
7. Avatar begins signing:
   - "hello" → plays full sign animation (from vocabulary)
   - "my" → plays full sign animation
   - "name" → plays full sign animation
   - "sarah" → fingerspells S-A-R-A-H (not in vocabulary)
8. Transcript highlights each word as it's signed
9. Progress bar advances
10. User can pause, replay, or adjust speed
11. User can click any word to jump to that sign
```

### 6.2 Video Link → Sign Language
```
1. User switches to "Video Link" tab
2. User pastes YouTube URL
3. User clicks "Convert to Sign Language"
4. Frontend shows loading spinner: "Transcribing audio..."
5. Backend:
   a. yt-dlp downloads audio from YouTube URL
   b. faster-whisper transcribes audio → English text
   c. Ollama cleans/simplifies text
   d. Returns word list to frontend
6. Transcribed text appears in transcript area
7. Avatar begins signing the transcribed words
8. Same playback controls as text mode
```

### 6.3 About Page
```
1. User clicks "About" in navbar
2. Navigates to /about page
3. Shows: feature cards, mission statement, tech stack, contact links
4. User clicks logo or "Sign Bridge AI" to return to home
```

---

## 7. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Page load time** | < 3 seconds (lazy load 3D scene) |
| **Text processing** | < 1 second for up to 500 characters |
| **Video transcription** | < 15 seconds for 5 minutes of audio |
| **Avatar framerate** | 60fps on mid-range hardware (GTX 1650+) |
| **Sign transition** | < 200ms smooth interpolation between signs |
| **Browser support** | Chrome 90+, Edge 90+, Safari 15+, Firefox 90+ |
| **Mobile support** | Responsive layout, touch controls, WebGL capable devices |
| **Accessibility** | ARIA labels, keyboard navigation, screen reader support |
| **Offline** | Cached signs playable offline (PWA stretch goal) |

---

## 8. Success Metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Sign vocabulary size | 50+ common ASL signs |
| Fingerspelling accuracy | 100% (26 letters fully implemented) |
| Average transcription time | < 10 seconds for 3-min video |
| Avatar animation smoothness | No visible jank or frame drops |
| Word highlight sync accuracy | ±100ms of actual sign timing |
| Browser compatibility | Works on 95%+ of modern browsers |

---

## 9. Assumptions & Constraints

### Assumptions
- Users have a modern browser with WebGL support
- Users have internet connection (for video transcription feature)
- Users input English text (no other language detection needed for v1.0)
- The local backend (Whisper + Ollama) runs on developer's machine for v1.0

### Constraints
- No budget for motion capture equipment — signs are hand-authored
- No commercial sign language datasets available — build vocabulary manually
- ASL grammar reordering is a research-level problem — use Signed Exact English
- Video transcription requires a local Python backend (cannot run Whisper in-browser effectively)

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sign animation creation is too slow | Limits vocabulary size | High | Fingerspelling fallback guarantees 100% coverage |
| Deaf community rejects SEE approach | Negative perception | Medium | Clearly label as "text visualization", not "ASL translation". Plan ASL grammar for v2.0 |
| WebGL not supported on user's device | Avatar won't render | Low | Error boundary with fallback message |
| Whisper transcription inaccurate | Wrong signs played | Medium | Allow user to edit transcript before signing |
| Avatar rig uses unexpected bone names | Signs may not animate | Medium | Enforce `BONE_MAP` validation on load and log missing bones |

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **ASL** | American Sign Language — a complete, natural language with its own grammar |
| **SEE** | Signed Exact English — signing English words in English word order (not true ASL) |
| **Fingerspelling** | Spelling words letter-by-letter using the ASL manual alphabet |
| **Gloss** | Written transcription of sign language (e.g., "STORE I GO" for "I am going to the store") |
| **Non-manual markers** | Facial expressions, head tilts, and body movements that carry meaning in ASL |
| **Mixamo Rig** | Standard humanoid skeleton naming pattern prefixed with `mixamorig` |
| **R3F** | @react-three/fiber — React renderer for Three.js |
| **SLERP** | Spherical Linear Interpolation — smooth rotation blending for 3D animations |
