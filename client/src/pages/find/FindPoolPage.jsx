import React, { useState, useCallback } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Car,
  Crosshair,
  Map,
  AlertCircle,
  LoaderCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LocationPickerModal from '../../components/map/LocationPickerModal';

export default function FindPoolPage() {
  const [pickup, setPickup] = useState({
    address: '',
    latitude: null,
    longitude: null
  });

  const [destination, setDestination] = useState({
    address: '',
    latitude: null,
    longitude: null
  });

  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Map Picker Modal State
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activePickerTarget, setActivePickerTarget] = useState('pickup'); // 'pickup' | 'destination'

  const openMapPicker = (target) => {
    setActivePickerTarget(target);
    setError('');
    setNotice('');
    setMapModalOpen(true);
  };

  const handleLocationConfirmed = (locationData) => {
    if (activePickerTarget === 'pickup') {
      setPickup(locationData);
      setNotice('Pickup location selected.');
    } else {
      setDestination(locationData);
      setNotice('Destination location selected.');
    }
  };

  // Browser Geolocation on main screen
  const useCurrentLocation = (target) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setError('');
    setNotice('');
    setLocationLoading(true);

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
          if (target === 'pickup') {
            setPickup({ address: addr, latitude: lat, longitude: lon });
          } else {
            setDestination({ address: addr, latitude: lat, longitude: lon });
          }
          setNotice(`${target === 'pickup' ? 'Pickup' : 'Destination'} set to current location.`);
        } catch {
          const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          if (target === 'pickup') {
            setPickup({ address: fallback, latitude: lat, longitude: lon });
          } else {
            setDestination({ address: fallback, latitude: lat, longitude: lon });
          }
        } finally {
          setLocationLoading(false);
        }
      },
      (geoErr) => {
        setLocationLoading(false);
        const msgs = {
          1: 'Location permission was denied. Please allow access in browser settings or choose on map.',
          2: 'Unable to detect your current position. Please select manually on the map.',
          3: 'Location detection timed out. Please try again.'
        };
        setError(msgs[geoErr.code] || 'Could not determine your location.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const handleSearch = useCallback(
    async (event) => {
      event?.preventDefault();

      setError('');
      setNotice('');
      setRides([]);

      if (pickup.latitude == null || pickup.longitude == null) {
        setError('Please choose your pickup location on the map or use your current location.');
        return;
      }

      if (destination.latitude == null || destination.longitude == null) {
        setError('Please choose your destination location on the map.');
        return;
      }

      if (!departureDate || !departureTime) {
        setError('Please select your departure date and time.');
        return;
      }

      const departure = new Date(`${departureDate}T${departureTime}`);
      if (Number.isNaN(departure.getTime()) || departure <= new Date()) {
        setError('Please select a future departure date and time.');
        return;
      }

      setLoading(true);

      try {
        const response = await api.get('/rides/matches', {
          params: {
            pickupLatitude: pickup.latitude,
            pickupLongitude: pickup.longitude,
            dropLatitude: destination.latitude,
            dropLongitude: destination.longitude,
            departureTime: departure.toISOString(),
            seats: 1
          }
        });

        const data = response?.data;
        const matches = Array.isArray(data?.matches) ? data.matches : [];

        setRides(matches);

        if (matches.length === 0) {
          setNotice('No matching rides found for this route and departure time window (+/- 3 hrs).');
        }
      } catch (err) {
        console.error('Ride matching failed:', err.response?.data || err.message);
        setError(
          err.response?.data?.message || 'Unable to search for matching rides. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [pickup, destination, departureDate, departureTime]
  );

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Search panel */}
      <section className="rounded-3xl bg-emerald-700 p-5 sm:p-7 text-white shadow-lg">
        <h1 className="mb-1 text-2xl sm:text-3xl font-extrabold tracking-tight">Find a Carpool</h1>
        <p className="mb-6 text-emerald-100 text-sm">
          Discover verified peer rides using open geographic route matching.
        </p>

        <form
          onSubmit={handleSearch}
          className="space-y-4 rounded-2xl bg-white p-4 sm:p-5 text-slate-800 shadow-xl"
        >
          {/* Pickup Selection */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pickup Location
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {pickup.address || 'Select where you want to be picked up'}
                </p>
                {pickup.latitude != null && (
                  <p className="mt-0.5 text-xs font-mono text-slate-400">
                    {pickup.latitude.toFixed(5)}, {pickup.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 pl-8">
              <button
                type="button"
                onClick={() => useCurrentLocation('pickup')}
                disabled={locationLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition-colors"
              >
                {locationLoading ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5" />
                )}
                Use Current Location
              </button>

              <button
                type="button"
                onClick={() => openMapPicker('pickup')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Map className="h-3.5 w-3.5 text-emerald-600" />
                Choose on Map (Draggable)
              </button>
            </div>
          </div>

          {/* Destination Selection */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-rose-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Destination
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {destination.address || 'Select where you want to go'}
                </p>
                {destination.latitude != null && (
                  <p className="mt-0.5 text-xs font-mono text-slate-400">
                    {destination.latitude.toFixed(5)}, {destination.longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 pl-8">
              <button
                type="button"
                onClick={() => openMapPicker('destination')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Map className="h-3.5 w-3.5 text-rose-500" />
                Choose Destination on Map (Draggable)
              </button>
            </div>
          </div>

          {/* Date and Time Picker */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <Calendar className="h-5 w-5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Departure Date
                </span>
                <input
                  type="date"
                  min={minDate}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <Clock className="h-5 w-5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Departure Time
                </span>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                />
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || locationLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-lg shadow-emerald-200/50 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            <span>{loading ? 'Calculating Route Matches...' : 'Find Matching Rides'}</span>
          </button>
        </form>
      </section>

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p>{error}</p>
        </div>
      )}

      {notice && !error && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800">
          {notice}
        </div>
      )}

      {/* Matching Results Section */}
      <section>
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-slate-800">
            Matching Rides {rides.length > 0 && `(${rides.length})`}
          </h2>
        </div>

        {loading && (
          <div className="py-12 text-center text-slate-500">
            <LoaderCircle className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-medium">Scanning active rides with Haversine route scoring...</p>
          </div>
        )}

        {!loading && !error && rides.length === 0 && !notice && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Car className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-bold text-slate-700">Ready to commute?</p>
            <p className="mt-1 text-xs text-slate-400">
              Select your pickup, destination, and departure time above to view matched rides.
            </p>
          </div>
        )}

        {!loading && rides.length > 0 && (
          <div className="space-y-4">
            {rides.map((item, index) => {
              const ride = item.ride || item;
              const driver = ride.driver || {};
              const vehicle = ride.vehicle || {};
              const rideId = ride.id || item.rideId;
              const departure = ride.departureTime;
              const rating = driver.driverRatingAvg != null ? Number(driver.driverRatingAvg).toFixed(1) : '5.0';

              return (
                <article
                  key={rideId || `match-${index}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-lg">
                        {driver.name ? driver.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                      </div>

                      <div>
                        <p className="flex items-center gap-1 font-bold text-slate-800 text-sm sm:text-base">
                          {driver.name || 'CoRide Driver'}
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </p>
                        <p className="text-xs text-slate-400">
                          ⭐ {rating} • {vehicle.color} {vehicle.make} {vehicle.model}
                        </p>
                        {item.overallScore != null && (
                          <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Match Score: {item.overallScore}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-emerald-600">
                        ₹{ride.pricePerSeat}
                      </p>
                      <p className="text-[11px] text-slate-400">per seat</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center py-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div className="my-1 min-h-6 w-0.5 flex-1 bg-slate-200" />
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-700">
                          {formatTime(departure)} <span className="font-normal text-slate-400">({formatDate(departure)})</span>
                        </p>
                        <p className="text-slate-600 truncate">{ride.originAddress}</p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-700">Dropoff</p>
                        <p className="text-slate-600 truncate">{ride.destinationAddress}</p>
                      </div>
                    </div>
                  </div>

                  {item.reasons && item.reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {item.reasons.map((r, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="font-semibold text-slate-500">
                      {ride.availableSeats} seat(s) available
                    </span>

                    {rideId && (
                      <Link
                        to={`/rides/${rideId}`}
                        className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        View & Book Ride →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* No-Paid-API Draggable Map Location Picker Modal */}
      <LocationPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleLocationConfirmed}
        title={activePickerTarget === 'pickup' ? 'Choose Pickup Location' : 'Choose Destination Location'}
        label={activePickerTarget === 'pickup' ? 'Pickup' : 'Destination'}
        markerColor={activePickerTarget === 'pickup' ? '#059669' : '#f43f5e'}
        initialLocation={activePickerTarget === 'pickup' ? pickup : destination}
      />
    </div>
  );
}
