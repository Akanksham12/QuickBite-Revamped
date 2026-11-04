import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(credentials) {
      const result = await api("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
      setUser(result.user);
      return result.user;
    },
    async signUp(details) {
      const result = await api("/auth/register", { method: "POST", body: JSON.stringify(details) });
      setUser(result.user);
      return result.user;
    },
    async signOut() {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
