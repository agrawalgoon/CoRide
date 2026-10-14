import React, { useState, useEffect } from 'react';
import {
  Clock, Edit2, X, Car, LoaderCircle, AlertCircle
} from 'lucide-react';
import { getMyRides, deleteRide } from '../../services/rideService';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatNextDeparture = (departureTime) => {
  if (!departureTime) return '';
  const dep = new Date(departureTime);
  if (isNaN(dep.getTime())) return '';
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = dep.toDateString() === now.toDateString();
  const isTomorrow = dep.toDateString() === tomorrow.toDateString();
  const timeStr = dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return `${dep.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
};

const getRecurringBadge = (ride) => {
  if (!ride.isRecurring) return null;
  const days = ride.recurringDays;
  if (!days || days.length === 0) return 'RECURRING';
  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const isWeekdays = weekdays.every((d) => days.includes(d)) && days.length === 5;
  if (isWeekdays) return 'MON - FRI COMMUTE';
  if (days.length === 7) return 'DAILY COMMUTE';
  return `${days.join(' · ')} COMMUTE`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActiveCommutesPanel({ onRefreshRequest, onEditCommute }) {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRides = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyRides();
      // Only keep active/scheduled rides
      const active = (data || []).filter(
        (r) => r.status === 'SCHEDULED' || r.status === 'ACTIVE'
      );
      setRides(active);
    } catch (err) {
      console.error('Failed to load active commutes:', err);
      setError('Failed to load your commutes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (onRefreshRequest) onRefreshRequest(fetchRides);
  }, [onRefreshRequest]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this active commute?')) return;
    setCancellingId(id);
    try {
      await deleteRide(id);
      await fetchRides();
    } catch (err) {
      console.error('Failed to cancel commute:', err);
      alert('Failed to cancel the commute. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleEdit = (ride) => {
    if (onEditCommute) {
      onEditCommute(ride);
    } else {
      navigate(`/rides/${ride.id}`);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
          <LoaderCircle size={26} className="animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Loading your commutes...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertCircle size={24} className="text-rose-400" />
          <p className="text-xs text-slate-600">{error}</p>
          <button
            onClick={fetchRides}
            className="text-xs font-bold text-emerald-700 border border-emerald-200 bg-white px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (rides.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
          <div className="bg-slate-100 rounded-full p-3.5">
            <Car size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No active commutes</p>
          <p className="text-xs text-slate-400 text-center max-w-xs">
            Published carpool offers will appear here for easy management and scheduling.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {rides.map((ride) => {
          const badge = getRecurringBadge(ride);
          const isCancelling = cancellingId === ride.id;

          return (
            <div
              key={ride.id}
              className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
            >
              {/* Header row: badge + next departure */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  {badge ? (
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2.5 py-0.5 rounded-md">
                      {badge}
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      One-time Ride
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  {formatNextDeparture(ride.departureTime)}
                </div>
              </div>

              {/* Route */}
              <p className="text-sm font-bold text-slate-800 leading-snug break-words">
                {ride.originAddress} <span className="text-slate-400 font-normal">→</span> {ride.destinationAddress}
              </p>

              {/* Meta information */}
              <p className="text-xs text-slate-500 font-medium">
                {ride.availableSeats} of {ride.totalSeats} Available&nbsp;•&nbsp;
                <span className="text-slate-700 font-semibold">₹{Number(ride.pricePerSeat).toFixed(2)} / seat</span>
              </p>

              {/* Action buttons matching screenshot */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleEdit(ride)}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors shadow-2xs text-center"
                >
                  Edit Commute
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(ride.id)}
                  disabled={isCancelling}
                  className="px-2 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Your Active Commutes</h3>
        {!loading && !error && (
          <span className="text-xs font-medium text-slate-400">
            {rides.length} {rides.length === 1 ? 'Active' : 'Active'}
          </span>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
