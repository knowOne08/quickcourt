// frontend/src/pages/user/Profile.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { authService } from '../../services/authService';
import './Profile.css';

const Profile = () => {
  const { user, loadUser } = useAuth();
  const { userBookings, loading, loadUserBookings, cancelBooking } = useBooking();

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'edit'

  // Edit form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', oldPassword: '', newPassword: '' });

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const oldPassRef = useRef(null);
  const newPassRef = useRef(null);

  useEffect(() => {
    // keep form in sync when user loads/changes
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validate = () => {
    const next = { fullName: '', email: '', oldPassword: '', newPassword: '' };
    if (!fullName.trim()) next.fullName = 'Full name is required';
    else if (fullName.trim().length < 2) next.fullName = 'Full name must be at least 2 characters';

    if (!email.trim()) next.email = 'Email is required';
    else if (!isEmail(email.trim())) next.email = 'Enter a valid email address';

    if (oldPassword || newPassword) {
      if (!oldPassword) next.oldPassword = 'Old password is required';
      else if (oldPassword.length < 6) next.oldPassword = 'Old password must be at least 6 characters';
      if (!newPassword) next.newPassword = 'New password is required';
      else if (newPassword.length < 8) next.newPassword = 'New password must be at least 8 characters';
      else if (newPassword === oldPassword) next.newPassword = 'New password must be different from old password';
    }

    setErrors(next);
    return !next.fullName && !next.email && !next.oldPassword && !next.newPassword;
  };

  const upcomingAndCancelled = useMemo(() => {
    const now = new Date();
    const isPast = (b) => new Date(b.date) < new Date(now.toDateString());
    const upcoming = [];
    const cancelled = [];
    for (const b of userBookings) {
      if (b.status === 'cancelled') cancelled.push(b);
      else upcoming.push(b);
    }
    return { upcoming, cancelled, isPast };
  }, [userBookings]);

  const handleProfileSave = async () => {
    if (!validate()) {
      // focus first error field
      if (errors.fullName) nameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else if (errors.oldPassword) oldPassRef.current?.focus();
      else if (errors.newPassword) newPassRef.current?.focus();
      return;
    }
    try {
      setSaving(true);
      await authService.updateProfile({ fullName, email });
      if (oldPassword && newPassword) {
        await authService.changePassword(oldPassword, newPassword);
      }
      await loadUser();
      setOldPassword('');
      setNewPassword('');
      alert('Profile updated');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const canCancel = (booking) => {
    // Disable cancel for past dates as per mock
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return booking.status === 'confirmed' && bookingDate >= new Date(today.toDateString());
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar" />
          <div className="profile-name">{user?.fullName || 'User'}</div>
          <div style={{ fontSize: '.9rem' }}>{user?.phone || ''}</div>
          <div className="profile-email">{user?.email}</div>

          <div className="sidebar-nav">
            <button className={`sidebar-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
              Edit Profile
            </button>
            <button className={`sidebar-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
              All Bookings
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="profile-content">
          {activeTab === 'bookings' ? (
            <div>
              <div className="tab-header">
                <button className="tab-chip active">All Bookings</button>
                <button className="tab-chip">Cancelled</button>
              </div>

              {loading ? (
                <div>Loading bookings...</div>
              ) : (
                <div className="booking-list">
                  {upcomingAndCancelled.upcoming.map((b) => (
                    <div className="booking-item" key={b._id}>
                      <div style={{ fontWeight: 700 }}>{b.venue?.name || 'Venue'} ({b.court?.name || b.courtType})</div>
                      <div className="booking-meta">
                        <span>{new Date(b.date).toLocaleDateString()}</span>
                        <span>{b.startTime} - {b.endTime}</span>
                        <span>{b.venue?.city || ''}</span>
                        <span>Status: {b.status}</span>
                      </div>
                      <div className="booking-actions">
                        {canCancel(b) && (
                          <button className="btn danger" onClick={() => cancelBooking(b._id)}>Cancel Booking</button>
                        )}
                        <button className="btn link">Write Review</button>
                      </div>
                    </div>
                  ))}

                  {upcomingAndCancelled.cancelled.length > 0 && (
                    <>
                      <h4 style={{ marginTop: 12 }}>Cancelled</h4>
                      {upcomingAndCancelled.cancelled.map((b) => (
                        <div className="booking-item" key={b._id}>
                          <div style={{ fontWeight: 700 }}>{b.venue?.name || 'Venue'} ({b.court?.name || b.courtType})</div>
                          <div className="booking-meta">
                            <span>{new Date(b.date).toLocaleDateString()}</span>
                            <span>{b.startTime} - {b.endTime}</span>
                            <span>{b.venue?.city || ''}</span>
                            <span>Status: {b.status}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="profile-avatar" style={{ marginBottom: 16 }} />
              <div className="form-grid">
                <div className="form-field">
                  <label className="label">Full Name</label>
                  <input
                    ref={nameRef}
                    className={`input ${errors.fullName ? 'input-error' : ''}`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={!!errors.fullName}
                    placeholder="Your full name"
                  />
                  {errors.fullName && <small className="field-error">{errors.fullName}</small>}
                </div>
                <div className="form-field">
                  <label className="label">Email</label>
                  <input
                    ref={emailRef}
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    placeholder="you@example.com"
                  />
                  {errors.email && <small className="field-error">{errors.email}</small>}
                </div>
                <div className="form-field">
                  <label className="label">Old Password</label>
                  <input
                    ref={oldPassRef}
                    className={`input ${errors.oldPassword ? 'input-error' : ''}`}
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    aria-invalid={!!errors.oldPassword}
                    placeholder="••••••••"
                  />
                  {errors.oldPassword && <small className="field-error">{errors.oldPassword}</small>}
                </div>
                <div className="form-field">
                  <label className="label">New Password</label>
                  <input
                    ref={newPassRef}
                    className={`input ${errors.newPassword ? 'input-error' : ''}`}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-invalid={!!errors.newPassword}
                    placeholder="At least 8 characters"
                  />
                  {errors.newPassword && <small className="field-error">{errors.newPassword}</small>}
                </div>
                <div className="form-actions">
                  <button className="btn" type="button" onClick={() => { setOldPassword(''); setNewPassword(''); }}>Reset</button>
                  <button className="btn primary" type="button" disabled={saving} onClick={handleProfileSave}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
