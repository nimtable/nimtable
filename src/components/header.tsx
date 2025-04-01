import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <header className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Nimtable</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
} 