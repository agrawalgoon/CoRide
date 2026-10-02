import React from 'react';
import TopHeader from '../components/navigation/TopHeader';
import BottomNav from '../components/navigation/BottomNav';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50/70 text-coride-text flex flex-col">
      {/* Full-Width Top Navigation Bar */}
      <TopHeader />

      {/* Centered Desktop Dashboard Content Area (Max width 1280px / 7xl) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Desktop Professional Footer (Hidden on Mobile) */}
      <footer className="hidden md:block bg-white border-t border-slate-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">CoRide</span>
            <span>•</span>
            <span>Intelligent Campus & Enterprise Carpooling Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="hover:text-coride-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-coride-primary cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-coride-primary cursor-pointer transition-colors">Campus Safety & Geofencing</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Verified Campus Network
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile-Only Bottom Navigation (Hidden on Tablet & Desktop) */}
      <BottomNav />
    </div>
  );
}
