// frontend/src/utils/authDebug.js
export const authDebugger = {
  logTokenInfo: () => {
    const token = localStorage.getItem('token');
    console.group('🔍 Auth Debug Info');
    
    if (!token) {
      console.log('❌ No token found in localStorage');
      console.groupEnd();
      return;
    }
    
    console.log('✅ Token found in localStorage');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    
    try {
      // Decode JWT payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      console.log('📋 Token Payload:', payload);
      
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = now > expDate;
        
        console.log('⏰ Token Expiry:', expDate.toLocaleString());
        console.log('🕐 Current Time:', now.toLocaleString());
        console.log(isExpired ? '🔴 Token is EXPIRED' : '🟢 Token is VALID');
        
        if (!isExpired) {
          const timeLeft = expDate - now;
          const minutesLeft = Math.floor(timeLeft / (1000 * 60));
          console.log(`⏳ Time remaining: ${minutesLeft} minutes`);
        }
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error);
    }
    
    console.groupEnd();
  },
  
  logApiCall: (config) => {
    console.group('🌐 API Call Debug');
    console.log('🎯 URL:', config.url);
    console.log('🔧 Method:', config.method?.toUpperCase());
    console.log('📊 Headers:', config.headers);
    if (config.data) {
      console.log('📦 Data:', config.data);
    }
    console.groupEnd();
  },
  
  logApiResponse: (response) => {
    console.group('📥 API Response Debug');
    console.log('✅ Status:', response.status);
    console.log('📋 Data:', response.data);
    console.groupEnd();
  },
  
  logApiError: (error) => {
    console.group('❌ API Error Debug');
    
    if (error.response) {
      console.log('🔴 Response Error');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('🔴 Request Error');
      console.log('Request:', error.request);
    } else {
      console.log('🔴 General Error');
      console.log('Message:', error.message);
    }
    
    console.log('Config:', error.config);
    console.groupEnd();
  },
  
  logAuthState: (authState) => {
    console.group('🔐 Auth State Debug');
    console.log('Is Authenticated:', authState.isAuthenticated);
    console.log('Loading:', authState.loading);
    console.log('User:', authState.user);
    console.log('Role:', authState.role);
    console.log('Token (localStorage):', localStorage.getItem('token') ? 'Present' : 'Not found');
    console.groupEnd();
  },
  
  enableDebugMode: () => {
    window.authDebug = authDebugger;
    console.log('🔍 Auth Debug Mode Enabled');
    console.log('Use window.authDebug.logTokenInfo() to check token status');
    console.log('Use window.authDebug.logAuthState(state) to check auth state');
  }
};

// Auto-enable in development
if (process.env.NODE_ENV === 'development') {
  authDebugger.enableDebugMode();
}

export default authDebugger;
