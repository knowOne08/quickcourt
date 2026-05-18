import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venueService } from '../../services/venueService';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';
import { FiHeart, FiMapPin, FiStar, FiClock, FiShield, FiPhone, FiMail, FiChevronLeft, FiChevronRight, FiGrid, FiActivity, FiDollarSign, FiUsers, FiBox, FiCheckCircle } from 'react-icons/fi';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeSport, setActiveSport] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenueById(id);
        const venueData = response.data.data.venue;
        setVenue(venueData);
        setActiveSport(venueData.sports?.[0] || '');

        if (isAuthenticated && user) {
          try {
            const favRes = await userService.getFavorites();
            const favs = favRes.data?.favorites || [];
            setIsFavorite(favs.some(f => (f._id || f) === id));
          } catch (favErr) {
            console.error('Favorite synchronization failure');
          }
        }
      } catch (e) {
        setError(`Sector synchronization aborted: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenueDetails();
  }, [id, isAuthenticated, user]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Authentication required for sanctuary storage');
      navigate('/login', { state: { from: `/venue/${id}` } });
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        await userService.removeFavorite(id);
        setIsFavorite(false);
        toast.success('Removed from personal matrix');
      } else {
        await userService.addFavorite(id);
        setIsFavorite(true);
        toast.success('Stored in personal sanctuary!');
      }
    } catch (err) {
      toast.error('Synchronization failed');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error('Authentication required for reservation protocol');
      navigate('/login', { state: { from: `/venue/${id}` } });
      return;
    }
    navigate(`/book/${venue._id}`);
  };

  const formatLocation = (location) => {
    if (!location) return 'Coordinates not specified';
    const parts = [location.address, location.city, location.state].filter(Boolean);
    return parts.join(', ');
  };

  const getVenueImage = () => {
    if (venue?.images && venue.images.length > 0) {
      return venue.images[imgIndex]?.url || venue.images[imgIndex];
    }
    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=2000&auto=format&fit=crop&q=80';
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-inter">
      <div className="w-16 h-1 bg-gray-100 rounded-full mb-8 overflow-hidden">
        <div className="w-1/2 h-full bg-primary animate-progress-fast"></div>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] italic">SYNCHRONIZING ARENA DATA...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white p-6 text-center font-inter">
      <div className="w-32 h-32 bg-red-50 text-red-500 rounded-[40px] flex items-center justify-center shadow-premium mb-10 border border-red-100">
        <FiBox size={60} />
      </div>
      <h2 className="text-4xl font-black text-gray-900 mb-4 italic uppercase tracking-tighter leading-none">Access <span className="text-red-500">Denied</span></h2>
      <p className="text-xl text-gray-400 font-medium italic max-w-sm mb-12 leading-relaxed">{error}</p>
      <button onClick={() => navigate(-1)} className="bg-gray-900 text-white px-16 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all duration-500 italic">INITIALIZE REBOUND</button>
    </div>
  );

  if (!venue) return null;

  return (
    <div className="min-h-screen bg-white font-inter pb-32">
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full overflow-hidden bg-gray-900 group">
        <img 
          src={getVenueImage()} 
          alt={venue.name} 
          className="w-full h-full object-cover opacity-60 transition-transform duration-1000 scale-105 group-hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-12 md:p-24">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-end gap-12">
            <div className="animate-fade-in space-y-6 max-w-4xl">
              <div className="flex items-center gap-4">
                <span className="bg-primary/20 backdrop-blur-xl text-primary border border-primary/30 text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.3em] italic shadow-2xl">{venue.venueType || 'PREMIUM FACILITY'}</span>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl text-white border border-white/20 text-[10px] font-black px-4 py-2 rounded-full italic tracking-[0.2em] shadow-2xl">
                  <FiStar className="text-primary" /> {venue.rating?.average || 0} INTEGRITY
                </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase italic">{venue.name}</h1>
              <p className="text-xl md:text-2xl text-gray-300 flex items-center gap-3 font-medium italic leading-relaxed">
                <FiMapPin className="text-primary text-2xl" /> {formatLocation(venue.location)}
              </p>
            </div>
            <div className="flex gap-6 w-full lg:w-auto shrink-0">
              <button 
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`w-24 h-24 rounded-[32px] backdrop-blur-2xl border transition-all duration-500 flex items-center justify-center shadow-2xl ${
                  isFavorite ? 'bg-primary border-primary text-white scale-110' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <FiHeart className={isFavorite ? 'fill-current' : ''} size={32} />
              </button>
              <button 
                onClick={handleBooking}
                className="flex-1 lg:flex-none bg-primary text-white px-20 py-8 rounded-[32px] font-black text-xl shadow-2xl shadow-primary/30 hover:bg-white hover:text-primary transition-all duration-500 transform hover:-translate-y-2 active:scale-95 italic uppercase tracking-[0.1em]"
              >
                INITIALIZE RESERVATION
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Nav */}
        {venue.images && venue.images.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-12 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <button 
              className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-primary transition-all duration-500 flex items-center justify-center"
              onClick={() => setImgIndex((i) => (i - 1 + venue.images.length) % venue.images.length)}
            >
              <FiChevronLeft size={32} />
            </button>
            <button 
              className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-primary transition-all duration-500 flex items-center justify-center"
              onClick={() => setImgIndex((i) => (i + 1) % venue.images.length)}
            >
              <FiChevronRight size={32} />
            </button>
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'OPEN TIME', value: `${venue.availability?.openTime || '06:00'}`, icon: <FiClock />, color: 'primary' },
                { label: 'CLOSE TIME', value: `${venue.availability?.closeTime || '22:00'}`, icon: <FiShield />, color: 'primary' },
                { label: 'BASE RATE', value: `₹${venue.pricing?.hourly || 500}`, icon: <FiDollarSign />, color: 'primary' },
                { label: 'FEEDBACK', value: `${venue.rating?.count || 0} REVIEWS`, icon: <FiStar />, color: 'primary' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[40px] shadow-premium border border-gray-100 flex flex-col items-center text-center group hover:border-primary/20 transition-all duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-primary text-2xl mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    {item.icon}
                  </div>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1 italic">{item.label}</p>
                  <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{item.value}</h4>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-12 md:p-16 rounded-[60px] shadow-premium border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-1/2" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-primary rounded-full" />
                  <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Venue <span className="text-primary">Intelligence</span></h3>
                </div>
                <p className="text-xl text-gray-500 leading-relaxed font-medium italic">{venue.description || "No tactical briefing available for this facility coordinates."}</p>
              </div>
            </div>

            {/* Courts Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-1 bg-primary rounded-full shadow-lg shadow-primary/20" />
                <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-4">
                  <FiGrid className="text-primary" /> Available <span className="text-primary">Matrices</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(venue.courts || []).map((court) => (
                  <div key={court._id} className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-premium group hover:shadow-2xl transition-all duration-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest italic rounded-bl-[30px]">₹{court.pricePerHour}/HR</div>
                    <div className="space-y-8 mt-4">
                      <div className="space-y-2">
                        <h4 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter group-hover:text-primary transition-colors">{court.name}</h4>
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                          <FiActivity className="text-primary" /> {court.type} SECTOR <span className="text-gray-200">|</span> {court.surface} SURFACE
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {(court.amenities || []).slice(0, 3).map((am, i) => (
                          <span key={i} className="text-[9px] font-black text-primary bg-primary/5 px-4 py-2 rounded-xl uppercase tracking-widest italic border border-primary/10 shadow-sm">{am}</span>
                        ))}
                      </div>
                      <button 
                        onClick={handleBooking}
                        className="w-full py-6 rounded-[24px] border-2 border-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 italic shadow-sm group-hover:shadow-lg"
                      >
                        CHECK OPERATIONAL WINDOW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-gray-900 p-12 md:p-16 rounded-[60px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-primary opacity-[0.03] -skew-x-12 translate-x-1/4" />
              <div className="relative z-10 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-1 bg-primary rounded-full shadow-lg shadow-primary/20" />
                  <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Venue <span className="text-primary">Infrastucture</span></h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
                  {(venue.amenities || []).map((am, idx) => (
                    <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 transition-all duration-500 group-hover:bg-primary group-hover:shadow-[0_0_15px_rgba(113,75,103,0.8)]"></div>
                      <span className="text-sm font-black text-gray-300 uppercase tracking-[0.2em] italic group-hover:text-white transition-colors">{am.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-12">
            {/* Contact Card */}
            <div className="bg-gray-900 p-12 rounded-[50px] shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4">
                  <FiPhone className="text-primary text-3xl" />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Comms <span className="text-primary">Center</span></h3>
                </div>
                <div className="space-y-8">
                  <div className="flex items-center gap-5 group cursor-pointer">
                    <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-2xl">
                      <FiPhone size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] italic">SIGNAL FREQUENCY</p>
                      <p className="text-lg font-black italic tracking-tight">{venue.contact?.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 group cursor-pointer">
                    <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-2xl">
                      <FiMail size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] italic">DATA TRANSMISSION</p>
                      <p className="text-lg font-black italic tracking-tight truncate max-w-[200px]">{venue.contact?.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-white p-12 rounded-[50px] shadow-premium border border-gray-100 space-y-10">
              <div className="flex items-center gap-4">
                <FiShield className="text-primary text-3xl" />
                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Security <span className="text-primary">Protocol</span></h3>
              </div>
              <div className="space-y-6">
                <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 group hover:border-primary/20 transition-all duration-500">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-2 italic">CANCELLATION POLICY</p>
                  <p className="text-sm text-gray-500 font-medium italic leading-relaxed">{venue.policies?.cancellation || "No specific cancellation protocols identified for this sector."}</p>
                </div>
                <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100 group hover:border-primary/20 transition-all duration-500">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em] mb-2 italic">ADVANCE OPERATIONAL WINDOW</p>
                  <p className="text-sm text-gray-500 font-medium italic leading-relaxed">System synchronized for up to {venue.policies?.advance_booking_days || 7} cycles in advance.</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white p-12 rounded-[50px] shadow-premium border border-gray-100 space-y-10">
              <div className="flex items-center gap-4">
                <FiActivity className="text-primary text-3xl" />
                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Global <span className="text-primary">Telemetry</span></h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 rounded-[32px] bg-gray-50 text-center space-y-2 group hover:scale-105 transition-all duration-500 shadow-inner">
                  <FiUsers className="mx-auto text-primary text-2xl group-hover:scale-110 transition-transform" />
                  <p className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">{venue.stats?.totalBookings || 0}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">VISITS</p>
                </div>
                <div className="p-8 rounded-[32px] bg-gray-50 text-center space-y-2 group hover:scale-105 transition-all duration-500 shadow-inner">
                  <FiStar className="mx-auto text-primary text-2xl group-hover:scale-110 transition-transform" />
                  <p className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none">{venue.stats?.repeatCustomers || 0}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">ELITE FANS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {venue.recentReviews && venue.recentReviews.length > 0 && (
          <div className="mt-24 space-y-16">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="w-16 h-1 bg-primary rounded-full shadow-lg shadow-primary/20 mb-8" />
                <h3 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Combat <span className="text-primary">Testimonials</span></h3>
                <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Direct synchronization from athletes operating within this arena sector.</p>
              </div>
              <div className="bg-gray-900 text-white px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.4em] italic shadow-2xl flex items-center gap-3">
                <FiCheckCircle className="text-primary" /> {venue.recentReviews.length} VERIFIED SIGNALS
              </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {venue.recentReviews.map((review) => (
                <div key={review._id} className="bg-white p-10 rounded-[50px] shadow-premium border border-gray-100 hover:border-primary/20 transition-all duration-700 group relative">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-500">
                        <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${review.user?.name}&background=714B67&color=fff&bold=true&size=128`} alt="" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{review.user?.name || 'ANONYMOUS OPERATIVE'}</h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex text-primary text-xs gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className={i < review.rating ? 'fill-current' : 'opacity-20'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-lg text-gray-500 font-medium italic leading-relaxed">"{review.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueDetails;



