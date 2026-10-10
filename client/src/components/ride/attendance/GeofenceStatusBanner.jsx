import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

export default function GeofenceStatusBanner({ rideId }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start space-x-3">
      <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-slate-700">Geofence Validation</p>
        <p className="text-xs text-slate-500 font-medium flex items-center mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
          Location services offline
        </p>
      </div>
    </div>
  );
}
