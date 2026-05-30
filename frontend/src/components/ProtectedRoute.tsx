import { Redirect } from "wouter";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div
        data-testid="protected-route-loading"
        className="min-h-screen flex items-center justify-center text-muted-foreground"
      >
        <span className="font-mono text-xs tracking-widest">LOADING…</span>
      </div>
    );
  }
  if (!user) {
    return <Redirect to="/auth" />;
  }
  return <>{children}</>;
}
