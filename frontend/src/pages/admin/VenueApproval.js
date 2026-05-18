// frontend/src/pages/admin/VenueApproval.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiBox, FiCheckCircle, FiXCircle, FiFilter, FiMapPin, FiActivity, FiClock, FiDollarSign, FiInfo, FiTrash2, FiEye } from 'react-icons/fi';

const VenueApproval = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchVenues();
    }
  }, [filter, user]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllVenues({ status: filter });
      setVenues(response.data.data.venues || []);
    } catch (error) {
      toast.error('Failed to synchronize arena registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (venueId) => {
    try {
      await adminService.approveVenue(venueId, 'Admin authorized');
      setVenues(venues.filter(v => v._id !== venueId));
      toast.success('Infrastructural authorization granted.');
    } catch (error) {
      toast.error('Authorization protocol failed.');
    }
  };

  const handleReject = async (venueId) => {
    const reason = prompt('Specify denial reason for operational records:');
    if (!reason) return;
    try {
      await adminService.rejectVenue(venueId, reason);
      setVenues(venues.filter(v => v._id !== venueId));
      toast.success('Facility deployment denied.');
    } catch (error) {
      toast.error('Rejection synchronization failure.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-[60px] p-20 shadow-premium border border-gray-100 text-center max-w-2xl">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8 shadow-lg shadow-red-500/10">
            <FiXCircle />
          </div>
          <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">Access Restricted</h2>
          <p className="text-gray-400 font-medium italic text-lg leading-relaxed">Your current credentials do not possess the clearance required for arena governance. Contact system high-command for authorization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-12 lg:p-20 font-inter">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              <FiActivity /> Infrastructure Governance
            </div>
            <h1 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">Arena <span className="text-primary">Clearance</span></h1>
            <p className="text-gray-400 font-medium italic">Reviewing and authorizing global sports infrastructure submissions.</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[32px] shadow-premium border border-gray-100 group">
            <FiFilter className="text-primary" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-gray-600 cursor-pointer">
              <option value="pending">Pending Authorization</option>
              <option value="approved">Operational</option>
              <option value="rejected">Denied</option>
              <option value="">Global Matrix</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-primary w-1/2 animate-[loading_1s_ease-in-out_infinite]" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Accessing Arena Registry...</p>
          </div>
        ) : venues.length === 0 ? (
          <div className="bg-white rounded-[60px] p-40 shadow-premium border border-gray-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-10 shadow-lg shadow-emerald-500/10">
              <FiCheckCircle />
            </div>
            <h3 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">Registry Clear</h3>
            <p className="text-gray-400 font-medium italic max-w-lg mx-auto text-lg leading-relaxed">No {filter} arenas found in the current sector. All infrastructural intelligence has been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {venues.map(venue => (
              <div key={venue._id} className="bg-white rounded-[50px] p-10 lg:p-14 border border-gray-100 shadow-premium flex flex-col lg:flex-row gap-14 group hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-50 overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${venue.status === 'approved' ? 'bg-emerald-500' : venue.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: '100%' }} />
                </div>

                <div className="w-full lg:w-[400px] space-y-8">
                  <div className="aspect-[4/3] rounded-[40px] overflow-hidden border-2 border-white shadow-2xl relative">
                    <img src={venue.images?.[0] ? `http://localhost:4000${venue.images[0].url}` : 'https://via.placeholder.com/400x300'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-6 right-6">
                      <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-xl ${venue.status === 'approved' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : venue.status === 'pending' ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-red-500 text-white shadow-red-500/30'}`}>
                        {venue.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {venue.images?.slice(1, 4).map((img, i) => (
                      <div key={i} className="flex-1 aspect-square rounded-2xl overflow-hidden border border-gray-100">
                        <img src={`http://localhost:4000${img.url}`} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-4xl font-black text-gray-800 tracking-tight uppercase italic leading-none group-hover:text-primary transition-colors">{venue.name}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <FiMapPin className="text-primary" /> {venue.location?.city}, {venue.location?.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1">Operational Fee</p>
                        <h4 className="text-3xl font-black text-primary tracking-tighter italic">₹{venue.pricing?.hourly}<span className="text-sm font-bold text-gray-400">/hr</span></h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Commander</p>
                        <p className="text-sm font-black text-gray-700 uppercase italic">{venue.owner?.name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Category</p>
                        <p className="text-sm font-black text-gray-700 uppercase italic">{venue.venueType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Submission Stamp</p>
                        <p className="text-sm font-black text-gray-700 uppercase italic">{new Date(venue.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                        <FiInfo className="text-primary" /> Operational Intel
                      </p>
                      <p className="text-gray-500 font-medium italic leading-relaxed text-sm bg-gray-50 p-6 rounded-[32px] border border-gray-100">{venue.description}</p>
                    </div>

                    {venue.status === 'rejected' && venue.rejectionReason && (
                      <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[32px] space-y-2">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">Denial Logic</p>
                        <p className="text-sm font-bold text-red-700 italic">{venue.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {venue.status === 'pending' && (
                    <div className="flex gap-4 pt-10">
                      <button onClick={() => handleApprove(venue._id)} className="flex-1 bg-gray-900 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-500 hover:scale-105 transition-all flex items-center justify-center gap-3 italic">
                        Authorize Facility <FiCheckCircle size={16} />
                      </button>
                      <button onClick={() => handleReject(venue._id)} className="px-10 py-5 rounded-[24px] border-2 border-gray-100 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center gap-3 italic">
                        Deny Deployment <FiXCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueApproval;

