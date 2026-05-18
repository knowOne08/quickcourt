// frontend/src/pages/auth/EmailVerification.js
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'react-hot-toast';
import { FiMail, FiShield, FiArrowRight, FiLock, FiActivity, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail } = useAuth();

  const email = searchParams.get('email') || localStorage.getItem('userEmail') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);

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
      await authService.resendVerificationEmail(email);
      setResendTimer(30);
      toast.success('Protocol Resent. Check your comms.');
    } catch (error) {
      toast.error('Resend protocol failed.');
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
      toast.error('Complete the 6-digit cryptographic sequence.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await verifyEmail(code);

      if (result.success) {
        toast.success('Identity Verified. Operational clearance granted.');
        const userRole = result.user?.role || 'user';
        switch (userRole) {
          case 'admin': navigate('/admin/dashboard', { replace: true }); break;
          case 'facility_owner': navigate('/owner/dashboard', { replace: true }); break;
          case 'user': default: navigate('/', { replace: true }); break;
        }
      } else {
        toast.error(result.message || 'Verification sequence aborted.');
      }
    } catch (error) {
      toast.error('Authorization bridge synchronization failure.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-inter bg-white overflow-hidden">
      {/* Visual Side */}
      <div className="hidden md:flex md:w-5/12 bg-gray-900 relative overflow-hidden items-center justify-center p-20 text-center">
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-primary rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 space-y-12">
          <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[40px] flex items-center justify-center text-primary text-4xl mx-auto shadow-2xl">
            <FiShield />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase italic">Secure<br/><span className="text-primary">Verification</span></h1>
            <p className="text-gray-400 font-medium italic max-w-sm mx-auto leading-relaxed text-lg">Your identity is being verified against the global security matrix. This ensures absolute integrity within the network.</p>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-1 bg-primary/30 rounded-full" />)}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12 md:p-24 relative overflow-y-auto">
        <div className="w-full max-w-lg space-y-16 py-12">
          <header className="space-y-4 text-center md:text-left">
            <div className="w-16 h-1 bg-primary rounded-full mb-8 mx-auto md:mx-0" />
            <h2 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Complete <span className="text-primary">Sync</span></h2>
            <p className="text-gray-400 font-medium italic text-lg leading-relaxed">A 6-digit cryptographic key has been dispatched to your identity token:</p>
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-[20px] border border-gray-100 shadow-sm">
              <FiMail className="text-primary" />
              <span className="text-sm font-black text-gray-800 lowercase italic">{email}</span>
            </div>
          </header>

          <div className="space-y-12" onPaste={handlePaste}>
            <div className="flex justify-between gap-4">
              {otp.map((d, i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-full aspect-square bg-white border-2 border-transparent rounded-[20px] text-center text-2xl font-black text-gray-800 shadow-premium focus:border-primary transition-all outline-none italic"
                  value={d}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  ref={(el) => (inputRefs.current[i] = el)}
                />
              ))}
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-50 italic group"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>VERIFY OPERATIONAL CLEARANCE <FiCheckCircle className="group-hover:scale-125 transition-transform" /></>
              )}
            </button>
          </div>

          <footer className="pt-12 border-t border-gray-100 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Signal Missing?</p>
                <button
                  type="button"
                  className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-gray-900 transition-all group disabled:opacity-30 disabled:pointer-events-none"
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                >
                  <FiRefreshCw className={resendTimer > 0 ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} /> 
                  RESEND OTP {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                </button>
              </div>
              <div className="space-y-1 text-center sm:text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Identity Correction?</p>
                <Link to="/signup" className="text-gray-800 font-black uppercase text-[10px] tracking-widest hover:text-primary transition-all italic underline underline-offset-4 decoration-primary/30">Edit Email Identity</Link>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic pt-4">
              <FiActivity /> Awaiting Cryptographic Sync
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;