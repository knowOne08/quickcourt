// frontend/src/pages/auth/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './EmailVerification.css';

const EmailVerification = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      handleVerification(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [searchParams]);

  const handleVerification = async (token) => {
    try {
      const result = await verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Email verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Email verification failed');
    }
  };

  return (
    <div className="email-verification-page">
      <div className="verification-container">
        <div className="verification-content">
          {status === 'verifying' && (
            <>
              <div className="verification-icon verifying">⏳</div>
              <h1>Verifying Email</h1>
              <p>Please wait while we verify your email address...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="verification-icon success">✅</div>
              <h1>Email Verified!</h1>
              <p>{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="verification-icon error">❌</div>
              <h1>Verification Failed</h1>
              <p>{message}</p>
              <button 
                onClick={() => navigate('/login')} 
                className="back-btn"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
