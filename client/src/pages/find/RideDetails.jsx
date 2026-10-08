import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ShieldCheck, MapPin, Clock, Info, CheckCircle, Navigation, Users, HelpCircle } from 'lucide-react';
import { getRideById } from '../../services/rideService';
import { createBooking } from '../../services/bookingService';

export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [seats, setSeats] = useState(1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await getRideById(rideId);
        setRide(response.ride);
      } catch (err) {
        console.error(err);
        setError('Ride not found or unable to load details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleBook = async () => {
    setBookingLoading(true);
    try {
      // CoRide Backend MVP uses distance-based fair fare.
      // We send exact fields expected by backend based on authoritative info.
      const bookingData = {
        seats,
        pickupLocation: ride.originAddress,
        dropLocation: ride.destinationAddress,
        totalFare: (ride.pricePerSeat || 40) * seats, // Authoritative fallback
      };
      await createBooking(rideId, bookingData);
      setShowModal(false);
      navigate('/find', { state: { bookingSuccess: true } });
    } catch (err) {
      alert('Failed to book ride. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
        <div className="h-40 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Oops!</h3>
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <button 
          onClick={() => navigate('/find')} 
          className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-emerald-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { driver, vehicle } = ride;
  const availableSeats = ride.availableSeats || 0;
  
  // Authoritative values (placeholder logic based on requirements)
  const tripDistance = ride.distance || '8.4 km';
  const tripFare = ride.pricePerSeat || 84; 
  const totalFare = tripFare * seats;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Route Preview */}
      <div className="bg-slate-800 rounded-3xl overflow-hidden shadow-lg relative h-48 sm:h-64 flex flex-col justify-between p-4 border border-slate-700">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-md self-start px-3 py-1.5 rounded-full border border-white/20">
          <Clock className="w-4 h-4 text-emerald-300" />
          <span className="text-white text-sm font-semibold tracking-wide">
            {new Date(ride.departureTime).toLocaleDateString()} • {new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        
        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20">
          <div className="flex items-stretch space-x-4">
            <div className="flex flex-col items-center py-1">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/30"></div>
              <div className="w-0.5 flex-1 bg-slate-300 my-1"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/30"></div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">From</p>
                <p className="text-sm font-bold text-slate-900 truncate pr-2">{ride.originAddress}</p>
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">To</p>
                <p className="text-sm font-bold text-slate-900 truncate pr-2">{ride.destinationAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver & Vehicle Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Driver & Vehicle</h3>
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
              {driver?.avatarUrl ? (
                <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-bold text-slate-900">{driver?.name || 'Driver'}</h4>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                ⭐ {driver?.driverRatingAvg?.toFixed(1) || '4.8'} • {driver?.driverRatingCount || 12} rides
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1">Vehicle</p>
            <p className="font-bold text-slate-800 text-sm">{vehicle?.make || 'Honda'} {vehicle?.model || 'City'}</p>
            <p className="text-xs font-medium text-slate-500">{vehicle?.color || 'White'} • {vehicle?.year || '2022'}</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Capacity</p>
            <p className="font-bold text-emerald-900 text-sm">{vehicle?.seatCapacity || 4} Total Seats</p>
            <p className="text-xs font-medium text-emerald-700">{vehicle?.vehicleType || 'Sedan'}</p>
          </div>
        </div>
      </div>

      {/* Ride Preferences */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900">Ride Information</h3>
          <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
            View Passengers
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1">Smoking</p>
            <p className="font-bold text-slate-800 text-sm">No</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1">Music</p>
            <p className="font-bold text-slate-800 text-sm">Okay</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1">Pets</p>
            <p className="font-bold text-slate-800 text-sm">No</p>
          </div>
        </div>
      </div>

      {/* Booking Configuration */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Booking Details</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span>Select Seats</span>
            <span className="text-emerald-600 font-semibold">{availableSeats} available</span>
          </label>
          <div className="flex space-x-3">
            {[...Array(Math.min(availableSeats, 4))].map((_, i) => (
              <button
                key={i}
                onClick={() => setSeats(i + 1)}
                className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                  seats === i + 1 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-offset-2 ring-emerald-500' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {availableSeats === 0 && (
              <div className="w-full text-center p-4 bg-rose-50 text-rose-600 font-bold rounded-2xl border border-rose-200">
                Ride Full
              </div>
            )}
          </div>
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 mb-1">
            <Info className="w-4 h-4" />
            <h4 className="font-bold text-sm">Distance-Based Fair Fare</h4>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Your trip distance</span>
            <span className="font-bold text-slate-900">{tripDistance}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Estimated fare per seat</span>
            <span className="font-bold text-slate-900">₹{tripFare}</span>
          </div>
          <div className="pt-3 border-t border-emerald-200/50 flex justify-between items-center">
            <span className="font-bold text-slate-800">Total Contribution</span>
            <span className="font-black text-2xl text-emerald-600">₹{totalFare}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          disabled={availableSeats === 0}
          className="w-full mt-6 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
        >
          Review & Book Ride
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-5 text-center">
              <h2 className="text-xl font-bold text-white mb-1">Confirm your ride?</h2>
              <p className="text-emerald-100 text-sm font-medium">Please review details before booking.</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex items-stretch space-x-4">
                <div className="flex flex-col items-center py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate pr-2">{ride.originAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate pr-2">{ride.destinationAddress}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(ride.departureTime).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Time</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Seats</p>
                  <p className="text-sm font-bold text-slate-800">{seats}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Your distance</p>
                  <p className="text-sm font-bold text-slate-800">{tripDistance}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-100">
                <span className="font-bold text-slate-700">Your fare</span>
                <span className="font-black text-xl text-emerald-600">₹{totalFare}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={bookingLoading}
                  className="py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBook}
                  disabled={bookingLoading}
                  className="py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
                >
                  {bookingLoading ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
