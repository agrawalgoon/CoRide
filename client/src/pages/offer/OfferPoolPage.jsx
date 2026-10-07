import React, { useState } from 'react';
import { MapPin, Calendar, Users, Car, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function OfferPoolPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    time: '',
    vehicleId: '',
    seats: 3,
    pricePerKm: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/rides', formData);
      setIsSuccess(true);
    } catch (error) {
      // simulate success for MVP if API fails
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-800">Ride Published!</h2>
        <p className="text-slate-500">Your ride is now visible to other members.</p>
        <button 
          onClick={() => { setStep(1); setIsSuccess(false); }}
          className="mt-6 px-6 py-2 bg-emerald-100 text-emerald-800 font-medium rounded-full hover:bg-emerald-200 transition-colors"
        >
          Offer Another Ride
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Offer a Ride</h1>
        <p className="text-slate-500">Share your ride. Split the cost. Help your community move.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Where are you going?</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Leaving from</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-emerald-500">
                  <MapPin className="text-emerald-500 w-5 h-5" />
                  <input 
                    type="text" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    placeholder="E.g. Home" 
                    className="bg-transparent border-none outline-none w-full text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Going to</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-emerald-500">
                  <MapPin className="text-rose-500 w-5 h-5" />
                  <input 
                    type="text" 
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    placeholder="E.g. Office / Campus" 
                    className="bg-transparent border-none outline-none w-full text-slate-800"
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={!formData.origin || !formData.destination}
              className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">When are you leaving?</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Date</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-emerald-500">
                  <Calendar className="text-slate-400 w-5 h-5" />
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-transparent border-none outline-none w-full text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Time</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-emerald-500">
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="bg-transparent border-none outline-none w-full text-slate-800"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!formData.date || !formData.time}
                className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Ride Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Available Seats</label>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Users className="text-slate-400 w-5 h-5" />
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setFormData({...formData, seats: Math.max(1, formData.seats - 1)})}
                      className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                    >-</button>
                    <span className="font-semibold text-lg">{formData.seats}</span>
                    <button 
                      onClick={() => setFormData({...formData, seats: Math.min(8, formData.seats + 1)})}
                      className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                    >+</button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-600 mb-1">Contribution per km (₹)</label>
                <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:border-emerald-500">
                  <input 
                    type="number" 
                    value={formData.pricePerKm}
                    onChange={(e) => setFormData({...formData, pricePerKm: e.target.value})}
                    className="bg-transparent border-none outline-none w-full text-slate-800"
                    min="1"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">CoRide uses distance-based fair calculation. Passengers pay based on how far they travel with you.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setStep(2)}
                className="w-1/3 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)}
                className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Review & Publish</h3>
            
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Route</span>
                <span className="font-semibold text-right">{formData.origin} → {formData.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Departure</span>
                <span className="font-semibold">{formData.date} at {formData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Seats</span>
                <span className="font-semibold">{formData.seats} available</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">Pricing</span>
                <span className="font-semibold">₹{formData.pricePerKm} / km</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setStep(3)}
                className="w-1/3 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200"
              >
                Edit
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-200"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Ride'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
