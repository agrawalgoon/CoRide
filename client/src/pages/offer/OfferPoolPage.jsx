import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle, XCircle, ChevronRight, Car } from 'lucide-react';
import { getMyRides } from '../../services/rideService';

export default function OfferPoolPage() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchMyRides = async () => {
      try {
        const response = await getMyRides();
        setRides(response.rides || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load your rides. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyRides();
  }, []);

  const upcomingRides = rides.filter(r => ['SCHEDULED', 'PUBLISHED'].includes(r.status));
  const completedRides = rides.filter(r => r.status === 'COMPLETED');
  const cancelledRides = rides.filter(r => r.status === 'CANCELLED');

  const getActiveRides = () => {
    switch(activeTab) {
      case 'completed': return completedRides;
      case 'cancelled': return cancelledRides;
      default: return upcomingRides;
    }
  };

  const activeRides = getActiveRides();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="bg-emerald-700 text-white p-6 rounded-3xl shadow-lg -mx-4 sm:mx-0 mt-[-1.5rem] sm:mt-0 pb-10">
        <h1 className="text-3xl font-bold mb-2">Offer a Ride</h1>
        <p className="text-emerald-100 mb-6 font-medium">Share your journey, reduce travel costs, and help your community commute.</p>
        
        <button 
          onClick={() => navigate('/offer/create')}
          className="w-full flex items-center justify-center space-x-2 bg-white text-emerald-700 font-bold py-3.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Offer a Ride</span>
        </button>
      </div>

      <div className="pt-2">
        <h2 className="text-xl font-bold text-slate-900 mb-4 px-1">My Offered Rides</h2>
        
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 mx-1">
          {['upcoming', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${
                activeTab === tab 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 px-1">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-white animate-pulse rounded-2xl border border-slate-100"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm mx-1">
            <p className="text-rose-500 font-medium mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Retry</button>
          </div>
        ) : activeRides.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm mx-1">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No {activeTab} rides</h3>
            <p className="text-slate-500 text-sm">You don't have any {activeTab} rides to show.</p>
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {activeRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      ride.status === 'SCHEDULED' || ride.status === 'PUBLISHED' ? 'bg-blue-50 text-blue-700' :
                      ride.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      ride.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                    }`}>
                      {ride.status}
                    </span>
                    <div className="text-xs text-slate-500 mt-2 font-medium flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ride.departureTime).toLocaleDateString()} • {new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 font-bold">{ride.availableSeats}</span>
                    <span className="text-slate-500 text-xs ml-1">seats left</span>
                  </div>
                </div>
                
                <div className="space-y-1 mb-5">
                  <div className="font-bold text-slate-800 text-sm truncate">{ride.originAddress}</div>
                  <div className="text-slate-400 text-xs pl-1">↓</div>
                  <div className="font-bold text-slate-800 text-sm truncate">{ride.destinationAddress}</div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <div className="text-xs font-semibold text-slate-500">
                    {ride.vehicle?.make} {ride.vehicle?.model}
                  </div>
                  <button 
                    onClick={() => navigate(`/offer/manage/${ride.id}`)}
                    className="flex items-center space-x-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-4 py-2 rounded-xl"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
