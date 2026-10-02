import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import FindPoolPage from './pages/FindPoolPage';
import OfferPoolPage from './pages/OfferPoolPage';
import MyRidesPage from './pages/MyRidesPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<FindPoolPage />} />
          <Route path="/find" element={<Navigate to="/" replace />} />
          <Route path="/offer" element={<OfferPoolPage />} />
          <Route path="/my-rides" element={<MyRidesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
