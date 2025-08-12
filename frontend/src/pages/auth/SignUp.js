// frontend/src/pages/auth/SignUp.js
import React, { useState, useRef } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SignUp.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ 
    fullName: '', 
    email: '', 
    phoneNumber: '',
    password: '', 
    confirmPassword: '', 
    role: '' 
  });

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const maxSizeBytes = 1024 * 1024; // 1 MB
    if (file.size > maxSizeBytes) {
      setError('Profile image must be less than 1 MB');
      e.target.value = null; // reset the file input
      setProfileImage(null);
      return;
    }

    setProfileImage(file);
    setError('');
  };

  // basic client-side validation
  const validate = () => {
    const next = { 
      fullName: '', 
      email: '', 
      phoneNumber: '',
      password: '', 
      confirmPassword: '', 
      role: '' 
    };
    
    if (!formData.fullName.trim()) next.fullName = 'Full name is required';
    else if (formData.fullName.trim().length < 2) next.fullName = 'Full name must be at least 2 characters';

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!emailRe.test(formData.email.trim())) next.email = 'Enter a valid email address';

    // Phone number validation (optional but if provided, should be valid)
    if (formData.phoneNumber.trim()) {
      const phoneRe = /^[0-9]{10}$/;
      if (!phoneRe.test(formData.phoneNumber.trim())) {
        next.phoneNumber = 'Enter a valid 10-digit phone number';
      }
    }

    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 8) next.password = 'Password must be at least 8 characters';

    if (!formData.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match';

    if (!formData.role) next.role = 'Please select an account type';

    setErrors(next);
    return !next.fullName && !next.email && !next.phoneNumber && !next.password && !next.confirmPassword && !next.role;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;
    setLoading(true);

    try {
      const result = await signup(formData);

      if (result.success) {
        navigate('/verify-email');
      } else {
        // map duplicate email or validation to email field if applicable
        const msg = result.message || 'Signup failed';
        if (/email/i.test(msg)) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else {
          setError(msg);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-form">
          <h1>Join QuickCourt</h1>
          <p>Create your account to start booking sports venues</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profileImage">Profile Picture</label>
              <input
                type="file"
                id="profileImage"
                name="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <div className="avatar-wrapper">
                <div className="avatar-circle">
                  {profileImage ? (
                    <img src={URL.createObjectURL(profileImage)} alt="avatar preview" />
                  ) : (
                    <span className="avatar-initials">QC</span>
                  )}
                  <button
                    type="button"
                    className="avatar-edit-btn"
                    title="Edit avatar"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    ✎
                  </button>
                </div>
                {profileImage && (
                  <small className="avatar-filename">{profileImage.name}</small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className={errors.fullName ? 'input-error' : ''}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && <small className="field-error">{errors.fullName}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className={errors.email ? 'input-error' : ''}
                aria-invalid={!!errors.email}
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className={errors.phoneNumber ? 'input-error' : ''}
                aria-invalid={!!errors.phoneNumber}
              />
              {errors.phoneNumber && <small className="field-error">{errors.phoneNumber}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={errors.role ? 'input-error' : ''}
                aria-invalid={!!errors.role}
              >
                <option value="user">Sports Player</option>
                <option value="facility_owner">Facility Owner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  minLength="8"
                  className={errors.password ? 'input-error' : ''}
                  aria-invalid={!!errors.password}
                />
                {errors.password && <small className="field-error">{errors.password}</small>}
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  minLength="8"
                  className={errors.confirmPassword ? 'input-error' : ''}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="signup-btn">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="signup-links">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
