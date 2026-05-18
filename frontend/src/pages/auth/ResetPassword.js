// frontend/src/pages/auth/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { FiLock, FiShield, FiArrowRight, FiActivity, FiEye, FiEyeOff } from 'react-icons/fi';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Cryptographic key must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Security key mismatch. Recalibrate.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      if (response.data.success) {
        toast.success('Security key recalibration successful. Re-establish connection.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Recalibration sequence failure. Token may be expired.');
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
            <FiShield />
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white leading-none tracking-tighter uppercase italic">Key<br/><span className="text-primary">Recalibration</span></h1>
            <p className="text-gray-400 font-medium italic max-w-sm mx-auto leading-relaxed text-lg">Finalizing your identity restoration. Securely update your verification key to regain operational access to the matrix.</p>
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-1 bg-primary/30 rounded-full" />)}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12 md:p-24 relative overflow-y-auto">
        <div className="w-full max-w-lg space-y-16 py-12">
          <header className="space-y-4">
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            <h2 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Update <span className="text-primary">Key</span></h2>
            <p className="text-gray-400 font-medium italic text-lg leading-relaxed">Submit your new verification sequence for cryptographic integration.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic">
                  <FiLock className="text-primary" /> New Security Key
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic">
                  <FiShield className="text-primary" /> Confirm Recalibration
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic focus:border-primary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
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
                <>EXECUTE RECALIBRATION <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <footer className="pt-12 border-t border-gray-100 flex items-center justify-between">
            <Link to="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2 italic underline underline-offset-4 decoration-primary/30">
              Abort to Login
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
              <FiActivity /> Awaiting Encryption Update
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

