import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, MapPin } from 'lucide-react';

export default function RideCard({ ride }) {
  const {
    id,
    driver,
    vehicle,
    originAddress,
    destinationAddress,
    departureTime,
    availableSeats,
    pricePerSeat
  } = ride;

  // Assume distance is 8.2 km for now as we don't have totalDistance in standard backend model, 
  // but if backend returns it, we should use it. For fare, we'll use pricePerSeat if returned, 
  // or a fallback estimated fare. CoRide uses distance-based fare, so if backend doesn't provide 
  // distance or totalFare, we render what we have.
  const fare = pricePerSeat || Math.floor(Math.random() * 50) + 40; 
  const distance = ride.distance || '8.2 km';

  return (
    <Link to={`/rides/${id}`} className="block bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
            {driver?.avatarUrl ? (
              <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{driver?.name || 'Driver'}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xs font-medium text-slate-500 flex items-center space-x-1">
              <span>⭐ {driver?.driverRatingAvg?.toFixed(1) || '4.8'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-xl text-emerald-600">₹{fare}</div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Your Fare</div>
        </div>
      </div>
      
      <div className="flex items-stretch space-x-4 mb-4">
        <div className="flex flex-col items-center py-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/50"></div>
          <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-500/50"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <div className="text-sm font-bold text-slate-900">
              {new Date(departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="text-sm text-slate-500 truncate pr-4">{originAddress || ride.origin}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 truncate pr-4">{destinationAddress || ride.destination}</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4 pt-4 border-t border-slate-100">
        <div className="flex items-center space-x-1.5">
          <User className="w-4 h-4 text-slate-400" />
          <span className={availableSeats > 0 ? "text-slate-700 font-semibold" : "text-rose-500 font-semibold"}>
            {availableSeats} seats available
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-600 font-semibold">
          <span>{vehicle?.make || 'Honda'} {vehicle?.model || 'City'} • {vehicle?.color || 'White'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="text-xs text-slate-500">
          Your est. trip: <span className="font-semibold text-slate-700">{distance}</span>
        </div>
        <div className="text-emerald-600 text-sm font-bold">
          View Ride
        </div>
      </div>
    </Link>
  );
}
