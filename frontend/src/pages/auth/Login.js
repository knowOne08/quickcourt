// frontend/src/pages/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiActivity } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = { email: '', password: '' };
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) next.email = 'Identifier Required';
    else if (!emailRe.test(formData.email.trim())) next.email = 'Invalid Protocol Format';
    if (!formData.password) next.password = 'Verification Key Required';
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, formData.role);
      if (result.success) {
        toast.success('Welcome back!');
        const from = location.state?.from;
        const userRole = result.user?.role || 'user';
        if (from) navigate(from, { replace: true });
        else {
          if (userRole === 'admin') navigate('/admin/dashboard');
          else if (userRole === 'facility_owner') navigate('/owner/dashboard');
          else navigate('/');
        }
      } else {
        const msg = result.message || 'Login Failed';
        toast.error(msg);
        if (/email/i.test(msg)) setErrors(prev => ({ ...prev, email: msg }));
        else setErrors(prev => ({ ...prev, password: msg }));
      }
    } catch (err) { toast.error('An error occurred during login.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-inter bg-white overflow-hidden">
      {/* Visual Brand Side */}
      <div className="hidden md:flex md:w-5/12 bg-gray-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-primary rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 space-y-12 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-widest">
              <FiShield /> SECURE LOGIN
            </div>
            <h1 className="text-6xl font-extrabold text-white leading-tight tracking-tight">
              QuickCourt
            </h1>
            <p className="text-xl text-gray-400 font-medium max-w-sm leading-relaxed">
              Book the best sports facilities and arenas near you.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Global Matrix</p>
              <p className="text-2xl font-black text-white italic tracking-tighter">500+ <span className="text-sm text-gray-600 uppercase">Arenas</span></p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Uptime Profile</p>
              <p className="text-2xl font-black text-white italic tracking-tighter">99.9% <span className="text-sm text-gray-600 uppercase">Operational</span></p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 left-20 border-l-2 border-primary/30 pl-6">
          <p className="text-gray-500 font-bold text-sm leading-relaxed max-w-xs">
            "Your next game starts here."
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-12 md:p-24 relative overflow-y-auto">
        <div className="absolute top-0 right-0 p-12 hidden md:block">
          <Link to="/" className="text-sm font-bold text-gray-400 hover:text-primary transition-all flex items-center gap-2">
            <FiArrowRight className="rotate-180" /> Back to Home
          </Link>
        </div>

        <div className="w-full max-w-lg space-y-16 py-12">
          <header className="space-y-4">
            <div className="w-16 h-1 bg-primary rounded-full mb-8" />
            <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">Login to your <span className="text-primary">Account</span></h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">Enter your details below to continue.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500 px-1 flex items-center gap-2">
                  <FiMail className="text-primary" /> Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@domain.com"
                    className={`w-full bg-white border-2 rounded-[24px] p-6 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic uppercase ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`}
                  />
                  {errors.email && <span className="absolute -bottom-6 left-1 text-xs font-bold text-red-500">{errors.email}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-500 px-1 flex items-center gap-2">
                  <FiShield className="text-primary" /> Login As
                </label>
                <div className="relative group">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 shadow-premium hover:border-primary transition-all outline-none appearance-none cursor-pointer italic uppercase"
                  >
                    <option value="user">User (Player)</option>
                    <option value="facility_owner">Facility Owner</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiArrowRight className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                    <FiLock className="text-primary" /> Password
                  </label>
                  <Link to="/forgot-password" size="sm" className="text-sm font-bold text-primary hover:text-gray-900 transition-all">Forgot Password?</Link>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-white border-2 rounded-[24px] p-6 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                  {errors.password && <span className="absolute -bottom-6 left-1 text-xs font-bold text-red-500">{errors.password}</span>}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gray-900 text-white py-4 rounded-[32px] font-bold text-sm shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <footer className="pt-12 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm font-medium text-gray-500 text-center sm:text-left">
              Don't have an account? <Link to="/signup" className="text-primary font-bold hover:text-gray-900 transition-all ml-1">Sign Up</Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;



