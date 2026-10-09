import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, XCircle, Edit, CheckCircle, Navigation } from 'lucide-react';
import { getRideById, updateRide, cancelRide } from '../../services/rideService';

export default function ManageRidePage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrice, setEditPrice] = useState(0);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await getRideById(rideId);
        setRide(res.ride);
        setEditPrice(res.ride.pricePerSeat || 50);
      } catch (err) {
        console.error(err);
        setError('Failed to load ride details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleEditRide = async () => {
    setEditLoading(true);
    try {
      await updateRide(rideId, { pricePerSeat: editPrice });
      setRide(prev => ({ ...prev, pricePerSeat: editPrice }));
      setShowEditModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ride.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelRide = async () => {
    setCancelLoading(true);
    try {
      await cancelRide(rideId);
      setShowCancelModal(false);
      setRide(prev => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel ride.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse px-4">
        <div className="h-40 bg-slate-200 rounded-3xl"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm mx-4 px-4">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Oops!</h3>
        <p className="text-rose-500 font-medium mb-6">{error}</p>
        <button onClick={() => navigate('/offer')} className="bg-emerald-600 text-white font-semibold py-2.5 px-6 rounded-xl">Go Back</button>
      </div>
    );
  }

  const isEditable = ride.status === 'SCHEDULED' || ride.status === 'PUBLISHED';
  const isCancellable = ride.status === 'SCHEDULED' || ride.status === 'PUBLISHED';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => navigate('/offer')} className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Manage Ride</h1>
        <div className="w-10"></div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              ride.status === 'SCHEDULED' || ride.status === 'PUBLISHED' ? 'bg-blue-50 text-blue-700' :
              ride.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
              ride.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
            }`}>
              {ride.status}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-emerald-600">₹{ride.pricePerSeat}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">Per Seat Base</p>
          </div>
        </div>

        <div className="flex items-stretch space-x-4 mb-6">
          <div className="flex flex-col items-center py-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/30"></div>
            <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/30"></div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Origin</p>
              <p className="text-sm font-bold text-slate-900 pr-2">{ride.originAddress}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Destination</p>
              <p className="text-sm font-bold text-slate-900 pr-2">{ride.destinationAddress}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100">
          <div>
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Departure</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{new Date(ride.departureTime).toLocaleDateString()}</p>
            <p className="text-xs font-medium text-slate-500">{new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <div>
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Seats</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{ride.availableSeats} Available</p>
            <p className="text-xs font-medium text-slate-500">of {ride.totalSeats || ride.availableSeats} total</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h3 className="font-bold text-lg text-slate-900 mb-4">Passenger List</h3>
        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">No passengers booked yet.</p>
        </div>
      </div>

      {isEditable && (
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit className="w-5 h-5 mb-1.5 text-slate-500" />
            <span className="text-xs font-bold">Edit Ride</span>
          </button>
          <button 
            onClick={() => setShowCancelModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
          >
            <XCircle className="w-5 h-5 mb-1.5" />
            <span className="text-xs font-bold">Cancel Ride</span>
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 pb-2 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Edit Ride Pricing</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price Per Seat (₹)</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
                  <span className="font-bold text-slate-400">₹</span>
                  <input 
                    type="number" 
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="bg-transparent border-none outline-none w-full text-slate-800 font-bold"
                    min="10"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-5 flex space-x-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditRide}
                disabled={editLoading || !editPrice}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Cancel this ride?</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Are you sure you want to cancel this ride? Passengers with confirmed bookings may be affected.
              </p>
            </div>
            
            <div className="p-5 flex space-x-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowCancelModal(false)}
                disabled={cancelLoading}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Keep Ride
              </button>
              <button 
                onClick={handleCancelRide}
                disabled={cancelLoading}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-md shadow-rose-200"
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Ride'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
