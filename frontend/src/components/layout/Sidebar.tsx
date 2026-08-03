import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  Settings,
  HeartPulse,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/auth/authStore';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'New Analysis', href: '/analysis/new', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR';

  return (
    <div className="flex h-screen w-[260px] flex-col border-r bg-white z-10 shrink-0 sticky top-0 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-800 block leading-tight">CardioRetina</span>
          <span className="text-xs text-slate-400 font-medium">AI Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors',
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="border-t p-3">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.specialization || user?.role || 'Clinician'}</p>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
        </button>

        {userMenuOpen && (
          <div className="mt-1 border rounded-lg bg-white shadow-md overflow-hidden">
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings className="w-4 h-4 text-slate-400" /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
