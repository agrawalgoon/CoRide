import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, Car, Users, Info, ChevronLeft, CheckCircle } from 'lucide-react';
import { createRide } from '../../services/rideService';
import { getVehicles } from '../../services/vehicleService';
import LocationSearchInput from '../../components/ride/LocationSearchInput';
import RouteMapPreview from '../../components/ride/RouteMapPreview';

export default function CreateRidePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [vehicles, setVehicles] = useState([]);
  const [fetchingVehicles, setFetchingVehicles] = useState(false);

  const [formData, setFormData] = useState({
    originAddress: '',
    originLat: null,
    originLng: null,
    destinationAddress: '',
    destinationLat: null,
    destinationLng: null,
    date: '',
    time: '',
    vehicleId: '',
    requestedSeats: 1,
    pricePerSeat: 50,
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (step === 3 && vehicles.length === 0) {
      const fetchMyVehicles = async () => {
        setFetchingVehicles(true);
        try {
          const res = await getVehicles();
          setVehicles(res.vehicles || res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setFetchingVehicles(false);
        }
      };
      fetchMyVehicles();
    }
  }, [step]);

  const handleNext = () => setStep(s => Math.min(5, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
  const vehicleCapacity = selectedVehicle?.seatCapacity || 4;
  const maxPassengerSeats = Math.max(1, vehicleCapacity - 1); // Exclude driver

  useEffect(() => {
    if (formData.requestedSeats > maxPassengerSeats) {
      setFormData(prev => ({ ...prev, requestedSeats: maxPassengerSeats }));
    }
  }, [maxPassengerSeats, formData.requestedSeats]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const departureTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      const payload = {
        vehicleId: formData.vehicleId,
        originAddress: formData.originAddress,
        originLatitude: formData.originLat || 19.8762, // Fallback if missing
        originLongitude: formData.originLng || 75.3433,
        destinationAddress: formData.destinationAddress,
        destinationLatitude: formData.destinationLat || 19.8862,
        destinationLongitude: formData.destinationLng || 75.3533,
        departureTime,
        totalSeats: formData.requestedSeats,
        pricePerSeat: formData.pricePerSeat,
      };
      await createRide(payload);
      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6 animate-in zoom-in duration-300">
        <CheckCircle className="w-24 h-24 text-emerald-500" />
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Ride Published!</h2>
          <p className="text-slate-500 font-medium">Your ride is now visible to other members.</p>
        </div>
        <div className="w-full max-w-sm space-y-3 mt-6">
          <button onClick={() => navigate('/offer/manage')} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors hidden">
            Manage Ride
          </button>
          <button onClick={() => navigate('/offer')} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors">
            Manage My Rides
          </button>
          <button onClick={() => navigate('/find')} className="w-full py-4 bg-slate-100 text-emerald-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors">
            Find More Rides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => step === 1 ? navigate('/offer') : handleBack()} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider px-1">
            <span className={step >= 1 ? 'text-emerald-600' : ''}>Route</span>
            <span className={step >= 2 ? 'text-emerald-600' : ''}>Time</span>
            <span className={step >= 3 ? 'text-emerald-600' : ''}>Vehicle</span>
            <span className={step >= 4 ? 'text-emerald-600' : ''}>Pricing</span>
            <span className={step >= 5 ? 'text-emerald-600' : ''}>Review</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6">
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Where are you going?</h2>
              <p className="text-slate-500 text-sm font-medium">Enter your origin and destination.</p>
            </div>
            <div className="space-y-4">
              <LocationSearchInput 
                label="Leaving from"
                value={formData.originAddress}
                onChange={(val) => setFormData({...formData, originAddress: val})}
                placeholder="E.g. MGM University"
                iconColor="text-emerald-500"
                onSelectCoordinates={(coords) => setFormData({...formData, originLat: coords.lat, originLng: coords.lng})}
              />
              <LocationSearchInput 
                label="Going to"
                value={formData.destinationAddress}
                onChange={(val) => setFormData({...formData, destinationAddress: val})}
                placeholder="E.g. CIDCO"
                iconColor="text-rose-500"
                onSelectCoordinates={(coords) => setFormData({...formData, destinationLat: coords.lat, destinationLng: coords.lng})}
              />
              <RouteMapPreview origin={formData.originAddress} destination={formData.destinationAddress} />
            </div>
            <button 
              onClick={handleNext}
              disabled={!formData.originAddress || !formData.destinationAddress || formData.originAddress === formData.destinationAddress}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-200 mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">When are you leaving?</h2>
              <p className="text-slate-500 text-sm font-medium">Select your departure date and time.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
                  <Calendar className="text-slate-400 w-5 h-5" />
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-transparent border-none outline-none w-full text-slate-800 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
                  <Clock className="text-slate-400 w-5 h-5" />
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="bg-transparent border-none outline-none w-full text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleNext}
              disabled={!formData.date || !formData.time}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-200 mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Vehicle & Seats</h2>
              <p className="text-slate-500 text-sm font-medium">Which vehicle are you driving?</p>
            </div>
            
            {fetchingVehicles ? (
              <div className="h-24 bg-slate-100 animate-pulse rounded-2xl"></div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-500 font-medium mb-4">No vehicle added yet.</p>
                <button onClick={() => navigate('/profile/vehicles')} className="text-emerald-600 font-bold bg-emerald-50 px-6 py-2.5 rounded-xl hover:bg-emerald-100">
                  Add Vehicle
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setFormData({...formData, vehicleId: v.id})}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      formData.vehicleId === v.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{v.make} {v.model}</p>
                        <p className="text-xs font-medium text-slate-500">{v.color} • {v.plateNumber}</p>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                        {v.seatCapacity} Seats
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {formData.vehicleId && (
              <div className="animate-in fade-in pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3">Available passenger seats</label>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <Users className="text-slate-400 w-5 h-5" />
                  <div className="flex items-center space-x-6">
                    <button 
                      onClick={() => setFormData({...formData, requestedSeats: Math.max(1, formData.requestedSeats - 1)})}
                      className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                    >-</button>
                    <span className="font-black text-xl text-slate-800">{formData.requestedSeats}</span>
                    <button 
                      onClick={() => setFormData({...formData, requestedSeats: Math.min(maxPassengerSeats, formData.requestedSeats + 1)})}
                      className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                    >+</button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium text-center">Do not count yourself (the driver).</p>
              </div>
            )}

            <button 
              onClick={handleNext}
              disabled={!formData.vehicleId}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-200 mt-4"
            >
              Continue
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Pricing</h2>
              <p className="text-slate-500 text-sm font-medium">Set a fair contribution per seat.</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Fare contribution (₹ per seat)</label>
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-emerald-500 transition-all">
                <span className="font-bold text-slate-400 text-lg">₹</span>
                <input 
                  type="number" 
                  value={formData.pricePerSeat}
                  onChange={(e) => setFormData({...formData, pricePerSeat: Number(e.target.value)})}
                  className="bg-transparent border-none outline-none w-full text-slate-800 font-bold text-lg"
                  min="10"
                />
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex space-x-3">
              <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900 mb-1">Distance-based Fair Fare</p>
                <p className="text-xs font-medium text-emerald-800/80 leading-relaxed">
                  Passenger fare is calculated according to the distance they travel. The backend calculates authoritative fares based on this base configuration.
                </p>
              </div>
            </div>

            <button 
              onClick={handleNext}
              disabled={!formData.pricePerSeat || formData.pricePerSeat <= 0}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-200 mt-4"
            >
              Review Ride
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Review & Publish</h2>
              <p className="text-slate-500 text-sm font-medium">Almost there! Review your ride details.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Route</p>
                  <p className="font-bold text-slate-900 text-sm truncate pr-4">{formData.originAddress}</p>
                  <p className="text-slate-400 text-xs py-1">↓</p>
                  <p className="font-bold text-slate-900 text-sm truncate pr-4">{formData.destinationAddress}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-emerald-600 text-xs font-bold">Edit</button>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Departure</p>
                  <p className="font-bold text-slate-900 text-sm">{formData.date} at {formData.time}</p>
                </div>
                <button onClick={() => setStep(2)} className="text-emerald-600 text-xs font-bold">Edit</button>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle & Seats</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedVehicle?.make} {selectedVehicle?.model}</p>
                  <p className="font-medium text-slate-500 text-xs">{formData.requestedSeats} passenger seat(s)</p>
                </div>
                <button onClick={() => setStep(3)} className="text-emerald-600 text-xs font-bold">Edit</button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pricing</p>
                  <p className="font-bold text-slate-900 text-sm">₹{formData.pricePerSeat} / seat base</p>
                </div>
                <button onClick={() => setStep(4)} className="text-emerald-600 text-xs font-bold">Edit</button>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
            >
              {loading ? 'Publishing...' : 'Publish Ride'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
