// client/src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  getHttpStatus,
  getErrorCode,
} from "../api/auth.api";

const AuthContext = createContext(null);

let bootMePromise = null;
function fetchMeBootOnce() {
  if (bootMePromise) return bootMePromise;

  const p = fetchMe().catch((e) => {
    bootMePromise = null;
    throw e;
  });

  bootMePromise = p;
  return p;
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous | error
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const inFlightRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSet = useCallback((fn) => {
    if (!mountedRef.current) return;
    fn();
  }, []);

  const refresh = useCallback(
    async (opts = {}) => {
      const { boot = false, silent = false } = opts;

      if (inFlightRef.current) return inFlightRef.current;

      const p = (async () => {
        if (!silent) safeSet(() => setStatus("loading"));
        safeSet(() => setError(null));

        try {
          const profile = boot ? await fetchMeBootOnce() : await fetchMe();

          if (profile) {
            safeSet(() => {
              setUser(profile);
              setStatus("authenticated");
            });
            return profile;
          }

          safeSet(() => {
            setUser(null);
            setStatus("anonymous");
          });
          return null;
        } catch (e) {
          const http = getHttpStatus(e);
          const code = getErrorCode(e);

          if (http === 401 || http === 403 || code === "AUTH_REQUIRED") {
            safeSet(() => {
              setUser(null);
              setStatus("anonymous");
            });
            return null;
          }

          safeSet(() => {
            setUser(null);
            setStatus("error");
            setError(e);
          });
          return null;
        } finally {
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = p;
      return p;
    },
    [safeSet]
  );

  useEffect(() => {
    refresh({ boot: true });
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      await loginApi(email, password);
      await refresh({ silent: false, boot: false });
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    } finally {
      safeSet(() => {
        setUser(null);
        setError(null);
        setStatus("anonymous");
      });
    }
  }, [safeSet]);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      isLoading: status === "loading",
      isAuthed: status === "authenticated",
      isAnonymous: status === "anonymous",
      refresh,
      login,
      logout,
    }),
    [status, user, error, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}
