import React from 'react';
import { User, ShieldCheck, Car, History, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // Handle case where user might be null briefly or we use mock data
  const currentUser = user || {
    name: 'Student User',
    email: 'student@mgm.ac.in',
    phone: '+91 9876543210',
    organization: 'MGM University',
    rating: 4.8,
    totalRides: 12,
    co2Saved: '45 kg',
    isVerified: true
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-600 to-emerald-800"></div>
        
        <div className="relative pt-6">
          <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-lg mb-3">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User className="w-12 h-12" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center space-x-1">
            <span>{currentUser.name}</span>
            {currentUser.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
          </h2>
          <p className="text-sm text-slate-500 mb-1">{currentUser.organization}</p>
          <div className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-emerald-100">
            Organization Verified
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
            <div>
              <div className="text-lg font-bold text-slate-800">{currentUser.rating} <span className="text-sm">⭐</span></div>
              <div className="text-xs text-slate-500">Rating</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{currentUser.totalRides}</div>
              <div className="text-xs text-slate-500">Rides</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">{currentUser.co2Saved}</div>
              <div className="text-xs text-slate-500">CO₂ Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Link to="/profile/edit" className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>
        
        <Link to="/profile/vehicles" className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700">My Vehicles</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <Link to="/profile/history" className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700">Ride History</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>
        
        <Link to="/profile/preferences" className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-medium text-slate-700">Preferences</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <button onClick={logout} className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors text-rose-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium">Logout</span>
          </div>
        </button>
      </div>
    </div>
  );
}
