// frontend/src/pages/user/MyBookings.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import { FiCalendar, FiClock, FiXCircle, FiRefreshCw, FiGrid, FiList, FiAlertCircle, FiActivity, FiShield, FiTrendingUp, FiBox } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { userBookings, loadUserBookings, loading } = useBooking();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (isAuthenticated) loadUserBookings();
  }, [isAuthenticated, loadUserBookings]);

  const getBookingDateTime = (booking) => {
    if (!booking || !booking.date) return new Date(0);
    try {
      const dateObj = new Date(booking.date);
      if (isNaN(dateObj.getTime())) return new Date(0);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return new Date(`${year}-${month}-${day}T${booking.startTime || '00:00'}`);
    } catch(e) { return new Date(0); }
  };

  const getBookingEndDateTime = (booking) => {
    if (!booking || !booking.date) return new Date(0);
    try {
      const dateObj = new Date(booking.date);
      if (isNaN(dateObj.getTime())) return new Date(0);
      const year = dateObj.getUTCFullYear();
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getUTCDate()).padStart(2, '0');
      return new Date(`${year}-${month}-${day}T${booking.endTime || '23:59'}`);
    } catch(e) { return new Date(0); }
  };

  const filterBookings = (bookings) => {
    const now = new Date();
    if (activeTab === 'upcoming') {
      return bookings.filter(booking => {
        const bookingEndDateTime = getBookingEndDateTime(booking);
        return bookingEndDateTime > now && booking.status !== 'cancelled' && booking.status !== 'completed';
      });
    } else if (activeTab === 'past') {
      return bookings.filter(booking => {
        const bookingEndDateTime = getBookingEndDateTime(booking);
        return bookingEndDateTime <= now || booking.status === 'completed';
      });
    } else if (activeTab === 'cancelled') {
      return bookings.filter(booking => booking.status === 'cancelled');
    }
    return bookings;
  };

  const filteredBookings = filterBookings(userBookings);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-inter">
        <div className="max-w-xl w-full bg-gray-900 rounded-[60px] p-16 shadow-2xl text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
          <div className="relative z-10 space-y-12">
            <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
              <FiShield size={60} className="text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Access <span className="text-primary">Denied</span></h2>
              <p className="text-xl text-gray-400 font-medium italic leading-relaxed">System requires identity verification to synchronize your operational logs and match history.</p>
            </div>
            <button onClick={() => navigate('/login')} className="w-full bg-primary text-white py-8 rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-white hover:text-primary transition-all duration-500 italic">
              INITIALIZE LOGIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabCounts = {
    upcoming: userBookings.filter(b => getBookingEndDateTime(b) > new Date() && b.status !== 'cancelled' && b.status !== 'completed').length,
    past: userBookings.filter(b => getBookingEndDateTime(b) <= new Date() || b.status === 'completed').length,
    cancelled: userBookings.filter(b => b.status === 'cancelled').length
  };


  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-[1600px] mx-auto py-24 px-6 md:px-16 lg:px-24 space-y-24">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic">
              <FiCalendar /> OPERATIONAL LOGS
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">YOUR <br/><span className="text-primary underline decoration-primary/10">BOOKINGS</span></h1>
            <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Maintain comprehensive tracking of your combat sessions and upcoming arena engagements.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 shrink-0">
            <div className="bg-gray-900 p-2 rounded-[30px] flex shadow-2xl border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-5 rounded-[22px] transition-all duration-500 ${viewMode === 'grid' ? 'bg-primary text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
              >
                <FiGrid size={24} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-5 rounded-[22px] transition-all duration-500 ${viewMode === 'list' ? 'bg-primary text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
              >
                <FiList size={24} />
              </button>
            </div>
            
            <button 
              onClick={loadUserBookings} 
              disabled={loading}
              className="flex items-center gap-4 bg-white px-10 py-6 rounded-[30px] border border-gray-100 font-black text-[10px] uppercase tracking-[0.3em] text-gray-900 shadow-premium hover:bg-gray-900 hover:text-white transition-all duration-500 italic disabled:opacity-20 group"
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} size={18} />
              <span>SYNC MATRIX</span>
            </button>
          </div>
        </header>

        <nav className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'upcoming', label: 'UPCOMING', icon: <FiCalendar /> },
            { id: 'past', label: 'HISTORY', icon: <FiClock /> },
            { id: 'cancelled', label: 'CANCELLED', icon: <FiXCircle /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-12 py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-500 italic ${
                activeTab === tab.id ? 'bg-gray-900 text-white shadow-2xl scale-105' : 'bg-gray-50 text-gray-400 border border-transparent hover:bg-white hover:border-gray-100'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-primary' : ''}>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-[9px] px-3 py-1 rounded-full italic ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-200 text-gray-500'}`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </nav>

        <div className="animate-fade-in min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-50 rounded-[60px] aspect-[4/5] animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-gray-50 rounded-[80px] p-24 text-center border-2 border-dashed border-gray-200 space-y-10">
              <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mx-auto shadow-premium group">
                <FiBox size={60} className="text-primary group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Sector Clear</h3>
                <p className="text-xl text-gray-400 font-medium italic max-w-lg mx-auto leading-relaxed">No {activeTab} sessions identified within the matrix. It's time to initiate a new arena operation.</p>
              </div>
              <button onClick={() => navigate('/venues')} className="bg-primary text-white px-16 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:scale-110 transition-all duration-500 italic">
                EXPLORE ARENAS
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12' : 'space-y-8'}>
              {filteredBookings.map(booking => (
                <div key={booking._id} className="animate-fade-in" style={{ animationDelay: `${filteredBookings.indexOf(booking) * 100}ms` }}>
                  <BookingCard
                    booking={booking}
                    onUpdate={loadUserBookings}
                    variant={viewMode}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;


