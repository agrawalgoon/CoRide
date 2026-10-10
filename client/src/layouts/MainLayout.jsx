import React from 'react';
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
    return <Navigate to="/auth/login" replace />;
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
