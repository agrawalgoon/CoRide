import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Search, 
  PlusCircle, 
  CalendarCheck, 
  Bell, 
  User, 
  ChevronDown,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function TopHeader() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Find Pool', icon: Search, exact: true },
    { to: '/offer', label: 'Offer Pool', icon: PlusCircle },
    { to: '/my-rides', label: 'My Rides', icon: CalendarCheck },
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: 3 }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ================= LEFT SECTION: BRAND & CAMPUS ================= */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-coride-dark flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xl text-slate-900 tracking-tight">CoRide</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-coride-light text-coride-dark px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                    CAMPUS
                  </span>
                </div>
              </div>
            </Link>

            {/* Campus Organization Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100/90 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200/60">
              <MapPin className="w-3.5 h-3.5 text-coride-primary" />
              <span className="font-medium text-slate-800">Stanford University Hub</span>
            </div>
          </div>

          {/* ================= CENTER SECTION: DESKTOP NAVIGATION ================= */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `
                    relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all
                    ${isActive 
                      ? 'bg-coride-light/80 text-coride-dark shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'}
                  `}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span>{item.label}</span>

                  {/* Badge Counter */}
                  {item.badge && (
                    <span className="ml-1 bg-rose-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.2">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* ================= RIGHT SECTION: VERIFICATION & PROFILE ================= */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            
            {/* Verification Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Member</span>
            </div>

            {/* Notification Bell Icon */}
            <Link 
              to="/alerts" 
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </Link>

            {/* User Profile Trigger & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-2 ring-emerald-500/20 flex items-center justify-center font-bold text-slate-700 text-xs">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                    alt="Ethan Liu"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span>EL</span>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">Ethan Liu</span>
                  <span className="text-[10px] font-medium text-slate-500">Student • Verified</span>
                </div>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-slate-200/80 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">Ethan Liu</p>
                      <p className="text-[11px] text-slate-500 truncate">ethan.liu@campus.edu</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile & Verification</span>
                    </Link>

                    <Link
                      to="/my-rides"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-slate-400" />
                      <span>My Bookings & Offers</span>
                    </Link>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        alert('CoRide: Signed out for demonstration.');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
