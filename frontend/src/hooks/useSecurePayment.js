// frontend/src/hooks/useSecurePayment.js
import { useState, useCallback } from 'react';
import { paymentService } from '../services/paymentService';

export const useSecurePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentState, setPaymentState] = useState({ status: 'idle' });

  // This function now accepts stripe and elements directly from the component
  const processPayment = useCallback(async (bookingData, stripe, elements) => {
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      const errorMessage = "Stripe has not loaded correctly. Please refresh the page.";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }

    try {
      // Step 1: Create Payment Intent on your server
      setPaymentState({ status: 'creating_intent' });
      const intentResponse = await paymentService.createPaymentIntent(bookingData);

      if (intentResponse.data.status !== 'success') {
        throw new Error(intentResponse.data.message || 'Failed to create payment intent.');
      }
      
      const { clientSecret } = intentResponse.data.data.paymentIntent;
      const { bookingId } = intentResponse.data.data;

      // Step 2: Confirm the payment on the client side using the clientSecret
      setPaymentState({ status: 'confirming_payment' });
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // The return_url is where the user will be redirected after payment.
          return_url: `${window.location.origin}/booking-success?bookingId=${bookingId}`,
        },
      });

      // This point will only be reached if there is an immediate error during submission.
      // Otherwise, the user is redirected to the return_url.
      if (confirmError) {
        throw new Error(confirmError.message);
      }
      
      // If the payment doesn't require a redirect, this part might be reached.
      setPaymentState({ status: 'completed' });
      return { success: true };

    } catch (err) {
      setError(err.message);
      setPaymentState({ status: 'failed' });
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    loading,
    error,
    paymentState,
    processPayment,
  };
};
