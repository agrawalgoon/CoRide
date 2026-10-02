import React, { useState } from 'react';
import { 
  CalendarCheck, 
  MapPin, 
  Clock, 
  Car, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Navigation, 
  ArrowRight,
  User,
  AlertCircle
} from 'lucide-react';

export default function MyRidesPage() {
  const [activeTab, setActiveTab] = useState('PASSENGER');
  const [showQrModal, setShowQrModal] = useState(false);

  const passengerRides = [
    {
      id: 'bk-101',
      driver: {
        name: 'Sarah Jenkins',
        role: 'Faculty • Computer Science',
        rating: '4.9',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
      },
      car: 'White Honda Civic (7XYZ89)',
      origin: 'West Campus Residence',
      destination: 'Innovation Science Park Hub',
      departureTime: 'Today, 08:45 AM',
      seats: 1,
      fare: '$3.50',
      status: 'CONFIRMED',
      geofenceStatus: 'Within pickup range (42m)'
    }
  ];

  const offeredRides = [
    {
      id: 'rd-201',
      car: 'Grey Honda Civic (7XYZ89)',
      origin: 'East Campus Dormitory',
      destination: 'Main Technology Campus Hub',
      departureTime: 'Tomorrow, 08:30 AM',
      totalSeats: 4,
      availableSeats: 3,
      farePerSeat: '$3.00',
      status: 'ACTIVE_COMMUTE',
      passengers: [
        { name: 'Alex Wong', role: 'Student', status: 'Accepted' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Campus Rides</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your booked carpool seats and driver commutes in real time.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-200/70 rounded-xl space-x-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('PASSENGER')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PASSENGER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            As Passenger (1)
          </button>
          <button
            onClick={() => setActiveTab('DRIVER')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DRIVER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            As Driver (1)
          </button>
        </div>
      </div>

      {/* Passenger View */}
      {activeTab === 'PASSENGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {passengerRides.map((ride) => (
            <div 
              key={ride.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-5"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {ride.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{ride.departureTime}</span>
                </div>
                <span className="text-base font-extrabold text-coride-dark">{ride.fare}</span>
              </div>

              {/* Driver Details */}
              <div className="flex items-center space-x-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <img
                  src={ride.driver.avatar}
                  alt={ride.driver.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{ride.driver.name}</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-500">{ride.driver.role}</p>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">{ride.car}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    ★ {ride.driver.rating}
                  </span>
                </div>
              </div>

              {/* Route Points */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-3 h-3 rounded-full bg-coride-primary mt-1 ring-4 ring-emerald-100 flex-shrink-0"></div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Pickup Point</span>
                    <p className="font-semibold text-slate-800">{ride.origin}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-3 h-3 rounded-full bg-rose-500 mt-1 ring-4 ring-rose-100 flex-shrink-0"></div>
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase">Drop-off Hub</span>
                    <p className="font-semibold text-slate-800">{ride.destination}</p>
                  </div>
                </div>
              </div>

              {/* Geofencing Indicator */}
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/60">
                <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Geofence Status: {ride.geofenceStatus}</span>
              </div>

              {/* Attendance QR Trigger Action */}
              <div className="flex items-center space-x-3 pt-2">
                <button 
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 bg-coride-dark hover:bg-emerald-900 active:scale-[0.99] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all"
                >
                  <QrCode className="w-4 h-4 stroke-[2.2]" />
                  <span>Show Dynamic Boarding Pass</span>
                </button>
                <button className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Driver View */}
      {activeTab === 'DRIVER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offeredRides.map((ride) => (
            <div 
              key={ride.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Offered Commute
                </span>
                <span className="text-xs font-bold text-slate-500">{ride.departureTime}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Route</p>
                <p className="text-sm font-bold text-slate-800">{ride.origin} → {ride.destination}</p>
                <p className="text-xs text-slate-500">{ride.car}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Seats:</span>{' '}
                  <span className="font-bold text-slate-800">{ride.availableSeats} of {ride.totalSeats} Available</span>
                </div>
                <div>
                  <span className="text-slate-500">Contribution:</span>{' '}
                  <span className="font-bold text-coride-dark">{ride.farePerSeat} / seat</span>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl transition-colors">
                  Manage Commute & Passengers
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic QR Code Modal Preview */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Attendance Pass
              </span>
              <button 
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-900">Dynamic Boarding QR</h3>
              <p className="text-xs text-slate-500">Scan this code with the driver to confirm your seat attendance.</p>
            </div>

            {/* QR Mockup with 30s rotating indicator */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-500/40 inline-block">
              <div className="w-48 h-48 bg-white rounded-xl shadow-xs flex flex-col items-center justify-center p-2 mx-auto">
                <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none">
                  {/* Outer Frame */}
                  <rect x="5" y="5" width="30" height="30" rx="4" stroke="#0F5132" strokeWidth="6" />
                  <rect x="13" y="13" width="14" height="14" fill="#0F5132" />
                  <rect x="65" y="5" width="30" height="30" rx="4" stroke="#0F5132" strokeWidth="6" />
                  <rect x="73" y="13" width="14" height="14" fill="#0F5132" />
                  <rect x="5" y="65" width="30" height="30" rx="4" stroke="#0F5132" strokeWidth="6" />
                  <rect x="13" y="73" width="14" height="14" fill="#0F5132" />
                  {/* Dynamic Pattern blocks */}
                  <rect x="42" y="10" width="8" height="8" fill="#137547" />
                  <rect x="52" y="18" width="8" height="8" fill="#137547" />
                  <rect x="42" y="32" width="16" height="8" fill="#137547" />
                  <rect x="10" y="45" width="14" height="8" fill="#137547" />
                  <rect x="45" y="45" width="10" height="10" fill="#0F5132" />
                  <rect x="65" y="45" width="14" height="8" fill="#137547" />
                  <rect x="85" y="45" width="8" height="18" fill="#137547" />
                  <rect x="45" y="65" width="18" height="8" fill="#137547" />
                  <rect x="68" y="72" width="12" height="12" fill="#0F5132" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-700">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Rotates every 30 seconds for security</span>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs transition-colors"
            >
              Close Boarding Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
