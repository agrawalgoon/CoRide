import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Navigation, MapPin, Users, AlertTriangle } from 'lucide-react';
import { getRideById, startRide, completeRide, cancelRide } from '../../services/liveRideService';
import { useAuth } from '../../hooks/useAuth';
import QRCodeDisplay from '../../components/ride/attendance/QRCodeDisplay';
import QRCodeScanner from '../../components/ride/attendance/QRCodeScanner';
import AttendanceStatusCard from '../../components/ride/attendance/AttendanceStatusCard';
import GeofenceStatusBanner from '../../components/ride/attendance/GeofenceStatusBanner';

export default function LiveRidePage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const data = await getRideById(rideId);
        setRide(data.ride || data);
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
    if (!window.confirm("Are you sure you want to start this ride?")) return;
    try {
      setActionError('');
      await startRide(rideId);
    } catch (err) {
      if (err.message === "API_NOT_SUPPORTED") {
        setActionError('Starting a ride is not supported by the current backend contract.');
      } else {
        setActionError('Failed to start ride.');
      }
    }
  };

  const handleCompleteRide = async () => {
    if (!window.confirm("Are you sure you want to complete this ride?")) return;
    try {
      setActionError('');
      await completeRide(rideId);
    } catch (err) {
      if (err.message === "API_NOT_SUPPORTED") {
        setActionError('Completing a ride is not supported by the current backend contract.');
      } else {
        setActionError('Failed to complete ride.');
      }
    }
  };

  const handleCancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    try {
      setActionError('');
      await cancelRide(rideId);
      navigate('/find'); // Or wherever appropriate
    } catch (err) {
      if (err.message === "API_NOT_SUPPORTED") {
        setActionError('Canceling a ride is not supported by the current backend contract.');
      } else {
        setActionError('Failed to cancel ride.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse px-4">
        <div className="h-40 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm mx-4 px-4">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Oops!</h3>
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl">Go Back</button>
      </div>
    );
  }

  const isDriver = user?.userId === ride.driverId || user?.id === ride.driverId;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Live Ride</h1>
        <div className="w-10"></div>
      </div>

      {actionError && (
        <div className="mx-1 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800">{actionError}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              ride.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
              ride.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' :
              ride.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
              'bg-slate-50 text-slate-700'
            }`}>
              {ride.status || 'SCHEDULED'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">Departure</p>
          </div>
        </div>

        <div className="flex items-stretch space-x-4 mb-6">
          <div className="flex flex-col items-center py-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/30"></div>
            <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/30"></div>
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

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-5">
        <h3 className="font-bold text-lg text-slate-900">Attendance & Passengers</h3>
        
        <AttendanceStatusCard passengerCount={ride.totalSeats} attendedCount={0} />

        {isDriver ? (
          <QRCodeDisplay rideId={ride.id} />
        ) : (
          <QRCodeScanner onScan={(data) => console.log(data)} />
        )}
      </div>

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
