import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/notificationService';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getNotifications();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(err.response?.data?.message || 'Unable to load alerts.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err) {
      alert('Failed to mark all as read.');
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await markNotificationRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'REQUEST_ACCEPTED':
      case 'ATTENDANCE_SUCCESS':
        return <CheckCircle className="text-emerald-500 w-6 h-6 shrink-0" />;
      case 'REQUEST_REJECTED':
      case 'RIDE_CANCELLED':
        return <XCircle className="text-rose-500 w-6 h-6 shrink-0" />;
      case 'RIDE_REQUEST_RECEIVED':
        return <Calendar className="text-blue-500 w-6 h-6 shrink-0" />;
      default:
        return <Bell className="text-slate-500 w-6 h-6 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
          <p className="text-slate-500 text-xs mt-0.5">Notifications for your rides and requests</p>
        </div>
        {alerts.some((a) => !a.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-emerald-600 text-xs font-semibold hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">No alerts yet</p>
          <p className="text-xs text-slate-400 mt-1">
            You will receive updates here when rides are requested, accepted, or cancelled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => !alert.isRead && handleMarkOneRead(alert.id)}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                alert.isRead
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
              } flex items-start space-x-3.5`}
            >
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      alert.isRead ? 'text-slate-800' : 'text-emerald-950 font-extrabold'
                    }`}
                  >
                    {alert.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
