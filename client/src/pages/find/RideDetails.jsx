import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, MapPin, Clock, Info, AlertCircle,
  CheckCircle, Navigation, Loader2, Calculator, Check, X, Users, Map
} from 'lucide-react';
import { getRideById } from '../../services/rideService';
import { createBooking, getBookingQuote, updateBookingStatus } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import LocationPickerModal from '../../components/map/LocationPickerModal';
import RouteMap from '../../components/map/RouteMap';
import { getRideFairCostSharing, getAuthoritativeRoadRoute } from '../../services/routingService';

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
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [fairPricing, setFairPricing] = useState(null);
  const [fairPricingLoading, setFairPricingLoading] = useState(false);
  const [roadPolyline, setRoadPolyline] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const handleUpdateBooking = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      // Refresh ride data to get updated bookings and seat counts
      const updatedData = await getRideById(rideId);
      if (updatedData) {
        setRide(updatedData);
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert(err.response?.data?.message || `Failed to ${newStatus.toLowerCase()} booking.`);
    } finally {
      setUpdatingBookingId(null);
    }
  };

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

          // Fetch authoritative road route with exact polyline
          try {
            const acceptedPickups = (data.bookings || [])
              .filter((b) => ['ACCEPTED', 'BOARDED', 'ARRIVED'].includes(b.status) && b.pickupLatitude != null)
              .map((b) => ({ latitude: Number(b.pickupLatitude), longitude: Number(b.pickupLongitude) }));

            const routeData = await getAuthoritativeRoadRoute({
              origin: { latitude: Number(data.originLatitude), longitude: Number(data.originLongitude) },
              destination: { latitude: Number(data.destinationLatitude), longitude: Number(data.destinationLongitude) },
              intermediates: acceptedPickups
            });
            setRouteInfo(routeData);
            if (routeData.encodedPolyline) {
              setRoadPolyline(routeData.encodedPolyline);
            }
          } catch (rErr) {
            console.error('Failed to load authoritative road polyline:', rErr);
          }

          // Fetch segment fair cost breakdown if available
          try {
            setFairPricingLoading(true);
            const breakdown = await getRideFairCostSharing(rideId);
            setFairPricing(breakdown);
          } catch {
            setFairPricing(null);
          } finally {
            setFairPricingLoading(false);
          }
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

        {/* Live Interactive Route Map with Passenger Pickups */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
              Route &amp; Pickups Map
            </h4>
            <div className="flex items-center gap-2">
              {routeInfo && (
                <span className="text-[10px] uppercase font-extrabold tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {routeInfo.distanceKm} km Road • {routeInfo.durationMinutes} mins ({routeInfo.provider === 'google_routes' ? 'Google Routes' : routeInfo.provider === 'openrouteservice' ? 'OpenRouteService' : 'OSRM Road'})
                </span>
              )}
              {ride.bookings?.some((b) => ['ACCEPTED', 'BOARDED'].includes(b.status)) && (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {ride.bookings.filter((b) => ['ACCEPTED', 'BOARDED'].includes(b.status)).length} Pickup Point(s) Added
                </span>
              )}
            </div>
          </div>
          <RouteMap
            origin={{
              latitude: ride.originLatitude,
              longitude: ride.originLongitude,
              address: ride.originAddress
            }}
            destination={{
              latitude: ride.destinationLatitude,
              longitude: ride.destinationLongitude,
              address: ride.destinationAddress
            }}
            bookings={ride.bookings || []}
            polyline={roadPolyline}
            className="h-64 sm:h-72"
          />
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
              <div className="pt-2 mt-2 border-t border-emerald-200 space-y-1.5">
                <div className="flex justify-between text-xs text-emerald-800 font-medium">
                  <span>Actual Driving Road Distance:</span>
                  <span className="font-bold">{quote.distanceKm} km</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700">
                  <span>Routing Provider:</span>
                  <span className="font-semibold uppercase tracking-wider">
                    {quote.distanceSource === 'google_routes' ? 'Google Maps Routes API' : quote.distanceSource === 'openrouteservice' ? 'OpenRouteService' : 'OSRM Road Network'}
                  </span>
                </div>
                {quote.durationMinutes && (
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>Estimated Drive Duration:</span>
                    <span>{quote.durationMinutes} mins</span>
                  </div>
                )}
                {quote.fuelEstimate && (
                  <div className="flex justify-between text-[11px] text-emerald-700">
                    <span>Est. Fuel Required:</span>
                    <span>{quote.fuelEstimate.fuelRequiredLitres} L (~₹{quote.fuelEstimate.estimatedFuelCost})</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-emerald-700 pt-1 border-t border-emerald-200/60">
                  <span>Per-seat Rate ({ride.pricePerKm || 5}₹/km):</span>
                  <span>₹{quote.perSeatFare}{quote.minFareApplied ? ' (min fare ₹10 applied)' : ''}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1 text-slate-900">
                  <span>Your Total Contribution ({seatsBooked} seat{seatsBooked > 1 ? 's' : ''}):</span>
                  <span className="text-emerald-800 font-extrabold">₹{quote.fare}</span>
                </div>
              </div>
            )}

            {/* Fair Segment Cost Sharing Breakdown (Section 5) */}
            {fairPricing && fairPricing.legs && fairPricing.legs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Route Leg Cost Sharing Breakdown</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {fairPricing.legs.length} Legs
                  </span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {fairPricing.legs.map((leg, i) => (
                    <div key={i} className="p-2 bg-white/80 rounded-xl border border-emerald-100 text-[11px] space-y-0.5">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>Leg {i + 1}: {leg.legDistanceKm} km</span>
                        <span className="text-emerald-800 font-bold">₹{leg.legEstimatedFuelCost} fuel</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>Participants: {leg.totalUnits} ({leg.activePassengerIds.length} passenger{leg.activePassengerIds.length === 1 ? '' : 's'})</span>
                        <span>Cost/share: ₹{leg.costPerUnit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-800 pt-1">
                  <span>Total Trip Fuel:</span>
                  <span>₹{fairPricing.totalTripFuelCost} ({fairPricing.totalTripRoadDistanceKm} km)</span>
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

        {/* Booking Controls & Driver Management */}
        {isOwnRide ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Driver Roster</span>
                <p className="text-sm font-bold text-slate-800">
                  {ride.totalSeats - ride.availableSeats} of {ride.totalSeats} seats filled
                </p>
              </div>
              {ride.availableSeats === 0 ? (
                <span className="text-xs font-extrabold px-3 py-1 bg-emerald-600 text-white rounded-full">
                  Full Pool
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  {ride.availableSeats} seat(s) remaining
                </span>
              )}
            </div>

            {/* Bookings & Requests List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
                <span>Passenger Requests & Bookings</span>
                <span className="text-xs font-normal text-slate-500">
                  ({(ride.bookings || []).length} total)
                </span>
              </h4>

              {(!ride.bookings || ride.bookings.length === 0) ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No passengers have requested this ride yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {ride.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {b.passenger?.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{b.passenger?.name || 'Passenger'}</p>
                            {b.passenger?.phone && (
                              <p className="text-[11px] text-slate-400 font-mono">{b.passenger.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'ACCEPTED' || b.status === 'BOARDED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : b.status === 'ARRIVED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {b.status}
                          </span>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">₹{b.fareContributionTotal}</p>
                        </div>
                      </div>

                      {/* Pickup & Drop Points */}
                      <div className="text-xs bg-slate-50 p-2.5 rounded-xl space-y-1 text-slate-600">
                        <p className="truncate">
                          <span className="font-semibold text-emerald-700">Pickup:</span> {b.pickupAddress}
                        </p>
                        <p className="truncate">
                          <span className="font-semibold text-rose-700">Drop:</span> {b.dropAddress}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Seats requested: <span className="font-bold text-slate-700">{b.seatsBooked}</span>
                        </p>
                      </div>

                      {/* Accept/Reject Action for PENDING bookings */}
                      {b.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={updatingBookingId === b.id}
                            onClick={() => handleUpdateBooking(b.id, 'ACCEPTED')}
                            className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{updatingBookingId === b.id ? 'Updating...' : 'Accept Request'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={updatingBookingId === b.id}
                            onClick={() => handleUpdateBooking(b.id, 'REJECTED')}
                            className="py-2 px-3 bg-slate-100 text-rose-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-rose-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : ride.availableSeats < 1 ? (
          <div className="p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-center space-y-1">
            <p className="font-bold text-sm">Ride is completely booked</p>
            <p className="text-xs text-amber-600">
              All {ride.totalSeats} seats on this ride are currently filled. Check back later if a seat becomes available.
            </p>
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

        <div className="mt-4">
          <button 
            onClick={() => navigate(`/rides/${rideId}/live`)}
            className="w-full bg-slate-100 text-emerald-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            View Live Ride
          </button>
        </div>
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
