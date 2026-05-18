// frontend/src/pages/user/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { venueService } from '../../services/venueService';
import VenueCard from '../../components/venue/VenueCard';
import { FiMapPin, FiArrowRight, FiChevronLeft, FiChevronRight, FiTrendingUp, FiActivity, FiShield, FiBox, FiUsers, FiCalendar } from 'react-icons/fi';

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      );
    } else { reject(new Error('Geolocation not supported')); }
  });
};

const Home = () => {
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPrompted, setLocationPrompted] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);
  const navigate = useNavigate();

  const heroImages = {
    'Ahmedabad': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000',
    'Mumbai': 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=2000',
    'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2000',
    'Bangalore': 'https://images.unsplash.com/photo-1596760407110-2f75d0db8330?q=80&w=2000',
    'Chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2000',
    'Hyderabad': 'https://images.unsplash.com/photo-1626332115162-817686524316?q=80&w=2000',
    'default': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000'
  };

  useEffect(() => {
    if (!locationPrompted && !isManualLocation) {
      getUserLocation()
        .then((loc) => { setUserLocation(loc); setLocationPrompted(true); })
        .catch(() => { setLocationPrompted(true); });
    } else { fetchVenues(); }
  }, [selectedLocation, userLocation, locationPrompted]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      if (isManualLocation || !userLocation) {
        const res = await venueService.getAllVenues({ city: selectedLocation, limit: 8 });
        if (res.data?.status === 'success') { setVenues(res.data.data.venues); }
      } else {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/venues/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=20`);
        const data = await response.json();
        if (data.status === 'success') { setVenues(data.data.venues); }
      }
    } catch (err) { console.error('Venue synchronization failure'); }
    finally { setLoading(false); }
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
    setIsManualLocation(true);
    setUserLocation(null);
  };

  const currentHeroImg = heroImages[selectedLocation] || heroImages.default;

  return (
    <div className="bg-white min-h-screen font-inter">
      {/* High-Impact Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentHeroImg})` }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-gray-900/95 via-gray-900/70 to-transparent" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-6 space-y-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-2xl">
            <FiActivity /> QUICKCOURT
          </div>
          
          <h1 className="text-5xl md:text-8xl font-extrabold text-white leading-tight tracking-tight">
            Find and Book <span className="text-primary">Sports Facilities</span> <br />
            in <span className="underline decoration-primary/30 underline-offset-8 decoration-4">{selectedLocation}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
            Access world-class sports infrastructure. Book your favorite sports venues instantly.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10">
            <div className="bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/20 shadow-premium flex items-center gap-6 group hover:bg-white/20 transition-all duration-500">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                <FiMapPin size={28} />
              </div>
              <div className="flex flex-col items-start pr-8">
                <span className="text-sm font-bold text-gray-400">Select City</span>
                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className="bg-transparent text-white font-bold text-2xl outline-none cursor-pointer appearance-none"
                >
                  {['Ahmedabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'].map(city => (
                    <option key={city} value={city} className="text-gray-900 font-bold bg-white">{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => navigate('/venues')}
              className="group bg-primary text-white px-16 py-6 rounded-[32px] font-bold text-xl shadow-2xl hover:bg-white hover:text-primary transition-all duration-300 flex items-center gap-4"
            >
              Explore Venues <FiArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 space-y-4 flex flex-col items-center">
          <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Scroll Down</p>
          <div className="w-1 h-16 bg-gradient-to-b from-primary to-transparent rounded-full animate-bounce shadow-lg shadow-primary/20" />
        </div>
      </section>

      {/* Venues Grid Section */}
      <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-16 lg:px-24">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-24">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1 bg-primary rounded-full shadow-lg shadow-primary/20" />
              <span className="text-primary font-bold text-sm uppercase tracking-widest">Featured</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-tight">
              Top <span className="text-primary">Facilities</span>
            </h2>
            <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
              Explore the best sports venues in your city.
            </p>
          </div>
          
          <Link to="/venues" className="group flex items-center gap-4 text-gray-900 font-bold text-sm uppercase hover:text-primary transition-all duration-300 pb-2">
            View All Venues <FiArrowRight className="group-hover:translate-x-2 transition-transform duration-300 text-primary" />
          </Link>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-gray-50 rounded-[50px] aspect-[4/5] animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {venues.length > 0 ? (
              venues.map((venue) => (
                <div key={venue._id} className="animate-fade-in" style={{ animationDelay: `${venues.indexOf(venue) * 100}ms` }}>
                  <VenueCard venue={venue} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-48 text-center bg-gray-50 rounded-[60px] border-2 border-dashed border-gray-200">
                <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-primary text-6xl mx-auto mb-10 shadow-premium">
                  <FiBox />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800">No Venues Found</h3>
                <p className="text-gray-500 mt-4 text-lg font-medium max-w-lg mx-auto leading-relaxed">We couldn't find any venues in this city. Please try selecting a different location.</p>
              </div>
            )}
          </div>
        )}

        {venues.length > 0 && (
          <div className="flex justify-center gap-6 mt-32">
            <button className="w-20 h-20 rounded-[32px] bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:scale-110 transition-all duration-500 shadow-premium group">
              <FiChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button className="w-20 h-20 rounded-[32px] bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:scale-110 transition-all duration-500 shadow-premium group">
              <FiChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <section className="bg-gray-50 py-32 px-6 md:px-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="space-y-4 text-center">
            <FiUsers className="text-primary text-3xl mx-auto" />
            <div>
              <p className="text-3xl font-extrabold text-gray-800">50k+</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Users</p>
            </div>
          </div>
          <div className="space-y-4 text-center">
            <FiShield className="text-primary text-3xl mx-auto" />
            <div>
              <p className="text-3xl font-extrabold text-gray-800">100%</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verified Venues</p>
            </div>
          </div>
          <div className="space-y-4 text-center">
            <FiCalendar className="text-primary text-3xl mx-auto" />
            <div>
              <p className="text-3xl font-extrabold text-gray-800">24/7</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Support</p>
            </div>
          </div>
          <div className="space-y-4 text-center">
            <FiTrendingUp className="text-primary text-3xl mx-auto" />
            <div>
              <p className="text-3xl font-extrabold text-gray-800">No. 1</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Booking Platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="px-6 md:px-16 lg:px-24 py-32">
        <div className="max-w-[1600px] mx-auto bg-gray-900 rounded-[60px] p-16 md:p-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000 -skew-x-12 translate-x-1/4" />
          <div className="relative z-10 grid lg:grid-cols-2 items-center gap-24">
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-1 bg-primary rounded-full" />
                  <span className="text-primary font-bold text-sm uppercase tracking-widest">Partner With Us</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                  List Your <br />
                  <span className="text-primary">Venue</span>
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed font-medium max-w-xl">
                  Grow your business by listing your facility on QuickCourt. Manage bookings, increase revenue, and reach more players.
                </p>
              </div>
              <button 
                onClick={() => navigate('/owner-register')}
                className="bg-white text-gray-900 px-12 py-5 rounded-[32px] font-bold text-lg shadow-xl hover:bg-primary hover:text-white transition-all duration-300"
              >
                Register as Owner
              </button>
            </div>
            <div className="hidden lg:block relative">
              <div className="aspect-square w-full max-w-md ml-auto bg-white/5 rounded-[60px] backdrop-blur-xl border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-primary/30 transition-colors duration-1000">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="text-white text-[180px] font-black italic opacity-10 select-none group-hover:scale-110 group-hover:opacity-20 transition-all duration-1000">QC</div>
                <div className="absolute bottom-12 left-12 right-12 space-y-4">
                  <div className="h-2 w-1/2 bg-white/20 rounded-full" />
                  <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;