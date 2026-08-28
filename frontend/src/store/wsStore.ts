import { create } from 'zustand';

interface WsState {
  isConnected: boolean;
  activeJobs: Record<string, any>;
  criticalAlerts: any[];
  connect: (jobId: string) => void;
  disconnect: (jobId: string) => void;
  dismissAlert: (alertId: string, reason: string) => void;
}

export const useWsStore = create<WsState>((set, get) => ({
  isConnected: false,
  activeJobs: {},
  criticalAlerts: [],
  
  connect: (jobId) => {
    // In a real app, initialize WebSocket connection here
    set({ isConnected: true });
    console.log(`Connecting WS for job ${jobId}`);
  },
  
  disconnect: (jobId) => {
    // In a real app, close WS connection
    set({ isConnected: false });
    console.log(`Disconnecting WS for job ${jobId}`);
  },

  dismissAlert: (alertId, reason) => {
    set((state) => ({
      criticalAlerts: state.criticalAlerts.filter(a => a.id !== alertId)
    }));
    // In real app, emit to backend audit log
    console.log(`Alert ${alertId} dismissed: ${reason}`);
  }
}));
