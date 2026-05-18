// frontend/src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { 
  FiGrid, FiUsers, FiBox, FiCalendar, 
  FiDollarSign, FiBarChart2, FiCheckCircle, FiXCircle,
  FiActivity, FiPieChart, FiShoppingBag, FiSearch, FiRefreshCw,
  FiFilter, FiEye, FiTrash2, FiUserCheck, FiChevronRight, FiSettings, FiMapPin, FiBriefcase, FiShield
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
    adminRevenue: 0,
    ownerRevenue: 0,
    recentBookings: []
  });
  
  const [data, setData] = useState({
    venues: [],
    users: [],
    bookings: [],
    pendingVenues: []
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'venues') fetchVenues();
    if (activeTab === 'bookings') fetchAllBookings();
  }, [activeTab, filter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await adminService.getGlobalStats();
      setStats(statsRes.data.data);
      const pendingRes = await adminService.getAllVenues({ status: 'pending' });
      setData(prev => ({ ...prev, pendingVenues: pendingRes.data.data.venues || [] }));
    } catch (error) {
      toast.error('Telemetry acquisition failure.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      setData(prev => ({ ...prev, users: res.data.data.users || [] }));
    } catch (error) {
      toast.error('User directory synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllVenues(filter !== 'all' ? { status: filter } : {});
      setData(prev => ({ ...prev, venues: res.data.data.venues || [] }));
    } catch (error) {
      toast.error('Venue registry access denied.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllBookings();
      setData(prev => ({ ...prev, bookings: res.data.data.bookings || [] }));
    } catch (error) {
      toast.error('Global ledger sync failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleVenueAction = async (venueId, action) => {
    try {
      setActionLoading(true);
      if (action === 'approve') {
        await adminService.approveVenue(venueId);
        toast.success('Facility authorized.');
      } else if (action === 'reject') {
        const reason = window.prompt('Authorization denial reason:');
        if (reason) {
          await adminService.rejectVenue(venueId, reason);
          toast.success('Facility rejected.');
        } else {
          setActionLoading(false);
          return;
        }
      } else if (action === 'delete') {
        if (window.confirm('Execute terminal deletion protocol?')) {
          await adminService.deleteVenue(venueId);
          toast.success('Facility decommissioned.');
        } else {
          setActionLoading(false);
          return;
        }
      }
      if (activeTab === 'overview') fetchDashboardData();
      if (activeTab === 'venues') fetchVenues();
    } catch (error) {
      toast.error('Operational override failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'OVERVIEW', icon: <FiGrid /> },
    { id: 'users', label: 'USER HUB', icon: <FiUsers /> },
    { id: 'venues', label: 'VENUE MANAGER', icon: <FiBox /> },
    { id: 'bookings', label: 'GLOBAL BOOKINGS', icon: <FiCalendar /> },
    { id: 'finances', label: 'REVENUE', icon: <FiDollarSign /> },
  ];

  const renderOverview = () => (
    <div className="space-y-16 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {[
          { label: 'TOTAL COMMUNITY', value: stats.totalUsers, icon: <FiUsers />, color: 'primary', trend: '+12% ACTIVE' },
          { label: 'TOTAL VENUES', value: stats.totalVenues, icon: <FiBox />, color: 'secondary', trend: '100% INERTIA' },
          { label: 'GLOBAL BOOKINGS', value: stats.totalBookings, icon: <FiShoppingBag />, color: 'emerald', trend: 'LIVE SYNC' },
          { label: 'TOTAL REVENUE', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: <FiPieChart />, color: 'amber', trend: 'PROJECTED' },
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
              <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Global <span className="text-primary">Ledger</span></h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">REAL-TIME DATA STREAM</p>
            </div>
            <button className="bg-gray-900 text-white px-8 py-4 rounded-[24px] text-[9px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-xl italic" onClick={() => setActiveTab('bookings')}>ACCESS FULL INTEL</button>
          </div>
          <div className="space-y-8 relative z-10">
            {(stats.recentBookings || []).slice(0, 5).map(booking => (
              <div key={booking._id} className="flex items-center justify-between p-8 rounded-[40px] bg-gray-50 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-700 group/item">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 rounded-[28px] bg-white shadow-premium flex items-center justify-center font-black text-2xl text-primary border border-gray-100 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-700 italic">
                    {booking.user?.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <strong className="text-xl font-black text-gray-900 block leading-none uppercase italic group-hover/item:text-primary transition-colors">{booking.user?.name}</strong>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                      <FiActivity className="text-primary" /> {booking.venue?.name}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <span className="text-2xl font-black text-primary block leading-none italic tracking-tighter">₹{booking.totalAmount}</span>
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg ${
                    booking.status === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-[60px] p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
          <div className="flex justify-between items-center mb-16 relative z-10">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight uppercase italic leading-none">Queue</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">FACILITY AUTHORIZATION</p>
            </div>
            <span className="bg-primary text-white text-[9px] font-black px-4 py-2 rounded-full shadow-2xl shadow-primary/40 italic uppercase tracking-widest">{(data.pendingVenues || []).length} NEW</span>
          </div>
          <div className="space-y-8 relative z-10">
            {(data.pendingVenues || []).map(venue => (
              <div key={venue._id} className="p-10 rounded-[50px] bg-white/5 border border-white/10 space-y-8 group/card hover:border-primary/30 transition-all duration-700">
                <div className="space-y-3">
                  <strong className="text-2xl font-black text-white block leading-tight uppercase italic group-hover/card:text-primary transition-colors">{venue.name}</strong>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 italic">
                    <FiMapPin size={14} className="text-primary" /> {venue.location?.city}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button className="flex-1 py-5 rounded-[24px] bg-emerald-500 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 italic" onClick={() => handleVenueAction(venue._id, 'approve')}>
                    <FiCheckCircle size={16} /> AUTHORIZE
                  </button>
                  <button className="flex-1 py-5 rounded-[24px] bg-red-500 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 italic" onClick={() => handleVenueAction(venue._id, 'reject')}>
                    <FiXCircle size={16} /> DENY
                  </button>
                </div>
              </div>
            ))}
            {(!data.pendingVenues || data.pendingVenues.length === 0) && (
              <div className="text-center py-24 bg-white/5 rounded-[50px] border border-dashed border-white/10">
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-primary/20 animate-pulse">
                  <FiShield size={40} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic">TELEMETRY CLEAR</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="bg-white rounded-[60px] border border-gray-100 p-16 shadow-premium animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16 relative z-10">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic leading-none">User <span className="text-primary">Hub</span></h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">GLOBAL COMMUNITY COORDINATES</p>
        </div>
        <div className="relative w-full lg:w-[400px]">
          <FiSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <input type="text" placeholder="SEARCH COORDINATES..." className="w-full pl-20 pr-10 py-6 rounded-[30px] bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-black text-gray-900 transition-all text-[10px] uppercase tracking-widest italic shadow-inner" />
        </div>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-gray-50 italic">
              <th className="pb-10 text-left">PROFILE INTEL</th>
              <th className="pb-10 text-left">OPERATIONAL EMAIL</th>
              <th className="pb-10 text-left">SECTOR ROLE</th>
              <th className="pb-10 text-left">DEPLOYMENT</th>
              <th className="pb-10 text-right">OVERRIDE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.users.map(u => (
              <tr key={u._id} className="group hover:bg-gray-50/50 transition-all duration-500">
                <td className="py-10">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <img className="w-16 h-16 rounded-[22px] border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-700" src={`https://ui-avatars.com/api/?name=${u.name}&background=714B67&color=fff&bold=true&italic=true&size=128`} alt="" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <strong className="text-xl font-black text-gray-900 uppercase italic group-hover:text-primary transition-colors duration-500 tracking-tighter">{u.name}</strong>
                  </div>
                </td>
                <td className="py-10 text-sm font-black text-gray-500 italic lowercase tracking-tight">{u.email}</td>
                <td className="py-10">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg italic ${
                    u.role === 'admin' ? 'bg-red-500 text-white' :
                    u.role === 'facility_owner' ? 'bg-primary text-white' :
                    'bg-gray-800 text-white'
                  }`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-10 text-sm font-black text-gray-400 italic uppercase tracking-tighter">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-10">
                  <div className="flex gap-4 justify-end">
                    <button className="w-14 h-14 rounded-[18px] bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 shadow-sm group/btn">
                      <FiEye size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button className="w-14 h-14 rounded-[18px] bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-500 shadow-sm group/btn">
                      <FiTrash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVenuesTab = () => (
    <div className="bg-white rounded-[60px] border border-gray-100 p-16 shadow-premium animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16 relative z-10">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Venue <span className="text-primary">Logistics</span></h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">FACILITY REGISTRY CONTROL</p>
        </div>
        <div className="flex items-center gap-6 bg-gray-900 px-10 py-5 rounded-[30px] border-2 border-transparent shadow-2xl">
          <FiFilter className="text-primary" size={20} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-[0.3em] focus:outline-none text-white cursor-pointer italic">
            <option value="all" className="bg-gray-900">GLOBAL MATRIX</option>
            <option value="pending" className="bg-gray-900">PENDING AUTH</option>
            <option value="approved" className="bg-gray-900">OPERATIONAL</option>
            <option value="rejected" className="bg-gray-900">DENIED SECTOR</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-gray-50 italic">
              <th className="pb-10 text-left">ARENA INTEL</th>
              <th className="pb-10 text-left">COMMANDER</th>
              <th className="pb-10 text-left">SECTOR</th>
              <th className="pb-10 text-left">STATUS</th>
              <th className="pb-10 text-right">OVERRIDE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.venues.map(v => (
              <tr key={v._id} className="group hover:bg-gray-50/50 transition-all duration-500">
                <td className="py-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-700">
                      <img className="w-full h-full object-cover" src={v.images?.[0]?.url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500'} alt="" />
                    </div>
                    <strong className="text-xl font-black text-gray-900 uppercase italic group-hover:text-primary transition-colors duration-500 tracking-tighter leading-tight">{v.name}</strong>
                  </div>
                </td>
                <td className="py-10 text-sm font-black text-gray-500 italic lowercase tracking-tight">{v.owner?.name}</td>
                <td className="py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{v.location?.city}</td>
                <td className="py-10">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg italic ${
                    v.status === 'approved' ? 'bg-emerald-500 text-white' :
                    v.status === 'pending' ? 'bg-amber-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="py-10">
                  <div className="flex gap-4 justify-end">
                    {v.status === 'pending' && (
                      <div className="flex gap-3">
                        <button className="w-14 h-14 rounded-[18px] bg-emerald-500 text-white flex items-center justify-center hover:bg-gray-900 transition-all duration-500 shadow-lg shadow-emerald-500/20 group/btn" onClick={() => handleVenueAction(v._id, 'approve')}>
                          <FiCheckCircle size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button className="w-14 h-14 rounded-[18px] bg-red-500 text-white flex items-center justify-center hover:bg-gray-900 transition-all duration-500 shadow-lg shadow-red-500/20 group/btn" onClick={() => handleVenueAction(v._id, 'reject')}>
                          <FiXCircle size={20} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    )}
                    <button className="w-14 h-14 rounded-[18px] bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 shadow-sm group/btn"><FiEye size={20} /></button>
                    <button className="w-14 h-14 rounded-[18px] bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm group/btn" onClick={() => handleVenueAction(v._id, 'delete')}><FiTrash2 size={20} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBookingsTab = () => (
    <div className="bg-white rounded-[60px] border border-gray-100 p-16 shadow-premium animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
      <div className="mb-16 relative z-10 space-y-2">
        <h3 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic leading-none">Global <span className="text-primary">Ledger</span></h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">HISTORICAL OPERATIONAL DATA</p>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b-2 border-gray-50 italic">
              <th className="pb-10 text-left">ID</th>
              <th className="pb-10 text-left">OPERATIVE</th>
              <th className="pb-10 text-left">ARENA OBJECTIVE</th>
              <th className="pb-10 text-left">TIMESTAMP</th>
              <th className="pb-10 text-left">VALUATION</th>
              <th className="pb-10 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.bookings.map(b => (
              <tr key={b._id} className="group hover:bg-gray-50/50 transition-all duration-500">
                <td className="py-10 font-black text-primary/40 text-[10px] tracking-widest uppercase italic">#{b._id.slice(-6)}</td>
                <td className="py-10 text-xl font-black text-gray-900 uppercase italic group-hover:text-primary transition-colors duration-500 tracking-tighter">{b.user?.name}</td>
                <td className="py-10 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{b.venue?.name}</td>
                <td className="py-10 text-sm font-black text-gray-500 italic uppercase tracking-tighter">{new Date(b.date).toLocaleDateString()}</td>
                <td className="py-10 text-2xl font-black text-primary italic tracking-tighter leading-none">₹{b.totalAmount}</td>
                <td className="py-10 text-right">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg italic ${
                    b.status === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && activeTab === 'overview') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-inter">
        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary w-1/2 animate-progress-fast" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse italic">INITIALIZING HIGH-COMMAND INTERFACE...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-inter">
      {/* Sidebar */}
      <aside className="w-96 bg-gray-900 text-white flex flex-col shadow-2xl z-50 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(113,75,103,0.15),transparent)] pointer-events-none" />
        <div className="p-12 flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[22px] bg-primary flex items-center justify-center text-3xl shadow-2xl shadow-primary/40 italic font-black transition-transform hover:rotate-12">QC</div>
          <div>
            <h2 className="font-black text-2xl tracking-tighter uppercase italic leading-none">ADMIN</h2>
            <p className="text-[9px] text-primary tracking-[0.4em] uppercase font-black mt-2">HIGH COMMAND</p>
          </div>
        </div>
        
        <nav className="flex-1 px-8 py-10 space-y-4 relative z-10">
          {menuItems.map(item => (
            <button 
              key={item.id}
              className={`w-full flex items-center gap-6 px-8 py-6 rounded-[30px] transition-all duration-700 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.05]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className={`text-2xl transition-all duration-700 ${activeTab === item.id ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-12'}`}>{item.icon}</span>
              <span className="font-black text-[11px] uppercase tracking-[0.3em] italic">{item.label}</span>
              {activeTab === item.id && <FiChevronRight className="ml-auto animate-bounce-x" />}
            </button>
          ))}
        </nav>

        <div className="p-12 mt-auto relative z-10 border-t border-white/5">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">MATRIX ONLINE</span>
          </div>
          <button 
            className="w-full py-6 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 flex items-center justify-center gap-4 group italic shadow-xl"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <FiRefreshCw className={`group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} size={18} /> SYNC TELEMETRY
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20 relative bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-12 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
                <FiActivity size={16} /> SYSTEM GOVERNANCE
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">GOVERNANCE <br/><span className="text-primary underline decoration-primary/10">MATRIX</span></h1>
              <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">High-Command operational console for platform governance and sector synchronization.</p>
            </div>
            <div className="flex items-center gap-10 bg-gray-900 p-10 rounded-[50px] shadow-2xl group hover:-translate-y-2 transition-all duration-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 -skew-x-12 translate-x-1/2" />
              <div className="w-20 h-20 rounded-[28px] bg-primary text-white flex items-center justify-center text-3xl group-hover:scale-110 transition-all duration-700 shadow-2xl shadow-primary/30 relative z-10">
                <FiBriefcase />
              </div>
              <div className="relative z-10 space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">PLATFORM YIELD</p>
                <h4 className="text-4xl font-black text-white leading-none italic tracking-tighter">₹{(stats.adminRevenue || 0).toLocaleString()}</h4>
              </div>
            </div>
          </header>

          <div className="relative z-10 pb-32">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'venues' && renderVenuesTab()}
            {activeTab === 'bookings' && renderBookingsTab()}
            {activeTab === 'finances' && (
              <div className="bg-gray-50 rounded-[80px] p-40 shadow-premium border border-gray-100 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
                <div className="w-32 h-32 bg-white text-primary rounded-[40px] flex items-center justify-center text-5xl mx-auto mb-12 shadow-premium group-hover:scale-110 transition-transform duration-700 border border-gray-50">
                  <FiPieChart />
                </div>
                <div className="space-y-6 max-w-2xl mx-auto mb-16">
                  <h3 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-tight">FINANCIAL <br/><span className="text-primary">INTELLIGENCE</span></h3>
                  <p className="text-xl text-gray-400 font-medium italic leading-relaxed">Split-fee analytics, automated payout protocols, and fiscal forecasting models are currently undergoing deployment synchronization.</p>
                </div>
                <button className="bg-primary text-white px-16 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 flex items-center gap-4 mx-auto italic">
                  <FiRefreshCw className="animate-spin-slow" /> RE-SYNC FISCAL DATA
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;