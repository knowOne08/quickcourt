// frontend/src/components/booking/BookingCard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { FiMapPin, FiClock, FiActivity, FiArrowRight, FiSlash, FiMessageSquare, FiInfo, FiCalendar, FiShield, FiTrendingUp, FiBox } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const BookingCard = ({ booking, onUpdate, variant = 'grid' }) => {
  const navigate = useNavigate();
  const { cancelBooking, loading } = useBooking();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Operational rationale required'); return; }
    try {
      const result = await cancelBooking(booking._id, cancelReason);
      if (result.success) {
        toast.success('Operational reservation aborted');
        setShowCancelModal(false);
        if (onUpdate) onUpdate();
      } else toast.error(result.message);
    } catch (error) { toast.error('Abort signal failed'); }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const isPast = () => {
    const bookingDateTime = new Date(`${new Date(booking.date).toISOString().split('T')[0]}T${booking.startTime}`);
    return new Date() > bookingDateTime;
  };

  const canCancel = () => {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
    const bookingDateTime = new Date(`${new Date(booking.date).toISOString().split('T')[0]}T${booking.startTime}`);
    return (bookingDateTime - new Date()) > (2 * 60 * 60 * 1000);
  };

  const venueImage = (booking.venue?.images?.length > 0) 
    ? (typeof booking.venue.images[0] === 'string' ? booking.venue.images[0] : booking.venue.images[0].url)
    : 'https://images.unsplash.com/photo-1545116832-82e9071f9959?q=80&w=800&auto=format&fit=crop';

  const statusColors = {
    confirmed: 'bg-emerald-500 shadow-emerald-500/20',
    pending: 'bg-amber-500 shadow-amber-500/20',
    cancelled: 'bg-red-500 shadow-red-500/20',
    completed: 'bg-primary shadow-primary/20'
  };

  if (variant === 'list') {
    return (
      <div className={`bg-white rounded-[40px] border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-10 transition-all duration-700 hover:shadow-premium hover:-translate-y-2 relative overflow-hidden group font-inter ${isPast() ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <div className="absolute top-0 right-0 w-32 h-full bg-gray-50 -skew-x-12 translate-x-1/2 opacity-50" />
        <div className="relative w-32 h-32 shrink-0">
          <img src={venueImage} className="w-full h-full rounded-[30px] object-cover shadow-2xl transition-transform duration-700 group-hover:scale-110" alt="" />
          <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${statusColors[booking.status]}`}></div>
        </div>
        <div className="flex-1 space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="font-black text-gray-900 text-2xl uppercase italic tracking-tighter group-hover:text-primary transition-colors">{booking.venue?.name}</h3>
            <span className={`text-[9px] uppercase font-black text-white px-4 py-1.5 rounded-full italic tracking-[0.2em] shadow-xl ${statusColors[booking.status]}`}>{booking.status}</span>
          </div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2"><FiMapPin className="text-primary" size={14} /> {booking.venue?.location?.city || 'REMOTE SECTOR'}</p>
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-50">
            <span className="text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em] italic"><FiCalendar className="text-primary" /> {formatDate(booking.date)}</span>
            <span className="text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em] italic"><FiClock className="text-primary" /> {formatTime(booking.startTime)}</span>
            <span className="text-[10px] font-black text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em] italic"><FiActivity className="text-primary" /> {booking.court?.name}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-6 shrink-0 w-full md:w-auto relative z-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em] italic mb-1">TOTAL TRANSFERRED</span>
            <span className="text-4xl font-black text-gray-900 italic tracking-tighter">₹{booking.totalAmount}</span>
          </div>
          <div className="flex gap-4">
            {canCancel() && <button onClick={() => setShowCancelModal(true)} className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm flex items-center justify-center"><FiSlash size={20} /></button>}
            <button onClick={() => navigate(`/booking/${booking._id}`)} className="bg-primary text-white px-10 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic">LOG DETAILS</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-[50px] border border-gray-100 overflow-hidden group transition-all duration-700 hover:shadow-premium hover:-translate-y-3 relative font-inter ${isPast() ? 'opacity-60 grayscale-[0.3]' : ''}`}>
      <div className="relative h-56 overflow-hidden">
        <img src={venueImage} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-100"></div>
        <div className={`absolute top-6 right-6 text-[9px] font-black uppercase text-white px-5 py-2 rounded-full shadow-2xl italic tracking-[0.2em] ${statusColors[booking.status]}`}>
          {booking.status}
        </div>
        <div className="absolute bottom-6 left-8 space-y-1">
          <h3 className="font-black text-white text-2xl uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors duration-500">{booking.venue?.name}</h3>
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] italic flex items-center gap-2"><FiMapPin className="text-primary" /> {booking.venue?.location?.city || 'REMOTE'}</p>
        </div>
      </div>
      
      <div className="p-10 space-y-8">
        <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-50">
          <div className="space-y-2">
            <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em] italic flex items-center gap-2"><FiCalendar className="text-primary" /> SCHEDULE</p>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{formatDate(booking.date)}</p>
              <p className="text-[10px] text-gray-400 font-black italic">{formatTime(booking.startTime)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em] italic flex items-center gap-2"><FiActivity className="text-primary" /> FACILITY</p>
            <div className="space-y-0.5">
              <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight truncate">{booking.court?.name}</p>
              <p className="text-[10px] text-gray-400 font-black italic uppercase tracking-widest">{booking.court?.sport}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em] italic mb-1">TOTAL TRANSFERRED</p>
            <p className="text-3xl font-black text-gray-900 italic tracking-tighter">₹{booking.totalAmount}</p>
          </div>
          <div className="flex gap-4">
            {canCancel() && (
              <button onClick={() => setShowCancelModal(true)} className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-500 shadow-sm flex items-center justify-center">
                <FiSlash size={20} />
              </button>
            )}
            <button onClick={() => navigate(`/booking/${booking._id}`)} className="w-14 h-14 bg-primary/5 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 shadow-sm flex items-center justify-center group/btn">
              <FiArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-xl animate-fade-in" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-[60px] p-12 md:p-16 max-w-xl w-full shadow-2xl relative border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 -skew-x-12 translate-x-1/2" />
            <div className="relative z-10 space-y-10">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mb-6 shadow-inner">
                <FiSlash size={36} />
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">ABORT <span className="text-red-500">RESERVATION?</span></h3>
                <p className="text-xl text-gray-400 font-medium italic leading-relaxed">System protocols indicate refunds are subject to cancellation cycles. Provide operational rationale below.</p>
              </div>
              
              <textarea 
                value={cancelReason} 
                onChange={e => setCancelReason(e.target.value)}
                className="w-full bg-gray-50 border-2 border-transparent rounded-[32px] p-8 text-sm font-black text-gray-800 focus:bg-white focus:border-red-500/30 transition-all duration-500 min-h-[150px] outline-none italic uppercase placeholder:text-gray-300"
                placeholder="SPECIFY ABORT RATIONALE..."
              />
              
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => setShowCancelModal(false)} className="py-6 text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-gray-900 italic transition-colors">NEGATE ABORT</button>
                <button onClick={handleCancel} disabled={loading || !cancelReason.trim()} className="bg-red-500 text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-500/30 hover:bg-gray-900 transition-all duration-500 italic disabled:opacity-20">
                  CONFIRM ABORT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;


