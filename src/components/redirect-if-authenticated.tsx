import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

export default function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If authenticated and trying to access login page, redirect to welcome
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
} 