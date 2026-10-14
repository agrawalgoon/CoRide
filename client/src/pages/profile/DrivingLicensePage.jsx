import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Upload,
  Car,
  Loader2,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function DrivingLicensePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [licenseNumber, setLicenseNumber] = useState('');
  const [maskedLicenseNumber, setMaskedLicenseNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [showLicenseNumber, setShowLicenseNumber] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch verified license details from backend database
  useEffect(() => {
    const fetchLicense = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/license');
        const lic = res.data?.license;
        if (lic && lic.licenseNumber) {
          setMaskedLicenseNumber(lic.licenseNumber);
          setLicenseNumber(lic.licenseNumber);
          setHolderName(lic.holderName || '');
          if (lic.expiryDate) {
            const exp = new Date(lic.expiryDate).toISOString().split('T')[0];
            setExpiryDate(exp);
          }
          setSaved(true);
          setIsVerified(Boolean(lic.isVerified));
        }
      } catch (err) {
        console.warn('Could not fetch driving license from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanNumber = licenseNumber.trim();
    if (!cleanNumber || cleanNumber.length < 8) {
      setError('License number must be at least 8 characters (e.g., MH14 20110012345).');
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
      setError('License has expired. Expired licenses cannot be accepted for carpooling.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.put('/users/license', {
        licenseNumber: cleanNumber,
        holderName: holderName.trim(),
        expiryDate: new Date(expiryDate).toISOString()
      });

      const updated = response.data?.license;
      if (updated) {
        setMaskedLicenseNumber(updated.licenseNumber);
        setSaved(true);
        setIsVerified(Boolean(updated.isVerified));
        setSuccess('Driving license verified and securely saved to your CoRide profile.');
        setShowLicenseNumber(false);
      }
    } catch (err) {
      console.error('License update failed:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Failed to save license details. Please check the information and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setDocumentName(file.name);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = expiryDate && new Date(expiryDate) <= new Date();

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading license credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Driving License</h1>
          <p className="text-xs text-slate-500">Required to offer rides as a driver on CoRide</p>
        </div>
      </div>

      {/* Security Assurance Notice */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <p className="font-bold mb-0.5">Secure Credential Storage</p>
          <p>
            Your driving license is encrypted and validated in our backend database. Sensitive digits
            are automatically masked so your credentials remain private.
          </p>
        </div>
      </div>

      {/* Verification Status Banner */}
      {saved && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-sm font-bold text-slate-800 block">Driver Verification</span>
              <span className="text-[11px] text-slate-500 font-mono">
                License: {maskedLicenseNumber || licenseNumber}
              </span>
            </div>
          </div>
          <span
            className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              isVerified
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isVerified ? 'VERIFIED DRIVER' : 'PENDING'}
          </span>
        </div>
      )}

      {/* Error/Success Alerts */}
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800">License Credentials</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* License Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              License Number * (e.g., MH14 20110012345)
            </label>
            <div className="flex gap-2">
              <input
                type={showLicenseNumber ? 'text' : 'password'}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Enter official driving license number"
                required
                className="flex-1 p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowLicenseNumber(!showLicenseNumber)}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
              >
                {showLicenseNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {saved && !showLicenseNumber && (
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Stored as: {maskedLicenseNumber}
              </p>
            )}
          </div>

          {/* Holder Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              License Holder Name *
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Full name as printed on physical license"
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Expiry Date *
            </label>
            <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl focus-within:border-emerald-500">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={todayStr}
                required
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            {isExpired && (
              <p className="text-xs text-rose-600 mt-1 font-medium">
                This license has expired and cannot be accepted.
              </p>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              License Document / Photo (Optional)
            </label>
            <label className="flex items-center gap-2 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                {documentName || 'Select license photo or PDF'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isExpired || submitting}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying &amp; Saving...</span>
              </>
            ) : saved ? (
              'Update License Credentials'
            ) : (
              'Save & Verify License'
            )}
          </button>
        </form>
      </div>

      {/* Information card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Why verify your driving license?</p>
            <ul className="text-xs text-emerald-700 mt-2 space-y-1 list-disc list-inside">
              <li>Required before publishing carpool commute offers</li>
              <li>Ensures safety compliance across campus and corporate networks</li>
              <li>Instills passenger trust with verified driver credentials</li>
              <li>Protected with backend encryption and number masking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
