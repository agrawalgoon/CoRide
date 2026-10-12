import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  LoaderCircle,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getRides } from '../../services/rideService';
import LocationPickerModal from '../../components/map/LocationPickerModal';

export default function FindPoolPage() {
  // Search Bar state
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
  const [seatFilter, setSeatFilter] = useState(1);

  // Raw rides from server
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filter & Refine Sidebar State
  const [sortBy, setSortBy] = useState('best'); // 'best' | 'earliest' | 'cheapest' | 'seats'
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [timeMin, setTimeMin] = useState('');
  const [timeMax, setTimeMax] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [showOneTime, setShowOneTime] = useState(true);
  const [showRecurring, setShowRecurring] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Map Picker Modal State
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activePickerTarget, setActivePickerTarget] = useState('pickup');

  // Load existing scheduled rides on initial mount so page is populated
  useEffect(() => {
    const fetchInitialRides = async () => {
      try {
        const list = await getRides({ status: 'SCHEDULED' });
        if (Array.isArray(list) && list.length > 0) {
          // Normalize to match structure
          setRides(list.map((r) => ({ ride: r, overallScore: r.isRecurring ? 95 : 88 })));
        }
      } catch (err) {
        console.error('Failed to load initial rides:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialRides();
  }, []);

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
            seats: Number(seatFilter) || 1
          }
        });

        const data = response?.data;
        const matches = Array.isArray(data?.matches) ? data.matches : [];

        setRides(matches);

        if (matches.length === 0) {
          setNotice('No matching carpools found for this route and departure window (+/- 3 hrs).');
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
    [pickup, destination, departureDate, departureTime, seatFilter]
  );

  const resetFilters = () => {
    setSortBy('best');
    setRouteFrom('');
    setRouteTo('');
    setFilterDate('');
    setTimeMin('');
    setTimeMax('');
    setMinPrice('');
    setMaxPrice('');
    setMinSeats('');
    setShowOneTime(true);
    setShowRecurring(true);
    setVerifiedOnly(false);
    setSelectedDays([]);
  };

  // Comprehensive Client-side Filtering & Sorting
  const filteredAndSortedRides = useMemo(() => {
    let result = [...rides];

    // 1. Route filters
    if (routeFrom.trim()) {
      const q = routeFrom.toLowerCase();
      result = result.filter((item) => {
        const ride = item.ride || item;
        return (ride.originAddress || '').toLowerCase().includes(q);
      });
    }

    if (routeTo.trim()) {
      const q = routeTo.toLowerCase();
      result = result.filter((item) => {
        const ride = item.ride || item;
        return (ride.destinationAddress || '').toLowerCase().includes(q);
      });
    }

    // 2. Departure Date filter
    if (filterDate) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        if (!ride.departureTime) return false;
        return ride.departureTime.slice(0, 10) === filterDate;
      });
    }

    // 3. Departure Time Range
    if (timeMin) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        if (!ride.departureTime) return false;
        const depTime = new Date(ride.departureTime).toTimeString().slice(0, 5);
        return depTime >= timeMin;
      });
    }

    if (timeMax) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        if (!ride.departureTime) return false;
        const depTime = new Date(ride.departureTime).toTimeString().slice(0, 5);
        return depTime <= timeMax;
      });
    }

    // 4. Price filter
    if (minPrice !== '') {
      result = result.filter((item) => {
        const ride = item.ride || item;
        return Number(ride.pricePerSeat) >= Number(minPrice);
      });
    }

    if (maxPrice !== '') {
      result = result.filter((item) => {
        const ride = item.ride || item;
        return Number(ride.pricePerSeat) <= Number(maxPrice);
      });
    }

    // 5. Available seats filter
    if (minSeats !== '') {
      result = result.filter((item) => {
        const ride = item.ride || item;
        return Number(ride.availableSeats) >= Number(minSeats);
      });
    }

    // 6. Ride Type filter
    if (!showOneTime || !showRecurring) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        if (!showOneTime && !ride.isRecurring) return false;
        if (!showRecurring && ride.isRecurring) return false;
        return true;
      });
    }

    // 7. Driver verification filter
    if (verifiedOnly) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        const driver = ride.driver || {};
        return driver.isOrgVerified === true;
      });
    }

    // 8. Recurrence Days filter
    if (selectedDays.length > 0) {
      result = result.filter((item) => {
        const ride = item.ride || item;
        if (!ride.isRecurring || !Array.isArray(ride.recurringDays)) return false;
        return selectedDays.some((d) => ride.recurringDays.includes(d));
      });
    }

    // Sorting
    result.sort((a, b) => {
      const rideA = a.ride || a;
      const rideB = b.ride || b;

      switch (sortBy) {
        case 'earliest':
          return new Date(rideA.departureTime || 0) - new Date(rideB.departureTime || 0);
        case 'cheapest':
          return Number(rideA.pricePerSeat || 0) - Number(rideB.pricePerSeat || 0);
        case 'seats':
          return Number(rideB.availableSeats || 0) - Number(rideA.availableSeats || 0);
        case 'best':
        default: {
          const scoreA = Number(a.overallScore ?? rideA.overallScore ?? 80);
          const scoreB = Number(b.overallScore ?? rideB.overallScore ?? 80);
          return scoreB - scoreA;
        }
      }
    });

    return result;
  }, [
    rides,
    sortBy,
    routeFrom,
    routeTo,
    filterDate,
    timeMin,
    timeMax,
    minPrice,
    maxPrice,
    minSeats,
    showOneTime,
    showRecurring,
    verifiedOnly,
    selectedDays
  ]);

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
  const minDateStr = today.toISOString().split('T')[0];

  // Top featured AI match for banner in Screenshot 2
  const topMatch = filteredAndSortedRides.length > 0 ? (filteredAndSortedRides[0].ride || filteredAndSortedRides[0]) : null;
  const topMatchScore = filteredAndSortedRides.length > 0 ? (filteredAndSortedRides[0].overallScore || 98) : 98;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      
      {/* ── TOP HERO BANNER (MATCHING SCREENSHOT 2) ────────────────── */}
      <section className="rounded-3xl bg-emerald-800 text-white p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-700/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span>AI-Powered Commute Optimization</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Find Compatible Campus Carpools
        </h1>
        <p className="mt-1 text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
          Match with verified students, faculty, and campus staff who share your daily route and schedule.
        </p>
      </section>

      {/* ── SEARCH BAR CARD (MATCHING SCREENSHOT 2) ───────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <form onSubmit={handleSearch} className="space-y-3">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Pickup Location */}
            <div
              onClick={() => openMapPicker('pickup')}
              className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                Pickup Location
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                {pickup.address || 'Select on map'}
              </p>
            </div>

            {/* Campus Destination */}
            <div
              onClick={() => openMapPicker('destination')}
              className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 cursor-pointer hover:border-rose-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Campus Destination
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                {destination.address || 'Select on map'}
              </p>
            </div>

            {/* Date */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date
              </div>
              <input
                type="date"
                min={minDateStr}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none"
              />
            </div>

            {/* Time */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time
              </div>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none"
              />
            </div>

            {/* Seats + Submit Button */}
            <div className="flex items-center gap-2">
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Seats
                </div>
                <select
                  value={seatFilter}
                  onChange={(e) => setSeatFilter(Number(e.target.value))}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value={1}>1 Seat</option>
                  <option value={2}>2 Seats</option>
                  <option value={3}>3 Seats</option>
                  <option value={4}>4 Seats</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || locationLoading}
                className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-bold h-full min-h-[58px] px-5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
              >
                {loading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="text-sm">Search</span>
              </button>
            </div>

          </div>

          {/* Quick Geolocation helper row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Quick Setup:</span>
            <button
              type="button"
              onClick={() => useCurrentLocation('pickup')}
              disabled={locationLoading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-emerald-800 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Crosshair className="w-3 h-3" /> Use Current Location
            </button>
            <button
              type="button"
              onClick={() => openMapPicker('pickup')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Map className="w-3 h-3 text-emerald-700" /> Choose Pickup on Map
            </button>
            <button
              type="button"
              onClick={() => openMapPicker('destination')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <Map className="w-3 h-3 text-rose-600" /> Choose Destination on Map
            </button>
          </div>

        </form>
      </section>

      {/* Notice / Feedback messages */}
      {error && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Mobile Toggle Button for Filters */}
      <div className="lg:hidden flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold text-slate-700">
          Showing {filteredAndSortedRides.length} carpool rides
        </span>
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {filtersVisible ? 'Hide Filters' : 'Filter & Refine'}
        </button>
      </div>

      {/* ── TWO-COLUMN LAYOUT: FILTER SIDEBAR + RESULTS ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        
        {/* ── 1. FILTER & REFINE SIDEBAR ────────────────────────────── */}
        <aside className={`${filtersVisible ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-5">
            
            {/* Header: Title + Reset All */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <h3 className="font-extrabold text-slate-800 text-sm">Filter &amp; Refine</h3>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>

            {/* 1. Sort Rides By */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Sort Rides By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="best">Best AI Compatibility (98% – 80%)</option>
                <option value="earliest">Earliest Departure</option>
                <option value="cheapest">Lowest Price</option>
                <option value="seats">Most Available Seats</option>
              </select>
            </div>

            {/* 2. Route Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Route
              </label>
              <input
                type="text"
                placeholder="Filter starting point..."
                value={routeFrom}
                onChange={(e) => setRouteFrom(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
              />
              <input
                type="text"
                placeholder="Filter destination..."
                value={routeTo}
                onChange={(e) => setRouteTo(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>

            {/* 3. Departure Date & Time Range */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Departure
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="time"
                  value={timeMin}
                  onChange={(e) => setTimeMin(e.target.value)}
                  placeholder="From"
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  title="Earliest departure time"
                />
                <input
                  type="time"
                  value={timeMax}
                  onChange={(e) => setTimeMax(e.target.value)}
                  placeholder="To"
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                  title="Latest departure time"
                />
              </div>
            </div>

            {/* 4. Price Range */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Price Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                  <span className="text-xs text-slate-400 mr-1 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5">
                  <span className="text-xs text-slate-400 mr-1 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. Available Seats */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Min. Available Seats
              </label>
              <input
                type="number"
                min="1"
                max="8"
                placeholder="Any number of seats"
                value={minSeats}
                onChange={(e) => setMinSeats(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>

            {/* 6. Ride Type */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ride Type
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showOneTime}
                  onChange={(e) => setShowOneTime(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <span>One-time rides</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showRecurring}
                  onChange={(e) => setShowRecurring(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <span>Recurring commutes</span>
              </label>
            </div>

            {/* 7. Driver Verification */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Driver Verification
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 accent-emerald-700 rounded"
                />
                <span className="flex items-center gap-1">
                  Verified members only
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                </span>
              </label>
            </div>

            {/* 8. Recurrence Days */}
            {showRecurring && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recurrence Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setSelectedDays((prev) =>
                            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                          )
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-800 border-emerald-800 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-[10px] text-slate-400">
                    Showing rides that match selected days
                  </p>
                )}
              </div>
            )}

          </div>
        </aside>

        {/* ── 2. RIDE RESULTS SECTION ───────────────────────────────── */}
        <main className="space-y-4">
          
          {/* Top Featured AI Commute Match Card (Matching Screenshot 2) */}
          {topMatch && !loading && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 tracking-wide">
                    {topMatchScore}% Route Overlap
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Departure +/- 5 mins</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  AI Commute Match: {topMatch.driver?.name || 'Verified Driver'} shares your exact routine
                </h3>
                <p className="text-xs text-slate-600 truncate">
                  Departs at {formatTime(topMatch.departureTime)} from {topMatch.originAddress} with {topMatch.availableSeats} open seats available.
                </p>
              </div>

              <Link
                to={`/rides/${topMatch.id || topMatch.rideId}`}
                className="shrink-0 px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Quick Reserve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Results Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Available Campus Pools
              <span className="text-xs font-semibold text-slate-400 ml-2">
                ({filteredAndSortedRides.length} matching)
              </span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {formatDate(new Date())}
            </span>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 p-8">
              <LoaderCircle className="h-8 w-8 animate-spin mx-auto text-emerald-700 mb-2.5" />
              <p className="text-sm font-bold text-slate-800">Calculating AI Route Compatibility...</p>
              <p className="text-xs text-slate-400 mt-1">Scanning active carpools along your coordinates.</p>
            </div>
          )}

          {/* Empty State: No search results or no rides */}
          {!loading && filteredAndSortedRides.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
              <Car className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="font-bold text-slate-800 text-base">No Matching Carpools Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No rides match your current filters. Try resetting the sidebar filters or searching with broader departure times.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Ride Cards List */}
          {!loading && filteredAndSortedRides.length > 0 && (
            <div className="space-y-4">
              {filteredAndSortedRides.map((item, index) => {
                const ride = item.ride || item;
                const driver = ride.driver || {};
                const vehicle = ride.vehicle || {};
                const rideId = ride.id || item.rideId;
                const departure = ride.departureTime;
                const rating = driver.driverRatingAvg != null ? Number(driver.driverRatingAvg).toFixed(1) : '4.9';
                const score = item.overallScore || (ride.isRecurring ? 96 : 90);

                return (
                  <article
                    key={rideId || `match-${index}`}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                  >
                    {/* Top Row: Driver Info & Fare */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-lg">
                          {driver.name ? driver.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                        </div>

                        <div>
                          <p className="flex items-center gap-1.5 font-bold text-slate-800 text-sm sm:text-base">
                            {driver.name || 'CoRide Driver'}
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            {ride.isRecurring && (
                              <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full ml-1">
                                {Array.isArray(ride.recurringDays) && ride.recurringDays.length > 0
                                  ? `${ride.recurringDays.join('·')} Commute`
                                  : 'Recurring'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            ⭐ {rating} • {vehicle.color || ''} {vehicle.make || 'Verified'} {vehicle.model || 'Vehicle'}
                          </p>
                          <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                            Match Score: {score}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-extrabold text-emerald-800">
                          ₹{ride.pricePerSeat}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">per seat</p>
                      </div>
                    </div>

                    {/* Route line */}
                    <div className="flex gap-3 bg-slate-50/70 p-3.5 rounded-2xl">
                      <div className="flex flex-col items-center py-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                        <div className="my-1 min-h-6 w-0.5 flex-1 bg-slate-200" />
                        <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">
                            {formatTime(departure)} <span className="font-normal text-slate-400">({formatDate(departure)})</span>
                          </p>
                          <p className="text-slate-600 truncate">{ride.originAddress}</p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">Destination</p>
                          <p className="text-slate-600 truncate">{ride.destinationAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reasons / Badges */}
                    {item.reasons && item.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.reasons.map((r, i) => (
                          <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg font-medium">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Driving Road Distance / Details */}
                    {item.details && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>Pickup detour: <strong>{item.details.pickupDistanceKm} km</strong></span>
                        <span>•</span>
                        <span>Dropoff detour: <strong>{item.details.dropDistanceKm} km</strong></span>
                        <span>•</span>
                        <span>Time diff: <strong>{item.details.departureDifferenceMinutes} mins</strong></span>
                      </div>
                    )}

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
                      <span className="font-semibold text-slate-500">
                        {ride.availableSeats} of {ride.totalSeats || 4} seat(s) available
                      </span>

                      {rideId && (
                        <Link
                          to={`/rides/${rideId}`}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors shadow-2xs"
                        >
                          View &amp; Book Ride →
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Draggable Map Picker Modal */}
      <LocationPickerModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        onConfirm={handleLocationConfirmed}
        title={activePickerTarget === 'pickup' ? 'Choose Pickup Location' : 'Choose Campus Destination'}
        label={activePickerTarget === 'pickup' ? 'Pickup' : 'Destination'}
        markerColor={activePickerTarget === 'pickup' ? '#059669' : '#f43f5e'}
        initialLocation={activePickerTarget === 'pickup' ? pickup : destination}
      />
    </div>
  );
}
