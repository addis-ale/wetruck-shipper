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
  message?: string;
  role: string;
  expires_in: number;
}

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Load user from localStorage
      const savedUser = localStorage.getItem("wetruck_user");

      if (savedUser) {
        // Verify the session with backend (check if cookie is still valid)
        const { data, error, status } = await request<{
          id: number;
          email: string;
          user_type: string;
        }>("/auth/me");

        if (error || status === 401) {
          // Session invalid - clear everything
          console.log("❌ Session invalid - clearing user data");
          localStorage.removeItem("wetruck_user");
          setUser(null);
        } else if (data) {
          // Session valid - keep user logged in
          setUser(JSON.parse(savedUser));
        }
      }

      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        role: "shipper", // Required by your backend
      }),
    });

    if (error) throw new Error(error);

    if (data) {
      // Create user data from login response
      const user: User = {
        id: "", // Backend can provide this later if needed
        email,
        role: data.role,
        name: email.split("@")[0],
      };

      setUser(user);
      localStorage.setItem("wetruck_user", JSON.stringify(user));
    }
  };

  const logout = async () => {
    try {
      // Call backend to clear cookies
      await request("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      // Even if backend call fails, still clear local data
      console.warn("Logout endpoint failed, clearing local data anyway", error);
    } finally {
      // Always clear local user data
      setUser(null);
      localStorage.removeItem("wetruck_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
