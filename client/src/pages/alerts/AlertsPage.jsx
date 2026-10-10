import React, { useState, useEffect } from 'react';
import { Bell, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/notifications');
        setAlerts(response.data);
      } catch (err) {
        // Fallback mock data
        setAlerts([
          {
            id: '1',
            type: 'booking_confirmed',
            title: 'Booking Confirmed!',
            message: 'Your ride with John to Connaught Place is confirmed.',
            time: '10 mins ago',
            read: false,
          },
          {
            id: '2',
            type: 'reminder',
            title: 'Upcoming Ride',
            message: 'Your ride starts in 30 minutes. Be at the pickup point.',
            time: '25 mins ago',
            read: true,
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed': return <CheckCircle className="text-emerald-500 w-6 h-6" />;
      case 'reminder': return <Calendar className="text-blue-500 w-6 h-6" />;
      case 'cancelled': return <XCircle className="text-rose-500 w-6 h-6" />;
      default: return <Bell className="text-slate-500 w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
        <button className="text-emerald-600 text-sm font-medium hover:underline">Mark all as read</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500">No new alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-xl border ${alert.read ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-100'} flex items-start space-x-4`}
            >
              <div className="mt-1">
                {getIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-semibold ${alert.read ? 'text-slate-700' : 'text-slate-900'}`}>{alert.title}</h4>
                  <span className="text-xs text-slate-400">{alert.time}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
