import React from 'react';
import { QrCode, AlertCircle } from 'lucide-react';

export default function QRCodeDisplay({ rideId }) {
  // Since the backend contract is missing, we render an unavailable state.
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center mx-auto">
        <QrCode className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <h3 className="text-slate-700 font-bold mb-1">Dynamic QR Attendance</h3>
        <p className="text-slate-500 text-sm flex items-center justify-center">
          <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
          Currently unavailable
        </p>
      </div>
    </div>
  );
}
