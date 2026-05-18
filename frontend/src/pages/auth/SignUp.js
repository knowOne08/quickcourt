// frontend/src/pages/auth/SignUp.js
import React, { useState, useRef } from 'react';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock, FiCamera, FiArrowRight, FiShield, FiActivity } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const SignUp = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', role: '' });

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { toast.error('Avatar must be < 1MB'); return; }
    setProfileImage(file);
  };

  const validate = () => {
    const next = { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', role: '' };
    if (!formData.fullName.trim()) next.fullName = 'Full Name Required';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) next.email = 'Identifier Required';
    else if (!emailRe.test(formData.email.trim())) next.email = 'Invalid Protocol Format';
    if (formData.phoneNumber.trim() && !/^[0-9]{10}$/.test(formData.phoneNumber.trim())) next.phoneNumber = 'Invalid 10-digit Comms Bridge';
    if (!formData.password) next.password = 'Verification Key Required';
    else if (formData.password.length < 8) next.password = 'Min. 8 Cryptic Characters';
    if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Security Key Mismatch';
    setErrors(next);
    return !Object.values(next).some(v => v !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const signupData = new FormData();
      Object.keys(formData).forEach(key => signupData.append(key, formData[key]));
      if (profileImage) signupData.append('profileImage', profileImage);

      const result = await signup(signupData);
      if (result.success) {
        toast.success('Identity Created. Verification dispatched!');
        localStorage.setItem('userEmail', formData.email);
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        const msg = result.message || 'Creation Protocol Failed';
        toast.error(msg);
        if (/email/i.test(msg)) setErrors(prev => ({ ...prev, email: msg }));
      }
    } catch (err) { toast.error('Synchronization bridge synchronization failure.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-inter bg-white overflow-hidden">
      {/* Visual Brand Side */}
      <div className="hidden md:flex md:w-4/12 bg-gray-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <div className="absolute top-[-20%] right-[-10%] w-[100%] h-[100%] bg-primary rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] bg-secondary rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 space-y-12 animate-fade-in">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-primary uppercase tracking-[0.4em]">
              <FiShield /> PROTOCOL INITIATION
            </div>
            <h1 className="text-7xl font-black text-white leading-none tracking-tighter uppercase italic">
              JOIN THE<br/><span className="text-primary">ELITE</span>
            </h1>
            <p className="text-lg text-gray-400 font-medium italic max-w-sm leading-relaxed">
              Forge your professional identity within the global arena matrix. Secure, high-performance, and scalable.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FiActivity />
              </div>
              <div>
                <p className="text-white font-black italic uppercase text-sm">Real-time Analytics</p>
                <p className="text-gray-500 text-xs italic">Operational transparency at scale.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                <FiShield />
              </div>
              <div>
                <p className="text-white font-black italic uppercase text-sm">Military-Grade Security</p>
                <p className="text-gray-500 text-xs italic">End-to-end cryptographic protection.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 left-20 border-l-2 border-primary/30 pl-6 hidden lg:block">
          <p className="text-gray-500 font-bold italic text-sm leading-relaxed max-w-xs">
            "Identity is the cornerstone of the operational sports ecosystem."
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 md:p-20 relative overflow-y-auto">
        <div className="absolute top-0 right-0 p-12 hidden md:block">
          <Link to="/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-all flex items-center gap-2 italic">
            Establish Connection <FiArrowRight />
          </Link>
        </div>

        <div className="w-full max-w-3xl space-y-12 py-10">
          <header className="space-y-4">
            <div className="w-16 h-1 bg-primary rounded-full mb-6" />
            <h2 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Initialize <span className="text-primary">Identity</span></h2>
            <p className="text-gray-400 font-medium italic text-lg leading-relaxed">Construct your operational profile and synchronize with the global network.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[40px] bg-white shadow-premium border-4 border-white overflow-hidden group-hover:scale-105 transition-all duration-500 relative">
                  {profileImage ? (
                    <img src={URL.createObjectURL(profileImage)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-black text-4xl italic">QC</div>
                  )}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FiCamera className="text-white text-2xl" />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-xl hover:bg-gray-900 transition-all z-10"
                >
                  <FiCamera size={18} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Identity Visualization (Avatar)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiUser className="text-primary" /> Full Name</label>
                <div className="relative group">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Commander John Doe" className={`w-full bg-white border-2 rounded-[24px] p-5 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic uppercase ${errors.fullName ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`} />
                  {errors.fullName && <span className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest italic">{errors.fullName}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiMail className="text-primary" /> Identity Token (Email)</label>
                <div className="relative group">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@network.com" className={`w-full bg-white border-2 rounded-[24px] p-5 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic uppercase ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`} />
                  {errors.email && <span className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest italic">{errors.email}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiPhone className="text-primary" /> Comms Bridge (Phone)</label>
                <div className="relative group">
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="10-digit signal" className={`w-full bg-white border-2 rounded-[24px] p-5 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 italic uppercase ${errors.phoneNumber ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`} />
                  {errors.phoneNumber && <span className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest italic">{errors.phoneNumber}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiShield className="text-primary" /> Sector Protocol (Role)</label>
                <div className="relative group">
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-white border-2 border-transparent rounded-[24px] p-5 text-sm font-black text-gray-800 shadow-premium hover:border-primary transition-all outline-none appearance-none cursor-pointer italic uppercase">
                    <option value="user">Civilian (Athlete)</option>
                    <option value="facility_owner">Commander (Owner)</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FiArrowRight className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiLock className="text-primary" /> Verification Key</label>
                <div className="relative group">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`w-full bg-white border-2 rounded-[24px] p-5 pr-14 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors">{showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
                  {errors.password && <span className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest italic">{errors.password}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiLock className="text-primary" /> Confirm Key</label>
                <div className="relative group">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`w-full bg-white border-2 rounded-[24px] p-5 pr-14 text-sm font-black text-gray-800 transition-all outline-none shadow-premium placeholder:text-gray-300 ${errors.confirmPassword ? 'border-red-500 bg-red-50/50' : 'border-transparent group-hover:border-primary/20 focus:border-primary'}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors">{showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}</button>
                  {errors.confirmPassword && <span className="absolute -bottom-6 left-1 text-[9px] font-black text-red-500 uppercase tracking-widest italic">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-50 italic group">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>FORGE OPERATIONAL IDENTITY <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <footer className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center sm:text-left">
              Existing Identity? <Link to="/login" className="text-primary hover:text-gray-900 transition-all ml-2 underline underline-offset-4 decoration-primary/30">Establish Connection</Link>
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
              <FiActivity /> Matrix Initialization Ready
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SignUp;



