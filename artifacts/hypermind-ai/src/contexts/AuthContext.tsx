import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  
  const { data: user, isLoading: isUserLoading, refetch } = useGetCurrentUser({
    query: {
      enabled: !!token,
      retry: false,
    },
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  });

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token, refetch]);

  return (
    <AuthContext.Provider value={{ user: user || null, token, isLoading: isUserLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
