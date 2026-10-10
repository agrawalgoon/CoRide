import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AttendanceStatusCard({ passengerCount, attendedCount }) {
  // Always unavailable until backend API supports it
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-slate-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Attendance Log</p>
          <p className="text-xs font-medium text-slate-500">Service unavailable</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-slate-300">- / -</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Boarded</p>
      </div>
    </div>
  );
}
