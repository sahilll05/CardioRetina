import { useLocation, Link } from 'react-router-dom';
import { Bell, UserCircle, ChevronRight } from 'lucide-react';

export function TopHeader() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-surface px-6 sticky top-0 z-10 transition-shadow">
      <div className="flex items-center">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <div>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </div>
            </li>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const title = value.charAt(0).toUpperCase() + value.slice(1);

              return (
                <li key={to}>
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <Link
                      to={to}
                      className={`ml-2 text-sm font-medium ${
                        last ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      } transition-colors`}
                      aria-current={last ? 'page' : undefined}
                    >
                      {title}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <button type="button" className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-destructive ring-2 ring-surface" />
        </button>
        <button type="button" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <span className="sr-only">Open user menu</span>
          <UserCircle className="h-8 w-8" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
