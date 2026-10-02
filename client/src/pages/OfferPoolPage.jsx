import React, { useState } from 'react';
import { 
  PlusCircle, 
  Car, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Repeat, 
  CheckCircle2, 
  X, 
  Check, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function OfferPoolPage() {
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState(3);
  const [selectedDays, setSelectedDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const incomingRequests = [
    {
      id: 'req-1',
      passenger: {
        name: 'Alex Wong',
        role: 'Data Science • Graduate Student',
        rating: 4.95,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150'
      },
      rideInfo: 'East Dorms → Main Tech Hub (08:30 AM)',
      seatsRequested: 1,
      time: '15m ago'
    },
    {
      id: 'req-2',
      passenger: {
        name: 'Chloe Bennett',
        role: 'Biomedical • Junior',
        rating: 4.9,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150'
      },
      rideInfo: 'East Dorms → Main Tech Hub (08:30 AM)',
      seatsRequested: 1,
      time: '1h ago'
    }
  ];

  const activeOfferedRides = [
    {
      id: 'off-1',
      origin: 'East Campus Dormitory Area',
      destination: 'Main Technology Campus Hub',
      departureTime: 'Tomorrow at 08:30 AM',
      isRecurring: true,
      recurringText: 'Mon - Fri Commute',
      seatsAvailable: 3,
      totalSeats: 4,
      contribution: '$3.00 / seat',
      status: 'SCHEDULED'
    }
  ];

  return (
    <div className="space-y-8">
      {/* ================= TOP HEADER & QUICK METRICS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Offer Pool Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish your empty carpool seats and manage incoming passenger requests.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 transition-colors"
          >
            <Car className="w-4 h-4 text-coride-primary" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* ================= 2-COLUMN DESKTOP WORKSPACE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT COLUMN: CREATE RIDE FORM (7 Cols) ================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-subtle space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900">Create a New Campus Commute</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in your departure details to open seats for campus peers.
            </p>
          </div>

          {/* Active Vehicle Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-coride-light text-coride-dark flex items-center justify-center shadow-xs">
                <Car className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">Honda Civic • 2023 (Grey)</span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">License Plate: 7XYZ89 • 4 Passenger Capacity</p>
              </div>
            </div>

            <button 
              onClick={() => setShowAddVehicleModal(true)}
              className="text-xs font-bold text-coride-primary hover:underline"
            >
              Switch
            </button>
          </div>

          {/* Form Fields: Route */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Route & Stops</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Starting Point</label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-coride-primary"></div>
                  <input
                    type="text"
                    defaultValue="East Campus Dormitory Area"
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Destination Hub</label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                  <input
                    type="text"
                    defaultValue="Main Technology Campus Hub"
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Date & Time */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule & Recurrence</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Departure Date</label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    defaultValue="2026-10-04"
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 w-full focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Departure Time</label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    defaultValue="08:30"
                    className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 w-full focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Recurring Toggle & Days */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Repeat className="w-4 h-4 text-coride-primary" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Make this a Recurring Commute</p>
                    <p className="text-[11px] text-slate-500">Automatically creates rides for your weekly routine</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isRecurring ? 'bg-coride-dark' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isRecurring ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-emerald-200/50 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 mr-2">Repeats on:</span>
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                    const active = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          active 
                            ? 'bg-coride-dark text-white border-coride-dark' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Form Fields: Seats & Cost Contribution */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Seats & Contribution</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Available Passenger Seats</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSelectedSeats(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedSeats === num
                          ? 'bg-coride-dark text-white border-coride-dark shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Fuel Contribution / Seat</label>
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2.5">
                  <DollarSign className="w-4 h-4 text-coride-primary" />
                  <input
                    type="text"
                    defaultValue="3.00"
                    className="bg-transparent text-sm font-bold text-slate-800 w-full focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button 
            onClick={() => alert('CoRide: New carpool offer published successfully!')}
            className="w-full bg-coride-dark hover:bg-emerald-900 active:scale-[0.99] text-white py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Publish Carpool Offer</span>
          </button>
        </div>

        {/* ================= RIGHT COLUMN: REQUESTS & ACTIVE RIDES (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Passenger Ride Requests Management Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-coride-primary" />
                <h3 className="font-extrabold text-sm text-slate-900">Passenger Requests</h3>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                2 Pending
              </span>
            </div>

            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div 
                  key={req.id}
                  className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={req.passenger.avatar}
                        alt={req.passenger.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{req.passenger.name}</h4>
                        <p className="text-[11px] text-slate-500">{req.passenger.role}</p>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          ★ {req.passenger.rating}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{req.time}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                    <span className="font-bold text-slate-800">1 Seat Requested:</span> {req.rideInfo}
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={() => alert(`Accepted ${req.passenger.name}'s request!`)}
                      className="flex-1 bg-coride-dark hover:bg-emerald-900 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Request</span>
                    </button>
                    <button 
                      onClick={() => alert(`Declined request.`)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active & Recurring Commutes Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Your Active Commutes</h3>
              <span className="text-xs text-slate-400 font-semibold">1 Active</span>
            </div>

            {activeOfferedRides.map((ride) => (
              <div 
                key={ride.id}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {ride.recurringText}
                  </span>
                  <span className="text-xs font-bold text-slate-600">{ride.departureTime}</span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">{ride.origin} → {ride.destination}</p>
                  <p className="text-slate-500 font-medium">{ride.seatsAvailable} of {ride.totalSeats} Available • {ride.contribution}</p>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl transition-colors">
                    Edit Commute
                  </button>
                  <button className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Register New Vehicle</h3>
              <button 
                onClick={() => setShowAddVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Make & Model</label>
                <input type="text" placeholder="e.g. Toyota Prius" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">License Plate</label>
                  <input type="text" placeholder="e.g. 7XYZ89" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium uppercase" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Total Seats</label>
                  <input type="number" defaultValue="4" max="7" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Vehicle Registration Photo (RC)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-coride-primary transition-colors">
                  <FileCheck className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-slate-500 font-medium">Click to upload vehicle documents</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  alert('Vehicle submitted for campus verification!');
                  setShowAddVehicleModal(false);
                }}
                className="flex-1 bg-coride-dark hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition-colors"
              >
                Save & Submit for Verification
              </button>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
