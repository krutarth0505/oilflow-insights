import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Droplets } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-2xl bg-gradient-primary p-4 shadow-glow animate-pulse-glow">
          <Droplets className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}