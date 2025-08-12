// frontend/src/pages/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const next = { email: '', password: '' };
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!emailRe.test(formData.email.trim())) next.email = 'Enter a valid email address';
    if (!formData.password) next.password = 'Password is required';
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect based on user role
        const userRole = result.user?.role || 'user';
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'facility_owner':
            navigate('/owner/dashboard');
            break;
          case 'user':
          default:
            navigate('/');
            break;
        }
      } else {
        const msg = result.message || 'Login failed';
        if (/email/i.test(msg)) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (/password/i.test(msg) || /credentials/i.test(msg)) {
          setErrors((prev) => ({ ...prev, password: msg }));
        } else {
          setError(msg);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <h1>Welcome Back</h1>
          <p>Sign in to your QuickCourt account</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
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
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
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

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
