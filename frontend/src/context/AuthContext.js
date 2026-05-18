// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';
import { setAccessToken, clearTokens } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  role: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        role: action.payload.user.role
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        role: null
      };
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        role: action.payload.role
      };
    case 'LOAD_USER_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        role: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAccessToken(token);
      loadUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();

      if (!response?.data?.success || !response?.data?.user) {
        throw new Error('Invalid response format');
      }

      dispatch({ type: 'LOAD_USER_SUCCESS', payload: response.data.user });
      console.log('👤 Active User:', response.data.user.email, '(ID:', response.data.user._id, ')');

      // Ensure security session is initialized for returning users
      if (!sessionStorage.getItem('sessionId')) {
        sessionStorage.setItem('sessionId', Math.random().toString(36).substring(2));
        sessionStorage.setItem('sessionStart', Date.now().toString());
      }
      if (!localStorage.getItem('lastActivity')) {
        localStorage.setItem('lastActivity', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading user:', error);

      // Handle different error types
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          // Token expired or invalid, will be handled by interceptor
          dispatch({ type: 'LOAD_USER_FAIL' });
        } else if (status === 500) {
          console.error('Server error:', error.response.data);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      dispatch({ type: 'LOAD_USER_FAIL' });
    }
  };

  const login = async (email, password, role) => {
    try {
      const response = await authService.login(email, password, role);
      
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Login failed');
      }

      const { user, tokens, token } = response.data;
      const accessToken = tokens?.accessToken || token;
      const refreshToken = tokens?.refreshToken;

      if (accessToken) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        
        sessionStorage.setItem('sessionId', Math.random().toString(36).substring(2));
        sessionStorage.setItem('sessionStart', Date.now().toString());
        localStorage.setItem('lastActivity', new Date().toISOString());
        setAccessToken(accessToken);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } });
      }

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData);
      
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Signup failed');
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const verifyEmail = async (code) => {
    try {
      const response = await authService.verifyEmail(code);
      
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Email verification failed');
      }

      // Handle new token structure from backend
      const { user, tokens, token } = response.data;
      const accessToken = tokens?.accessToken || token;

      if (accessToken) {
        localStorage.setItem('token', accessToken);
        setAccessToken(accessToken);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: accessToken } });
      }

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Email verification failed'
      };
    }
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    login,
    signup,
    logout,
    verifyEmail,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};