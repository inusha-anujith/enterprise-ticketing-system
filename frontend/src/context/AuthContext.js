// context/AuthContext.js
// The logged-in user is needed everywhere (sidebar, routes, buttons), so instead of
// passing it down as props through every component, it lives in a React Context.
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

// Usage in any component: const { user, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
