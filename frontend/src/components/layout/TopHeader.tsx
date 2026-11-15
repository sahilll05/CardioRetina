import { useLocation, Link } from 'react-router-dom';
import { UserCircle, ChevronRight, ShieldCheck } from 'lucide-react';

export function TopHeader() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-6 sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-border">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs">
          <li>
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 font-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Dashboard
            </Link>
          </li>
          {pathnames.map((value, index) => {
            const isLast = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const formatted = value
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return (
              <li key={to} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />
                <Link
                  to={to}
                  className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {formatted}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Telemetry Status & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-border bg-surface-deep text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-ok" />
          <span>Local Engine Active</span>
          <span className="text-border-strong">|</span>
          <span className="font-mono text-[11px] text-cool">v1.4.0</span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/settings"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account Settings"
          >
            <UserCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
