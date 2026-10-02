import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Car, 
  Leaf, 
  DollarSign, 
  Settings, 
  Music, 
  MessageSquare, 
  Wind, 
  CheckCircle2, 
  AlertCircle,
  FileText, 
  Mail, 
  Phone, 
  Plus, 
  Award,
  Calendar,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const vehicles = [
    {
      id: 'v-1',
      make: 'Honda',
      model: 'Civic',
      year: 2023,
      color: 'Grey',
      plate: '7XYZ89',
      capacity: 4,
      isVerified: true,
      isPrimary: true
    }
  ];

  const pastRides = [
    {
      id: 'pr-1',
      date: 'Oct 1, 2026',
      time: '08:45 AM',
      route: 'West Campus Residence → Engineering Complex',
      role: 'Passenger',
      partner: 'Sarah Jenkins',
      co2Saved: '3.2 kg',
      fare: '$3.50',
      status: 'COMPLETED'
    },
    {
      id: 'pr-2',
      date: 'Sep 29, 2026',
      time: '08:30 AM',
      route: 'East Campus Dorms → Main Tech Hub',
      role: 'Driver',
      partner: 'Alex Wong, Chloe B.',
      co2Saved: '6.4 kg',
      fare: '+$6.00',
      status: 'COMPLETED'
    }
  ];

  return (
    <div className="space-y-8">
      {/* ================= PROFILE COVER & HEADER CARD ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        {/* Cover Accent Banner */}
        <div className="h-32 bg-gradient-to-r from-coride-dark via-emerald-800 to-teal-800 relative">
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Stanford University Hub</span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-5 -mt-12 sm:-mt-14">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-slate-200 overflow-hidden ring-4 ring-white shadow-md flex items-center justify-center font-extrabold text-slate-700 text-2xl">
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250"
                  alt="Ethan Liu"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span>EL</span>
              </div>
              <span className="absolute bottom-1 right-1 bg-coride-dark text-white rounded-full p-1 ring-2 ring-white" title="Verified Campus Member">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Ethan Liu</h1>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Verified Member
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                ethan.liu@campus.edu • Computer Science (Senior)
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <button 
              onClick={() => alert('CoRide: Edit Profile modal')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              Edit Profile
            </button>
            <button 
              onClick={() => alert('CoRide: Security Settings')}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= RIDE STATISTICS METRIC CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">42.5 kg</span>
            <p className="text-xs text-slate-500 font-medium">CO₂ Emissions Offset</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">26</span>
            <p className="text-xs text-slate-500 font-medium">Carpools Completed</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">$184</span>
            <p className="text-xs text-slate-500 font-medium">Transit Fuel Saved</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">4.95 ★</span>
            <p className="text-xs text-slate-500 font-medium">Community Trust Score</p>
          </div>
        </div>

      </div>

      {/* ================= 2-COLUMN DASHBOARD CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: VERIFICATION & PERSONAL INFO (4 Cols) ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Organization Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Organization Verification</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Verified
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Institution</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">Stanford University</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Verified Email</span>
                <p className="font-semibold text-slate-800 mt-0.5">ethan.liu@campus.edu</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Role & Expiry</span>
                <p className="font-semibold text-slate-800 mt-0.5">Undergraduate Student • Valid until 2027</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 p-3 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full access to closed campus carpool network</span>
            </div>
          </div>

          {/* Driver License Verification Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Driving Licence Status</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Approved
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Licence Number</span>
                <p className="font-bold text-slate-800 mt-0.5">DL-••••••••789</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Authorised Category</span>
                <p className="font-semibold text-slate-800 mt-0.5">Class C • Passenger Motor Vehicle</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Verified to publish carpool offers and take passengers.
              </span>
            </div>
          </div>

          {/* Personal Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Contact & Emergency
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium">+1 (555) 234-5678</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium">ethan.liu@campus.edu</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Emergency Contact</span>
                <p className="font-bold text-slate-800 mt-0.5">Jane Liu (Parent) • +1 (555) 987-6543</p>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN: VEHICLES, PREFERENCES & RIDE HISTORY (8 Cols) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Registered Vehicles Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Registered Vehicles</h3>
                <p className="text-xs text-slate-500">Your campus-approved vehicles used for carpooling</p>
              </div>
              <button 
                onClick={() => alert('Register Vehicle modal')}
                className="bg-coride-light hover:bg-emerald-100 text-coride-dark font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>

            <div className="space-y-3">
              {vehicles.map((v) => (
                <div 
                  key={v.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white text-coride-dark flex items-center justify-center border border-slate-200 shadow-xs">
                      <Car className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900">{v.make} {v.model} ({v.year})</h4>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Plate: <span className="font-semibold text-slate-800">{v.plate}</span> • {v.color} • {v.capacity} Passenger Capacity
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-coride-primary bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                    Primary Car
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Commute Preferences Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
              Commute Preferences & Habits
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 rounded-2xl p-3.5 flex flex-col items-center">
                <Music className="w-5 h-5 text-coride-primary mb-1.5" />
                <span className="text-xs font-bold text-slate-900">Music Allowed</span>
                <span className="text-[10px] text-slate-500">Radio / Spotify</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 flex flex-col items-center">
                <MessageSquare className="w-5 h-5 text-coride-primary mb-1.5" />
                <span className="text-xs font-bold text-slate-900">Moderate Chat</span>
                <span className="text-[10px] text-slate-500">Friendly vibe</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 flex flex-col items-center">
                <Wind className="w-5 h-5 text-coride-primary mb-1.5" />
                <span className="text-xs font-bold text-slate-900">Air Conditioned</span>
                <span className="text-[10px] text-slate-500">Comfortable temp</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-coride-primary mb-1.5" />
                <span className="text-xs font-bold text-slate-900">Zero Smoking</span>
                <span className="text-[10px] text-slate-500">Clean air policy</span>
              </div>
            </div>
          </div>

          {/* Ride History Table / Cards */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Recent Commute History</h3>
                <p className="text-xs text-slate-500">Verified carpools completed on campus</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">2 Completed</span>
            </div>

            <div className="space-y-3">
              {pastRides.map((ride) => (
                <div 
                  key={ride.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {ride.role}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{ride.date} • {ride.time}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{ride.route}</p>
                    <p className="text-[11px] text-slate-500">Shared with {ride.partner}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <span className="text-sm font-extrabold text-slate-900">{ride.fare}</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                      🌱 {ride.co2Saved} saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
