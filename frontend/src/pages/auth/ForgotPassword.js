// frontend/src/pages/auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { FiMail, FiShield, FiArrowRight, FiLock, FiActivity, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Identity Token Required for recovery protocol.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.data.success) {
        setSubmitted(true);
        toast.success('Recovery signal dispatched successfully.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Recovery protocol failure.');
    } finally {
      setLoading(false);
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
            <FiLock />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase italic">Security<br/><span className="text-primary">Recovery</span></h1>
            <p className="text-gray-400 font-medium italic max-w-sm mx-auto leading-relaxed text-lg">Initiating cryptographic identity recovery. Your verification key is being recalibrated within the global matrix.</p>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-1 bg-primary/30 rounded-full" />)}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12 md:p-24 relative overflow-y-auto">
        <div className="absolute top-0 left-0 p-12 hidden md:block">
          <Link to="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2 italic">
            <FiArrowRight className="rotate-180" /> Back to Terminal
          </Link>
        </div>

        <div className="w-full max-w-lg space-y-16 py-12">
          {submitted ? (
            <div className="space-y-12 animate-fade-in text-center md:text-left">
              <header className="space-y-4">
                <div className="w-16 h-1 bg-primary rounded-full mb-8 mx-auto md:mx-0" />
                <h2 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Signal <span className="text-primary">Dispatched</span></h2>
                <p className="text-gray-400 font-medium italic text-lg leading-relaxed">A recovery protocol has been transmitted to your identity token:</p>
                <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-[20px] border border-gray-100 shadow-sm">
                  <FiMail className="text-primary" />
                  <span className="text-sm font-black text-gray-800 lowercase italic">{email}</span>
                </div>
              </header>

              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-premium space-y-4 italic">
                <p className="text-gray-400 font-medium leading-relaxed">Access your communication hub to execute the recalibration link. This token will expire in <span className="text-primary font-black">600 seconds</span>.</p>
              </div>

              <div className="flex flex-col gap-6 pt-4">
                <Link to="/login" className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 italic group">
                  ESTABLISH CONNECTION <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all italic underline underline-offset-4 decoration-primary/30"
                >
                  Request New Signal?
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-12 animate-fade-in">
              <header className="space-y-4">
                <div className="w-16 h-1 bg-primary rounded-full mb-8" />
                <h2 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Recover <span className="text-primary">Key</span></h2>
                <p className="text-gray-400 font-medium italic text-lg leading-relaxed">Submit your identity token to initiate the cryptographic recalibration sequence.</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic">
                    <FiMail className="text-primary" /> Identity Token (Email)
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      placeholder="name@network.com"
                      className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic uppercase focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-50 italic group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>TRANSMIT RECOVERY SIGNAL <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </form>

              <footer className="pt-12 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  Recollected Key? <Link to="/login" className="text-primary hover:text-gray-900 transition-all ml-2 underline underline-offset-4 decoration-primary/30">Establish Connection</Link>
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
                  <FiActivity /> System Ready
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

