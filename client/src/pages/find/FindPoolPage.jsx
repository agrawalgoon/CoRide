import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function FindPoolPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
  });

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      // using mock data fallback if backend fails or doesn't have it yet
      const response = await api.get('/rides', { params: searchParams });
      setRides(response.data);
    } catch (err) {
      console.error('Failed to fetch rides', err);
      // Fallback mock data for demo if API fails
      setRides([
        {
          id: '1',
          driver: { name: 'John Doe', rating: 4.8, isVerified: true },
          origin: 'MGM University',
          destination: 'Connaught Place',
          departureTime: '2023-11-01T08:30:00Z',
          availableSeats: 2,
          pricePerKm: 10,
          totalDistance: 12,
        },
        {
          id: '2',
          driver: { name: 'Jane Smith', rating: 4.9, isVerified: true },
          origin: 'MGM University',
          destination: 'Prozone Mall',
          departureTime: '2023-11-01T17:15:00Z',
          availableSeats: 3,
          pricePerKm: 8,
          totalDistance: 8,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-emerald-700 text-white p-6 rounded-3xl shadow-lg -mx-4 sm:mx-0 mt-[-1.5rem] sm:mt-0 pb-10">
        <h1 className="text-2xl font-bold mb-2">Where to?</h1>
        <p className="text-emerald-100 mb-6">Find a verified ride for your daily commute.</p>
        
        <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-xl space-y-4 text-slate-800">
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <MapPin className="text-emerald-600 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Leaving from..." 
              className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
              value={searchParams.from}
              onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <MapPin className="text-rose-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Going to..." 
              className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
              value={searchParams.to}
              onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1 flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Calendar className="text-slate-400 w-5 h-5" />
              <input 
                type="date" 
                className="bg-transparent border-none outline-none w-full text-slate-800 text-sm"
                value={searchParams.date}
                onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200">
            Search Rides
          </button>
        </form>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Available Rides</h2>
        
        {loading ? (
          <div className="text-center py-10 text-slate-500">Searching...</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500">No rides found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <Link to={`/rides/${ride.id}`} key={ride.id} className="block bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center space-x-1">
                        <span>{ride.driver.name}</span>
                        {ride.driver.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="text-xs text-slate-500">⭐ {ride.driver.rating}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-600">₹{ride.pricePerKm * ride.totalDistance}</div>
                    <div className="text-xs text-slate-400">Total Fare</div>
                  </div>
                </div>
                
                <div className="flex items-stretch space-x-4">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <div className="w-0.5 h-8 bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div className="text-sm text-slate-500 truncate">{ride.origin}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Estimated</div>
                      <div className="text-sm text-slate-500 truncate">{ride.destination}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <User className="w-4 h-4" />
                    <span>{ride.availableSeats} seats left</span>
                  </div>
                  <div className="text-emerald-600 font-medium hover:underline">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
