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
  User as UserIcon,
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
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DR';

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface-deep shrink-0 sticky top-0 z-20">
      {/* Brand Header */}
      <div className="flex h-14 items-center px-4 border-b border-border gap-3">
        <div className="w-8 h-8 rounded border border-border-strong bg-surface flex items-center justify-center shrink-0 text-primary">
          <HeartPulse className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-semibold tracking-tight text-foreground block leading-tight truncate">
            CardioRetina
          </span>
          <span className="text-xs text-muted-foreground block leading-tight truncate">
            Clinical AI Platform
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/dashboard' &&
              location.pathname.startsWith(item.href.split('/').slice(0, 2).join('/')));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-surface text-foreground border border-border-strong font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-surface/60 hover:text-foreground border border-transparent'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1 h-3 rounded-full bg-primary shrink-0" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-3 relative">
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-surface transition-colors duration-150 ease-out text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={userMenuOpen}
        >
          <div className="h-8 w-8 rounded border border-border bg-surface flex items-center justify-center text-foreground font-mono text-xs font-medium shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.name || 'Dr. Clinician'}</p>
            <p className="text-[11px] text-muted-foreground truncate capitalize">
              {user?.specialization || user?.role || 'Cardiology'}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
              userMenuOpen && 'rotate-180'
            )}
          />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-surface border border-border-strong rounded-md shadow-lg p-1.5 z-30 animate-in fade-in duration-100">
            <Link
              to="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-deep rounded transition-colors duration-150"
            >
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
              Account Settings
            </Link>
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors duration-150 text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
