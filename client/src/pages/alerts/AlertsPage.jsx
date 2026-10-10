import React, { useState, useEffect } from 'react';
import { Bell, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      let data = response.data;
      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (data?.notifications && Array.isArray(data.notifications)) {
        setAlerts(data.notifications);
      } else {
        setAlerts([]); // Graceful fallback if backend returns placeholder
      }
    } catch (err) {
      // Keep empty if API is missing or fails
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
          <button onClick={fetchAlerts} className="text-sm font-medium text-slate-500 hover:text-emerald-600">Refresh</button>
        </div>
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
