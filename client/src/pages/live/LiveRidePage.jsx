import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Navigation } from 'lucide-react';
import { getRideById, startRide, completeRide, cancelRide } from '../../services/liveRideService';
import { useAuth } from '../../hooks/useAuth';
import QRCodeDisplay from '../../components/ride/attendance/QRCodeDisplay';
import QRCodeScanner from '../../components/ride/attendance/QRCodeScanner';
import AttendanceStatusCard from '../../components/ride/attendance/AttendanceStatusCard';
import GeofenceStatusBanner from '../../components/ride/attendance/GeofenceStatusBanner';
import RouteMap from '../../components/map/RouteMap';
import { getAuthoritativeRoadRoute } from '../../services/routingService';

export default function LiveRidePage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Route map state
  const [roadPolyline, setRoadPolyline] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const data = await getRideById(rideId);
        const rideData = data.ride || data;
        setRide(rideData);

        // Fetch authoritative road route for the map
        try {
          const acceptedPickups = (rideData.bookings || [])
            .filter(b => ['ACCEPTED', 'BOARDED'].includes(b.status) && b.pickupLatitude != null)
            .map(b => ({ latitude: Number(b.pickupLatitude), longitude: Number(b.pickupLongitude) }));

          const routeData = await getAuthoritativeRoadRoute({
            origin: {
              latitude: Number(rideData.originLatitude),
              longitude: Number(rideData.originLongitude)
            },
            destination: {
              latitude: Number(rideData.destinationLatitude),
              longitude: Number(rideData.destinationLongitude)
            },
            intermediates: acceptedPickups
          });
          setRouteInfo(routeData);
          if (routeData.encodedPolyline) setRoadPolyline(routeData.encodedPolyline);
        } catch (rErr) {
          console.warn('Road route fetch failed, falling back to straight-line map:', rErr);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load ride details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleStartRide = async () => {
    if (!window.confirm('Are you sure you want to start this ride?')) return;
    try {
      setActionError('');
      await startRide(rideId);
    } catch (err) {
      setActionError(
        err.message === 'API_NOT_SUPPORTED'
          ? 'Starting a ride is not supported by the current backend contract.'
          : 'Failed to start ride.'
      );
    }
  };

  const handleCompleteRide = async () => {
    if (!window.confirm('Are you sure you want to complete this ride?')) return;
    try {
      setActionError('');
      await completeRide(rideId);
    } catch (err) {
      setActionError(
        err.message === 'API_NOT_SUPPORTED'
          ? 'Completing a ride is not supported by the current backend contract.'
          : 'Failed to complete ride.'
      );
    }
  };

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    try {
      setActionError('');
      await cancelRide(rideId);
      navigate('/find');
    } catch (err) {
      setActionError(
        err.message === 'API_NOT_SUPPORTED'
          ? 'Canceling a ride is not supported by the current backend contract.'
          : 'Failed to cancel ride.'
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse px-4">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/2" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm mx-4 px-4">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Oops!</h3>
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isDriver = user?.userId === ride.driverId || user?.id === ride.driverId;
  const acceptedBookings = (ride.bookings || []).filter(b =>
    ['ACCEPTED', 'BOARDED', 'ARRIVED'].includes(b.status)
  );

  return (
    <div className="space-y-5 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Live Ride</h1>
        <div className="w-10" />
      </div>

      {actionError && (
        <div className="mx-1 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800">{actionError}</p>
        </div>
      )}

      {/* Status & Route Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5">
        <div className="flex justify-between items-start">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            ride.status === 'ACTIVE'    ? 'bg-emerald-50 text-emerald-700' :
            ride.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' :
            ride.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
            'bg-slate-50 text-slate-700'
          }`}>
            {ride.status || 'SCHEDULED'}
          </span>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">
              {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs font-bold text-slate-400 uppercase">Departure</p>
          </div>
        </div>

        {/* Origin → Destination text route */}
        <div className="flex items-stretch space-x-4">
          <div className="flex flex-col items-center py-1">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-400/30" />
            <div className="w-0.5 flex-1 bg-slate-200 my-1" />
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/30" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Origin</p>
              <p className="text-sm font-bold text-slate-900 pr-2">{ride.originAddress}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Destination</p>
              <p className="text-sm font-bold text-slate-900 pr-2">{ride.destinationAddress}</p>
            </div>
          </div>
        </div>

        <GeofenceStatusBanner rideId={ride.id} />
      </div>

      {/* ── Route Map ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            Route &amp; Travel Path
          </h3>
          {routeInfo && (
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {routeInfo.distanceKm} km · {
                routeInfo.durationMinutes >= 60
                  ? `${Math.floor(routeInfo.durationMinutes / 60)}h ${routeInfo.durationMinutes % 60}m`
                  : `${routeInfo.durationMinutes} min`
              }
            </span>
          )}
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
          routeInfo={routeInfo}
          className="h-72"
        />
      </div>

      {/* Attendance & Passengers */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5">
        <h3 className="font-bold text-lg text-slate-900">Attendance &amp; Passengers</h3>
        <AttendanceStatusCard
          passengerCount={ride.totalSeats}
          attendedCount={acceptedBookings.length}
        />
        {isDriver ? (
          <QRCodeDisplay rideId={ride.id} />
        ) : (
          <QRCodeScanner onScan={(data) => console.log(data)} />
        )}
      </div>

      {/* Driver action buttons */}
      {isDriver && (
        <div className="flex flex-col space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStartRide}
              className="flex items-center justify-center py-4 bg-emerald-600 rounded-2xl text-white font-bold hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
            >
              Start Ride
            </button>
            <button
              onClick={handleCompleteRide}
              className="flex items-center justify-center py-4 bg-slate-800 rounded-2xl text-white font-bold hover:bg-slate-900 transition-colors shadow-md shadow-slate-200"
            >
              Complete Ride
            </button>
          </div>
          <button
            onClick={handleCancelRide}
            className="flex items-center justify-center py-3 border-2 border-rose-500 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 transition-colors"
          >
            Cancel Ride
          </button>
        </div>
      )}
    </div>
  );
}
