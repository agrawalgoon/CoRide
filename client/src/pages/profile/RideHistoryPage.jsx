import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import api from '../../services/api';

export default function RideHistoryPage() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/bookings/history');
        setRides(response.data);
      } catch (err) {
        // Fallback mock
        setRides([
          {
            id: '1',
            date: '2023-10-05T08:30:00Z',
            origin: 'MGM University',
            destination: 'Connaught Place',
            role: 'Passenger',
            fare: 120,
            status: 'Completed',
          },
          {
            id: '2',
            date: '2023-10-04T17:15:00Z',
            origin: 'Prozone Mall',
            destination: 'MGM University',
            role: 'Driver',
            fare: 240,
            status: 'Completed',
          },
          {
            id: '3',
            date: '2023-10-06T09:00:00Z',
            origin: 'Home',
            destination: 'Office',
            role: 'Passenger',
            fare: 0,
            status: 'Cancelled',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-emerald-700 bg-emerald-100';
      case 'Cancelled': return 'text-rose-700 bg-rose-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="px-2">
        <h1 className="text-2xl font-bold text-slate-800">Ride History</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading history...</div>
      ) : rides.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No ride history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{new Date(ride.date).toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500">{new Date(ride.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">₹{ride.fare}</div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusColor(ride.status)}`}>
                    {ride.status}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-slate-700 truncate">{ride.origin}</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-700 truncate">{ride.destination}</span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium border border-slate-200 px-2 py-1 rounded-md bg-slate-50">
                  As {ride.role}
                </span>
                <button className="text-emerald-600 font-medium hover:underline flex items-center">
                  Details <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
