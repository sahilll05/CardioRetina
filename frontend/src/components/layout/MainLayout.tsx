import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopHeader />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 relative">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
      <Sonner position="top-right" richColors closeButton />
    </div>
  );
}
