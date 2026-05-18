// frontend/src/pages/owner/FacilityManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ownerService } from '../../services/ownerService';
import VenueModal from '../../components/venue/VenueModal';
import { FiPlus, FiEdit, FiCalendar, FiGrid, FiMapPin, FiActivity, FiAlertCircle, FiSettings, FiArrowRight, FiShield, FiLayers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FacilityManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        setError('Authentication required for infrastructure management.');
        setIsAuthError(true);
        setLoading(false);
      } else if (user?.role !== 'facility_owner' && user?.role !== 'owner') {
        setError('Access denied. Sector restricted to Facility Commanders.');
        setIsAuthError(false);
        setLoading(false);
      } else {
        fetchVenues();
      }
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError('');
      setIsAuthError(false);
      const response = await ownerService.getVenues();
      const venuesData = response.data?.data?.venues || response.data?.venues || response.data || [];
      setVenues(Array.isArray(venuesData) ? venuesData : []);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Session expired. Re-authentication required.');
        setIsAuthError(true);
      } else {
        setError('Telemetry synchronization failed.');
      }
      if (debugMode) {
        setVenues([{
          _id: 'mock-1',
          name: 'Apex Sports Complex',
          description: 'Premium sports facility with modern amenities',
          location: { address: '123 Sports Street', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
          sports: ['badminton', 'tennis'],
          venueType: 'indoor',
          status: 'approved',
          courts: [{}, {}],
          pricing: { hourly: 500 },
          rating: { average: 4.5, count: 25 },
          amenities: ['parking', 'changing_room']
        }]);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditVenue = (venue) => {
    setSelectedVenue(venue);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const configs = {
      'approved': 'bg-emerald-500 shadow-emerald-500/20',
      'pending': 'bg-amber-500 shadow-amber-500/20',
      'rejected': 'bg-red-500 shadow-red-500/20',
      'suspended': 'bg-gray-800 shadow-gray-800/20'
    };
    return (
      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-white italic shadow-lg ${configs[status] || configs.suspended}`}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-inter">
      <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-primary w-1/2 animate-progress-fast" />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse italic">SYNCING INFRASTRUCTURE...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-inter relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-red-500 opacity-[0.02] -skew-x-12 translate-x-1/2" />
      <div className="max-w-xl w-full bg-white rounded-[60px] p-16 shadow-premium border border-gray-100 text-center space-y-12 relative z-10">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[35px] flex items-center justify-center mx-auto shadow-inner group">
          <FiAlertCircle size={48} className="group-hover:rotate-12 transition-transform duration-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">SYSTEM <span className="text-red-500">FAILURE</span></h2>
          <p className="text-xl text-gray-400 font-medium italic leading-relaxed">{error}</p>
        </div>
        <div className="flex flex-col gap-4">
          {isAuthError ? (
            <button onClick={() => navigate('/login')} className="bg-primary text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic">AUTHORIZE SESSION</button>
          ) : (
            <button onClick={fetchVenues} className="bg-primary text-white py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic">RE-SYNC SYSTEM</button>
          )}
          <button onClick={() => setDebugMode(!debugMode)} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-primary transition-all italic">
            {debugMode ? 'DISABLE' : 'ENABLE'} EMERGENCY MOCK
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white py-24 px-6 md:px-12 lg:px-24 font-inter relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-primary opacity-[0.02] -skew-x-12 translate-x-1/2" />
      <div className="max-w-7xl mx-auto space-y-24 relative z-10">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
              <FiShield /> OPERATIONAL UNITS
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">ARENA <br/><span className="text-primary underline decoration-primary/10">MANAGEMENT</span></h1>
            <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Overseeing {venues.length} active deployment zones across platform sectors.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-gray-900 text-white px-12 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:scale-105 active:scale-100 transition-all duration-500 flex items-center gap-4 italic group"
          >
            <FiPlus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> INITIALIZE UNIT
          </button>
        </header>

        {venues.length === 0 ? (
          <div className="bg-gray-50 rounded-[80px] p-40 shadow-premium border border-gray-100 text-center relative overflow-hidden group animate-fade-in">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2 opacity-50" />
            <div className="w-32 h-32 bg-white text-primary rounded-[40px] flex items-center justify-center text-6xl mx-auto mb-12 shadow-premium border border-gray-50 group-hover:scale-110 transition-transform duration-1000">
              <FiGrid className="animate-pulse" />
            </div>
            <div className="space-y-6 max-w-2xl mx-auto mb-16 relative z-10">
              <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-tight">INFRASTRUCTURE <br/><span className="text-primary">VOID</span></h2>
              <p className="text-xl text-gray-400 font-medium italic leading-relaxed">No active facilities detected in your command sector. Begin deployment to establish operations.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-primary text-white px-16 py-7 rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic relative z-10">INITIALIZE FIRST ARENA</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-fade-in">
            {venues.map(venue => (
              <div key={venue._id} className="bg-white rounded-[60px] overflow-hidden border border-gray-100 shadow-premium group hover:-translate-y-4 transition-all duration-1000 relative">
                <div className="relative h-80 overflow-hidden">
                  {venue.images?.[0]?.url ? (
                    <img src={venue.images[0].url} alt={venue.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-125" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                      <FiGrid size={64} className="group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute top-8 left-8">
                    {getStatusBadge(venue.status)}
                  </div>
                  <div className="absolute bottom-8 left-8 space-y-2">
                    <h3 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tighter group-hover:text-primary transition-colors duration-500">{venue.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] italic">
                      <FiMapPin className="text-primary" /> {venue.location?.city}, {venue.location?.state}
                    </div>
                  </div>
                </div>
                
                <div className="p-12 space-y-10 bg-white">
                  <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-50">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] italic">VALUATION</p>
                      <p className="text-2xl font-black text-gray-900 italic tracking-tighter leading-none">₹{venue.pricing?.hourly}<span className="text-[11px] text-gray-400 uppercase tracking-widest ml-1">/HR</span></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] italic">ASSETS</p>
                      <p className="text-2xl font-black text-gray-900 italic tracking-tighter leading-none">{venue.courts?.length || 0} <span className="text-[11px] text-gray-400 uppercase tracking-widest ml-1">UNITS</span></p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleEditVenue(venue)}
                      className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-3 italic group/btn"
                    >
                      <FiEdit size={18} className="group-hover/btn:rotate-12" /> MODIFY INTEL
                    </button>
                    <button className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[24px] flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all duration-500 shadow-inner group/settings">
                      <FiSettings size={22} className="group-hover/settings:rotate-90 duration-700" />
                    </button>
                  </div>
                  <button className="w-full py-2 text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center justify-center gap-4 group/log transition-all italic hover:text-gray-900">
                    ACCESS LOGISTICS <FiArrowRight className="group-hover/log:translate-x-3 transition-transform duration-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showModal && (
        <VenueModal
          venue={selectedVenue}
          onClose={() => { setShowModal(false); setSelectedVenue(null); }}
          onSuccess={() => { setShowModal(false); setSelectedVenue(null); fetchVenues(); }}
        />
      )}
    </div>
  );
};

export default FacilityManagement;
