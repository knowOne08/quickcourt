// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { TeamProvider } from './context/TeamContext';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import EmailVerification from './pages/auth/EmailVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AddVenue from './pages/owner/AddVenue';
import Notifications from './pages/owner/Notifications';

// User Pages
import Home from './pages/user/Home';
import VenuesList from './pages/user/VenuesList';
import VenueDetails from './pages/user/VenueDetails';
import VenueTest from './pages/user/VenueTest';
import BookingPage from './pages/user/BookingPage';
import Profile from './pages/user/Profile';
import MyBookings from './pages/user/MyBookings';
import FindTeams from './pages/user/FindTeams';
import FindPlayers from './pages/user/FindPlayers';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import FacilityManagement from './pages/owner/FacilityManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VenueApproval from './pages/admin/VenueApproval';
import UserManagement from './pages/admin/UserManagement';
import BookingManagement from './pages/admin/BookingManagement';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import { Toaster } from 'react-hot-toast';

// Styles

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <TeamProvider>
          <Router>
            <Toaster position="top-right" />
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/venues" element={<VenuesList />} />
                  <Route path="/venue/:id" element={<VenueDetails />} />
                  <Route path="/venue-test" element={<VenueTest />} />
                  <Route path="/find-teams" element={<FindTeams />} />
                  <Route path="/find-players" element={<FindPlayers />} />

                  {/* Protected User Routes */}
                  <Route path="/book/:venueId" element={
                    <ProtectedRoute>
                      <BookingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-bookings" element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } />

                  {/* Protected Owner Routes */}
                  <Route path="/owner/dashboard" element={
                    <ProtectedRoute requiredRole="facility_owner">
                      <OwnerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/owner/add-venue" element={
                    <ProtectedRoute requiredRole="facility_owner">
                      <AddVenue />
                    </ProtectedRoute>
                  } />
                  <Route path="/owner/facilities" element={
                    <ProtectedRoute requiredRole="facility_owner">
                      <FacilityManagement />
                    </ProtectedRoute>
                  } />

                  {/* Protected Admin Routes */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/venues" element={
                    <ProtectedRoute requiredRole="admin">
                      <VenueApproval />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/bookings" element={
                    <ProtectedRoute requiredRole="admin">
                      <BookingManagement />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </TeamProvider>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;