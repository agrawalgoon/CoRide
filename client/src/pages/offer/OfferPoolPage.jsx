import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Clock, Users, CheckCircle, AlertCircle,
  Map, Crosshair, LoaderCircle, Repeat, PlusCircle, Car, Check, X, ShieldCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createRide, updateRide, getRideById } from '../../services/rideService';
import { getVehicles } from '../../services/vehicleService';
import LocationPickerModal from '../../components/map/LocationPickerModal';
import ActiveCommutesPanel from '../../components/ride/ActiveCommutesPanel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OfferPoolPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editParamId = searchParams.get('edit');

  // Form state
  const [editingRideId, setEditingRideId] = useState(null);
  const [origin, setOrigin] = useState({ address: '', latitude: null, longitude: null });
  const [destination, setDestination] = useState({ address: '', latitude: null, longitude: null });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(3.00);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Ride Published!');
  const [error, setError] = useState('');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState('origin');
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeCommutesKey, setActiveCommutesKey] = useState(0);

  // Mock pending request state for visual fidelity with Screenshot 1
  const [pendingRequestApproved, setPendingRequestApproved] = useState(false);
  const [pendingRequestDismissed, setPendingRequestDismissed] = useState(false);

  // Load user vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setVehiclesLoading(true);
      try {
        const list = await getVehicles();
        const activeVehicles = Array.isArray(list) ? list.filter((v) => v.isActive) : [];
        setVehicles(activeVehicles);
        if (activeVehicles.length > 0 && !selectedVehicleId) {
          setSelectedVehicleId(activeVehicles[0].id);
        }
      } catch (err) {
        console.error('Failed to load vehicles for offer pool:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Handle edit param if present
  useEffect(() => {
    if (editParamId) {
      loadRideForEdit(editParamId);
    }
  }, [editParamId]);

  const loadRideForEdit = async (rideId) => {
    try {
      const ride = await getRideById(rideId);
      if (ride) {
        setEditingRideId(ride.id);
        setOrigin({
          address: ride.originAddress,
          latitude: Number(ride.originLatitude),
          longitude: Number(ride.originLongitude)
        });
        setDestination({
          address: ride.destinationAddress,
          latitude: Number(ride.destinationLatitude),
          longitude: Number(ride.destinationLongitude)
        });
        if (ride.departureTime) {
          const d = new Date(ride.departureTime);
          setDate(d.toISOString().split('T')[0]);
          setTime(d.toTimeString().slice(0, 5));
        }
        setSeats(ride.totalSeats || 3);
        setPricePerSeat(Number(ride.pricePerSeat) || 3.00);
        setIsRecurring(Boolean(ride.isRecurring));
        if (ride.recurringDays && Array.isArray(ride.recurringDays)) {
          setRecurringDays(ride.recurringDays);
        }
        if (ride.vehicleId) {
          setSelectedVehicleId(ride.vehicleId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to load ride for edit:', err);
    }
  };

  const cancelEdit = () => {
    setEditingRideId(null);
    setOrigin({ address: '', latitude: null, longitude: null });
    setDestination({ address: '', latitude: null, longitude: null });
    setDate('');
    setTime('');
    setSeats(3);
    setPricePerSeat(3.00);
    setIsRecurring(false);
    setRecurringDays(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    setError('');
  };

  const toggleDay = (day) => {
    if (recurringDays.includes(day)) {
      if (recurringDays.length > 1) {
        setRecurringDays(recurringDays.filter((d) => d !== day));
      }
    } else {
      setRecurringDays([...recurringDays, day]);
    }
  };

  const openMapModal = (target) => {
    setMapTarget(target);
    setMapModalOpen(true);
  };

  const handleLocationSelect = (loc) => {
    if (mapTarget === 'origin') {
      setOrigin({
        address: loc.address,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude)
      });
    } else {
      setDestination({
        address: loc.address,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude)
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setOrigin({ address, latitude, longitude });
        } catch {
          setOrigin({
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
          });
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        alert('Unable to retrieve your location.');
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!origin.latitude || !destination.latitude) {
      setError('Please select both starting point and destination hub.');
      return;
    }
    if (!date || !time) {
      setError('Please select departure date and time.');
      return;
    }
    const departure = new Date(`${date}T${time}`);
    if (isNaN(departure.getTime()) || departure <= new Date()) {
      setError('Departure date and time must be in the future.');
      return;
    }
    if (isRecurring && recurringDays.length === 0) {
      setError('Please select at least one recurring day.');
      return;
    }
    if (!selectedVehicleId && vehicles.length > 0) {
      setError('Please select a vehicle for this carpool.');
      return;
    }
    if (vehicles.length === 0 && !vehiclesLoading) {
      setError('You need to add a vehicle first in Profile → My Vehicles before offering a ride.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vehicleId: selectedVehicleId || vehicles[0]?.id,
        originAddress: origin.address,
        originLatitude: Number(origin.latitude),
        originLongitude: Number(origin.longitude),
        destinationAddress: destination.address,
        destinationLatitude: Number(destination.latitude),
        destinationLongitude: Number(destination.longitude),
        departureTime: departure.toISOString(),
        totalSeats: Number(seats),
        pricePerSeat: Number(pricePerSeat),
        pricePerKm: 5,
        isRecurring: Boolean(isRecurring),
        ...(isRecurring && {
          recurringDays,
          recurringPattern: {
            pattern: 'CUSTOM',
            recurringDays,
            startDate: departure.toISOString(),
            departureTimeOfDay: time,
          },
        }),
      };

      if (editingRideId) {
        await updateRide(editingRideId, payload);
        setSuccessMessage('Commute Schedule Updated!');
      } else {
        await createRide(payload);
        setSuccessMessage('Ride Published!');
      }

      setIsSuccess(true);
      setActiveCommutesKey((k) => k + 1);
    } catch (err) {
      console.error('Ride submit error:', err);
      setError(err.response?.data?.message || 'Failed to publish carpool offer. Please verify route and schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Success Screen
  // ---------------------------------------------------------------------------
  const renderSuccess = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10 flex flex-col items-center gap-4 text-center">
      <div className="bg-emerald-100 rounded-full p-4">
        <CheckCircle size={44} className="text-emerald-700" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-800">{successMessage}</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        {isRecurring
          ? 'Your recurring weekly commute schedule is active. Eligible campus passengers can now request seats.'
          : 'Your carpool offer is now live. Passengers along your route can book available seats.'}
      </p>
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={() => {
            setIsSuccess(false);
            setEditingRideId(null);
            setOrigin({ address: '', latitude: null, longitude: null });
            setDestination({ address: '', latitude: null, longitude: null });
            setDate('');
            setTime('');
            setSeats(3);
            setPricePerSeat(3.00);
            setIsRecurring(false);
            setRecurringDays(['MON', 'TUE', 'WED', 'THU', 'FRI']);
            setError('');
          }}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          Offer Another Pool
        </button>
        <button
          onClick={() => navigate('/profile/history')}
          className="border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
        >
          View In Activity
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        
        {/* Main Grid: Form on Left, Active Commutes & Requests on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 items-start">
          
          {/* LEFT: Offer Pool Creation Form */}
          <div>
            {isSuccess ? (
              renderSuccess()
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
                
                {/* Form header if in edit mode */}
                {editingRideId && (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                    <span className="text-xs font-bold text-emerald-800">
                      Editing Commute #{editingRideId}
                    </span>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs font-medium">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── ROUTE SECTION ─────────────────────────────────── */}
                <div className="space-y-4">
                  {/* Starting Point */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Starting Point
                      </label>
                    </div>
                    <div
                      onClick={() => openMapModal('origin')}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-50/80 cursor-pointer hover:border-emerald-500 transition-colors truncate"
                    >
                      {origin.address || <span className="text-slate-400 font-normal">Select starting point</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={locationLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 bg-white px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {locationLoading ? (
                          <LoaderCircle size={12} className="animate-spin" />
                        ) : (
                          <Crosshair size={12} />
                        )}
                        Use Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => openMapModal('origin')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <Map size={12} />
                        Choose on Map
                      </button>
                    </div>
                  </div>

                  {/* Destination Hub */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Destination Hub
                      </label>
                    </div>
                    <div
                      onClick={() => openMapModal('destination')}
                      className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-50/80 cursor-pointer hover:border-rose-400 transition-colors truncate"
                    >
                      {destination.address || <span className="text-slate-400 font-normal">Select destination</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => openMapModal('destination')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <Map size={12} />
                        Choose on Map
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── SCHEDULE & RECURRENCE ─────────────────────────── */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Schedule &amp; Recurrence
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Departure Date */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Departure Date
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-2.5 bg-slate-50/80 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                        <Calendar size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {/* Departure Time */}
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Departure Time
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-2xl px-3.5 py-2.5 bg-slate-50/80 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                        <Clock size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recurring Toggle Card - Matching Screenshot 1 */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-100/90 text-emerald-700 rounded-xl p-2.5 shrink-0">
                          <Repeat size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            Make this a Recurring Commute
                          </p>
                          <p className="text-xs text-slate-500">
                            Automatically creates rides for your weekly routine
                          </p>
                        </div>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                          isRecurring ? 'bg-emerald-800' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            isRecurring ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Day-of-week Selectors - Only visible when recurring enabled */}
                    {isRecurring && (
                      <div className="pt-2 border-t border-emerald-200/50 space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Repeats on:</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {DAYS.map((day) => {
                            const isSelected = recurringDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── SEATS & CONTRIBUTION ──────────────────────────── */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Seats &amp; Contribution
                  </h3>

                  {/* Seat Selection Buttons */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">
                      Available Passenger Seats
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSeats(num)}
                          className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${
                            seats === num
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {num} {num === 1 ? 'Seat' : 'Seats'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fuel Contribution Input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">
                      Fuel Contribution / Seat
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/80 focus-within:border-emerald-600 focus-within:bg-white transition-all max-w-xs">
                      <span className="px-3.5 text-sm font-bold text-slate-500 bg-white border-r border-slate-200 py-2.5">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        value={pricePerSeat}
                        onChange={(e) => setPricePerSeat(parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2.5 text-sm font-bold text-slate-800 bg-transparent outline-none"
                      />
                      <span className="pr-3.5 text-xs font-bold text-slate-400">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Selector (Ensures backend createRide succeeds) */}
                  {vehicles.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Assigned Vehicle
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full max-w-sm border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50/80 outline-none"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.color} {v.make} {v.model} ({v.plateNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {vehicles.length === 0 && !vehiclesLoading && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                      <span>No active vehicle found. Please add a vehicle first.</span>
                      <button
                        type="button"
                        onClick={() => navigate('/profile/vehicles')}
                        className="font-bold underline text-amber-900 ml-2"
                      >
                        Add Vehicle
                      </button>
                    </div>
                  )}
                </div>

                {/* ── PUBLISH BUTTON ─────────────────────────────────── */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        <span>Processing Offer...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        <span>{editingRideId ? 'Update Carpool Offer' : 'Publish Carpool Offer'}</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* RIGHT: Active Commutes & Ride Requests Sidebar (Matching Screenshot 1) */}
          <div className="space-y-5">
            
            {/* Top Card: Ride Request (Chloe Bennett in Screenshot 1) */}
            {!pendingRequestDismissed && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-sky-100 flex items-center justify-center font-bold text-sky-800 text-sm overflow-hidden">
                      CB
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight">Chloe Bennett</h4>
                      <p className="text-xs text-slate-500">Biomedical • Junior</p>
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">⭐ 4.9</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">1h ago</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 font-medium">
                  1 Seat Requested: East Dorms → Main Tech Hub (08:30 AM)
                </div>

                {pendingRequestApproved ? (
                  <div className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    <Check size={14} /> Request Approved
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingRequestApproved(true)}
                      className="flex-1 py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Check size={14} /> Approve Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRequestDismissed(true)}
                      className="py-2.5 px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Card: Your Active Commutes Panel */}
            <ActiveCommutesPanel
              key={activeCommutesKey}
              onEditCommute={(ride) => loadRideForEdit(ride.id)}
            />

          </div>

        </div>

      </div>

      {/* Draggable Map Modal */}
      <LocationPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleLocationSelect}
        title={mapTarget === 'origin' ? 'Choose Departure / Pickup Point' : 'Choose Destination Hub'}
        label={mapTarget === 'origin' ? 'Pickup' : 'Destination'}
        markerColor={mapTarget === 'origin' ? '#059669' : '#f43f5e'}
        initialLocation={
          mapTarget === 'origin'
            ? (origin.latitude ? origin : null)
            : (destination.latitude ? destination : null)
        }
      />
    </div>
  );
}
