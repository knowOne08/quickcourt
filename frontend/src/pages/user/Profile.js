// frontend/src/pages/user/Profile.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import {
  FiUser, FiMail, FiPhone, FiLock,
  FiHeart, FiSettings, FiLogOut, FiCamera,
  FiChevronRight, FiCreditCard, FiBell, FiShield, FiSliders, FiActivity, FiCalendar
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, loadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    oldPassword: '',
    newPassword: ''
  });

  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    favoriteVenuesCount: 0
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || ''
      }));
      fetchStats();
    }
  }, [user, activeTab]);

  const fetchStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.data?.success) setStats(response.data.stats);
    } catch (error) { console.error('Stats synchronization failure'); }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userService.updateProfile({ name: formData.name, phoneNumber: formData.phoneNumber });

      if (formData.oldPassword && formData.newPassword) {
        await userService.changePassword(formData.oldPassword, formData.newPassword);
        toast.success('Security Key Updated. Re-authentication required.');
        logout(); navigate('/login'); return;
      }

      await loadUser();
      toast.success('Identity synchronized successfully!');
    } catch (error) { toast.error(error.response?.data?.message || 'Synchronization aborted.'); }
    finally { setSaving(false); }
  };

  const menuItems = [
    { id: 'profile', label: 'Identity Matrix', icon: <FiUser /> },
    { id: 'favorites', label: 'Arena Sanctuary', icon: <FiHeart /> },
    { id: 'security', label: 'Security Shield', icon: <FiShield /> },
    { id: 'preferences', label: 'System Config', icon: <FiSliders /> },
    { id: 'notifications', label: 'Signal Feed', icon: <FiBell /> },
  ];

  return (
    <div className="min-h-screen bg-white font-inter overflow-hidden">
      <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col lg:flex-row p-6 md:p-12 gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-96 space-y-12 shrink-0">
          <div className="bg-gray-900 rounded-[50px] p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-[60px] bg-white p-1 border-4 border-primary/20 shadow-premium overflow-hidden group-hover:scale-105 transition-all duration-700">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=714B67&color=fff&size=256&bold=true`}
                    className="w-full h-full object-cover rounded-[55px]"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FiCamera className="text-white text-3xl" />
                  </div>
                </div>
                <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-white hover:text-primary transition-all duration-500">
                  <FiCamera size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{user?.name}</h2>
              <div className="mt-2 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] italic">
                <FiActivity /> {user?.role === 'owner' ? 'COMMANDER PROTOCOL' : 'ELITE ATHLETE PROTOCOL'}
              </div>
            </div>
          </div>

          <nav className="space-y-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-5 px-8 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] italic transition-all duration-500 ${activeTab === item.id ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-800'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
                {activeTab === item.id && <FiChevronRight className="ml-auto" />}
              </button>
            ))}
          </nav>

          <button onClick={logout} className="w-full flex items-center gap-5 px-8 py-6 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] italic text-red-500 hover:bg-red-50 transition-all duration-500">
            <FiLogOut className="text-xl" />
            <span>Terminate Session</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-gray-50 rounded-[60px] p-12 md:p-24 shadow-premium border border-gray-100 overflow-y-auto max-h-[85vh]">
          <div className="animate-fade-in max-w-4xl">
            {activeTab === 'profile' && (
              <div className="space-y-20">
                <header className="space-y-4">
                  <div className="w-16 h-1 bg-primary rounded-full mb-8" />
                  <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">Identity <span className="text-primary">Matrix</span></h1>
                  <p className="text-xl text-gray-400 font-medium italic">Synchronize your core profile across the global network.</p>
                </header>

                <form className="space-y-12" onSubmit={handleSave}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiUser className="text-primary" /> Display Identity</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 shadow-premium focus:border-primary transition-all outline-none italic uppercase" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiMail className="text-primary" /> Core Token (Email)</label>
                      <input type="email" value={formData.email} readOnly className="w-full bg-gray-100 border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-400 cursor-not-allowed outline-none italic lowercase" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiPhone className="text-primary" /> Comms Signal</label>
                      <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 shadow-premium focus:border-primary transition-all outline-none italic uppercase" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiCreditCard className="text-primary" /> Operational Rank</label>
                      <div className="bg-primary/5 text-primary rounded-[24px] p-6 text-sm font-black uppercase tracking-[0.2em] border border-primary/10 italic">
                        {user?.role === 'owner' ? 'COMMANDER RANK' : 'ATHLETE RANK'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-10">
                    <button type="submit" disabled={saving} className="bg-gray-900 text-white px-16 py-7 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.05] active:scale-100 transition-all duration-500 disabled:opacity-50 italic">
                      {saving ? 'SYNCING MATRIX...' : 'SYNCHRONIZE IDENTITY'}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 border-t border-gray-200">
                  {[
                    { val: stats.totalBookings, lab: 'RESERVATIONS', icon: <FiCalendar /> },
                    { val: stats.totalReviews, lab: 'TESTIMONIALS', icon: <FiActivity /> },
                    { val: stats.favoriteVenuesCount, lab: 'SANCTUARIES', icon: <FiHeart /> },
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-10 rounded-[40px] shadow-premium border border-gray-100 text-center space-y-3 group hover:border-primary/20 transition-all duration-500">
                      <div className="text-primary text-2xl mb-4 group-hover:scale-110 transition-transform">{s.icon}</div>
                      <p className="text-5xl font-black text-gray-900 italic tracking-tighter leading-none">{s.val}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] italic">{s.lab}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-20">
                <header className="space-y-4">
                  <div className="w-16 h-1 bg-primary rounded-full mb-8" />
                  <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">Security <span className="text-primary">Shield</span></h1>
                  <p className="text-xl text-gray-400 font-medium italic">Manage authentication parameters and cryptographic keys.</p>
                </header>

                <form className="space-y-12 max-w-lg" onSubmit={handleSave}>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiLock className="text-primary" /> Current Verification Key</label>
                    <input type="password" name="oldPassword" value={formData.oldPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 shadow-premium focus:border-primary transition-all outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2 italic"><FiShield className="text-primary" /> New Master Key</label>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} placeholder="Min. 8 Entropy Units" className="w-full bg-white border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-gray-800 shadow-premium focus:border-primary transition-all outline-none" />
                  </div>

                  <div className="pt-10">
                    <button type="submit" disabled={saving || !formData.newPassword} className="bg-gray-900 text-white px-16 py-7 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-[1.05] active:scale-100 transition-all duration-500 disabled:opacity-50 italic">
                      RECALIBRATE SECURITY
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-20">
                <header className="space-y-4">
                  <div className="w-16 h-1 bg-primary rounded-full mb-8" />
                  <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">Arena <span className="text-primary">Sanctuary</span></h1>
                  <p className="text-xl text-gray-400 font-medium italic">Your curated archive of world-class facilities.</p>
                </header>
                <div className="py-40 text-center bg-white rounded-[60px] border border-gray-100 shadow-premium space-y-10 italic">
                  <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto shadow-inner"><FiHeart size={50} /></div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter italic">Sanctuary Clear</h3>
                    <p className="text-gray-400 text-lg font-medium italic max-w-sm mx-auto leading-relaxed">No high-grade venues archived in your personal matrix.</p>
                  </div>
                  <button onClick={() => navigate('/venues')} className="bg-primary text-white px-12 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-110 transition-all duration-500 italic">DISCOVER COORDINATES</button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-20">
                <header className="space-y-4">
                  <div className="w-16 h-1 bg-primary rounded-full mb-8" />
                  <h1 className="text-5xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">System <span className="text-primary">Config</span></h1>
                  <p className="text-xl text-gray-400 font-medium italic">Adjust interaction parameters with the global matrix.</p>
                </header>
                <div className="space-y-8">
                  {[
                    { title: 'Visual Protocol', desc: 'Toggle high-contrast Dark Mode sequence', value: 'Light Matrix', active: true },
                    { title: 'Global Dialect', desc: 'Communication protocol for signal reception', value: 'English (US)', active: false },
                    { title: 'Data Telemetry', desc: 'Transmission frequency of operational analytics', value: 'Real-time', active: false },
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-12 rounded-[40px] bg-white shadow-premium border border-gray-50 hover:border-primary/20 transition-all duration-500 group cursor-pointer">
                      <div className="space-y-2">
                        <h4 className="font-black text-gray-800 text-lg uppercase tracking-tight italic">{pref.title}</h4>
                        <p className="text-sm text-gray-400 font-medium italic">{pref.desc}</p>
                      </div>
                      <div className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest italic border ${pref.active ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                        {pref.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;


