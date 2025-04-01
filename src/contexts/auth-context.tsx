import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Call backend API to validate credentials
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('auth-token', 'authenticated');
        setIsAuthenticated(true);
        return { success: true };
      }
      
      // Return the error message from the server or a default message
      return { 
        success: false, 
        message: data.message || "Invalid username or password"
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: "Network error. Please try again." 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    setIsAuthenticated(false);
    
    // Optional: Call logout endpoint to invalidate server-side session
    fetch('/api/logout', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('Logout error:', err));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 