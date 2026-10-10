import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, Building, CheckCircle, AlertCircle, Mail, Info } from 'lucide-react';
import { getOrganizations, linkOrganization, requestOrganizationOtp, verifyOrganizationOtp } from '../../services/organizationService';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyOrganization() {
  const { isAuthenticated, loading, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  
  const [step, setStep] = useState(1); // 1: Org & Email, 2: Enter OTP, 3: Success
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // Fetch organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await getOrganizations();
        const orgs = Array.isArray(data) ? data : (data.data || []);
        setOrganizations(orgs);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    if (isAuthenticated) {
      fetchOrgs();
    }
  }, [isAuthenticated]);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Wait for auth to resolve
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-emerald-700">Loading...</div>;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleContinue = async () => {
    if (!selectedOrgId || !orgEmail) {
      setError('Please select an organization and enter your organization email.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setDevOtp('');
    
    try {
      // 1. Link organization
      await linkOrganization(selectedOrgId, orgEmail);
      
      // 2. Automatically request OTP
      const otpResponse = await requestOrganizationOtp();
      
      if (otpResponse.devOtp) {
        setDevOtp(otpResponse.devOtp);
      }
      
      setStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to process request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError('');
    setDevOtp('');
    try {
      const otpResponse = await requestOrganizationOtp();
      if (otpResponse.devOtp) {
        setDevOtp(otpResponse.devOtp);
      }
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to resend OTP.');
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
      await verifyOrganizationOtp(otpValue);
      await refreshUser();
      setStep(3); // Success step
      setTimeout(() => {
        navigate('/find');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || 'Invalid OTP. Please try again.');
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
          Connect your college or organization account to start using CoRide.
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
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Organization</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-xl appearance-none bg-white border shadow-sm"
              >
                <option value="" disabled>Search or select your organization...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} {org.type ? `(${org.type})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedOrgId && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Organization Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  placeholder="e.g. yourname@mgm.edu.in"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={isLoading || !selectedOrgId || !orgEmail}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-semibold text-slate-900 mb-1">Verify your email</h3>
            <p className="text-sm text-slate-600">Enter the 6-digit OTP sent to</p>
            <p className="font-semibold text-slate-900 mt-1">{orgEmail}</p>
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

            {devOtp && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2 text-sm text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold">Development Helper</p>
                  <p>Development OTP: <span className="font-mono font-bold">{devOtp}</span></p>
                </div>
              </div>
            )}

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
