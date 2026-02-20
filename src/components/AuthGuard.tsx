import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state, isLoading } = useApp();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-mono text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
