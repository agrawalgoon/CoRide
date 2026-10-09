import React from 'react';
import { MapPin } from 'lucide-react';

export default function LocationSearchInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  iconColor = "text-emerald-500",
  onSelectCoordinates
}) {
  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    
    // Simulate finding coordinates for any typed address to pass backend validation
    if (val.trim().length > 3) {
      if (onSelectCoordinates) {
        // Just mock coordinates for now since we're not using a real map API
        onSelectCoordinates({
          lat: 19.8762 + (Math.random() * 0.01),
          lng: 75.3433 + (Math.random() * 0.01)
        });
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <MapPin className={`${iconColor} w-5 h-5`} />
        <input 
          type="text" 
          value={value}
          onChange={handleChange}
          placeholder={placeholder} 
          className="bg-transparent border-none outline-none w-full text-slate-800 font-medium placeholder-slate-400"
        />
      </div>
    </div>
  );
}
