// frontend/src/components/venue/VenueCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { FiHeart, FiMapPin, FiStar, FiArrowRight, FiActivity, FiShield, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const VenueCard = ({ venue }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const checkFavorite = async () => {
        try {
          const res = await userService.getFavorites();
          const favs = res.data?.favorites || [];
          setIsFavorite(favs.some(f => (f._id || f) === venue._id));
        } catch (err) { console.error('Favorite status synchronization failed'); }
      };
      checkFavorite();
    }
  }, [venue._id, isAuthenticated, user]);

  const toggleFavorite = async (e) => {
    e.stopPropagation(); 
    if (!isAuthenticated) { toast.error('Please login to add to favorites'); navigate('/login'); return; }

    try {
      setLoading(true);
      if (isFavorite) {
        await userService.removeFavorite(venue._id);
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await userService.addFavorite(venue._id);
        setIsFavorite(true);
        toast.success('Added to favorites!');
      }
    } catch (err) { toast.error('Failed to update favorites'); }
    finally { setLoading(false); }
  };

  const getVenueImage = () => {
    if (venue.images?.length > 0) return venue.images[0].url || venue.images[0];
    const fallbacks = { badminton: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800', football: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', cricket: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800' };
    return fallbacks[venue.sports?.[0]] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
  };

  const formatPrice = () => {
    if (venue.pricing?.hourly) return `₹${venue.pricing.hourly}`;
    if (venue.priceRange) return `₹${venue.priceRange.min}`;
    return 'N/A';
  };

  return (
    <div 
      className="bg-white rounded-[50px] overflow-hidden shadow-premium border border-gray-100 group transition-all duration-700 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-3 cursor-pointer relative font-inter"
      onClick={() => navigate(`/venue/${venue._id}`)}
    >
      <div className="relative h-72 overflow-hidden">
        <img 
          src={getVenueImage()} 
          alt={venue.name} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <button 
          className={`absolute top-6 right-6 w-14 h-14 rounded-[22px] flex items-center justify-center backdrop-blur-xl transition-all duration-500 border-2 shadow-2xl z-20 ${
            isFavorite ? 'bg-primary border-primary text-white scale-110' : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary hover:border-white'
          }`}
          onClick={toggleFavorite}
          disabled={loading}
        >
          <FiHeart size={24} fill={isFavorite ? "currentColor" : "none"} className="transition-transform active:scale-150" />
        </button>

        <div className="absolute bottom-6 left-8 flex flex-col gap-3 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
              <FiStar className="text-primary fill-primary" size={14} />
              <span className="text-xs font-bold text-white">{venue.rating?.average || '0.0'} RATING</span>
            </div>
          </div>
          <span className="bg-primary text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit shadow-2xl">
            {venue.sports?.[0]?.replace('_', ' ') || 'SPORTS'}
          </span>
        </div>
      </div>
      
      <div className="p-10 space-y-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-primary transition-colors duration-300">{venue.name}</h3>
          <p className="text-sm text-gray-500 font-semibold flex items-center gap-2">
            <FiMapPin size={14} className="text-primary" /> 
            {[venue.location?.city, venue.location?.state].filter(Boolean).join(', ') || 'Unknown Location'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{formatPrice()}</span>
              <span className="text-xs font-bold text-gray-500">/hr</span>
            </div>
          </div>
          
          <button className="w-16 h-16 rounded-[24px] bg-gray-50 text-gray-300 flex items-center justify-center transition-all duration-500 group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-2xl group-hover:rotate-45">
            <FiArrowRight size={28} className="-rotate-45 group-hover:rotate-0 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;