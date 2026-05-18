// frontend/src/components/common/AuthStatus.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import authDebugger from '../../utils/authDebug';

const AuthStatus = () => {
  const auth = useAuth();

  const handleDebugInfo = () => {
    authDebugger.logTokenInfo();
    authDebugger.logAuthState(auth);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Auth Debug Panel</h4>
      <div>
        <strong>Status:</strong> {auth.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
      </div>
      <div>
        <strong>Loading:</strong> {auth.loading ? '⏳ Yes' : '✅ No'}
      </div>
      <div>
        <strong>User:</strong> {auth.user?.name || 'None'}
      </div>
      <div>
        <strong>Role:</strong> {auth.user?.role || 'None'}
      </div>
      <div>
        <strong>Token:</strong> {localStorage.getItem('token') ? '✅ Present' : '❌ Missing'}
      </div>
      <button 
        onClick={handleDebugInfo}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        Debug Info
      </button>
    </div>
  );
};

export default AuthStatus;
