// frontend/src/components/booking/PaymentSection.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurePayment } from '../../hooks/useSecurePayment';
import { toast } from 'react-hot-toast';
import { FiShield, FiCreditCard, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiLock, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';

const PaymentSection = ({ 
  totalAmount, 
  onContinue, 
  disabled = false,
  bookingDetails = null 
}) => {
  const { user } = useAuth();
  const {
    loading: paymentLoading,
    error: paymentError,
    paymentState,
    securityValidation,
    isSecurityValid,
    processPayment,
    resetPaymentState
  } = useSecurePayment();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (bookingDetails) {
      sessionStorage.setItem('bookingSession', JSON.stringify({
        bookingId: bookingDetails.bookingId,
        amount: totalAmount,
        timestamp: Date.now()
      }));
    }
    return () => {
      if (paymentState.status !== 'completed') sessionStorage.removeItem('bookingSession');
    };
  }, [bookingDetails, totalAmount, paymentState.status]);

  const handleCreateBooking = async () => {
    if (!bookingDetails) { toast.error('Booking information is missing.'); return; }
    if (!termsAccepted) { toast.error('Please accept the Terms & Conditions.'); return; }
    if (!isSecurityValid && selectedPaymentMethod !== 'cash') { toast.error('Security validation failed.'); return; }

    try {
      if (selectedPaymentMethod === 'cash') {
        const result = await onContinue({ ...bookingDetails, paymentMethod: 'cash', totalAmount });
        if (result?.success) {
          setShowConfirmation(true);
          sessionStorage.removeItem('bookingSession');
          setTimeout(() => window.location.href = '/my-bookings', 2000);
        } else toast.error('Booking failed.');
        return;
      }

      const tempBookingId = bookingDetails.bookingId || `booking_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const result = await processPayment({ ...bookingDetails, bookingId: tempBookingId, amount: totalAmount, currency: 'INR', paymentMethod: 'online' });
      
      if (result.success) {
        setShowConfirmation(true);
        sessionStorage.removeItem('bookingSession');
        setTimeout(() => window.location.href = '/my-bookings', 3000);
      } else toast.error('Payment failed.');
    } catch (error) { toast.error('Error: ' + error.message); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  if (showConfirmation) return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-100 shadow-lg shadow-green-100">
        <FiCheckCircle size={40} />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
      <p className="text-gray-500 max-w-xs mx-auto mb-8">Your court has been reserved. Redirecting you to your schedule...</p>
      <div className="w-12 h-1 border-t-2 border-green-500 animate-pulse rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Reservation Details</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <FiMapPin />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Venue & Facility</p>
                  <p className="text-sm font-bold text-gray-800">{bookingDetails?.venueName} • {bookingDetails?.courtName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-bold text-gray-800">{formatDate(bookingDetails?.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <FiClock />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Schedule</p>
                  <p className="text-sm font-bold text-gray-800">{formatTime(bookingDetails?.startTime)} - {formatTime(bookingDetails?.endTime)} ({bookingDetails?.duration} mins)</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total to Pay</p>
                <p className="text-2xl font-black text-gray-800">{formatCurrency(totalAmount)}</p>
              </div>
              <p className="text-[10px] text-gray-400 italic">Inc. all taxes</p>
            </div>
          </div>

          {!isSecurityValid && selectedPaymentMethod !== 'cash' && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
              <FiShield className="text-amber-500 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-bold text-amber-800 mb-1">Security Validation</p>
                <p className="text-xs text-amber-600 leading-relaxed italic">Validating encrypted handshake with facility servers...</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Payment Method</label>
            <div className="space-y-3">
              {[
                { id: 'razorpay', name: 'Digital Payment', desc: 'UPI, Cards, Net Banking', icon: <FiCreditCard /> },
                { id: 'cash', name: 'Pay at Venue', desc: 'Secure cash payment on arrival', icon: <FiDollarSign /> },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${
                    selectedPaymentMethod === method.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-50 bg-gray-50 hover:border-primary/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedPaymentMethod === method.id ? 'bg-primary text-white' : 'bg-white text-gray-400'
                  }`}>
                    {method.icon}
                  </div>
                  <div>
                    <h5 className={`font-bold text-sm ${selectedPaymentMethod === method.id ? 'text-primary' : 'text-gray-800'}`}>{method.name}</h5>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                  {selectedPaymentMethod === method.id && <FiCheckCircle className="ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                I agree to the <span className="font-bold text-primary">Terms of Service</span> and <span className="font-bold text-primary">Cancellation Policy</span>. I understand that free cancellation is available up to 2 hours before the slot.
              </span>
            </label>

            <button
              onClick={handleCreateBooking}
              disabled={disabled || paymentLoading || !termsAccepted || (!isSecurityValid && selectedPaymentMethod !== 'cash')}
              className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                termsAccepted ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {paymentLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{paymentState.status}...</span>
                </div>
              ) : (
                <>
                  <FiLock />
                  <span>{selectedPaymentMethod === 'cash' ? 'Confirm Reservation' : `Pay ${formatCurrency(totalAmount)}`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-gray-100 flex flex-wrap justify-center gap-8 grayscale opacity-50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><FiShield /> SSL Encrypted</div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><FiLock /> PCI Compliant</div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><FiCheckCircle /> Secure Gateway</div>
      </div>
    </div>
  );
};

export default PaymentSection;

