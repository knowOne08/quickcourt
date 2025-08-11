// frontend/src/pages/user/Profile.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { userService } from '../../services/userService';
import './Profile.css';

const Profile = () => {
  const { user, loadUser, logout } = useAuth();
  const { userBookings, loading, loadUserBookings, cancelBooking } = useBooking();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'edit' | 'favorites' | 'reviews' | 'preferences'
  const [stats, setStats] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', oldPassword: '', newPassword: '' });

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const oldPassRef = useRef(null);
  const newPassRef = useRef(null);

  useEffect(() => {
    // Keep form in sync when user loads/changes
    setFullName(user?.fullName || user?.name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
  }, [user]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'bookings') {
      loadUserBookings();
    } else if (activeTab === 'overview') {
      loadUserStats();
      loadFavorites();
      loadReviews();
    } else if (activeTab === 'favorites') {
      loadFavorites();
    } else if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'preferences') {
      loadPreferences();
    }
  }, [activeTab, loadUserBookings]);

  const loadUserStats = async () => {
    try {
      setLoadingStats(true);
      const response = await userService.getUserStats();
      if (response.data?.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const response = await userService.getFavoriteVenues();
      if (response.data?.success) {
        setFavorites(response.data.favorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await userService.getUserReviews();
      if (response.data?.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await userService.getUserPreferences();
      if (response.data?.success) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const removeFavorite = async (venueId) => {
    try {
      await userService.removeFavoriteVenue(venueId);
      setFavorites(prev => prev.filter(venue => venue._id !== venueId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

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
      // Focus first error field
      if (errors.fullName) nameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      else if (errors.oldPassword) oldPassRef.current?.focus();
      else if (errors.newPassword) newPassRef.current?.focus();
      return;
    }
    try {
      setSaving(true);
      await userService.updateProfile({ name: fullName, phoneNumber });
      
      let passwordChanged = false;
      if (oldPassword && newPassword) {
        await userService.changePassword(oldPassword, newPassword);
        passwordChanged = true;
      }
      
      if (passwordChanged) {
        // If password was changed, log out the user and redirect to login
        alert('Password changed successfully! Please log in again with your new password.');
        logout();
        navigate('/login');
        return;
      }
      
      await loadUser();
      setOldPassword('');
      setNewPassword('');
      alert('Profile updated successfully!');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const canCancel = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return booking.status === 'confirmed' && bookingDate >= new Date(today.toDateString());
  };

  const formatLocation = (venue) => {
    if (!venue) return '';
    const parts = [venue.address, venue.city].filter(Boolean);
    return parts.join(', ');
  };

  const formatPrice = (venue) => {
    if (venue.pricing?.hourly) {
      return `₹${venue.pricing.hourly}/hour`;
    }
    if (venue.pricePerHour) {
      return `₹${venue.pricePerHour}/hour`;
    }
    return 'Price not available';
  };

  const getVenueImage = (venue) => {
    if (venue.images && venue.images.length > 0) {
      return venue.images[0].url || venue.images[0];
    }
    return 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop';
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats?.totalBookings || 0}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.completedBookings || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.totalSpent || 0}</div>
          <div className="stat-label">Total Spent (₹)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{favorites.length}</div>
          <div className="stat-label">Favorite Venues</div>
        </div>
      </div>

      <div className="recent-section">
        <h3>Recent Bookings</h3>
        <div className="recent-bookings">
          {upcomingAndCancelled.upcoming.slice(0, 3).map((booking) => (
            <div key={booking._id} className="recent-booking-item">
              <div className="booking-venue">{booking.venue?.name || 'Venue'}</div>
              <div className="booking-date">{new Date(booking.date).toLocaleDateString()}</div>
              <div className="booking-status">{booking.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="favorites-section">
        <h3>Favorite Venues</h3>
        <div className="favorites-grid">
          {favorites.slice(0, 4).map((venue) => (
            <div key={venue._id} className="favorite-venue-card">
              <img src={getVenueImage(venue)} alt={venue.name} />
              <div className="venue-info">
                <div className="venue-name">{venue.name}</div>
                <div className="venue-location">{formatLocation(venue)}</div>
                <div className="venue-price">{formatPrice(venue)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div>
      <div className="tab-header">
        <button className="tab-chip active">All Bookings</button>
        <button className="tab-chip">Cancelled</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading bookings...</div>
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
  );

  const renderFavorites = () => (
    <div>
      <h3>Favorite Venues</h3>
      {loadingFavorites ? (
        <div className="loading-state">Loading favorites...</div>
      ) : (
        <div className="favorites-list">
          {favorites.map((venue) => (
            <div key={venue._id} className="favorite-item">
              <img src={getVenueImage(venue)} alt={venue.name} className="venue-thumbnail" />
              <div className="venue-details">
                <div className="venue-name">{venue.name}</div>
                <div className="venue-location">{formatLocation(venue)}</div>
                <div className="venue-price">{formatPrice(venue)}</div>
                <div className="venue-rating">⭐ {venue.rating?.average || 'N/A'}</div>
              </div>
              <div className="venue-actions">
                <button className="btn primary">View Details</button>
                <button className="btn danger" onClick={() => removeFavorite(venue._id)}>Remove</button>
              </div>
            </div>
          ))}
          {favorites.length === 0 && (
            <div className="empty-state">
              <p>No favorite venues yet.</p>
              <p>Start exploring venues and add them to your favorites!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div>
      <h3>My Reviews</h3>
      {loadingReviews ? (
        <div className="loading-state">Loading reviews...</div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="review-venue">{review.venue?.name}</div>
                <div className="review-rating">{'⭐'.repeat(review.rating)}</div>
              </div>
              <div className="review-comment">{review.comment}</div>
              <div className="review-date">{new Date(review.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="empty-state">
              <p>No reviews yet.</p>
              <p>Write reviews for venues you've visited!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPreferences = () => (
    <div>
      <h3>Preferences</h3>
      {preferences ? (
        <div className="preferences-form">
          <div className="preference-group">
            <h4>Notifications</h4>
            <label className="checkbox-label">
              <input type="checkbox" checked={preferences.notifications?.email} />
              Email notifications
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={preferences.notifications?.sms} />
              SMS notifications
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={preferences.notifications?.push} />
              Push notifications
            </label>
          </div>
          
          <div className="preference-group">
            <h4>Privacy</h4>
            <label className="checkbox-label">
              <input type="checkbox" checked={preferences.privacy?.showProfile} />
              Show my profile to others
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={preferences.privacy?.showBookingHistory} />
              Show my booking history
            </label>
          </div>
        </div>
      ) : (
        <div className="loading-state">Loading preferences...</div>
      )}
    </div>
  );

  const renderEditProfile = () => (
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
          <label className="label">Phone Number</label>
          <input
            ref={phoneRef}
            className="input"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Your phone number"
          />
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
  );

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar" />
          <div className="profile-name">{user?.fullName || user?.name || 'User'}</div>
          <div style={{ fontSize: '.9rem' }}>{user?.phoneNumber || ''}</div>
          <div className="profile-email">{user?.email}</div>

          <div className="sidebar-nav">
            <button className={`sidebar-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            <button className={`sidebar-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
              My Bookings
            </button>
            <button className={`sidebar-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              Favorites
            </button>
            <button className={`sidebar-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
              My Reviews
            </button>
            <button className={`sidebar-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
              Edit Profile
            </button>
            <button className={`sidebar-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
              Preferences
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="profile-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'favorites' && renderFavorites()}
          {activeTab === 'reviews' && renderReviews()}
          {activeTab === 'edit' && renderEditProfile()}
          {activeTab === 'preferences' && renderPreferences()}
        </section>
      </div>
    </div>
  );
};

export default Profile;
