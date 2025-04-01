import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleLogout} 
        className="absolute top-2 right-4 z-50 flex items-center gap-1"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </Button>
    </div>
  );
} 