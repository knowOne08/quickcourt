// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  token: localStorage.getItem('token')
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'LOAD_USER_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
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
  const tokenTimerRef = useRef(null);

  // Decode JWT payload safely (no external dep)
  const decodeJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const isExpired = (token) => {
    const payload = decodeJwt(token);
    if (!payload?.exp) return false; // if no exp, assume not expired
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  };

  const scheduleExpiryHandler = (token) => {
    clearTimeout(tokenTimerRef.current);
    const payload = decodeJwt(token);
    if (!payload?.exp) return; // nothing to schedule
    const now = Date.now();
    const expMs = payload.exp * 1000;
    const lead = 30 * 1000; // 30s early
    const delay = Math.max(expMs - now - lead, 0);
    tokenTimerRef.current = setTimeout(() => {
      logout();
    }, delay);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isExpired(token)) {
      dispatch({ type: 'SET_LOADING', payload: true });
      loadUser();
      scheduleExpiryHandler(token);
    } else {
      localStorage.removeItem('token');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    // cleanup timer on unmount
    return () => clearTimeout(tokenTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      dispatch({ type: 'LOAD_USER_SUCCESS', payload: response.data.user });
    } catch (error) {
      // Only clear token on 401; for other errors keep session
      const status = error.response?.status;
      if (status === 401) {
        localStorage.removeItem('token');
        dispatch({ type: 'LOAD_USER_FAIL' });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      scheduleExpiryHandler(token);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || 'Login failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authService.signup(userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearTimeout(tokenTimerRef.current);
    dispatch({ type: 'LOGOUT' });
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);
      const { user, token: authToken } = response.data;

      localStorage.setItem('token', authToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: authToken } });
      scheduleExpiryHandler(authToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || 'Email verification failed'
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