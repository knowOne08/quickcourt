// frontend/src/hooks/useSecurePayment.js
import { useState, useCallback, useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import { securityService } from '../services/securityService';
import { useAuth } from '../context/AuthContext';

export const useSecurePayment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentState, setPaymentState] = useState({
    orderId: null,
    paymentId: null,
    status: 'idle' // idle, creating, verifying, completed, failed
  });

  // Security checks
  const [securityValidation, setSecurityValidation] = useState({
    userAuthenticated: false,
    sessionValid: false,
    tokenValid: false,
    amountValidated: false,
    environmentSecure: false,
    deviceTrusted: false,
    sessionFresh: false
  });

  // Validate security requirements
  useEffect(() => {
    const validateSecurity = async () => {
      try {
        // Use the comprehensive security service
        const authResult = await securityService.validateUserAuthentication();
        const sessionResult = securityService.validateSession();
        const envResult = securityService.validateEnvironment();
        const deviceResult = securityService.validateDeviceTrust();
        const tokenValid = Boolean(securityService.getValidToken());

        const validation = {
          userAuthenticated: authResult.valid,
          sessionValid: sessionResult.valid,
          tokenValid,
          amountValidated: true, // Will be set during payment creation
          environmentSecure: envResult.valid,
          deviceTrusted: deviceResult.valid,
          sessionFresh: sessionResult.valid
        };
        
        setSecurityValidation(validation);

        // Log any failed validations for debugging
        if (!authResult.valid) console.warn('Auth validation failed:', authResult.reason);
        if (!sessionResult.valid) console.warn('Session validation failed:', sessionResult.reason);
        if (!envResult.valid) console.warn('Environment validation failed:', envResult.reason);
        if (!deviceResult.valid) console.warn('Device validation failed:', deviceResult.reason);

      } catch (error) {
        console.error('Security validation error:', error);
        // Set all to false on error
        setSecurityValidation({
          userAuthenticated: false,
          sessionValid: false,
          tokenValid: false,
          amountValidated: false,
          environmentSecure: false,
          deviceTrusted: false,
          sessionFresh: false
        });
      }
    };

    validateSecurity();
    
    // Revalidate every 30 seconds
    const interval = setInterval(validateSecurity, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Check if all security validations pass
  const isSecurityValid = useCallback(() => {
    return Object.values(securityValidation).every(check => check === true);
  }, [securityValidation]);

  // Validate payment amount
  const validateAmount = useCallback((amount) => {
    const numAmount = parseFloat(amount);
    const isValid = numAmount > 0 && numAmount <= 100000 && !isNaN(numAmount);
    
    setSecurityValidation(prev => ({
      ...prev,
      amountValidated: isValid
    }));
    
    return isValid;
  }, []);

  // Helper functions defined first
  const updateLastActivity = useCallback(() => {
    localStorage.setItem('lastActivity', new Date().toISOString());
  }, []);

  const generateDeviceFingerprint = useCallback(() => {
    try {
      // Create a basic device fingerprint (non-invasive)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|');
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return hash.toString();
    } catch (error) {
      console.error('Device fingerprint generation error:', error);
      return 'unknown';
    }
  }, []);

  const addTrustedDevice = useCallback(() => {
    try {
      const deviceFingerprint = generateDeviceFingerprint();
      const trustedDevices = JSON.parse(localStorage.getItem('trustedDevices') || '[]');
      
      if (!trustedDevices.includes(deviceFingerprint)) {
        trustedDevices.push(deviceFingerprint);
        // Keep only last 5 trusted devices
        if (trustedDevices.length > 5) {
          trustedDevices.shift();
        }
        localStorage.setItem('trustedDevices', JSON.stringify(trustedDevices));
      }
    } catch (error) {
      console.error('Add trusted device error:', error);
    }
  }, [generateDeviceFingerprint]);

  const performSecurityAudit = useCallback(async () => {
    try {
      const auditResults = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: null,
        deviceFingerprint: generateDeviceFingerprint(),
        securityChecks: { ...securityValidation }
      };

      console.log('Security audit:', auditResults);
      return auditResults;
    } catch (error) {
      console.error('Security audit error:', error);
      return null;
    }
  }, [securityValidation, generateDeviceFingerprint]);

  // Create payment order with security checks
  const createPaymentOrder = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setPaymentState(prev => ({ ...prev, status: 'creating' }));

      // Update last activity
      updateLastActivity();

      // Comprehensive security validation using security service
      const securityValidationResult = await securityService.validatePaymentSecurity(bookingData.amount);
      
      if (!securityValidationResult.valid) {
        throw new Error(`Security validation failed: ${securityValidationResult.summary}`);
      }

      if (!validateAmount(bookingData.amount)) {
        throw new Error('Invalid payment amount.');
      }

      // Additional security checks
      if (!bookingData.bookingId) {
        throw new Error('Booking information is missing.');
      }

      // Check rate limiting
      const rateLimitResult = securityService.checkRateLimit('payment_create');
      if (!rateLimitResult.allowed) {
        throw new Error(rateLimitResult.reason);
      }

      // Create secure session token for this payment
      const sessionToken = crypto.randomUUID ? crypto.randomUUID() : 
                          Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('paymentSession', sessionToken);

      // Add device fingerprint and audit data
      const paymentData = {
        ...bookingData,
        sessionToken,
        timestamp: Date.now(),
        deviceFingerprint: generateDeviceFingerprint(),
        securityAudit: securityValidationResult
      };

      const response = await paymentService.createPaymentOrder(paymentData);

      if (response.data.status === 'success') {
        const { order } = response.data.data;
        
        setPaymentState({
          orderId: order.id,
          paymentId: null,
          status: 'created'
        });

        // Mark device as trusted after successful order creation
        addTrustedDevice();

        return {
          success: true,
          order,
          sessionToken
        };
      } else {
        throw new Error(response.data.message || 'Failed to create payment order');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment creation failed';
      setError(errorMessage);
      setPaymentState(prev => ({ ...prev, status: 'failed' }));
      
      // Track failed attempts
      const currentFailed = parseInt(sessionStorage.getItem('paymentFailedAttempts') || '0');
      sessionStorage.setItem('paymentFailedAttempts', (currentFailed + 1).toString());
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [validateAmount, updateLastActivity, generateDeviceFingerprint, addTrustedDevice]);

  // Process Razorpay payment with security
  const processRazorpayPayment = useCallback(async (orderData, bookingDetails) => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.Razorpay) {
          throw new Error('Razorpay is not loaded. Please refresh the page.');
        }

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'QuickCourt',
          description: `Booking payment for ${bookingDetails.venueName}`,
          order_id: orderData.order.id,
          
          handler: async (response) => {
            try {
              setPaymentState(prev => ({ ...prev, status: 'verifying' }));
              
              const verificationResult = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingDetails.bookingId,
                sessionToken: orderData.sessionToken
              });

              if (verificationResult.success) {
                setPaymentState({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  status: 'completed'
                });
                
                // Clear payment session
                sessionStorage.removeItem('paymentSession');
                
                resolve(verificationResult);
              } else {
                throw new Error(verificationResult.error);
              }
            } catch (verifyError) {
              setPaymentState(prev => ({ ...prev, status: 'failed' }));
              reject(verifyError);
            }
          },

          prefill: {
            name: user.name || `${user.firstName} ${user.lastName}`,
            email: user.email,
            contact: user.phone || ''
          },

          notes: {
            bookingId: bookingDetails.bookingId,
            userId: user.id,
            venue: bookingDetails.venueName,
            sessionToken: orderData.sessionToken
          },

          theme: {
            color: '#3b82f6'
          },

          modal: {
            ondismiss: () => {
              setPaymentState(prev => ({ ...prev, status: 'cancelled' }));
              setError('Payment cancelled by user');
              reject(new Error('Payment cancelled by user'));
            }
          },

          // Security configurations
          retry: {
            enabled: true,
            max_count: 3
          },
          timeout: 300, // 5 minutes
          remember_customer: false
        };

        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', (response) => {
          setPaymentState(prev => ({ ...prev, status: 'failed' }));
          const errorMessage = response.error?.description || 'Payment failed';
          setError(errorMessage);
          reject(new Error(errorMessage));
        });

        razorpay.open();

      } catch (err) {
        setError(err.message);
        reject(err);
      }
    });
  }, [user]);

  // Verify payment with backend
  const verifyPayment = useCallback(async (paymentData) => {
    try {
      setLoading(true);
      
      const response = await paymentService.verifyPayment(paymentData);
      
      if (response.data.status === 'success') {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment verification failed';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete payment flow
  const processPayment = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Create payment order
      const orderResult = await createPaymentOrder(bookingData);
      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Step 2: Process Razorpay payment
      const paymentResult = await processRazorpayPayment(orderResult, bookingData);
      
      return {
        success: true,
        data: paymentResult.data
      };

    } catch (err) {
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, [createPaymentOrder, processRazorpayPayment]);

  // Reset payment state
  const resetPaymentState = useCallback(() => {
    setPaymentState({
      orderId: null,
      paymentId: null,
      status: 'idle'
    });
    setError(null);
    setLoading(false);
    sessionStorage.removeItem('paymentSession');
  }, []);

  return {
    loading,
    error,
    paymentState,
    securityValidation,
    isSecurityValid: isSecurityValid(),
    processPayment,
    createPaymentOrder,
    verifyPayment,
    resetPaymentState,
    validateAmount
  };
};
