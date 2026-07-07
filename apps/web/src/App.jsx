
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import HomePage from '@/pages/HomePage.jsx';
import GetStartedPage from '@/pages/GetStartedPage.jsx';
import LearnMorePage from '@/pages/LearnMorePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import PasswordResetPage from '@/pages/PasswordResetPage.jsx';
import VerifyEmailPage from '@/pages/VerifyEmailPage.jsx';
import UserDashboard from '@/pages/UserDashboard.jsx';
import UploadPage from '@/pages/UploadPage.jsx';
import ScanResultsPage from '@/pages/ScanResultsPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import AdminLogsPage from '@/pages/AdminLogsPage.jsx';
import AdminUsersPage from '@/pages/AdminUsersPage.jsx';
import AccountSettingsPage from '@/pages/AccountSettingsPage.jsx';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/learn-more" element={<LearnMorePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify" element={<Navigate to="/verify-email" replace />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/results/:scanId"
            element={
              <ProtectedRoute>
                <ScanResultsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute adminOnly>
                <AdminLogsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
