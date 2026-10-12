import React, { useState, useEffect } from 'react';
import { FileText, Shield, Calendar, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff, Upload, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function DrivingLicensePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageKey = user ? `coride_license_${user.id}` : 'coride_license_guest';

  const [licenseNumber, setLicenseNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [showLicenseNumber, setShowLicenseNumber] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setLicenseNumber(data.licenseNumber || '');
        setHolderName(data.holderName || '');
        setExpiryDate(data.expiryDate || '');
        setDocumentName(data.documentName || '');
        setSaved(true);
      } catch {}
    }
    setIsLoaded(true);
  }, [storageKey]);

  const getMaskedLicense = (num) => {
    if (!num || num.length <= 4) return num;
    return '*'.repeat(num.length - 4) + num.slice(-4);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!licenseNumber.trim() || licenseNumber.trim().length < 5) {
      setError('License number must be at least 5 characters.');
      return;
    }
    if (!holderName.trim()) {
      setError('License holder name is required.');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required.');
      return;
    }
    const expiry = new Date(expiryDate);
    if (expiry <= new Date()) {
      setError('License has expired. Expired licenses cannot be used as valid driver credentials.');
      return;
    }

    const data = {
      licenseNumber: licenseNumber.trim(),
      holderName: holderName.trim(),
      expiryDate,
      documentName: documentName.trim(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    setSaved(true);
    setSuccess('Driving license information saved successfully.');
    setShowLicenseNumber(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setDocumentName(file.name);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = expiryDate && new Date(expiryDate) <= new Date();

  if (!isLoaded) return <div className="py-20 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Driving License</h1>
          <p className="text-xs text-slate-500">Required to offer rides as a driver</p>
        </div>
      </div>

      {/* Frontend-only notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-bold mb-0.5">Local Storage Mode</p>
          <p>License information is saved in your browser only. Backend verification integration coming soon.</p>
        </div>
      </div>

      {/* Status */}
      {saved && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-slate-800">Verification Status</span>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">PENDING VERIFICATION</span>
        </div>
      )}

      {/* Error/Success */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800">License Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* License Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              License Number *
            </label>
            <div className="flex gap-2">
              <input
                type={showLicenseNumber ? 'text' : 'password'}
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="Enter license number"
                required
                className="flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 font-mono"
              />
              <button type="button" onClick={() => setShowLicenseNumber(!showLicenseNumber)}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                {showLicenseNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {saved && !showLicenseNumber && (
              <p className="text-xs text-slate-400 mt-1 font-mono">Saved: {getMaskedLicense(licenseNumber)}</p>
            )}
          </div>

          {/* Holder Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              License Holder Name *
            </label>
            <input
              type="text"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
              placeholder="Full name as on license"
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Expiry Date *
            </label>
            <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                min={todayStr}
                required
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {isExpired && (
              <p className="text-xs text-rose-600 mt-1 font-medium">This license has expired and cannot be used.</p>
            )}
          </div>

          {/* Document Upload (frontend-only) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              License Document (Optional)
            </label>
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                {documentName || 'Click to select file (JPG, PNG, PDF)'}
              </span>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            </label>
            <p className="text-xs text-slate-400 mt-1">File stored locally only — not uploaded to server.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isExpired}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? 'Update License Information' : 'Save License Information'}
          </button>
        </form>
      </div>

      {/* Description card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Why add a driving license?</p>
            <ul className="text-xs text-emerald-700 mt-2 space-y-1 list-disc list-inside">
              <li>Required to offer rides on CoRide</li>
              <li>Builds trust with passengers</li>
              <li>Enables driver verification badge</li>
              <li>Helps match you with verified organizations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
