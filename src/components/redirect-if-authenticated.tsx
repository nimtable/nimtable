import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
}

export default function RedirectIfAuthenticated({ children }: RedirectIfAuthenticatedProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
} 