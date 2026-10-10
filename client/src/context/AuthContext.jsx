import React, { createContext, useState, useEffect } from 'react';
import { getMe } from '../services/userService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('coride_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('coride_token', token);
      refreshUser();
    } else {
      localStorage.removeItem('coride_token');
      setLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, jwtToken) => {
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout, refreshUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
