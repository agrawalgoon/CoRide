import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight, AlertCircle, Clock, User, Car, XCircle } from 'lucide-react';
import { getMyBookings, cancelBooking } from '../../services/bookingService';
import { getMyRides, deleteRide } from '../../services/rideService';
import { Link } from 'react-router-dom';

export default function RideHistoryPage() {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'offered'
  const [bookings, setBookings] = useState([]);
  const [offeredRides, setOfferedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsData, ridesData] = await Promise.all([
        getMyBookings(),
        getMyRides()
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setOfferedRides(Array.isArray(ridesData) ? ridesData : []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.response?.data?.message || 'Unable to load ride history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCancelBooking = async (id) => {
    const reason = window.prompt('Reason for cancelling booking:');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await cancelBooking(id, reason || 'Cancelled by passenger');
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRide = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled ride?')) return;
    setActionLoading(true);
    try {
      await deleteRide(id);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel ride.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'COMPLETED':
        return 'text-emerald-700 bg-emerald-100';
      case 'PENDING':
      case 'SCHEDULED':
        return 'text-amber-700 bg-amber-100';
      case 'REJECTED':
      case 'CANCELLED':
      case 'CANCELLED_PASSENGER':
      case 'CANCELLED_DRIVER':
        return 'text-rose-700 bg-rose-100';
      default:
        return 'text-slate-700 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-slate-800">My Activity</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your bookings and offered rides.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === 'bookings'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('offered')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            activeTab === 'offered'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Offered Rides ({offeredRides.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading your history...</div>
      ) : activeTab === 'bookings' ? (
        // PASSENGER BOOKINGS LIST
        bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">No bookings found</p>
            <p className="text-sm text-slate-400 mt-1">Book a ride to see your bookings here.</p>
            <Link
              to="/find"
              className="inline-block mt-4 px-5 py-2 bg-emerald-600 text-white font-medium rounded-xl text-sm hover:bg-emerald-700"
            >
              Find a Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const ride = booking.ride || {};
              const driver = ride.driver || {};
              return (
                <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        {ride.departureTime ? new Date(ride.departureTime).toLocaleDateString() : 'Date TBD'}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {ride.departureTime
                          ? new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-700">
                        ₹{booking.fareContributionTotal}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block mt-1 ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{booking.pickupAddress}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{booking.dropAddress}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Driver: <strong className="text-slate-700">{driver.name || 'CoRide Driver'}</strong> • {booking.seatsBooked} seat(s)
                    </span>
                    {['PENDING', 'ACCEPTED'].includes(booking.status) && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={actionLoading}
                        className="text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // DRIVER OFFERED RIDES LIST
        offeredRides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">No rides offered yet</p>
            <p className="text-sm text-slate-400 mt-1">Share your empty seats with peers.</p>
            <Link
              to="/offer"
              className="inline-block mt-4 px-5 py-2 bg-emerald-600 text-white font-medium rounded-xl text-sm hover:bg-emerald-700"
            >
              Offer a Ride
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offeredRides.map((ride) => {
              const vehicle = ride.vehicle || {};
              return (
                <div key={ride.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        {ride.departureTime ? new Date(ride.departureTime).toLocaleDateString() : 'Date TBD'}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {ride.departureTime
                          ? new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-700">
                        ₹{ride.pricePerSeat} <span className="text-xs font-normal text-slate-400">/ seat</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase inline-block mt-1 ${getStatusBadge(ride.status)}`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{ride.originAddress}</span>
                    </div>
                    <div className="flex items-start space-x-2 text-xs">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium">{ride.destinationAddress}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Vehicle: <strong className="text-slate-700">{vehicle.make} {vehicle.model}</strong> ({ride.availableSeats} of {ride.totalSeats} seats open)
                    </span>
                    {ride.status === 'SCHEDULED' && (
                      <button
                        onClick={() => handleCancelRide(ride.id)}
                        disabled={actionLoading}
                        className="text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                      >
                        Cancel Ride
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
