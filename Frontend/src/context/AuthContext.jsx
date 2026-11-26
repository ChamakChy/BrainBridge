import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const saved = localStorage.getItem('bb_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
      authAPI.me().then(r => setUser(r.data.user)).catch(() => logout()).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem('bb_token', r.data.token);
    localStorage.setItem('bb_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const register = useCallback(async (d) => {
    const r = await authAPI.register(d);
    localStorage.setItem('bb_token', r.data.token);
    localStorage.setItem('bb_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => {
    setUser(u);
    localStorage.setItem('bb_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
