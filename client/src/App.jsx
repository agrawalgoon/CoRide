import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOrganization from './pages/auth/VerifyOrganization';

// Find Pages
import FindPoolPage from './pages/find/FindPoolPage';
import RideDetails from './pages/find/RideDetails';

// Offer Pages
import OfferPoolPage from './pages/offer/OfferPoolPage';

// Alerts
import AlertsPage from './pages/alerts/AlertsPage';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage';
import VehiclesPage from './pages/profile/VehiclesPage';
import RideHistoryPage from './pages/profile/RideHistoryPage';

// Live Ride
import LiveRidePage from './pages/live/LiveRidePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-organization" element={<VerifyOrganization />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/find" replace />} />
          <Route path="/find" element={<FindPoolPage />} />
          <Route path="/rides/:rideId" element={<RideDetails />} />
          <Route path="/rides/:rideId/live" element={<LiveRidePage />} />
          
          <Route path="/offer" element={<OfferPoolPage />} />
          
          <Route path="/alerts" element={<AlertsPage />} />
          
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/vehicles" element={<VehiclesPage />} />
          <Route path="/profile/history" element={<RideHistoryPage />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/find" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
