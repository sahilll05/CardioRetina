import { create } from 'zustand';
import { api } from '@/config/api';

export interface CriticalAlert {
  id: string;
  jobId: string;
  patientId?: string;
  message: string;
  timestamp: number;
  severity: 'HIGH' | 'CRITICAL';
}

interface WsState {
  isConnected: boolean;
  activeJobs: Record<string, any>;
  criticalAlerts: CriticalAlert[];
  lastAlertTimestamp: number;
  connect: (jobId: string) => void;
  disconnect: (jobId: string) => void;
  addAlert: (alert: Omit<CriticalAlert, 'id' | 'timestamp'>) => void;
  dismissAlert: (alertId: string, reason: string) => Promise<void>;
}

const RATE_LIMIT_WINDOW_MS = 5000; // Rate limit: 1 alert per 5 sec (Task 4.6)

export const useWsStore = create<WsState>((set, get) => ({
  isConnected: false,
  activeJobs: {},
  criticalAlerts: [],
  lastAlertTimestamp: 0,
  
  connect: (jobId) => {
    set({ isConnected: true });
    console.log(`Connecting WS for job ${jobId}`);
  },
  
  disconnect: (jobId) => {
    set({ isConnected: false });
    console.log(`Disconnecting WS for job ${jobId}`);
  },

  addAlert: (alertData) => {
    const now = Date.now();
    const { lastAlertTimestamp } = get();
    
    // Rate limit check: drop if within rate-limit window
    if (now - lastAlertTimestamp < RATE_LIMIT_WINDOW_MS) {
      console.warn('[WS_STORE] Alert rate-limited to prevent notification fatigue');
      return;
    }

    const newAlert: CriticalAlert = {
      ...alertData,
      id: `alert-${now}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
    };

    set((state) => ({
      criticalAlerts: [...state.criticalAlerts, newAlert],
      lastAlertTimestamp: now,
    }));
  },

  dismissAlert: async (alertId, reason) => {
    set((state) => ({
      criticalAlerts: state.criticalAlerts.filter(a => a.id !== alertId)
    }));

    try {
      // Log dismissal with reason to audit chain API
      await api.post('/audit/dismiss-alert', { alertId, reason });
      console.log(`Alert ${alertId} dismissed with reason: ${reason}`);
    } catch {
      // Non-blocking log failure
      console.log(`Alert ${alertId} dismissed locally: ${reason}`);
    }
  }
}));
