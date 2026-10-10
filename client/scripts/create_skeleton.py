import os

def create_file(filepath, content):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\Shree\Desktop\FYP\CoRide\client\src"

files = {
    f"{base_dir}/services/api.js": """import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coride_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
""",
    f"{base_dir}/services/authService.js": """import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const verifyOrganizationOtp = async (otp) => {
  const response = await api.post('/users/organization/verify-otp', { otp });
  return response.data;
};
""",
    f"{base_dir}/services/userService.js": """import api from './api';

export const getMe = async () => {
  const response = await api.get('/users/me');
  return response.data;
};
""",
    f"{base_dir}/context/AuthContext.jsx": """import React, { createContext, useState, useEffect } from 'react';
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
""",
    f"{base_dir}/hooks/useAuth.js": """import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  return useContext(AuthContext);
};
""",
    f"{base_dir}/layouts/MainLayout.jsx": """import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import TopHeader from '../components/navigation/TopHeader';
import BottomNav from '../components/navigation/BottomNav';
import { useAuth } from '../hooks/useAuth';

export default function MainLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <TopHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
""",
    f"{base_dir}/layouts/AuthLayout.jsx": """import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          CoRide
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
""",
    f"{base_dir}/pages/auth/Login.jsx": """import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { login as loginService } from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await loginService(email, password);
      login(data.user, data.token);
      navigate('/find');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Sign in to your account</h3>
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email address</label>
          <div className="mt-1">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="mt-1">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <Link to="/auth/register" className="text-emerald-600 hover:text-emerald-500 text-sm font-medium">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
}
"""
}

for filepath, content in files.items():
    create_file(filepath, content)
    print(f"Created {filepath}")

