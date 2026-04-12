import { create } from 'zustand';
import { authApi } from '../api/auth.js';
import axios from 'axios';

export const useSessionStore = create((set, get) => ({
  token: null,
  user: null,
  ghostScore: 50,
  isReady: false,

  _attachInterceptor: () => {
    axios.interceptors.request.use(config => {
      const t = get().token;
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
  },

  init: async () => {
    get()._attachInterceptor();

    const token = localStorage.getItem('lokaal_token');
    if (!token) return set({ isReady: true });

    set({ token });

    try {
      const user = await authApi.me();
      set({ user, ghostScore: user.ghost_score, isReady: true });
    } catch {
      localStorage.removeItem('lokaal_token');
      set({ token: null, isReady: true });
    }
  },

  setSession: (token, user) => {
    localStorage.setItem('lokaal_token', token);
    set({ token, user, isReady: true });  // ← isReady: true added
  },

  logout: () => {
    localStorage.removeItem('lokaal_token');
    set({ token: null, user: null, ghostScore: 50 });
  },

  setGhostScore: (score) => set({ ghostScore: score }),
}));