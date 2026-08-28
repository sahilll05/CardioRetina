import { create } from 'zustand';

interface TenantState {
  organizationId: string | null;
  organizationName: string | null;
  setTenant: (id: string, name: string) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  organizationId: null,
  organizationName: null,
  setTenant: (id, name) => set({ organizationId: id, organizationName: name }),
  clearTenant: () => set({ organizationId: null, organizationName: null }),
}));
