import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AuthUser {
  id:        string;
  companyId: string | null;
  email:     string;
  role:      string;
  firstName: string;
  lastName:  string;
}

interface AuthContextValue {
  user:     AuthUser | null;
  setAuth:  (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  /** True while viewing as another company via super_admin impersonation. */
  isImpersonating: boolean;
  /** Stash the current (super_admin) session, then switch to the impersonated one. */
  startImpersonation: (user: AuthUser, accessToken: string) => void;
  /** Restore the stashed super_admin session. */
  endImpersonation: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY           = 'ecs_user';
const TOKEN_KEY          = 'access_token';
const ORIGINAL_USER_KEY  = 'ecs_impersonation_original_user';
const ORIGINAL_TOKEN_KEY = 'ecs_impersonation_original_token';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);
  const [isImpersonating, setIsImpersonating] = useState(
    () => localStorage.getItem(ORIGINAL_TOKEN_KEY) !== null
  );

  const setAuth = useCallback((u: AuthUser, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(ORIGINAL_USER_KEY);
    setUser(null);
    setIsImpersonating(false);
  }, []);

  const startImpersonation = useCallback((u: AuthUser, token: string) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const currentUser   = localStorage.getItem(USER_KEY);
    if (currentToken) localStorage.setItem(ORIGINAL_TOKEN_KEY, currentToken);
    if (currentUser)  localStorage.setItem(ORIGINAL_USER_KEY, currentUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    setIsImpersonating(true);
  }, []);

  const endImpersonation = useCallback(() => {
    const originalToken = localStorage.getItem(ORIGINAL_TOKEN_KEY);
    const originalUser   = localStorage.getItem(ORIGINAL_USER_KEY);
    if (originalToken) localStorage.setItem(TOKEN_KEY, originalToken);
    if (originalUser)  localStorage.setItem(USER_KEY, originalUser);
    localStorage.removeItem(ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(ORIGINAL_USER_KEY);
    setUser(originalUser ? (JSON.parse(originalUser) as AuthUser) : null);
    setIsImpersonating(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, setAuth, clearAuth, isImpersonating, startImpersonation, endImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
