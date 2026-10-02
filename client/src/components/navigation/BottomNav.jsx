import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, PlusCircle, CalendarCheck, Bell, User } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    {
      to: '/',
      label: 'Find',
      icon: Search,
      exact: true
    },
    {
      to: '/offer',
      label: 'Offer',
      icon: PlusCircle,
      isAction: true
    },
    {
      to: '/my-rides',
      label: 'My Rides',
      icon: CalendarCheck
    },
    {
      to: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: 3
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[58px]
              ${isActive ? 'text-coride-dark font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {item.isAction ? (
                    <div className={`
                      w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-sm
                      ${isActive 
                        ? 'bg-coride-dark text-white ring-2 ring-coride-light ring-offset-1' 
                        : 'bg-coride-light text-coride-dark hover:bg-emerald-100'}
                    `}>
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  ) : (
                    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-coride-light/60' : ''}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-coride-dark' : 'stroke-[1.8]'}`} />
                    </div>
                  )}

                  {/* Notification badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'text-coride-dark' : 'text-slate-500'}`}>
                  {item.label}
                </span>

                {/* Subtle active underline dot */}
                {isActive && !item.isAction && (
                  <span className="w-1 h-1 bg-coride-primary rounded-full mt-0.5"></span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
