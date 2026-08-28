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
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/auth/authStore';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'New Analysis', href: '/analysis/new', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Ingestion Queue', href: '/ingestion/queue', icon: Server },
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
    <div className="flex h-screen w-[260px] flex-col border-r border-primary/20 bg-black z-10 shrink-0 sticky top-0 shadow-lg shadow-primary/5">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-primary/20 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center shrink-0 border border-primary/30">
          <HeartPulse className="w-5 h-5 text-black" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-primary block leading-tight">CardioRetina</span>
          <span className="text-xs text-primary/60 font-medium">AI Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
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
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-foreground/70 hover:bg-white/5 hover:text-foreground border border-transparent'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-4.5 w-4.5 flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-foreground/50 group-hover:text-foreground/80'
                  )}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="border-t border-primary/20 p-3">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-600 to-green-900 border border-primary/30 flex items-center justify-center text-black font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-primary/60 truncate capitalize">{user?.specialization || user?.role || 'Clinician'}</p>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-primary/60 transition-transform', userMenuOpen && 'rotate-180')} />
        </button>

        {userMenuOpen && (
          <div className="mt-2 border border-primary/20 rounded-lg bg-black shadow-lg overflow-hidden">
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground/80 hover:bg-white/5 hover:text-primary transition-colors"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors border-t border-primary/10"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
