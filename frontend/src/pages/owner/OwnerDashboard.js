// frontend/src/pages/owner/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ownerService } from '../../services/ownerService';
import {
  FiHome, FiCalendar, FiBox, FiTrendingUp,
  FiSettings, FiBell, FiPlus,
  FiDollarSign, FiClock, FiActivity, FiSearch,
  FiMapPin, FiCheckCircle, FiXCircle, FiEdit, FiTrash2, FiChevronRight, FiGrid, FiArrowUpRight, FiShield, FiBriefcase
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import OwnerAnalytics from '../../components/dashboard/OwnerAnalytics';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBookings: 0, activeCourts: 0, earnings: 0, recentBookings: [] });
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await ownerService.getDashboardStats();
      const dashboardData = response.data?.data || {};
      setStats({
        totalBookings: dashboardData.totalBookings || 0,
        activeCourts: dashboardData.totalCourts || 0,
        earnings: dashboardData.totalRevenue || 0,
        todayRevenue: dashboardData.todayRevenue || 0,
        recentBookings: dashboardData.recentBookings || [],
        monthlyBookings: dashboardData.monthlyBookings || [],
        sportWiseEarnings: dashboardData.sportWiseEarnings || []
      });
    } catch (error) { toast.error('Telemetry failure. Reconnecting...'); }
    finally { setLoading(false); }
  }, []);

  const fetchVenues = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await ownerService.getVenues();
      setVenues(response.data.data.venues || []);
    } catch (error) { console.error('Venues fetch error'); }
    finally { setLoading(false); }
  }, []);

  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await ownerService.getBookings();
      setBookings(response.data.data.bookings || []);
    } catch (error) { console.error('Bookings fetch error'); }
    finally { setLoading(false); }
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await ownerService.updateBookingStatus(id, status);
      toast.success(`Booking protocol: ${status.toUpperCase()}`);
      fetchBookings();
      fetchDashboardData();
    } catch (err) { toast.error('Status synchronization failure.'); }
  };

  const handleDeleteVenue = async (id) => {
    if (window.confirm('PERMANENT DELETION: Are you sure? This action is irreversible.')) {
      try {
        await ownerService.deleteVenue(id);
        toast.success('Facility decommissioned.');
        fetchVenues();
      } catch (err) { toast.error('Decommissioning failed.'); }
    }
  };

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => {
    if (activeTab === 'venues') fetchVenues();
    if (activeTab === 'bookings') fetchBookings();
  }, [activeTab, fetchVenues, fetchBookings]);

  const menuItems = [
    { id: 'overview', label: 'OVERVIEW', icon: <FiHome /> },
    { id: 'bookings', label: 'LOGISTICS', icon: <FiCalendar /> },
    { id: 'venues', label: 'MY ARENAS', icon: <FiBox /> },
    { id: 'analytics', label: 'ANALYTICS', icon: <FiTrendingUp /> },
    { id: 'settings', label: 'GOVERNANCE', icon: <FiSettings /> },
  ];

  if (loading && activeTab === 'overview' && !stats.recentBookings.length) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-inter">
        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary w-1/2 animate-progress-fast" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse italic">INITIALIZING COMMAND CONSOLE...</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-16 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {[
          { label: 'TOTAL YIELD', value: `₹${(stats.earnings || 0).toLocaleString()}`, icon: <FiDollarSign />, color: 'primary', trend: '+12.5% CYCLE' },
          { label: 'TOTAL LOGISTICS', value: stats.totalBookings, icon: <FiCalendar />, color: 'secondary', trend: '+5.2% FLOW' },
          { label: 'ACTIVE SECTORS', value: stats.activeCourts, icon: <FiActivity />, color: 'emerald', trend: 'LIVE SYNC' },
          { label: 'PENDING ALERTS', value: (stats.recentBookings || []).filter(b => b.status === 'pending').length, icon: <FiClock />, color: 'amber', trend: 'ALERT STATE' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-[50px] p-10 border border-gray-100 shadow-premium relative overflow-hidden group hover:-translate-y-3 transition-all duration-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-1/2" />
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl bg-gray-50 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">
                {item.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 bg-gray-900 text-white rounded-full shadow-lg italic">{item.trend}</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-3 italic">{item.value}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white rounded-[60px] border border-gray-100 p-16 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
          <div className="flex justify-between items-center mb-16 relative z-10">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Recent <span className="text-primary">Logistics</span></h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">OPERATIONAL DATA STREAM</p>
            </div>
            <button className="bg-gray-900 text-white px-8 py-4 rounded-[24px] text-[9px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-xl italic" onClick={() => setActiveTab('bookings')}>AUDIT FULL LEDGER</button>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-left border-b-2 border-gray-50 italic">
                  <th className="pb-8">CLIENT OPERATIVE</th>
                  <th className="pb-8">ARENA SECTOR</th>
                  <th className="pb-8 text-center">VALUATION</th>
                  <th className="pb-8 text-right">PROTOCOL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stats.recentBookings || []).slice(0, 5).map(booking => (
                  <tr key={booking._id} className="group/item hover:bg-gray-50/50 transition-all duration-500">
                    <td className="py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center font-black text-lg text-primary border border-gray-100 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-700 italic">
                          {booking.user?.name[0]}
                        </div>
                        <span className="text-lg font-black text-gray-900 uppercase italic tracking-tighter group-hover/item:text-primary transition-colors">{booking.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-8 text-sm font-black text-gray-500 italic uppercase tracking-tighter">{booking.court.name}</td>
                    <td className="py-8 text-center text-xl font-black text-primary italic tracking-tighter leading-none">₹{booking.totalAmount}</td>
                    <td className="py-8 text-right">
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg italic ${
                        booking.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                        booking.status === 'pending' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>{booking.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-primary rounded-[60px] p-16 shadow-2xl shadow-primary/30 text-white relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-full h-full bg-white/5 -skew-x-12 translate-x-1/2 opacity-50" />
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center text-4xl mb-8 shadow-2xl border border-white/10 group-hover:rotate-12 transition-transform duration-700">
              <FiBriefcase />
            </div>
            <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">REVENUE <br/><span className="text-white/40 italic">DISTRIBUTION</span></h3>
            <p className="text-white/60 text-sm font-medium italic">Active performance cycle metrics.</p>
          </div>
          
          <div className="relative z-10 space-y-10 pt-12 border-t border-white/10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">COMMANDER SHARE (90%)</span>
                <span className="text-4xl font-black italic tracking-tighter">₹{((stats.earnings || 0) * 0.9).toLocaleString()}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-white rounded-full w-[90%] shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-8 rounded-[32px] border border-white/10 group-hover:border-white/20 transition-all duration-700">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 italic mb-1">SYSTEM GOVERNANCE (10%)</p>
                <p className="text-2xl font-black italic tracking-tighter text-secondary">₹{((stats.earnings || 0) * 0.1).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <FiArrowUpRight size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVenues = () => (
    <div className="space-y-16 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
            <FiShield size={16} /> ASSET MANAGEMENT
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">MY <span className="text-primary underline decoration-primary/10">ARENAS</span></h2>
          <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Infrastructure control for {venues.length} active combat zones across platform sectors.</p>
        </header>
        <button onClick={() => navigate('/owner/add-venue')} className="bg-gray-900 text-white px-12 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-105 active:scale-100 transition-all flex items-center gap-4 italic">
          <FiPlus size={20} /> INITIALIZE ARENA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {venues.map(venue => (
          <div key={venue._id} className="bg-white rounded-[60px] overflow-hidden border border-gray-100 shadow-premium group hover:-translate-y-4 transition-all duration-1000 relative">
            <div className="relative h-80 overflow-hidden">
              <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={venue.images?.[0]?.url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800'} alt={venue.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-8 left-8">
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl italic ${
                  venue.status === 'approved' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'
                }`}>{venue.status}</span>
              </div>
              <div className="absolute bottom-8 left-8 space-y-2">
                <h3 className="text-3xl font-black text-white leading-none uppercase italic tracking-tighter group-hover:text-primary transition-colors duration-500">{venue.name}</h3>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2 italic"><FiMapPin className="text-primary" /> {venue.location.city}, {venue.location.state}</p>
              </div>
            </div>
            <div className="p-10 bg-white">
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-4">
                  <button onClick={() => navigate(`/owner/edit-venue/${venue._id}`)} className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 shadow-inner group/btn"><FiEdit size={20} className="group-hover/btn:rotate-12" /></button>
                  <button onClick={() => handleDeleteVenue(venue._id)} className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500 shadow-inner group/btn"><FiTrash2 size={20} className="group-hover/btn:scale-110" /></button>
                </div>
                <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 group/slot italic shadow-xl hover:bg-primary transition-all duration-500">
                  SLOTS <FiChevronRight className="group-hover/slot:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {venues.length === 0 && (
          <div className="col-span-full py-56 text-center bg-gray-50 rounded-[80px] border-4 border-dashed border-gray-100 group">
            <div className="w-32 h-32 bg-white text-gray-200 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-premium group-hover:scale-110 transition-transform duration-700">
              <FiBox size={60} />
            </div>
            <h3 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">NO ACTIVE ARENAS</h3>
            <p className="text-xl text-gray-400 mt-4 italic font-medium max-w-lg mx-auto leading-relaxed">Commence your operational legacy by initializing your first combat facility.</p>
            <button onClick={() => navigate('/owner/add-venue')} className="mt-14 bg-primary text-white px-16 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 hover:scale-105 transition-all italic">INITIALIZE NOW</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-16 animate-fade-in">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
            <FiCalendar size={16} /> LOGISTICS GOVERNANCE
          </div>
          <h2 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">LOGISTICS <br/><span className="text-primary underline decoration-primary/10">ARCHIVE</span></h2>
          <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Deployment schedule oversight for all integrated arenas.</p>
        </header>
        <div className="relative w-full xl:w-[450px] group">
          <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-all duration-500" size={24} />
          <input type="text" placeholder="SEARCH CLIENT OR ARENA..." className="w-full pl-20 pr-10 py-7 rounded-[35px] bg-white border-2 border-transparent focus:border-primary/20 outline-none shadow-premium font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 transition-all italic" />
        </div>
      </div>

      <div className="bg-white rounded-[70px] p-16 border border-gray-100 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
        <div className="overflow-x-auto relative z-10">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-left border-b-2 border-gray-50 italic">
                <th className="pb-10">CLIENT IDENTITY</th>
                <th className="pb-10">DEPLOYMENT ZONE</th>
                <th className="pb-10">TIME SIGNATURE</th>
                <th className="pb-10 text-center">VALUATION</th>
                <th className="pb-10">STATUS</th>
                <th className="pb-10 text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(booking => (
                <tr key={booking._id} className="group/row hover:bg-gray-50/50 transition-all duration-500">
                  <td className="py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[22px] bg-white shadow-premium flex items-center justify-center font-black text-xl text-primary border border-gray-100 group-hover/row:bg-primary group-hover/row:text-white transition-all duration-700 italic">
                        {booking.user?.name[0]}
                      </div>
                      <span className="text-xl font-black text-gray-900 uppercase italic tracking-tighter group-hover/row:text-primary transition-colors duration-500">{booking.user?.name}</span>
                    </div>
                  </td>
                  <td className="py-10">
                    <span className="text-lg font-black text-gray-900 block leading-none italic tracking-tighter mb-1">{booking.venue?.name}</span>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">{booking.court?.name}</span>
                  </td>
                  <td className="py-10">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-gray-500 block italic uppercase tracking-tighter">{new Date(booking.date).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] italic">{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </td>
                  <td className="py-10 text-center text-3xl font-black text-primary italic tracking-tighter leading-none">₹{booking.totalAmount}</td>
                  <td className="py-10">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg italic ${
                      booking.status === 'confirmed' ? 'bg-emerald-500 text-white' :
                      booking.status === 'pending' ? 'bg-amber-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>{booking.status}</span>
                  </td>
                  <td className="py-10 text-right">
                    <div className="flex justify-end gap-4">
                      {booking.status === 'pending' && (
                        <>
                          <button onClick={() => handleStatusUpdate(booking._id, 'confirmed')} className="w-14 h-14 rounded-[18px] bg-emerald-500 text-white flex items-center justify-center hover:bg-gray-900 transition-all duration-500 shadow-xl shadow-emerald-500/20 group/btn"><FiCheckCircle size={22} className="group-hover/btn:scale-110" /></button>
                          <button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} className="w-14 h-14 rounded-[18px] bg-red-500 text-white flex items-center justify-center hover:bg-gray-900 transition-all duration-500 shadow-xl shadow-red-500/20 group/btn"><FiXCircle size={22} className="group-hover/btn:scale-110" /></button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <button onClick={() => handleStatusUpdate(booking._id, 'cancelled')} className="px-8 py-4 rounded-[18px] border-2 border-red-50 text-red-400 text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-500 italic shadow-sm">ABORTION</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden font-inter">
      {/* Premium Sidebar */}
      <aside className="w-96 bg-gray-900 flex flex-col relative z-50 overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(113,75,103,0.15),transparent)] pointer-events-none" />
        <div className="p-12 relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-6 mb-24 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center text-white text-3xl shadow-2xl shadow-primary/40 italic font-black transition-transform group-hover:rotate-12 duration-700">
              QC
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-none uppercase italic tracking-tighter">OWNER</h2>
              <p className="text-[9px] text-primary tracking-[0.4em] uppercase font-black mt-2">COMMAND CENTER</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-4">
            {menuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-6 px-10 py-6 rounded-[32px] transition-all duration-700 relative group overflow-hidden ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.05]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`text-2xl transition-all duration-700 ${activeTab === item.id ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-12'}`}>{item.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{item.label}</span>
                {activeTab === item.id && <FiChevronRight className="ml-auto animate-bounce-x" />}
              </button>
            ))}
          </nav>

          <div className="pt-12 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-6 p-6 rounded-[35px] bg-white/5 hover:bg-primary/10 transition-all duration-700 cursor-pointer group border border-transparent hover:border-primary/20" onClick={() => navigate('/profile')}>
              <div className="relative">
                <img className="w-16 h-16 object-cover rounded-[20px] border-2 border-white/10 group-hover:border-primary/50 transition-all duration-700 p-0.5" src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=714B67&color=fff&size=128`} alt="user" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-gray-900 rounded-full group-hover:animate-pulse"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-white truncate uppercase tracking-widest leading-none mb-2">{user?.name}</p>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">FACILITY COMMANDER</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace Area */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20 relative scroll-smooth bg-white">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10 animate-pulse" />
        
        <header className="flex justify-between items-center mb-24 animate-fade-in relative z-10">
          <div className="flex items-center gap-8">
            <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 italic">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              INFRASTRUCTURE LIVE
            </div>
            <div className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em] hidden xl:block italic">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button className="relative w-16 h-16 bg-white border border-gray-100 rounded-[24px] flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all duration-500 shadow-premium group" onClick={() => navigate('/notifications')}>
              <FiBell size={24} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-4 right-4 w-3.5 h-3.5 bg-primary rounded-full border-4 border-white shadow-lg shadow-primary/20 group-hover:scale-125 transition-transform" />
            </button>
            <button onClick={() => navigate('/owner/add-venue')} className="bg-gray-900 text-white px-10 py-6 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-105 active:scale-100 transition-all duration-500 flex items-center gap-4 italic group">
              <FiPlus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> DEPLOY ARENA
            </button>
          </div>
        </header>

        <div className="relative z-10 pb-32">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'venues' && renderVenues()}
          {activeTab === 'bookings' && renderBookingsTab()}
          {activeTab === 'analytics' && <OwnerAnalytics stats={stats} />}
          {['settings'].includes(activeTab) && (
            <div className="bg-gray-50 rounded-[100px] p-56 shadow-premium border border-gray-100 text-center animate-fade-in relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
              <div className="w-40 h-40 bg-white text-primary rounded-[50px] flex items-center justify-center text-6xl mx-auto mb-14 shadow-premium group-hover:scale-110 transition-transform duration-1000 border border-gray-50">
                <FiTrendingUp className="animate-bounce-slow" />
              </div>
              <div className="space-y-6 max-w-2xl mx-auto mb-16">
                <h2 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic leading-tight">{activeTab} <br/><span className="text-primary underline decoration-primary/10">OPTIMIZATION</span></h2>
                <p className="text-xl text-gray-400 font-medium italic leading-relaxed">System engineers are refining the {activeTab} algorithms for maximum operational efficiency and yield maximization.</p>
              </div>
              <button onClick={() => setActiveTab('overview')} className="bg-primary text-white px-12 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic">RETURN TO COMMAND OVERVIEW</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboard;