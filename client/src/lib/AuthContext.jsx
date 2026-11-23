import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context.js';
import { api } from './api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/api/auth/me')
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const result = await api.post('/api/auth/login', credentials);
      setUser(result.user);
      return result.user;
    },
    async register(details) {
      const result = await api.post('/api/auth/register', details);
      setUser(result.user);
      return result.user;
    },
    async logout() {
      await api.post('/api/auth/logout', {});
      setUser(null);
    },
    refresh: async () => {
      const result = await api.get('/api/auth/me');
      setUser(result.user);
      return result.user;
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
