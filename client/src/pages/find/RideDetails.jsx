import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, MapPin, Clock, Info, AlertCircle,
  CheckCircle, Navigation, Loader2, Calculator
} from 'lucide-react';
import { getRideById } from '../../services/rideService';
import { createBooking, getBookingQuote } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import LocationPickerModal from '../../components/map/LocationPickerModal';

export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [seatsBooked, setSeatsBooked] = useState(1);

  // Custom pickup/drop locations
  const [pickup, setPickup] = useState({ address: '', latitude: null, longitude: null });
  const [drop, setDrop] = useState({ address: '', latitude: null, longitude: null });
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [dropModalOpen, setDropModalOpen] = useState(false);

  // Quote state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    const fetchRide = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRideById(rideId);
        if (!data) {
          setError('Ride not found.');
        } else {
          setRide(data);
          // Default pickup/drop to driver's origin/destination
          setPickup({
            address: data.originAddress,
            latitude: Number(data.originLatitude),
            longitude: Number(data.originLongitude)
          });
          setDrop({
            address: data.destinationAddress,
            latitude: Number(data.destinationLatitude),
            longitude: Number(data.destinationLongitude)
          });
        }
      } catch (err) {
        console.error('Failed to load ride:', err);
        setError(err.response?.data?.message || 'Unable to load ride details.');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRide();
    }
  }, [rideId]);

  // Clear quote when pickup/drop/seats change
  useEffect(() => {
    setQuote(null);
    setQuoteError('');
  }, [pickup, drop, seatsBooked]);

  const handleGetQuote = async () => {
    if (!ride || !pickup.latitude || !drop.latitude) return;
    setQuoteLoading(true);
    setQuoteError('');
    setQuote(null);

    try {
      const result = await getBookingQuote({
        rideId: ride.id,
        seatsBooked: Number(seatsBooked),
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude
      });
      setQuote(result);
    } catch (err) {
      console.error('Quote failed:', err);
      setQuoteError(
        err.response?.data?.message || 'Unable to calculate fare. Please check your locations.'
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleBook = async () => {
    if (!ride || !pickup.latitude || !drop.latitude) return;
    setBookingLoading(true);
    setBookingError('');

    try {
      await createBooking({
        rideId: ride.id,
        seatsBooked: Number(seatsBooked),
        pickupAddress: pickup.address,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        dropAddress: drop.address,
        dropLatitude: drop.latitude,
        dropLongitude: drop.longitude
      });

      alert('Booking request sent successfully!');
      navigate('/profile/history');
    } catch (err) {
      console.error('Failed to book ride:', err);
      setBookingError(
        err.response?.data?.message ||
        'Failed to book ride. Please ensure you are not booking your own ride or that seats are available.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading ride details...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="font-semibold">{error || 'Ride not found.'}</p>
        <button
          onClick={() => navigate('/find')}
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Back to Find Pool
        </button>
      </div>
    );
  }

  const driver = ride.driver || {};
  const vehicle = ride.vehicle || {};
  const isOwnRide = user?.id && driver.id && user.id === driver.id;
  const rating = driver.driverRatingAvg != null ? Number(driver.driverRatingAvg).toFixed(1) : '5.0';
  const hasCustomLocations = pickup.latitude != null && drop.latitude != null;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Ride Details</h2>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {ride.status}
          </span>
        </div>

        {bookingError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Driver Info */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl">
            {driver.name ? driver.name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <h3 className="font-bold text-lg text-slate-800">{driver.name || 'CoRide Driver'}</h3>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500">
              ⭐ {rating} {driver.driverRatingCount != null ? `(${driver.driverRatingCount} ratings)` : ''}
            </p>
          </div>
        </div>

        {/* Driver's Route */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="w-0.5 h-10 bg-slate-200 my-1" />
              <div className="w-3 h-3 rounded-full bg-rose-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Driver's Origin</p>
                <p className="text-slate-800 font-medium">{ride.originAddress}</p>
                {ride.originLandmark && (
                  <p className="text-xs text-slate-400">Near {ride.originLandmark}</p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(ride.departureTime).toLocaleDateString()} at{' '}
                  {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Driver's Destination</p>
                <p className="text-slate-800 font-medium">{ride.destinationAddress}</p>
                {ride.destinationLandmark && (
                  <p className="text-xs text-slate-400">Near {ride.destinationLandmark}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-6">
          <h4 className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">Vehicle</h4>
          <p className="text-slate-800 font-semibold">
            {[vehicle.color, vehicle.make, vehicle.model, vehicle.year ? `(${vehicle.year})` : ''].filter(Boolean).join(' ') || 'Standard Vehicle'}
          </p>
          {vehicle.plateNumber && (
            <p className="text-sm font-mono text-slate-500 mt-1 uppercase">{vehicle.plateNumber}</p>
          )}
        </div>

        {/* Custom Pickup & Drop Selection */}
        {!isOwnRide && ride.availableSeats >= 1 && (
          <div className="bg-blue-50 p-5 rounded-2xl mb-6 border border-blue-100">
            <div className="flex items-center space-x-2 text-blue-800 mb-3">
              <Navigation className="w-5 h-5 shrink-0" />
              <h4 className="font-semibold">Your Pickup & Drop-off</h4>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              Set your exact pickup and drop-off points along the driver's route. Your fare is calculated based on the distance you travel.
            </p>

            <div className="space-y-3">
              {/* Pickup */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase text-slate-400">Your Pickup</p>
                  <p className="text-sm text-slate-700 truncate">{pickup.address || 'Not set'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPickupModalOpen(true)}
                  className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl hover:bg-emerald-200 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Change
                </button>
              </div>

              {/* Drop */}
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase text-slate-400">Your Drop-off</p>
                  <p className="text-sm text-slate-700 truncate">{drop.address || 'Not set'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDropModalOpen(true)}
                  className="shrink-0 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl hover:bg-rose-200 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fare & Seats Details */}
        <div className="bg-emerald-50 p-5 rounded-2xl mb-6 border border-emerald-100">
          <div className="flex items-center space-x-2 text-emerald-800 mb-3">
            <Info className="w-5 h-5 shrink-0" />
            <h4 className="font-semibold">Trip & Fair Pricing</h4>
          </div>
          <div className="space-y-2 text-sm text-emerald-900">
            <div className="flex justify-between">
              <span>Available Seats</span>
              <span className="font-semibold">{ride.availableSeats} of {ride.totalSeats}</span>
            </div>
            {ride.pricePerKm && (
              <div className="flex justify-between">
                <span>Rate per km</span>
                <span className="font-semibold">₹{ride.pricePerKm}/km</span>
              </div>
            )}
            {ride.pricePerSeat > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Base price per seat</span>
                <span>₹{ride.pricePerSeat}</span>
              </div>
            )}

            {/* Quote Result */}
            {quote && (
              <div className="pt-2 mt-2 border-t border-emerald-200 space-y-1">
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Your travel distance</span>
                  <span>{quote.distanceKm} km ({quote.distanceSource === 'osrm' ? 'road distance' : 'estimated'})</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Per-seat fare</span>
                  <span>₹{quote.perSeatFare}{quote.minFareApplied ? ' (min fare applied)' : ''}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Your Estimated Fare</span>
                  <span>₹{quote.fare}</span>
                </div>
              </div>
            )}

            {/* Fallback: show prompt when no quote */}
            {!quote && (
              <div className="pt-2 mt-2 border-t border-emerald-200 flex justify-between font-bold text-lg">
                <span>Estimated Fare</span>
                <span className="text-emerald-700 text-sm font-semibold">Get a quote ↓</span>
              </div>
            )}

            {quoteError && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {quoteError}
              </div>
            )}
          </div>
        </div>

        {/* Booking Controls */}
        {isOwnRide ? (
          <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl text-center text-sm font-medium">
            You are the driver of this ride.
          </div>
        ) : ride.availableSeats < 1 ? (
          <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-center text-sm font-medium">
            This ride has no available seats.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm font-medium text-slate-700">Seats to book:</span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSeatsBooked((prev) => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-600 hover:bg-slate-300"
                >
                  -
                </button>
                <span className="font-bold text-slate-800">{seatsBooked}</span>
                <button
                  type="button"
                  onClick={() => setSeatsBooked((prev) => Math.min(ride.availableSeats, prev + 1))}
                  className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-600 hover:bg-slate-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Get Quote Button */}
            {hasCustomLocations && !quote && (
              <button
                onClick={handleGetQuote}
                disabled={quoteLoading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200/50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {quoteLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Calculating Fare...</>
                ) : (
                  <><Calculator className="w-5 h-5" /> Get Fare Estimate</>
                )}
              </button>
            )}

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={bookingLoading || !quote}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200/50 disabled:opacity-50"
            >
              {bookingLoading ? 'Requesting Booking...' : `Book ${seatsBooked} Seat(s)${quote ? ` — ₹${quote.fare}` : ''}`}
            </button>

            {!quote && (
              <p className="text-xs text-center text-slate-400">
                Get a fare estimate first to see the distance-based price before booking.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Location Picker Modals */}
      <LocationPickerModal
        isOpen={pickupModalOpen}
        onClose={() => setPickupModalOpen(false)}
        onConfirm={(loc) => setPickup(loc)}
        title="Choose Your Pickup Point"
        initialLocation={pickup.latitude ? pickup : undefined}
        markerColor="#059669"
        label="Pickup"
      />

      <LocationPickerModal
        isOpen={dropModalOpen}
        onClose={() => setDropModalOpen(false)}
        onConfirm={(loc) => setDrop(loc)}
        title="Choose Your Drop-off Point"
        initialLocation={drop.latitude ? drop : undefined}
        markerColor="#e11d48"
        label="Drop-off"
      />
    </div>
  );
}
