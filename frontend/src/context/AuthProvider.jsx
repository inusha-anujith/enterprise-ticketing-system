// context/AuthProvider.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { api, getToken, setToken, clearToken } from '../api/client';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true while we check whether a token saved from last time is still valid
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // On first load: if a token is saved, ask the API who it belongs to
  useEffect(() => {
    if (!getToken()) return;
    api('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  // The API client fires this event when any request comes back 401
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api('/api/auth/register', { method: 'POST', body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      isStaff: user?.role === 'agent' || user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
