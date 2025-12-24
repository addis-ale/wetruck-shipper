"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { request } from "@/lib/api-client";

type User = {
  id: string;
  email: string;
  role: string;
  name?: string;
} | null;

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  role: string;
}

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT and extract user ID
function decodeJWT(token: string): { sub: string; role: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("wetruck_user");
      const savedToken = localStorage.getItem("wetruck_token");

      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await request<LoginResponse>(
      "/auth/login", 
      {
        method: "POST",
        body: JSON.stringify({ 
          email, 
          password,
          role: "shipper" // Required by your backend
        }),
      }
    );

    if (error) throw new Error(error);

    if (data) {
      // Decode JWT to get user ID
      const decoded = decodeJWT(data.access_token);
      
      const userData: User = {
        id: decoded?.sub || "",
        email,
        role: data.role,
        name: email.split('@')[0] // Fallback: use email prefix as name
      };

      setUser(userData);
      localStorage.setItem("wetruck_token", data.access_token);
      localStorage.setItem("wetruck_refresh_token", data.refresh_token);
      localStorage.setItem("wetruck_user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("wetruck_token");
    localStorage.removeItem("wetruck_refresh_token");
    localStorage.removeItem("wetruck_user");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
