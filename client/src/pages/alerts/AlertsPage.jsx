import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Check,
  X,
  User,
  ArrowRight
} from 'lucide-react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/notificationService';
import { updateBookingStatus } from '../../services/bookingService';

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStates, setActionStates] = useState({}); // { [bookingId]: 'ACCEPTED' | 'REJECTED' | 'LOADING' }

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

  const handleBookingAction = async (bookingId, status) => {
    if (!bookingId) return;
    setActionStates((prev) => ({ ...prev, [bookingId]: 'LOADING' }));
    try {
      await updateBookingStatus(bookingId, status);
      setActionStates((prev) => ({ ...prev, [bookingId]: status }));
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} booking.`);
      setActionStates((prev) => ({ ...prev, [bookingId]: null }));
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
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-slate-800">Alerts</h1>
            <button onClick={fetchAlerts} className="text-xs font-medium text-slate-500 hover:text-emerald-600">Refresh</button>
          </div>
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

                {/* Dynamic Action Controls for Ride Booking Requests */}
                {alert.type === 'RIDE_REQUEST_RECEIVED' && alert.metadata?.bookingId && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    {actionStates[alert.metadata.bookingId] === 'ACCEPTED' ? (
                      <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-100/70 py-1.5 px-3 rounded-xl text-xs font-bold">
                        <Check className="w-4 h-4" />
                        <span>Request Accepted</span>
                      </div>
                    ) : actionStates[alert.metadata.bookingId] === 'REJECTED' ? (
                      <div className="flex items-center space-x-2 text-rose-700 bg-rose-100/70 py-1.5 px-3 rounded-xl text-xs font-bold">
                        <X className="w-4 h-4" />
                        <span>Request Rejected</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={actionStates[alert.metadata.bookingId] === 'LOADING'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(alert.metadata.bookingId, 'ACCEPTED');
                          }}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {actionStates[alert.metadata.bookingId] === 'LOADING'
                              ? 'Processing...'
                              : 'Accept Request'}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={actionStates[alert.metadata.bookingId] === 'LOADING'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingAction(alert.metadata.bookingId, 'REJECTED');
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-rose-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        {alert.metadata.rideId && (
                          <Link
                            to={`/rides/${alert.metadata.rideId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center space-x-1 py-1 px-2"
                          >
                            <span>View Ride</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Simple View Ride link for other ride alerts */}
                {alert.type !== 'RIDE_REQUEST_RECEIVED' && alert.metadata?.rideId && (
                  <div className="mt-2 text-right">
                    <Link
                      to={`/rides/${alert.metadata.rideId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold text-emerald-600 hover:underline inline-flex items-center space-x-1"
                    >
                      <span>View Ride</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
