import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { getOrganizations, linkOrganization, requestOtp, verifyOtp } from '../../services/organizationService';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyOrganization() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  
  const [step, setStep] = useState(1); // 1: Select Org & Request, 2: Enter OTP, 3: Success
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await getOrganizations();
        // Extract array if backend wraps in { success: true, data: [...] }
        const orgs = Array.isArray(data) ? data : (data.data || []);
        setOrganizations(orgs);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    fetchOrgs();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!selectedOrgId) {
      setError('Please select an organization');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Link organization using registered email
      await linkOrganization(selectedOrgId, user?.email);
      
      // 2. Request OTP
      await requestOtp();
      
      setStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await requestOtp();
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      await verifyOtp(otpValue);
      await refreshUser();
      setStep(3); // Success step
      setTimeout(() => {
        navigate('/find');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-900">Verification Successful!</h2>
        <p className="text-slate-500 text-center">Your organization has been verified.</p>
        <p className="text-sm text-slate-400 mt-2">Redirecting you to the app...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your organization</h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Verify your college or organization email to access CoRide.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Email</label>
            <div className="flex items-center space-x-3 text-slate-700 font-medium">
              <Mail className="w-5 h-5 text-slate-400" />
              <span>{user?.email || 'Loading...'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Organization</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl appearance-none bg-white border shadow-sm"
              >
                <option value="" disabled>Select your college/company...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSendOtp}
            disabled={isLoading || !selectedOrgId}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-1">Enter the 6-digit code sent to</p>
            <p className="font-semibold text-slate-900">{user?.email}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center space-x-2 sm:space-x-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white shadow-sm"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length < 6}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center text-sm">
            {countdown > 0 ? (
              <p className="text-slate-500">
                Resend OTP in <span className="font-semibold text-slate-700">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
