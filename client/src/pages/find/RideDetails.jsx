import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ShieldCheck, MapPin, Clock, Info } from 'lucide-react';
import api from '../../services/api';

export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const response = await api.get(`/rides/${rideId}`);
        setRide(response.data);
      } catch (err) {
        // Fallback mock
        setRide({
          id: rideId,
          driver: { name: 'John Doe', rating: 4.8, isVerified: true, totalRides: 45 },
          vehicle: { make: 'Honda', model: 'City', color: 'White', plate: 'MH20 AB 1234' },
          origin: 'MGM University',
          destination: 'Connaught Place',
          departureTime: '2023-11-01T08:30:00Z',
          availableSeats: 2,
          pricePerKm: 10,
          totalDistance: 12,
          routeOverview: 'Via Jalna Road',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleBook = async () => {
    setBookingLoading(true);
    try {
      await api.post(`/bookings`, { rideId });
      alert('Booking confirmed!');
      navigate('/profile/history');
    } catch (err) {
      alert('Failed to book ride. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!ride) return <div className="p-8 text-center text-red-500">Ride not found.</div>;

  const totalFare = ride.pricePerKm * ride.totalDistance;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Ride Details</h2>
        
        {/* Driver Info */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-slate-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <h3 className="font-bold text-lg text-slate-800">{ride.driver.name}</h3>
              {ride.driver.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
            </div>
            <p className="text-sm text-slate-500">⭐ {ride.driver.rating} • {ride.driver.totalRides} rides</p>
          </div>
        </div>

        {/* Route Details */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pickup</p>
              <p className="text-slate-800 font-medium">{ride.origin}</p>
              <p className="text-sm text-slate-500">{new Date(ride.departureTime).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-rose-500 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Dropoff</p>
              <p className="text-slate-800 font-medium">{ride.destination}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="bg-slate-50 p-4 rounded-xl mb-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Vehicle</h4>
          <p className="text-slate-800">{ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}</p>
          <p className="text-sm text-slate-500 font-mono mt-1">{ride.vehicle.plate}</p>
        </div>

        {/* Fare Details */}
        <div className="bg-emerald-50 p-5 rounded-xl mb-6 border border-emerald-100">
          <div className="flex items-center space-x-2 text-emerald-800 mb-3">
            <Info className="w-5 h-5" />
            <h4 className="font-semibold">Fair Distance-Based Fare</h4>
          </div>
          <div className="space-y-2 text-sm text-emerald-900">
            <div className="flex justify-between">
              <span>Distance Traveled</span>
              <span>{ride.totalDistance} km</span>
            </div>
            <div className="flex justify-between">
              <span>Fare per km</span>
              <span>₹{ride.pricePerKm}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-emerald-200 flex justify-between font-bold text-lg">
              <span>Your Estimated Contribution</span>
              <span>₹{totalFare}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <button 
            onClick={handleBook}
            disabled={bookingLoading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200/50 disabled:opacity-50"
          >
            {bookingLoading ? 'Booking...' : 'Book Ride'}
          </button>
          
          <button 
            onClick={() => navigate(`/rides/${rideId}/live`)}
            className="w-full bg-slate-100 text-emerald-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
          >
            View Live Ride
          </button>
        </div>
      </div>
    </div>
  );
}
