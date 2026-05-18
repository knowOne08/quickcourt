// frontend/src/pages/admin/BookingManagement.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiFilter, FiActivity, FiSearch, FiClock, FiDollarSign, FiBox } from 'react-icons/fi';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', sport: '' });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllBookings(filters);
      setBookings(response.data.data.bookings);
    } catch (error) {
      toast.error('Global ledger synchronization failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-12 lg:p-20 font-inter">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              <FiActivity /> Fiscal Governance
            </div>
            <h1 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Global <span className="text-primary">Transactions</span></h1>
            <p className="text-gray-400 font-medium italic">Monitoring system-wide booking activity and financial telemetry.</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[24px] shadow-premium border border-gray-100 group">
            <FiFilter className="text-primary" />
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-gray-600 cursor-pointer"
            >
              <option value="">All Status Cycles</option>
              <option value="confirmed">Confirmed (Active)</option>
              <option value="pending">Pending Sync</option>
              <option value="cancelled">Cancelled (Aborted)</option>
            </select>
          </div>
        </header>

        <div className="bg-white rounded-[60px] border border-gray-100 p-12 lg:p-16 shadow-premium relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center relative z-10">
              <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary w-1/2 animate-[loading_1s_ease-in-out_infinite]" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Synchronizing Global Ledger...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-40 text-center relative z-10">
              <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8">
                <FiCalendar />
              </div>
              <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">No Transactions Identified</h3>
              <p className="text-gray-400 font-medium italic text-lg">No booking records matching your parameters were found in the global matrix.</p>
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-10 text-left italic">Civilian Commander</th>
                    <th className="pb-10 text-left italic">Arena Objective</th>
                    <th className="pb-10 text-left italic">Core Discipline</th>
                    <th className="pb-10 text-left italic">Temporal Stamp</th>
                    <th className="pb-10 text-left italic">Valuation</th>
                    <th className="pb-10 text-right italic">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map(booking => (
                    <tr key={booking._id} className="group hover:bg-gray-50/50 transition-all duration-300">
                      <td className="py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-primary font-black italic">
                            {booking.user?.name?.charAt(0) || '?'}
                          </div>
                          <strong className="text-lg font-black text-gray-800 uppercase italic group-hover:text-primary transition-colors">{booking.user?.name || 'N/A'}</strong>
                        </div>
                      </td>
                      <td className="py-8">
                        <div>
                          <p className="text-sm font-black text-gray-700 uppercase italic leading-none mb-1">{booking.venue?.name}</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest italic">{booking.court?.name}</p>
                        </div>
                      </td>
                      <td className="py-8">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{booking.court?.sport}</span>
                      </td>
                      <td className="py-8">
                        <div className="text-sm font-black text-gray-400 italic uppercase">
                          <p className="leading-none mb-1">{new Date(booking.date).toLocaleDateString()}</p>
                          <p className="text-[8px] tracking-widest text-gray-400">{booking.startTime} - {booking.endTime}</p>
                        </div>
                      </td>
                      <td className="py-8 text-xl font-black text-gray-800 italic leading-none">₹{booking.totalAmount}</td>
                      <td className="py-8 text-right">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                          booking.status === 'confirmed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                          booking.status === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                          'bg-red-500 text-white shadow-lg shadow-red-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;

