import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';

// ── Full-page skeleton shown while session is being restored ───────────────────

function FullPageSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[200px] flex-shrink-0 bg-sidebar border-r border-border/20 animate-pulse" />
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-[52px] bg-card border-b border-border animate-pulse" />
        <div className="flex-1 p-5 grid grid-cols-3 gap-4 content-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[108px] rounded bg-muted animate-pulse" />
          ))}
          <div className="col-span-3 h-[260px] rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── PrivateRoute ───────────────────────────────────────────────────────────────

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSkeleton />;

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <AppShell>{children}</AppShell>;
}
