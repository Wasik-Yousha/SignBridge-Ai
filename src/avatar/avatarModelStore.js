import { create } from 'zustand';

const STORAGE_KEY = 'signbridge-avatar-url';

const getStoredUrl = () => {
  try { return localStorage.getItem(STORAGE_KEY) || null; }
  catch { return null; }
};

export const useAvatarModelStore = create((set) => ({
  modelUrl: getStoredUrl(),
  setModelUrl: (url) => {
    try { localStorage.setItem(STORAGE_KEY, url); } catch (error) { void error; }
    set({ modelUrl: url });
  },
  clearModelUrl: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (error) { void error; }
    set({ modelUrl: null });
  },
}));
