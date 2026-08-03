import { create } from 'zustand';
import type { User, Patient, Analysis, Notification } from '../types';

interface AppState {
  user: User | null;
  patients: Patient[];
  currentAnalysis: Analysis | null;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'system';
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addNotification: (notification: Notification) => void;
  setPatients: (patients: Patient[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  patients: [],
  currentAnalysis: null,
  notifications: [],
  theme: 'system',
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  setPatients: (patients) => set({ patients }),
}));
