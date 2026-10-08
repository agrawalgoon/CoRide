import React, { useState } from 'react';
import { MapPin, Calendar, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FindPoolPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    seats: 1,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams(searchParams).toString();
    navigate(`/find/results?${query}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-emerald-700 text-white p-6 rounded-3xl shadow-lg -mx-4 sm:mx-0 mt-[-1.5rem] sm:mt-0 pb-12">
        <h1 className="text-3xl font-bold mb-2">Find a Ride</h1>
        <p className="text-emerald-100 mb-6 font-medium">Share your journey. Save money. Travel together.</p>
        
        <form onSubmit={handleSearch} className="bg-white rounded-2xl p-5 shadow-xl space-y-4 text-slate-800">
          <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <MapPin className="text-emerald-600 w-5 h-5 flex-shrink-0" />
            <input 
              type="text" 
              required
              placeholder="Leaving from (e.g. MGM University)" 
              className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400 font-medium"
              value={searchParams.from}
              onChange={(e) => setSearchParams({...searchParams, from: e.target.value})}
            />
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <MapPin className="text-rose-500 w-5 h-5 flex-shrink-0" />
            <input 
              type="text" 
              required
              placeholder="Going to (e.g. CIDCO)" 
              className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400 font-medium"
              value={searchParams.to}
              onChange={(e) => setSearchParams({...searchParams, to: e.target.value})}
            />
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-1 flex items-center space-x-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <Calendar className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <input 
                type="date" 
                required
                className="bg-transparent border-none outline-none w-full text-slate-800 text-sm font-medium"
                value={searchParams.date}
                onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
              />
            </div>
            <div className="flex-1 flex items-center space-x-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <Clock className="text-slate-400 w-5 h-5 flex-shrink-0" />
              <input 
                type="time" 
                className="bg-transparent border-none outline-none w-full text-slate-800 text-sm font-medium"
                value={searchParams.time}
                onChange={(e) => setSearchParams({...searchParams, time: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
            <Users className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <select 
              className="bg-transparent border-none outline-none w-full text-slate-800 text-sm font-medium appearance-none"
              value={searchParams.seats}
              onChange={(e) => setSearchParams({...searchParams, seats: Number(e.target.value)})}
            >
              <option value="1">1 Seat</option>
              <option value="2">2 Seats</option>
              <option value="3">3 Seats</option>
              <option value="4">4 Seats</option>
            </select>
          </div>
          
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 mt-2">
            Find Rides
          </button>
        </form>
      </div>
      
      <div className="px-1 text-center pb-8">
        <p className="text-sm text-slate-500">CoRide automatically matches you with verified users in your organization.</p>
      </div>
    </div>
  );
}
