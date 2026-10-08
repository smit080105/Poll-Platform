import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pollwave_token');
    const savedUser = localStorage.getItem('pollwave_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token is still valid
        api.get('/auth/me')
          .then(res => {
            setUser(res.data);
            localStorage.setItem('pollwave_user', JSON.stringify(res.data));
          })
          .catch((err) => {
            // Only end the session when the server says it is invalid:
            // 401 = bad/expired token, 404 = user no longer exists.
            // Network errors, cold starts and 5xx keep the cached session.
            const status = err.response?.status;
            if (status === 401 || status === 404) {
              localStorage.removeItem('pollwave_token');
              localStorage.removeItem('pollwave_user');
              setUser(null);
            }
          })
          .finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('pollwave_token');
        localStorage.removeItem('pollwave_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('pollwave_token', res.data.token);
    localStorage.setItem('pollwave_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('pollwave_token', res.data.token);
    localStorage.setItem('pollwave_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('pollwave_token');
    localStorage.removeItem('pollwave_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}