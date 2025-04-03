import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 