import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Car,
  CheckCircle,
  AlertCircle,
  Map,
  Crosshair,
  LoaderCircle,
  Repeat
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getVehicles } from '../../services/vehicleService';
import { createRide } from '../../services/rideService';
import LocationPickerModal from '../../components/map/LocationPickerModal';

export default function OfferPoolPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Route, 2: Schedule & Vehicle, 3: Seats & Pricing, 4: Review

  const [origin, setOrigin] = useState({
    address: '',
    latitude: null,
    longitude: null
  });

  const [destination, setDestination] = useState({
    address: '',
    latitude: null,
    longitude: null
  });

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [seats, setSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(50);
  const [pricePerKm, setPricePerKm] = useState(5);

  // Recurring ride state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('WEEKDAYS'); // 'WEEKDAYS' | 'DAILY' | 'CUSTOM'
  const [customDays, setCustomDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [repeatWeeks, setRepeatWeeks] = useState(4);

  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRide, setCreatedRide] = useState(null);
  const [error, setError] = useState('');

  // Map modal states
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState('origin'); // 'origin' | 'destination'

  useEffect(() => {
    const fetchDriverVehicles = async () => {
      try {
        const data = await getVehicles();
        const activeVehicles = Array.isArray(data) ? data.filter((v) => v.isActive) : [];
        setVehicles(activeVehicles);
        if (activeVehicles.length > 0) {
          setSelectedVehicleId(activeVehicles[0].id);
          setSeats(Math.max(1, activeVehicles[0].seatCapacity - 1));
        }
      } catch (err) {
        console.error('Failed to load driver vehicles:', err);
      } finally {
        setVehiclesLoading(false);
      }
    };
    fetchDriverVehicles();
  }, []);

  const openMapPicker = (target) => {
    setMapTarget(target);
    setError('');
    setMapModalOpen(true);
  };

  const handleLocationConfirmed = (locData) => {
    if (mapTarget === 'origin') {
      setOrigin(locData);
    } else {
      setDestination(locData);
    }
  };

  const useCurrentLocation = (target) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const addr = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          if (target === 'origin') {
            setOrigin({ address: addr, latitude: lat, longitude: lon });
          } else {
            setDestination({ address: addr, latitude: lat, longitude: lon });
          }
        } catch {
          const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          if (target === 'origin') {
            setOrigin({ address: fallback, latitude: lat, longitude: lon });
          } else {
            setDestination({ address: fallback, latitude: lat, longitude: lon });
          }
        } finally {
          setLocationLoading(false);
        }
      },
      (geoErr) => {
        setLocationLoading(false);
        setError('Unable to detect location. Please select manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSubmit = async () => {
    setError('');
    if (!selectedVehicleId) {
      setError('Please select a vehicle or add one first in Profile → My Vehicles.');
      return;
    }

    const departure = new Date(`${date}T${time}`);
    if (isNaN(departure.getTime()) || departure <= new Date()) {
      setError('Departure date and time must be in the future.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedDays =
        recurringPattern === 'DAILY'
          ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
          : recurringPattern === 'WEEKDAYS'
          ? ['MON', 'TUE', 'WED', 'THU', 'FRI']
          : customDays;

      const endDate = new Date(departure);
      endDate.setDate(endDate.getDate() + repeatWeeks * 7);

      const payload = {
        vehicleId: selectedVehicleId,
        originAddress: origin.address,
        originLatitude: Number(origin.latitude),
        originLongitude: Number(origin.longitude),
        destinationAddress: destination.address,
        destinationLatitude: Number(destination.latitude),
        destinationLongitude: Number(destination.longitude),
        departureTime: departure.toISOString(),
        totalSeats: Number(seats),
        pricePerSeat: Number(pricePerSeat),
        totalTripCost: Number(pricePerSeat) * Number(seats),
        pricePerKm: Number(pricePerKm),
        isRecurring: Boolean(isRecurring),
        ...(isRecurring && {
          recurringDays: resolvedDays,
          recurringPattern: {
            pattern: recurringPattern,
            recurringDays: resolvedDays,
            startDate: departure.toISOString(),
            endDate: endDate.toISOString(),
            departureTimeOfDay: time,
            maxInstances: Math.min(60, repeatWeeks * resolvedDays.length)
          }
        })
      };

      const result = await createRide(payload);
      setCreatedRide(result);
      setIsSuccess(true);
    } catch (err) {
      console.error('Ride publishing error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to offer ride. Please verify that your vehicle and route information are valid.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-800">Ride Published!</h2>
        <p className="text-slate-500 max-w-sm text-sm">
          Your ride is now active in the system and eligible passengers can discover and book seats.
        </p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              setStep(1);
              setIsSuccess(false);
              setCreatedRide(null);
            }}
            className="px-6 py-2.5 bg-emerald-100 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-200 transition-colors text-sm"
          >
            Offer Another
          </button>
          <button
            onClick={() => navigate('/profile/history')}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors text-sm shadow-md shadow-emerald-200"
          >
            View My Rides
          </button>
        </div>
      </div>
    );
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Offer a Carpool Ride</h1>
        <p className="text-slate-500 text-sm">Share your ride, split trip costs, and commute together.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper indicator */}
      <div className="flex justify-between items-center px-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s}
            </div>
            {s < 4 && <div className={`w-12 sm:w-16 h-1 ${step > s ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        {/* STEP 1: ROUTE SELECTION WITH MAP */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Step 1: Set Your Route</h3>

            {/* Origin Location */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Leaving From (Pickup)</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 break-words">
                    {origin.address || 'Select departure point on map'}
                  </p>
                  {origin.latitude != null && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {origin.latitude.toFixed(5)}, {origin.longitude.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 pl-8">
                <button
                  type="button"
                  onClick={() => useCurrentLocation('origin')}
                  disabled={locationLoading}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Use Current Location
                </button>
                <button
                  type="button"
                  onClick={() => openMapPicker('origin')}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Map className="w-3.5 h-3.5 text-emerald-600" />
                  Choose on Map (Draggable)
                </button>
              </div>
            </div>

            {/* Destination Location */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-rose-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Going To (Destination)</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 break-words">
                    {destination.address || 'Select destination point on map'}
                  </p>
                  {destination.latitude != null && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 pl-8">
                <button
                  type="button"
                  onClick={() => openMapPicker('destination')}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Map className="w-3.5 h-3.5 text-rose-500" />
                  Choose on Map (Draggable)
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                if (!origin.latitude || !destination.latitude) {
                  setError('Please select both pickup and destination locations on the map.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              disabled={!origin.latitude || !destination.latitude}
              className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md shadow-emerald-200"
            >
              Continue to Schedule →
            </button>
          </div>
        )}

        {/* STEP 2: DATE, TIME & VEHICLE */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Step 2: Schedule & Vehicle</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Departure Date
                </label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <Calendar className="text-slate-400 w-5 h-5 shrink-0" />
                  <input
                    type="date"
                    min={minDate}
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent outline-none w-full text-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Departure Time
                </label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <Clock className="text-slate-400 w-5 h-5 shrink-0" />
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-transparent outline-none w-full text-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* RECURRING RIDE TOGGLE & OPTIONS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Recurring Ride</p>
                      <p className="text-xs text-slate-500">Auto-schedule this ride for future dates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {isRecurring && (
                  <div className="pt-3 border-t border-slate-200 space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Repeat Pattern
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'WEEKDAYS', label: 'Weekdays (M–F)' },
                          { id: 'DAILY', label: 'Daily (7 days)' },
                          { id: 'CUSTOM', label: 'Custom' }
                        ].map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => setRecurringPattern(pat.id)}
                            className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                              recurringPattern === pat.id
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {recurringPattern === 'CUSTOM' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Select Days
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                            const isSelected = customDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    if (customDays.length > 1) {
                                      setCustomDays(customDays.filter((d) => d !== day));
                                    }
                                  } else {
                                    setCustomDays([...customDays, day]);
                                  }
                                }}
                                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Duration
                      </label>
                      <select
                        value={repeatWeeks}
                        onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                      >
                        <option value={1}>Repeat for 1 week</option>
                        <option value={2}>Repeat for 2 weeks</option>
                        <option value={3}>Repeat for 3 weeks</option>
                        <option value={4}>Repeat for 4 weeks (1 month)</option>
                        <option value={8}>Repeat for 8 weeks (2 months)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Vehicle
                  </label>
                  <Link to="/profile/vehicles" className="text-xs font-bold text-emerald-600 hover:underline">
                    + Manage Vehicles
                  </Link>
                </div>

                {vehiclesLoading ? (
                  <p className="text-xs text-slate-400">Loading your vehicles...</p>
                ) : vehicles.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs space-y-2">
                    <p className="font-bold">No active vehicles found.</p>
                    <p>You must register a vehicle before publishing a ride.</p>
                    <Link
                      to="/profile/vehicles"
                      className="inline-block px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold"
                    >
                      Add Vehicle Now
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const veh = vehicles.find((v) => v.id === e.target.value);
                      if (veh) setSeats(Math.max(1, veh.seatCapacity - 1));
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.color} {v.make} {v.model} ({v.plateNumber}) • {v.seatCapacity} seats
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!date || !time) {
                    setError('Please select departure date and time.');
                    return;
                  }
                  if (!selectedVehicleId) {
                    setError('Please register and select a vehicle.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                disabled={!date || !time || !selectedVehicleId}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 text-sm"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SEATS & PRICING */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Step 3: Seats & Contribution</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Available Passenger Seats
                </label>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Users className="text-slate-400 w-5 h-5" />
                    <span className="text-sm font-semibold text-slate-700">Passenger Seats</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-300"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg text-slate-800">{seats}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSeats((prev) =>
                          Math.min(selectedVehicle ? selectedVehicle.seatCapacity - 1 : 6, prev + 1)
                        )
                      }
                      className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                {selectedVehicle && (
                  <p className="text-xs text-slate-400 mt-1 pl-1">
                    Max capacity for {selectedVehicle.make} {selectedVehicle.model}: {selectedVehicle.seatCapacity - 1} passengers
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Price per Seat (₹)
                </label>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-2">
                  <span className="text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(Number(e.target.value))}
                    className="bg-transparent outline-none w-full text-slate-800 font-bold text-base"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Standard peer contribution to cover fuel and commute expenses.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Rate per Kilometre (₹/km)
                </label>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center space-x-2">
                  <span className="text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(Number(e.target.value))}
                    className="bg-transparent outline-none w-full text-slate-800 font-bold text-base"
                  />
                  <span className="text-slate-400 text-sm whitespace-nowrap">/km</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Passengers pay based on their individual travel distance at this rate.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep(4);
                }}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 text-sm"
              >
                Review Ride →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & PUBLISH */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Step 4: Review & Publish</h3>

            <div className="bg-slate-50 p-5 rounded-2xl space-y-4 text-sm border border-slate-200">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Route</span>
                <p className="font-semibold text-slate-800">{origin.address}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ({origin.latitude?.toFixed(4)}, {origin.longitude?.toFixed(4)})
                </p>
                <p className="text-xs text-slate-500 mt-1">↓ To</p>
                <p className="font-semibold text-slate-800 mt-1">{destination.address}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ({destination.latitude?.toFixed(4)}, {destination.longitude?.toFixed(4)})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Departure</span>
                  <span className="font-semibold text-slate-800">{date} at {time}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Seats Offered</span>
                  <span className="font-semibold text-slate-800">{seats} seats</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Vehicle</span>
                  <span className="font-semibold text-slate-800">
                    {selectedVehicle?.color} {selectedVehicle?.make} ({selectedVehicle?.plateNumber})
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block mb-0.5">Fare per Seat</span>
                  <span className="font-bold text-emerald-600 text-base">₹{pricePerSeat}</span>
                </div>
              </div>

              {isRecurring && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start space-x-2.5">
                  <Repeat className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-800">Recurring Ride Scheduled</p>
                    <p className="text-emerald-700 mt-0.5">
                      Repeats {recurringPattern === 'WEEKDAYS' ? 'every weekday (Mon–Fri)' : recurringPattern === 'DAILY' ? 'daily (7 days)' : `on ${customDays.join(', ')}`} for {repeatWeeks} week(s) at {time}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-200/50 text-sm"
              >
                {isSubmitting ? 'Publishing Ride...' : 'Publish Ride'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* No-Paid-API Draggable Map Location Picker Modal */}
      <LocationPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleLocationConfirmed}
        title={mapTarget === 'origin' ? 'Choose Departure / Pickup Point' : 'Choose Destination Point'}
        label={mapTarget === 'origin' ? 'Pickup' : 'Destination'}
        markerColor={mapTarget === 'origin' ? '#059669' : '#f43f5e'}
        initialLocation={mapTarget === 'origin' ? origin : destination}
      />
    </div>
  );
}
