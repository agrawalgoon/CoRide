import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import RideCard from '../../components/ride/RideCard';
import { getRides } from '../../services/rideService';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const seats = searchParams.get('seats') || '1';

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getRides({ from, to, date, seats });
        setRides(response.rides || []);
      } catch (err) {
        console.error('Failed to fetch rides', err);
        setError('Unable to load rides. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [from, to, date, seats]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/find')} 
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Search Results</h1>
        <button 
          onClick={() => setShowFilters(true)}
          className="p-2 -mr-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between text-sm">
        <div>
          <div className="font-bold text-slate-800">{from || 'Anywhere'} → {to || 'Anywhere'}</div>
          <div className="text-slate-500 mt-0.5">{date ? new Date(date).toLocaleDateString() : 'Any date'} • {seats} seat(s)</div>
        </div>
        <button 
          onClick={() => navigate('/find')} 
          className="text-emerald-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Edit
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex justify-between mb-4">
                <div className="flex space-x-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div className="space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="w-16 h-6 bg-slate-200 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
            <p className="text-rose-500 font-medium mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-emerald-200"
            >
              Retry
            </button>
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2">No rides found</h3>
            <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">Try changing your date, destination or filters to find more rides.</p>
            <button 
              onClick={() => navigate('/find')} 
              className="border-2 border-emerald-600 text-emerald-600 font-bold py-2.5 px-6 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">Filters & Sort</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 -mr-2 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {['Recommended', 'Earliest departure', 'Lowest fare', 'Highest rated'].map(sort => (
                    <button key={sort} className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors">
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Departure Time</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2.5 px-3 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-center">Morning (06:00 - 12:00)</button>
                  <button className="py-2.5 px-3 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-center">Afternoon (12:00 - 18:00)</button>
                  <button className="py-2.5 px-3 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-center">Evening (18:00 - 00:00)</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Maximum Fare (₹)</label>
                <input type="range" min="20" max="200" defaultValue="100" className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between mt-2 text-xs font-semibold text-slate-500">
                  <span>₹20</span>
                  <span>₹100</span>
                  <span>₹200+</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {['No Smoking', 'Pets Allowed', 'Music', 'Ladies Only', 'Luggage Allowed'].map(pref => (
                    <button key={pref} className="px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors">
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-5 border-t border-slate-100 flex items-center space-x-3">
              <button onClick={() => setShowFilters(false)} className="px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Reset
              </button>
              <button onClick={() => setShowFilters(false)} className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
