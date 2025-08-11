// frontend/src/pages/auth/EmailVerification.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import './EmailVerification.css';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();

  const email = searchParams.get('email') || 'user@example.com';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // allow only a single digit

    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');

    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const arr = text.split('');
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = arr[i] || '';
    setOtp(next);
    if (inputRefs.current[Math.min(arr.length, 5)]) {
      inputRefs.current[Math.min(arr.length, 5)].focus();
    }
    e.preventDefault();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    try {
      setError('');
      await authService.resendVerificationEmail(email);
      setResendTimer(30); // start cooldown
      
      // Show success message briefly
      setError('Verification code sent successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend code. Please try again.');
    }
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Use the AuthContext verifyEmail function
      const result = await verifyEmail(code);
      
      if (result.success) {
        // Navigate to dashboard or home page based on user role
        const userRole = result.user?.role || 'user';
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard', { 
              replace: true,
              state: { message: 'Email verified successfully! Welcome to QuickCourt!' }
            });
            break;
          case 'facility_owner':
            navigate('/owner/dashboard', { 
              replace: true,
              state: { message: 'Email verified successfully! Welcome to QuickCourt!' }
            });
            break;
          case 'user':
          default:
            navigate('/', { 
              replace: true,
              state: { message: 'Email verified successfully! Welcome to QuickCourt!' }
            });
            break;
        }
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      if (error.response?.status === 400) {
        setError(error.response.data.error || 'Invalid or expired verification code');
      } else if (error.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="email-verify-page">
      <div className="verify-card">
        <div className="verify-left">
          <img src="https://placehold.co/600x800?text=IMAGE" alt="Verification" />
        </div>
        <div className="verify-right">
          <h3 className="title">
            <span role="img" aria-label="lock">🔒</span> VERIFY YOUR EMAIL
          </h3>
          <p className="subtitle">
            We've sent a code to your email: <span className="email">{email}</span>
          </p>

          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-box"
                value={d}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                ref={(el) => (inputRefs.current[i] = el)}
              />
            ))}
          </div>

          {error && (
            <div className={`error-text ${error.includes('successfully') ? 'success-text' : ''}`}>
              {error}
            </div>
          )}

          <button className="verify-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <div className="assist">
            <small>
              Didn't receive the code?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={handleResend}
                disabled={resendTimer > 0}
              >
                Resend OTP {resendTimer > 0 ? `(${resendTimer}s)` : ''}
              </button>
            </small>
            <small>
              Wrong email?{' '}
              <button type="button" className="link-btn" onClick={() => navigate('/signup')}>
                Edit Email
              </button>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;