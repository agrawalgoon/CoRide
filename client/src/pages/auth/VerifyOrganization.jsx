import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyOrganizationOtp, requestOrganizationOtp } from '../../services/authService';
import api from '../../services/api';

export default function VerifyOrganization() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch organizations
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizations');
        setOrganizations(response.data);
      } catch (err) {
        console.error('Failed to load organizations', err);
      }
    };
    fetchOrgs();
  }, []);

  const handleSendOtp = async () => {
    if (!selectedOrg) {
      setError('Please select an organization');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await requestOrganizationOtp(selectedOrg);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await verifyOrganizationOtp(otp);
      navigate('/auth/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Verify Organization</h3>
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</div>}
      
      {!otpSent ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Select Organization</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            >
              <option value="">Select an organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSendOtp}
            disabled={isLoading || !selectedOrg}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Enter OTP sent to your email</label>
            <div className="mt-1">
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-center tracking-widest text-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.length < 4}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={handleSendOtp}
              className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
