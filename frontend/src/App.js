// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';


// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import EmailVerification from './pages/auth/EmailVerification';

// User Pages
import Home from './pages/user/Home';
import VenuesList from './pages/user/VenuesList';
import VenueDetails from './pages/user/VenueDetails';
import VenueTest from './pages/user/VenueTest';
import BookingPage from './pages/user/BookingPage';
import Profile from './pages/user/Profile';
import MyBookings from './pages/user/MyBookings';
import BookingSuccessPage from './components/booking/BookingSuccessPage';
import AddReviewPage from './pages/user/AddReviewPage';

// Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import FacilityManagement from './pages/owner/FacilityManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VenueApproval from './pages/admin/VenueApproval';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Styles
import './styles/globals.css';
import './styles/odoo-theme.css';
import 'leaflet/dist/leaflet.css'

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/venues" element={<VenuesList />} />
                <Route path="/venue/:id" element={<VenueDetails />} />
                <Route path="/venue-test" element={<VenueTest />} />
                <Route path="/booking/:bookingId/review" element={<AddReviewPage />} />

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
                <Route path="/booking-success" element={<BookingSuccessPage />} />

                {/* Protected Owner Routes */}
                <Route path="/owner/dashboard" element={
                  <ProtectedRoute requiredRole="facility_owner">
                    <OwnerDashboard />
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
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;