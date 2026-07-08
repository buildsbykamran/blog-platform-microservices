import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AUTH_TOKEN_KEY,
  getProfile,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await getProfile();
        setUser(result.data.user);
      } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const login = async (email, password) => {
    const result = await loginRequest(email, password);
    const nextToken = result.data.token;

    setToken(nextToken);
    setUser(result.data.user);

    return result;
  };

  const register = async (username, email, password, fullName) =>
    registerRequest(username, email, password, fullName);

  const logout = () => {
    logoutRequest();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      register,
      isAuthenticated: Boolean(token)
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
