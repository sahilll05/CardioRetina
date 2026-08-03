import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  expiresAt: number | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string, expiresAt: number, rememberMe: boolean) => void;
  logout: () => void;
  checkExpiry: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      rememberMe: false,
      isAuthenticated: false,

      login: (user, token, expiresAt, rememberMe) => {
        set({ user, token, expiresAt, rememberMe, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, expiresAt: null, rememberMe: false, isAuthenticated: false });
        // Clear sessionStorage as well
        sessionStorage.removeItem('auth-session');
      },

      checkExpiry: () => {
        const { expiresAt, logout } = get();
        if (expiresAt && Date.now() > expiresAt) {
          logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'cardioretina-auth',
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          // Try localStorage first (rememberMe), then sessionStorage
          return localStorage.getItem(key) || sessionStorage.getItem(key);
        },
        setItem: (key, value) => {
          const state = JSON.parse(value);
          if (state?.state?.rememberMe) {
            localStorage.setItem(key, value);
          } else {
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key);
          }
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        },
      })),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        rememberMe: state.rememberMe,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
