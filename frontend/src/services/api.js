// frontend/src/services/api.js
import axios from 'axios';
import authDebugger from '../utils/authDebug';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store access token in memory
let accessToken = null;

// Helper functions
const setAccessToken = (token) => {
  accessToken = token;
  console.log('🔑 Access token updated');
};

const getAccessToken = () => {
  return accessToken || localStorage.getItem('token');
};

const clearTokens = () => {
  accessToken = null;
  localStorage.removeItem('token');
  console.log('🧹 Tokens cleared');
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Debug API calls in development
    if (process.env.NODE_ENV === 'development') {
      authDebugger.logApiCall(config);
    }
    
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 [API] ${config.method.toUpperCase()} ${config.url} - Token Attached`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [API] ${config.method.toUpperCase()} ${config.url} - NO TOKEN FOUND`);
      }
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Debug successful responses in development
    if (process.env.NODE_ENV === 'development' && response.config.url !== '/auth/refresh') {
      authDebugger.logApiResponse(response);
    }
    return response;
  },
  async (error) => {
    // Debug errors in development
    if (process.env.NODE_ENV === 'development') {
      authDebugger.logApiError(error);
    }
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      
      console.log('🔄 Attempting token refresh...');

      try {
        // Try to refresh the token
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken
        }, {
          withCredentials: true
        });

        if (refreshResponse.data.success) {
          const newAccessToken = refreshResponse.data.accessToken;
          setAccessToken(newAccessToken);
          localStorage.setItem('token', newAccessToken);
          
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        console.log('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
        clearTokens();
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      switch (error.response.status) {
        case 403:
          console.error('🚫 Access forbidden:', error.response.data);
          break;
        case 404:
          console.error('🔍 Resource not found:', error.response.data);
          break;
        case 429:
          console.error('⏸️ Rate limit exceeded:', error.response.data);
          break;
        case 500:
          console.error('🔥 Server Error:', {
            endpoint: error.config.url,
            method: error.config.method,
            data: error.response.data
          });
          break;
        default:
          console.error(`❗ HTTP Error ${error.response.status}:`, error.response.data);
      }
    } else if (error.request) {
      console.error('🌐 Network error:', error.request);
    } else {
      console.error('⚠️ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export helper functions
export { setAccessToken, getAccessToken, clearTokens };
export default api;