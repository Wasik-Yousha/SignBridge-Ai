/**
 * API service — communicates with the FastAPI backend.
 * In development, requests to /api are proxied to localhost:8000 via Vite.
 */

const API_BASE = '/api';

/**
 * Check if the backend is running.
 * @returns {Promise<{ status: string, whisper_loaded: boolean, ollama_available: boolean }>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

/**
 * Process English text → simplified word list for signing.
 * @param {string} text - Raw English input.
 * @returns {Promise<{ original: string, processed_words: string[], removed: string[], changes: string[], method: string }>}
 */
export async function processText(text) {
  const res = await fetch(`${API_BASE}/process-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Text processing failed');
  }
  return res.json();
}

/**
 * Transcribe a video/audio URL → word-level transcript.
 * @param {string} url - YouTube or direct video URL.
 * @param {number} [maxDuration=300] - Max seconds of audio to process.
 * @returns {Promise<{ text: string, words: Array<{word: string, start: number, end: number}>, duration: number, language: string }>}
 */
export async function transcribeVideo(url, maxDuration = 300) {
  const res = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, max_duration: maxDuration }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Transcription failed');
  }
  return res.json();
}
