import React from 'react';
import { User, ShieldCheck, Car, History, LogOut, ChevronRight, Mail, Phone, Building, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading profile...
      </div>
    );
  }

  const rating = user.driverRatingAvg != null ? Number(user.driverRatingAvg).toFixed(1) : '5.0';
  const co2 = user.co2SavedKgTotal != null ? Number(user.co2SavedKgTotal).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-600 to-emerald-800" />

        <div className="relative pt-6">
          <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-lg mb-3">
            <div className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-bold text-3xl">
              {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center space-x-1.5">
            <span>{user.name}</span>
            {user.isOrgVerified && <ShieldCheck className="w-5 h-5 text-emerald-500" title="Organization Verified" />}
          </h2>
          <p className="text-sm text-slate-500 mb-1">{user.email}</p>

          {user.isOrgVerified ? (
            <div className="inline-block bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-xs font-bold mb-6 border border-emerald-100">
              ✓ Verified Community Member
            </div>
          ) : (
            <Link
              to="/auth/verify-organization"
              className="inline-block bg-amber-50 text-amber-800 hover:bg-amber-100 px-3.5 py-1 rounded-full text-xs font-bold mb-6 border border-amber-200"
            >
              ⚠ Verify Organization Account →
            </Link>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div>
              <div className="text-lg font-bold text-slate-800">
                {rating} <span className="text-sm">⭐</span>
              </div>
              <div className="text-xs text-slate-400">Driver Rating</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">
                {co2} <span className="text-sm font-semibold">kg</span>
              </div>
              <div className="text-xs text-slate-400">CO₂ Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Details</h3>

        <div className="flex items-center space-x-3 text-sm text-slate-700">
          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        {user.orgEmail && (
          <div className="flex items-center space-x-3 text-sm text-slate-700">
            <Building className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{user.orgEmail}</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">ORG</span>
          </div>
        )}

        {user.phone && (
          <div className="flex items-center space-x-3 text-sm text-slate-700">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{user.phone}</span>
          </div>
        )}
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <Link
          to="/profile/vehicles"
          className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-slate-700 block text-sm">My Vehicles</span>
              <span className="text-xs text-slate-400">Manage cars and bikes for offering rides</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/profile/driving-license"
          className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-slate-700 block text-sm">Driving License</span>
              <span className="text-xs text-slate-400">Driver verification credentials</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/profile/history"
          className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-slate-700 block text-sm">Activity & History</span>
              <span className="text-xs text-slate-400">View your bookings and offered carpools</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Link>

        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors text-rose-600"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Log Out</span>
          </div>
        </button>
      </div>
    </div>
  );
}
