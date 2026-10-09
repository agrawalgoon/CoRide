import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function RouteMapPreview({ origin, destination }) {
  if (!origin && !destination) return null;

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 border-dashed relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Navigation className="w-24 h-24" />
      </div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex flex-col items-center mt-1">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/30"></div>
            <div className="w-0.5 h-8 bg-slate-200 my-1"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-500/30"></div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Origin</p>
              <p className="text-sm font-bold text-slate-900 truncate pr-4">
                {origin || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Destination</p>
              <p className="text-sm font-bold text-slate-900 truncate pr-4">
                {destination || "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
