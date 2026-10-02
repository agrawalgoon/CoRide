import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  X, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Car, 
  QrCode, 
  ShieldCheck, 
  Filter, 
  CheckCheck,
  ArrowRight
} from 'lucide-react';

export default function AlertsPage() {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const notifications = [
    {
      id: 1,
      category: 'REQUESTS',
      title: 'New Ride Request from Alex Wong',
      message: 'Alex Wong requested 1 seat for your tomorrow 08:30 AM campus carpool (East Dorms → Main Tech Hub).',
      timestamp: '12 minutes ago',
      badge: 'Pending Approval',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
      actionable: true,
      sender: {
        name: 'Alex Wong',
        role: 'Graduate Student • Data Science',
        rating: '4.95',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'
      }
    },
    {
      id: 2,
      category: 'STATUS',
      title: 'Ride Request Accepted',
      message: 'Sarah Jenkins approved your carpool reservation for tomorrow at 08:45 AM. Your seat is confirmed.',
      timestamp: '45 minutes ago',
      badge: 'Confirmed Seat',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      actionable: false,
      rideLink: true
    },
    {
      id: 3,
      category: 'REMINDERS',
      title: 'Upcoming Ride Reminder',
      message: 'Your morning commute with Sarah departs in 45 minutes from West Campus Residence Gate 2.',
      timestamp: '1 hour ago',
      badge: 'Departure Reminder',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
      actionable: false
    },
    {
      id: 4,
      category: 'MATCHES',
      title: 'AI Commute Match: Marcus Chen shares your route',
      message: 'Marcus Chen drives a Tesla Model 3 from North Apartments to Engineering Hub every weekday at 08:50 AM (94% Match).',
      timestamp: '3 hours ago',
      badge: 'AI Route Match',
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
      actionable: false
    },
    {
      id: 5,
      category: 'ATTENDANCE',
      title: 'Attendance Verified via Dynamic QR',
      message: 'Your attendance was successfully checked in by driver Sarah Jenkins using dynamic geofenced QR code.',
      timestamp: 'Yesterday at 09:12 AM',
      badge: 'Attendance Confirmed',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
      actionable: false
    }
  ];

  const filtered = activeCategory === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates on your ride requests, confirmations, AI matches, and attendance.
          </p>
        </div>

        <button 
          onClick={() => alert('All notifications marked as read.')}
          className="self-start sm:self-auto flex items-center space-x-2 text-xs font-bold text-coride-primary bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl border border-emerald-200/60 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* 2-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Category Filter (3 Cols) */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-subtle space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Categories</h3>

          {[
            { key: 'ALL', label: 'All Notifications', count: 5 },
            { key: 'REQUESTS', label: 'Ride Requests', count: 1 },
            { key: 'STATUS', label: 'Confirmations & Status', count: 1 },
            { key: 'REMINDERS', label: 'Ride Reminders', count: 1 },
            { key: 'MATCHES', label: 'AI Matches', count: 1 },
            { key: 'ATTENDANCE', label: 'Attendance Passes', count: 1 }
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.key
                  ? 'bg-coride-dark text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeCategory === cat.key 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </aside>

        {/* Right Main Notifications List (9 Cols) */}
        <div className="lg:col-span-9 space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-md transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {item.timestamp}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>

              {/* Actionable Request Block */}
              {item.actionable && item.sender && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.sender.avatar}
                      alt={item.sender.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{item.sender.name}</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">{item.sender.role}</p>
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        ★ {item.sender.rating} rating
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => alert(`Accepted ${item.sender.name}'s request!`)}
                      className="bg-coride-dark hover:bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Request</span>
                    </button>
                    <button 
                      onClick={() => alert('Declined request.')}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Link for Confirmed Rides */}
              {item.rideLink && (
                <div className="pt-1">
                  <button 
                    onClick={() => window.location.href = '/my-rides'}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-coride-primary hover:text-coride-dark transition-colors"
                  >
                    <span>View Boarding Pass in My Rides</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
