"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginRequest,
  registerRequest,
  getToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
} from "./api";
import type { RegisterPayload, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface StoredAuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Combined into one object so the initial localStorage read is a single
  // setState call, not three separate ones cascading in the same effect.
  const [state, setState] = useState<StoredAuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    // localStorage isn't available during SSR, so the initial read has to
    // happen post-mount in an effect rather than in the useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ token: getToken(), user: getStoredUser(), loading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setStoredAuth(data.token, data.user);
    setState({ token: data.token, user: data.user, loading: false });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerRequest(payload);
    setStoredAuth(data.token, data.user);
    setState({ token: data.token, user: data.user, loading: false });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setState({ token: null, user: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: state.user, token: state.token, loading: state.loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/** Redirects to /login if the user isn't signed in once auth state has loaded. */
export function useRequireAuth(): AuthContextValue {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.token) {
      router.push("/login");
    }
  }, [auth.loading, auth.token, router]);

  return auth;
}
